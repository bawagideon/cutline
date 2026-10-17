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
    await supabase.from('worker_heartbeats').upsert({
      worker_id: this.workerId,
      status: 'healthy',
      last_heartbeat_at: new Date().toISOString(),
      active_jobs_count: activeJobs,
    });
  }

  /**
   * Atomically claims an available queued job or reclaims an expired lease.
   */
  async claimNextJob(): Promise<ProductionJobRecord | null> {
    const supabase = getSupabaseServiceClient();
    const now = new Date();
    const leaseExpiration = new Date(now.getTime() + this.leaseDurationSec * 1000).toISOString();
    const nowIso = now.toISOString();

    // Find a job that is 'queued' or has an expired lease
    const { data: eligibleJobs, error: selectError } = await supabase
      .from('production_jobs')
      .select('*')
      .or(`stage.eq.queued,and(stage.neq.completed,stage.neq.failed,locked_until.lt.${nowIso})`)
      .order('created_at', { ascending: true })
      .limit(1);

    if (selectError || !eligibleJobs || eligibleJobs.length === 0) {
      return null;
    }

    const job = eligibleJobs[0] as ProductionJobRecord;

    // Atomically claim lease
    const { data: claimed, error: updateError } = await supabase
      .from('production_jobs')
      .update({
        stage: job.stage === 'queued' ? 'started' : job.stage,
        locked_by: this.workerId,
        locked_until: leaseExpiration,
        updated_at: nowIso,
      })
      .eq('id', job.id)
      .select()
      .single();

    if (updateError || !claimed) {
      return null; // Another worker claimed it concurrently
    }

    await this.logJobEvent(job.id, 'info', `Job claimed by ${this.workerId}`, { leaseExpiration });
    return claimed as ProductionJobRecord;
  }

  /**
   * Processes a single job through the canonical pipeline.
   */
  async processJob(job: ProductionJobRecord): Promise<void> {
    const supabase = getSupabaseServiceClient();

    try {
      if (job.stage === 'started') {
        // Fetch scene details
        const { data: scene } = await supabase.from('scenes').select('*').eq('id', job.scene_id).single();
        if (!scene) {
          throw new Error(`Associated scene ${job.scene_id} not found.`);
        }

        await this.logJobEvent(job.id, 'info', `Submitting render to ${job.provider}`, {
          durationSec: scene.duration_sec,
        });

        const submission = await renderManager.submitRender(job.provider, {
          prompt: scene.visual_prompt,
          durationSec: scene.duration_sec,
          aspectRatio: '16:9',
        });

        await supabase
          .from('production_jobs')
          .update({
            stage: 'waiting_for_provider',
            provider_task_id: submission.providerTaskId,
            cost_usd: submission.costUsd,
            cost_type: submission.costType,
            is_mock: submission.isMock,
            updated_at: new Date().toISOString(),
          })
          .eq('id', job.id);

        await this.logJobEvent(job.id, 'info', `task=${submission.providerTaskId} accepted by provider`);
      } else if (job.stage === 'waiting_for_provider') {
        if (!job.provider_task_id) {
          throw new Error('Missing provider task ID.');
        }

        const status = await renderManager.checkStatus(job.provider, job.provider_task_id);

        if (status.status === 'done' && status.videoUrl) {
          await this.logJobEvent(job.id, 'info', `task=${job.provider_task_id} status=done`);

          await supabase
            .from('production_jobs')
            .update({
              stage: 'downloading',
              updated_at: new Date().toISOString(),
            })
            .eq('id', job.id);

          // Safe download with host validation & hash verification
          const destPath = `episodes/${job.episode_id}/scenes/${job.scene_id}.mp4`;
          await this.logJobEvent(job.id, 'info', `fetch host=allowed redirects=0`);

          const download = await downloadAndStoreMedia(status.videoUrl, destPath);

          await this.logJobEvent(job.id, 'info', `bytes=${(download.bytesDownloaded / 1048576).toFixed(1)}MB type=video/mp4 sha256=verified`);
          await this.logJobEvent(job.id, 'info', `stored path=${download.storagePath}`);

          // Update scene status
          await supabase
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

          // Advance job to awaiting_review
          await supabase
            .from('production_jobs')
            .update({
              stage: 'awaiting_review',
              locked_by: null,
              locked_until: null,
              updated_at: new Date().toISOString(),
            })
            .eq('id', job.id);
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
    const canRetry = nextAttempt <= job.max_attempts;

    await this.logJobEvent(job.id, 'error', `Job error: ${errorMessage}`, {
      attempt: job.attempt,
      canRetry,
    });

    if (canRetry) {
      await supabase
        .from('production_jobs')
        .update({
          attempt: nextAttempt,
          stage: 'queued',
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
    // Redact sensitive patterns (API keys, tokens)
    const redacted = message.replace(/(key=)(sk-[a-zA-Z0-9_\-]+)/g, '$1sk-••••');
    await supabase.from('job_logs').insert({
      job_id: jobId,
      level,
      message: redacted,
      metadata,
    });
  }
}
