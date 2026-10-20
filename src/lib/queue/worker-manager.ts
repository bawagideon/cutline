import { getSupabaseServiceClient } from '../database/client.ts';
import { renderManager } from '../providers/render/manager.ts';
import { downloadAndStoreMedia } from '../providers/storage/downloader.ts';
import { RenderProviderError, type RenderProviderName } from '../providers/render/types.ts';

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

/**
 * Thrown when a worker attempts a database write on a job for which it no longer owns the lease,
 * or whose attempt fencing token has been incremented by a newer claiming worker.
 */
export class LostLeaseError extends Error {
  readonly jobId: string;
  readonly workerId: string;
  readonly attempt: number;
  readonly operation: string;

  constructor(jobId: string, workerId: string, attempt: number, operation: string) {
    super(
      `[Fencing Token Violation] Worker ${workerId} lost lease for job ${jobId} (attempt=${attempt}) during operation '${operation}'. Write aborted to prevent queue state corruption.`
    );
    this.name = 'LostLeaseError';
    this.jobId = jobId;
    this.workerId = workerId;
    this.attempt = attempt;
    this.operation = operation;
    Object.setPrototypeOf(this, LostLeaseError.prototype);
  }
}

/**
 * Classifies whether a provider exception represents a definitive client rejection (4xx validation/param error)
 * where no render task was started or billed, as opposed to an ambiguous timeout/5xx network failure.
 */
export function isDefinitiveProviderRejection(err: unknown): boolean {
  if (err instanceof RenderProviderError) {
    return err.definitiveRejection;
  }
  if (typeof err === 'object' && err !== null) {
    const rec = err as { definitiveRejection?: boolean; statusCode?: number; status?: number };
    if (typeof rec.definitiveRejection === 'boolean') {
      return rec.definitiveRejection;
    }
    const code = rec.statusCode ?? rec.status;
    if (typeof code === 'number' && code >= 400 && code < 500 && code !== 429) {
      return true;
    }
  }
  const msg = err instanceof Error ? err.message : String(err);
  // Robust pattern matching matching real PixVerse adapter formats:
  // e.g. "[PixVerse API Error 400]", "[PixVerse Error]", "PixVerse HTTP 400", etc.
  if (/\[?PixVerse (API )?(Error|HTTP)\s*4\d\d\]?/i.test(msg)) {
    return !msg.includes('429');
  }
  if (/HTTP 4\d\d/i.test(msg) && !msg.includes('429')) {
    return true;
  }
  return false;
}

export class WorkerManager {
  private workerId: string;
  private leaseDurationSec: number;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private supabaseClient?: any;

  constructor(
    workerId = `worker-${Math.random().toString(36).substring(2, 8)}`,
    leaseDurationSec = 300,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    supabaseClient?: any
  ) {
    this.workerId = workerId;
    this.leaseDurationSec = leaseDurationSec;
    this.supabaseClient = supabaseClient;
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private getSupabase(): any {
    return this.supabaseClient || getSupabaseServiceClient();
  }

  /**
   * Updates worker heartbeat in database so dashboard tracks actual worker liveness.
   */
  async recordHeartbeat(activeJobs = 0): Promise<void> {
    const supabase = this.getSupabase();
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
    const supabase = this.getSupabase();
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
   * Executes an atomic state transition conditional on the current fencing token (attempt)
   * and worker lease ownership (locked_by).
   * 
   * Throws LostLeaseError if zero rows were modified, preventing stale or expired workers
   * from corrupting a newer worker's state or clearing its locks.
   */
  async fencedJobUpdate(
    job: ProductionJobRecord,
    operation: string,
    updates: Record<string, unknown>,
    expectedStage?: JobStage
  ): Promise<ProductionJobRecord> {
    const supabase = this.getSupabase();
    const nowIso = new Date().toISOString();
    const effectiveWorkerId = job.locked_by || this.workerId;

    let query = supabase
      .from('production_jobs')
      .update({
        ...updates,
        updated_at: nowIso,
      })
      .eq('id', job.id)
      .eq('attempt', job.attempt)
      .eq('locked_by', effectiveWorkerId);

    if (expectedStage) {
      query = query.eq('stage', expectedStage);
    }

    const { data, error } = await query.select();

    if (error) {
      throw new Error(`Database failure during fenced write '${operation}' on job ${job.id}: ${error.message}`);
    }

    // Treat a zero-row update as a lost lease!
    if (!data || data.length === 0) {
      const lostLeaseMsg = `Lost lease for job ${job.id} during '${operation}'. Worker ${this.workerId} (attempt ${job.attempt}) was preempted. Zero rows updated.`;
      await this.logJobEvent(job.id, 'warn', lostLeaseMsg, {
        attempt: job.attempt,
        workerId: this.workerId,
        operation,
      });
      throw new LostLeaseError(job.id, this.workerId, job.attempt, operation);
    }

    const updatedRow = (Array.isArray(data) ? data[0] : data) as ProductionJobRecord;
    // Synchronize in-memory job state with confirmed database state
    Object.assign(job, updatedRow);
    return updatedRow;
  }

  /**
   * Processes a single job through the canonical pipeline with two-phase paid submission.
   */
  async processJob(job: ProductionJobRecord): Promise<void> {
    const supabase = this.getSupabase();

    // Ensure worker ID is stamped on in-memory job record
    if (!job.locked_by) {
      job.locked_by = this.workerId;
    }

    try {
      if (job.stage === 'started') {
        // Idempotency check 1: If provider_task_id is already present, advance immediately to avoid re-billing
        if (job.provider_task_id) {
          await this.logJobEvent(job.id, 'warn', `Job was already submitted (task=${job.provider_task_id}); advancing to waiting_for_provider`);
          await this.fencedJobUpdate(job, 'advance_already_submitted', {
            stage: 'waiting_for_provider',
            error_message: null,
          }, 'started');
          return;
        }

        // Idempotency check 2: Ambiguous Submission Recovery Guard
        // If error_message indicates SUBMITTING_RENDER without provider_task_id, a previous worker crashed
        // mid-flight during the paid provider call. Since provider API does not guarantee deduplicated lookup,
        // AUTOMATIC RESUBMISSION IS PROHIBITED to prevent double billing.
        if (job.error_message === 'SUBMITTING_RENDER' || job.error_message?.includes('Ambiguous render submission')) {
          const ambiguousError = `Ambiguous render submission: Previous worker crashed while submitting render to ${job.provider}. Automatic resubmission blocked to prevent duplicate billing. Manual reconciliation required.`;
          await this.markAmbiguousSubmissionHalt(job, ambiguousError);
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
        // Record intent BEFORE calling external provider API to prevent untracked duplicate spends on worker crash.
        // Fenced update ensures stale worker whose lease expired cannot record intent or proceed to provider call!
        await this.fencedJobUpdate(job, 'record_submission_intent', {
          error_message: 'SUBMITTING_RENDER',
        }, 'started');

        await this.logJobEvent(job.id, 'info', `Submitting render to ${job.provider}`, {
          durationSec: scene.duration_sec,
          idempotencyKey: job.idempotency_key,
        });

        // Phase 2: Call external provider with dedicated error capture
        let submission;
        try {
          // External provider call passes idempotency key to prevent duplicate render charges
          submission = await renderManager.submitRender(job.provider, {
            prompt: scene.visual_prompt,
            durationSec: scene.duration_sec,
            aspectRatio: '16:9',
            idempotencyKey: job.idempotency_key,
          });
        } catch (providerErr: unknown) {
          // Check if provider returned a definitive client-side rejection (4xx validation error) where no render was started
          if (isDefinitiveProviderRejection(providerErr)) {
            const providerErrMsg = providerErr instanceof Error ? providerErr.message : String(providerErr);
            await this.markJobFailed(job, `Provider rejected render request: ${providerErrMsg}`);
            return;
          }

          // Ambiguous error: provider was contacted and could have accepted the request.
          // Automatic resubmission is prohibited to prevent duplicate billing.
          const providerErrMsg = providerErr instanceof Error ? providerErr.message : String(providerErr);
          const ambiguousMsg = `Ambiguous render submission: Provider call threw an exception (${providerErrMsg}). Automatic resubmission blocked to prevent duplicate billing. Manual reconciliation required.`;
          await this.markAmbiguousSubmissionHalt(job, ambiguousMsg);
          return;
        }

        // Phase 3: Provider accepted render; confirm task ID in database
        job.provider_task_id = submission.providerTaskId;
        job.cost_usd = submission.costUsd;
        job.cost_type = submission.costType;
        job.is_mock = submission.isMock;

        try {
          await this.fencedJobUpdate(job, 'confirm_provider_task', {
            stage: 'waiting_for_provider',
            provider_task_id: submission.providerTaskId,
            cost_usd: submission.costUsd,
            cost_type: submission.costType,
            is_mock: submission.isMock,
            error_message: null,
          }, 'started');
        } catch (dbConfirmErr: unknown) {
          if (dbConfirmErr instanceof LostLeaseError) {
            // Worker lost lease while waiting for provider call.
            // Log task ID so reconciliation can match it with provider!
            await this.logJobEvent(job.id, 'error', `Lost lease after provider accepted render (task=${submission.providerTaskId}). Logged for operator reconciliation.`, {
              providerTaskId: submission.providerTaskId,
              attempt: job.attempt,
            });
            throw dbConfirmErr;
          }
          // Provider accepted the render, but saving task ID failed! Automatic resubmission must be blocked!
          const dbErrMsg = dbConfirmErr instanceof Error ? dbConfirmErr.message : String(dbConfirmErr);
          const confirmFailMsg = `Ambiguous render confirmation failure: Provider accepted render (task=${submission.providerTaskId}), but saving task ID failed (${dbErrMsg}). Automatic resubmission blocked.`;
          await this.markAmbiguousSubmissionHalt(job, confirmFailMsg, submission.providerTaskId);
          return;
        }

        await this.logJobEvent(job.id, 'info', `task=${submission.providerTaskId} accepted by provider`);
      } else if (job.stage === 'waiting_for_provider') {
        if (!job.provider_task_id) {
          throw new Error('Ambiguous render state: Stage is waiting_for_provider but provider_task_id is missing.');
        }

        const status = await renderManager.checkStatus(job.provider, job.provider_task_id);

        if (status.status === 'done' && status.videoUrl) {
          await this.logJobEvent(job.id, 'info', `task=${job.provider_task_id} status=done`);

          await this.fencedJobUpdate(job, 'transition_to_downloading', {
            stage: 'downloading',
          }, 'waiting_for_provider');

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
          await this.fencedJobUpdate(job, 'transition_to_awaiting_review', {
            stage: 'awaiting_review',
            locked_by: null,
            locked_until: null,
          }, 'downloading');
        } else if (status.status === 'failed') {
          throw new Error(status.error || 'Provider reported render failure.');
        }
      }
    } catch (err: unknown) {
      if (err instanceof LostLeaseError) {
        // Worker was preempted by another worker. Cease execution immediately.
        // DO NOT invoke handleJobFailure; DO NOT attempt to rewrite the job state.
        return;
      }
      const errorMessage = err instanceof Error ? err.message : String(err);
      await this.handleJobFailure(job, errorMessage);
    }
  }

  /**
   * Halts resubmission of a job when an ambiguous provider state occurs.
   * Transitions job to 'failed' to prevent duplicate spend, records diagnostic message,
   * and preserves provider_task_id if one was already returned.
   */
  async markAmbiguousSubmissionHalt(job: ProductionJobRecord, message: string, providerTaskId?: string): Promise<void> {
    job.stage = 'failed';
    job.error_message = message;
    if (providerTaskId) {
      job.provider_task_id = providerTaskId;
    }

    await this.logJobEvent(job.id, 'error', message, {
      idempotencyKey: job.idempotency_key,
      attempt: job.attempt,
      providerTaskId: providerTaskId || job.provider_task_id,
    });

    const updatePayload: Record<string, unknown> = {
      stage: 'failed',
      error_message: message,
      locked_by: null,
      locked_until: null,
    };
    if (providerTaskId) {
      updatePayload.provider_task_id = providerTaskId;
    }

    try {
      await this.fencedJobUpdate(job, 'halt_ambiguous_submission', updatePayload);
    } catch (err: unknown) {
      if (err instanceof LostLeaseError) {
        return;
      }
      console.error(`[Worker Error] Failed to persist ambiguous submission halt for job ${job.id}: ${err instanceof Error ? err.message : String(err)}`);
    }
  }

  /**
   * Transitions a job to 'failed' permanently (non-retryable).
   */
  async markJobFailed(job: ProductionJobRecord, message: string): Promise<void> {
    job.stage = 'failed';
    job.error_message = message;

    await this.logJobEvent(job.id, 'error', message, {
      attempt: job.attempt,
    });

    try {
      await this.fencedJobUpdate(job, 'mark_job_failed', {
        stage: 'failed',
        error_message: message,
        locked_by: null,
        locked_until: null,
      });
    } catch (err: unknown) {
      if (err instanceof LostLeaseError) {
        return;
      }
      console.error(`[Worker Error] Failed to persist failure for job ${job.id}: ${err instanceof Error ? err.message : String(err)}`);
    }
  }

  private async handleJobFailure(job: ProductionJobRecord, errorMessage: string): Promise<void> {
    const nextAttempt = job.attempt + 1;

    // Fail closed against duplicate billing:
    // Any job where submission intent was persisted (error_message starts with or includes SUBMITTING_RENDER or Ambiguous)
    // CANNOT be retried as 'queued'.
    const hasStartedSubmission =
      job.error_message === 'SUBMITTING_RENDER' ||
      job.error_message?.includes('SUBMITTING_RENDER') ||
      job.error_message?.includes('Ambiguous') ||
      errorMessage.includes('SUBMITTING_RENDER') ||
      errorMessage.includes('Ambiguous');

    const isExplicitProviderFailure = isDefinitiveProviderRejection(errorMessage) ||
      errorMessage.includes('Provider reported render failure');

    // Pre-request failures in 'started' stage (before intent is written) can retry as 'queued'.
    // Post-submission failures in 'waiting_for_provider' (status check errors) can retry as 'waiting_for_provider'.
    // In-flight or ambiguous submission attempts MUST NOT retry as 'queued'.
    const canRetry = nextAttempt <= job.max_attempts &&
      !isExplicitProviderFailure &&
      !hasStartedSubmission;

    await this.logJobEvent(job.id, 'error', `Job error: ${errorMessage}`, {
      attempt: job.attempt,
      canRetry,
    });

    try {
      if (canRetry) {
        // If the job already has a confirmed provider task ID, retry in waiting_for_provider
        // to continue polling instead of re-submitting to the paid provider
        const retryStage: JobStage = job.provider_task_id ? 'waiting_for_provider' : 'queued';

        await this.fencedJobUpdate(job, 'retry_job', {
          attempt: nextAttempt,
          stage: retryStage,
          error_message: errorMessage,
          locked_by: null,
          locked_until: null,
        });
      } else {
        await this.fencedJobUpdate(job, 'fail_job', {
          stage: 'failed',
          error_message: errorMessage,
          locked_by: null,
          locked_until: null,
        });
      }
    } catch (err: unknown) {
      if (err instanceof LostLeaseError) {
        // Stale worker was preempted; abort without overwriting state
        return;
      }
      console.error(`[Worker Error] Failed to update failure/retry status for job ${job.id}: ${err instanceof Error ? err.message : String(err)}`);
    }
  }

  private async logJobEvent(jobId: string, level: 'info' | 'warn' | 'error', message: string, metadata = {}): Promise<void> {
    const supabase = this.getSupabase();
    const redacted = WorkerManager.redactSensitiveData(message);
    await supabase.from('job_logs').insert({
      job_id: jobId,
      level,
      message: redacted,
      metadata,
    });
  }
}
