import { getSupabaseServiceClient } from '../database/client.ts';
import { renderManager } from '../providers/render/manager.ts';
import { downloadAndStoreMedia } from '../providers/storage/downloader.ts';
import type { RenderProviderName } from '../providers/render/types.ts';

export type JobStage =
  | 'queued'
  | 'started'
  | 'waiting_for_provider'
  | 'downloading'
  | 'assembling'
  | 'awaiting_review'
  | 'completed'
  | 'failed';

export interface ProductionJobRecord {
  id: string;
  workspace_id: string;
  episode_id: string;
  scene_id?: string;
  stage: JobStage;
  provider: RenderProviderName;
  provider_task_id?: string;
  idempotency_key: string;
  attempt: number;
  max_attempts: number;
  locked_by?: string;
  locked_until?: string;
  is_mock: boolean;
  cost_usd: number;
  cost_type: 'estimated' | 'provider-reported';
  error_message?: string;
  created_at: string;
  updated_at: string;
}

export class WorkerManager {
  private workerId: string;
  private leaseDurationSec: number;

  constructor(workerId = `worker-${Math.random().toString(36).substring(2, 8)}`, leaseDurationSec = 300) {
    this.workerId = workerId;
    this.leaseDurationSec = leaseDurationSec;
  }

  /**
   * Updates worker heartbeat in database so dashboard tracks actual worker liveness.
   */
  async recordHeartbeat(activeJobs = 0): Promise<void> {
    const supabase = getSupabaseServiceClient();
    const { error } = await supabase.from('worker_heartbeats').upsert({
      worker_id: this.workerId,
      status: 'healthy',
      last_heartbeat_at: new Date().toISOString(),
      active_jobs_count: activeJobs,
    });
    if (error) {
      console.error(`[Worker Heartbeat Error] ${error.message}`);
    }
  }

  /**
   * Redacts sensitive credentials (API keys, bearer tokens) from log entries and messages.
   */
  static redactSensitiveData(message: string): string {
    return message
      .replace(/(key=)(sk-[a-zA-Z0-9_\-]+)/g, '$1sk-••••')
      .replace(/(Bearer\s+)[a-zA-Z0-9_\.\-]+/gi, '$1••••••••')
      .replace(/(AIza[0-9A-Za-z-_]{35})/g, 'AIza••••');
  }

  /**
   * Atomically claims an available queued job or reclaims an expired lease.
   * Utilizes database RPC with FOR UPDATE SKIP LOCKED or atomic conditional update with fencing tokens.
   */
  async claimNextJob(): Promise<ProductionJobRecord | null> {
    const supabase = getSupabaseServiceClient();
    const now = new Date();
    const leaseExpiration = new Date(now.getTime() + this.leaseDurationSec * 1000).toISOString();
    const nowIso = now.toISOString();

    // 1. Try atomic PostgreSQL RPC with FOR UPDATE SKIP LOCKED
    try {
      const { data: rpcJob, error: rpcError } = await supabase
        .rpc('claim_next_production_job', {
          p_worker_id: this.workerId,
          p_lease_sec: this.leaseDurationSec,
        });

      if (!rpcError && rpcJob) {
        const job = Array.isArray(rpcJob) ? rpcJob[0] : rpcJob;
        if (job) {
          await this.logJobEvent(job.id, 'info', `Job claimed atomically via RPC by ${this.workerId}`, { leaseExpiration });
          return job as ProductionJobRecord;
        }
      }
    } catch {
      // RPC fallback to atomic conditional update below
    }

    // 2. Fallback: Conditional update ensuring atomic lease ownership
    const { data: eligibleJobs, error: selectError } = await supabase
      .from('production_jobs')
      .select('*')
      .or(`stage.eq.queued,and(stage.neq.completed,stage.neq.failed,locked_until.lt.${nowIso})`)
      .order('created_at', { ascending: true })
      .limit(1);

    if (selectError || !eligibleJobs || eligibleJobs.length === 0) {
      return null;
    }

    const candidate = eligibleJobs[0] as ProductionJobRecord;

    // Atomically claim lease ONLY if lock is strictly expired or unheld
    // Removed worker self-lock condition to prevent unexpired lease re-entry
    // Increments attempt as a fencing token
    const { data: claimed, error: updateError } = await supabase
      .from('production_jobs')
      .update({
        stage: candidate.stage === 'queued' ? 'started' : candidate.stage,
        locked_by: this.workerId,
        locked_until: leaseExpiration,
        attempt: (candidate.attempt || 0) + 1,
        updated_at: nowIso,
      })
      .eq('id', candidate.id)
      .or(`locked_until.lt.${nowIso},locked_by.is.null`)
      .select()
      .single();

    if (updateError || !claimed) {
      return null; // Another worker claimed it concurrently; race safely avoided
    }

    await this.logJobEvent(candidate.id, 'info', `Job claimed conditionally by ${this.workerId}`, { leaseExpiration });
    return claimed as ProductionJobRecord;
  }

  /**
   * Processes a single job through the canonical pipeline with two-phase paid submission.
   */
  async processJob(job: ProductionJobRecord): Promise<void> {
    const supabase = getSupabaseServiceClient();

    try {
      if (job.stage === 'started') {
        // Idempotency check 1: If provider_task_id is already present, advance immediately to avoid re-billing
        if (job.provider_task_id) {
          await this.logJobEvent(job.id, 'warn', `Job was already submitted (task=${job.provider_task_id}); advancing to waiting_for_provider`);
          const { error: advanceError } = await supabase
            .from('production_jobs')
            .update({
              stage: 'waiting_for_provider',
              error_message: null,
              updated_at: new Date().toISOString(),
            })
            .eq('id', job.id);
          if (advanceError) {
            throw new Error(`Failed to advance job stage: ${advanceError.message}`);
          }
          return;
        }

        // Idempotency check 2: Ambiguous Submission Recovery Guard
        // If error_message indicates SUBMITTING_RENDER without provider_task_id, a previous worker crashed
        // mid-flight during the paid provider call. Since provider API does not guarantee deduplicated lookup,
        // AUTOMATIC RESUBMISSION IS PROHIBITED to prevent double billing.
        if (job.error_message === 'SUBMITTING_RENDER') {
          const ambiguousError = `Ambiguous render submission: Previous worker crashed while submitting render to ${job.provider}. Automatic resubmission blocked to prevent duplicate billing. Manual reconciliation required.`;
          await this.logJobEvent(job.id, 'error', ambiguousError, {
            idempotencyKey: job.idempotency_key,
            attempt: job.attempt,
          });

          // Transition job to 'failed' with explicit cause to prevent duplicate spend
          const { error: haltError } = await supabase
            .from('production_jobs')
            .update({
              stage: 'failed',
              error_message: ambiguousError,
              locked_by: null,
              locked_until: null,
              updated_at: new Date().toISOString(),
            })
            .eq('id', job.id);

          if (haltError) {
            throw new Error(`Failed to record ambiguous submission halt: ${haltError.message}`);
          }
          return;
        }

        // Fetch scene details
        const { data: scene, error: sceneError } = await supabase
          .from('scenes')
          .select('*')
          .eq('id', job.scene_id)
          .single();

        if (sceneError || !scene) {
          throw new Error(`Associated scene ${job.scene_id} not found.`);
        }

        // Phase 1 of Two-Phase Paid Submission:
        // Record intent BEFORE calling external provider API to prevent untracked duplicate spends on worker crash
        const { error: intentError } = await supabase
          .from('production_jobs')
          .update({
            error_message: 'SUBMITTING_RENDER',
            updated_at: new Date().toISOString(),
          })
          .eq('id', job.id);

        if (intentError) {
          throw new Error(`Failed to record render submission intent: ${intentError.message}`);
        }

        await this.logJobEvent(job.id, 'info', `Submitting render to ${job.provider}`, {
          durationSec: scene.duration_sec,
          idempotencyKey: job.idempotency_key,
        });

        // External provider call passes idempotency key to prevent duplicate render charges
        const submission = await renderManager.submitRender(job.provider, {
          prompt: scene.visual_prompt,
          durationSec: scene.duration_sec,
          aspectRatio: '16:9',
          idempotencyKey: job.idempotency_key,
        });

        // Phase 2: Record confirmed provider task ID and transition stage
        const { error: confirmError } = await supabase
          .from('production_jobs')
          .update({
            stage: 'waiting_for_provider',
            provider_task_id: submission.providerTaskId,
            cost_usd: submission.costUsd,
            cost_type: submission.costType,
            is_mock: submission.isMock,
            error_message: null,
            updated_at: new Date().toISOString(),
          })
          .eq('id', job.id);

        if (confirmError) {
          throw new Error(`Failed to record provider task confirmation: ${confirmError.message}`);
        }

        await this.logJobEvent(job.id, 'info', `task=${submission.providerTaskId} accepted by provider`);
      } else if (job.stage === 'waiting_for_provider') {
        if (!job.provider_task_id) {
          throw new Error('Ambiguous render state: Stage is waiting_for_provider but provider_task_id is missing.');
        }

        const status = await renderManager.checkStatus(job.provider, job.provider_task_id);

        if (status.status === 'done' && status.videoUrl) {
          await this.logJobEvent(job.id, 'info', `task=${job.provider_task_id} status=done`);

          const { error: dlStageError } = await supabase
            .from('production_jobs')
            .update({
              stage: 'downloading',
              updated_at: new Date().toISOString(),
            })
            .eq('id', job.id);

          if (dlStageError) {
            throw new Error(`Failed to update job to downloading stage: ${dlStageError.message}`);
          }

          // Safe download with host validation & hash verification
          const destPath = `episodes/${job.episode_id}/scenes/${job.scene_id}.mp4`;
          await this.logJobEvent(job.id, 'info', `fetch host=allowed redirects=0`);

          const download = await downloadAndStoreMedia(status.videoUrl, destPath);

          await this.logJobEvent(job.id, 'info', `bytes=${(download.bytesDownloaded / 1048576).toFixed(1)}MB type=video/mp4 sha256=verified`);
          await this.logJobEvent(job.id, 'info', `stored path=${download.storagePath}`);

          // Update scene status
          const { error: sceneUpdateError } = await supabase
            .from('scenes')
            .update({
              status: 'rendered',
              video_url: status.videoUrl,
              storage_path: download.storagePath,
              sha256_hash: download.sha256Hash,
              file_size_bytes: download.bytesDownloaded,
              updated_at: new Date().toISOString(),
            })
            .eq('id', job.scene_id);

          if (sceneUpdateError) {
            throw new Error(`Failed to update scene render metadata: ${sceneUpdateError.message}`);
          }

          // Advance job to awaiting_review
          const { error: reviewError } = await supabase
            .from('production_jobs')
            .update({
              stage: 'awaiting_review',
              locked_by: null,
              locked_until: null,
              updated_at: new Date().toISOString(),
            })
            .eq('id', job.id);

          if (reviewError) {
            throw new Error(`Failed to advance job to awaiting_review: ${reviewError.message}`);
          }
        } else if (status.status === 'failed') {
          throw new Error(status.error || 'Provider reported render failure.');
        }
      }
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : String(err);
      await this.handleJobFailure(job, errorMessage);
    }
  }

  private async handleJobFailure(job: ProductionJobRecord, errorMessage: string): Promise<void> {
    const supabase = getSupabaseServiceClient();
    const nextAttempt = job.attempt + 1;
    const isAmbiguousSubmission = errorMessage.includes('Ambiguous render state') ||
      (job.stage === 'started' && errorMessage.includes('SUBMITTING_RENDER'));
    const isExplicitProviderFailure = errorMessage.includes('Provider reported render failure') ||
      errorMessage.includes('PixVerse HTTP 4');

    const canRetry = nextAttempt <= job.max_attempts && !isExplicitProviderFailure && !isAmbiguousSubmission;

    await this.logJobEvent(job.id, 'error', `Job error: ${errorMessage}`, {
      attempt: job.attempt,
      canRetry,
    });

    if (canRetry) {
      // If the job already has a confirmed provider task ID, retry in waiting_for_provider
      // to continue polling instead of re-submitting to the paid provider
      const retryStage: JobStage = job.provider_task_id ? 'waiting_for_provider' : 'queued';

      await supabase
        .from('production_jobs')
        .update({
          attempt: nextAttempt,
          stage: retryStage,
          error_message: errorMessage,
          locked_by: null,
          locked_until: null,
          updated_at: new Date().toISOString(),
        })
        .eq('id', job.id);
    } else {
      await supabase
        .from('production_jobs')
        .update({
          stage: 'failed',
          error_message: errorMessage,
          locked_by: null,
          locked_until: null,
          updated_at: new Date().toISOString(),
        })
        .eq('id', job.id);
    }
  }

  private async logJobEvent(jobId: string, level: 'info' | 'warn' | 'error', message: string, metadata = {}): Promise<void> {
    const supabase = getSupabaseServiceClient();
    const redacted = WorkerManager.redactSensitiveData(message);
    await supabase.from('job_logs').insert({
      job_id: jobId,
      level,
      message: redacted,
      metadata,
    });
  }
}
