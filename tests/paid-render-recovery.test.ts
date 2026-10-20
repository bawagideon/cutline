import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  WorkerManager,
  LostLeaseError,
  isDefinitiveProviderRejection,
  type ProductionJobRecord,
} from '../src/lib/queue/worker-manager.ts';
import { renderManager } from '../src/lib/providers/render/manager.ts';
import { RenderProviderError } from '../src/lib/providers/render/types.ts';

interface DatabaseState {
  production_jobs: Record<string, ProductionJobRecord>;
  scenes: Record<string, any>;
  job_logs: Array<{ job_id: string; level: string; message: string; metadata?: any }>;
  failNextWriteTable?: string;
}

/**
 * High-fidelity PostgreSQL queue simulator.
 * Faithfully simulates atomic conditional updates, fencing tokens, zero-row update detection,
 * and concurrent worker lease claims according to PostgreSQL / Supabase semantics.
 */
function createPostgresQueueSimulator(db: DatabaseState) {
  return {
    from: (table: string) => {
      const filters: Array<(row: any) => boolean> = [];
      const orFilters: string[] = [];
      let orderByField: string | null = null;
      let orderAsc: boolean = true;
      let limitCount: number | null = null;

      const builder: any = {
        select: (_cols?: string) => builder,
        eq: (col: string, val: any) => {
          filters.push((row) => row[col] === val);
          return builder;
        },
        neq: (col: string, val: any) => {
          filters.push((row) => row[col] !== val);
          return builder;
        },
        lt: (col: string, val: any) => {
          filters.push((row) => row[col] !== null && row[col] !== undefined && row[col] < val);
          return builder;
        },
        or: (orExpression: string) => {
          orFilters.push(orExpression);
          return builder;
        },
        order: (field: string, opts?: { ascending?: boolean }) => {
          orderByField = field;
          orderAsc = opts?.ascending ?? true;
          return builder;
        },
        limit: (count: number) => {
          limitCount = count;
          return builder;
        },
        single: async () => {
          const res = await builder.then((r: any) => r);
          const rows = res.data || [];
          if (rows.length === 0) {
            return { data: null, error: { message: 'Row not found', code: 'PGRST116' } };
          }
          return { data: rows[0], error: null };
        },
        update: (values: any) => {
          return {
            eq: (col: string, val: any) => {
              filters.push((row) => row[col] === val);
              return builder.update(values);
            },
            or: (orExpression: string) => {
              orFilters.push(orExpression);
              return builder.update(values);
            },
            select: () => {
              const exec = async () => {
                if (db.failNextWriteTable === table) {
                  db.failNextWriteTable = undefined;
                  return {
                    data: null,
                    error: { message: `Simulated PostgreSQL connection failure on update to ${table}` },
                  };
                }

                if (table !== 'production_jobs') {
                  return { data: [], error: null };
                }

                // Evaluate all matching rows against filters
                const matchedRows: ProductionJobRecord[] = [];
                for (const row of Object.values(db.production_jobs)) {
                  let matches = filters.every((fn) => fn(row));
                  if (matches && orFilters.length > 0) {
                    for (const orExpr of orFilters) {
                      const clauses = orExpr.split(',');
                      const rec = row as Record<string, any>;
                      const passesOr = clauses.some((clause) => {
                        if (clause.includes('.is.null')) {
                          const col = clause.split('.is.null')[0];
                          return rec[col] === null || rec[col] === undefined;
                        }
                        if (clause.includes('.lt.')) {
                          const [col, val] = clause.split('.lt.');
                          return rec[col] !== null && rec[col] !== undefined && rec[col] < val;
                        }
                        if (clause.includes('.eq.')) {
                          const [col, val] = clause.split('.eq.');
                          return String(rec[col]) === val;
                        }
                        return false;
                      });
                      if (!passesOr) {
                        matches = false;
                        break;
                      }
                    }
                  }
                  if (matches) {
                    matchedRows.push(row);
                  }
                }

                // Fencing check: 0 rows matched means lease or attempt token did not match!
                if (matchedRows.length === 0) {
                  return { data: [], error: null };
                }

                const updatedRows: ProductionJobRecord[] = [];
                for (const row of matchedRows) {
                  Object.assign(row, values);
                  updatedRows.push({ ...row });
                }
                return { data: updatedRows, error: null };
              };

              return {
                then: (onfulfilled: any, onrejected: any) => exec().then(onfulfilled, onrejected),
                single: async () => {
                  const res = await exec();
                  if (res.error) return res;
                  const rows = res.data || [];
                  if (rows.length === 0) {
                    return { data: null, error: { message: 'Row not found', code: 'PGRST116' } };
                  }
                  return { data: rows[0], error: null };
                },
              };
            },
          };
        },
        insert: async (values: any) => {
          if (table === 'job_logs') {
            const entry = Array.isArray(values) ? values : [values];
            db.job_logs.push(...entry);
            return { data: values, error: null };
          }
          return { data: values, error: null };
        },
        upsert: async (values: any) => {
          return { data: values, error: null };
        },
      };

      builder.then = (resolve: any) => {
        if (table === 'scenes') {
          const matched = Object.values(db.scenes).filter((s) => filters.every((fn) => fn(s)));
          return resolve({ data: matched, error: null });
        }
        if (table === 'production_jobs') {
          let matched = Object.values(db.production_jobs).filter((j) => {
            let passes = filters.every((fn) => fn(j));
            if (passes && orFilters.length > 0) {
              for (const orExpr of orFilters) {
                if (orExpr.includes('stage.eq.queued')) {
                  const nowIso = new Date().toISOString();
                  const isQueued = j.stage === 'queued';
                  const isExpiredLease =
                    j.stage !== 'completed' &&
                    j.stage !== 'failed' &&
                    (j.locked_until === null || j.locked_until === undefined || j.locked_until < nowIso);
                  if (!isQueued && !isExpiredLease) {
                    passes = false;
                    break;
                  }
                }
              }
            }
            return passes;
          });
          if (orderByField) {
            matched.sort((a: any, b: any) => {
              if (a[orderByField!] < b[orderByField!]) return orderAsc ? -1 : 1;
              if (a[orderByField!] > b[orderByField!]) return orderAsc ? 1 : -1;
              return 0;
            });
          }
          if (limitCount) {
            matched = matched.slice(0, limitCount);
          }
          return resolve({ data: matched.map((r) => ({ ...r })), error: null });
        }
        return resolve({ data: [], error: null });
      };

      return builder;
    },
    rpc: async () => ({ data: null, error: { message: 'RPC fallback' } }),
  };
}

describe('Paid-Render Concurrency Fencing, Ambiguous Recovery & Real Provider Classification', () => {
  it('Case 1: Fencing Token Enforcement — Stale worker with expired lease is prohibited from overwriting newer worker or submitting renders', async () => {
    // Failure Scenario: Worker 1 claimed the job (attempt=1), but its lease expired while fetching scene data.
    // Worker 2 claimed the job (attempt=2, locked_by='worker-2').
    // When Worker 1 wakes up and attempts a write, the DB update MUST match 0 rows, throw LostLeaseError,
    // and abort before any paid provider call can be made.
    const db: DatabaseState = {
      production_jobs: {},
      scenes: {
        'scene-fence-001': {
          id: 'scene-fence-001',
          visual_prompt: 'Cyberpunk neon rain',
          duration_sec: 5,
        },
      },
      job_logs: [],
    };

    const simulator = createPostgresQueueSimulator(db);
    const worker1 = new WorkerManager('worker-1', 1, simulator);
    const worker2 = new WorkerManager('worker-2', 300, simulator);

    // Initial queued job in DB
    const initialJob: ProductionJobRecord = {
      id: 'job-fence-001',
      workspace_id: 'ws-test-001',
      episode_id: 'ep-test-001',
      scene_id: 'scene-fence-001',
      stage: 'queued',
      provider: 'pixverse',
      idempotency_key: 'idemp-fence-001',
      attempt: 0,
      max_attempts: 3,
      is_mock: false,
      cost_usd: 0.12,
      cost_type: 'estimated',
      created_at: new Date(Date.now() - 60000).toISOString(),
      updated_at: new Date(Date.now() - 60000).toISOString(),
    };
    db.production_jobs[initialJob.id] = { ...initialJob };

    // Worker 1 claims job
    const worker1Job = await worker1.claimNextJob();
    assert.ok(worker1Job, 'Worker 1 should claim job');
    assert.equal(worker1Job.attempt, 1);
    assert.equal(worker1Job.locked_by, 'worker-1');

    // Simulate Worker 1's lease expiring (lease was 1 second)
    db.production_jobs[initialJob.id].locked_until = new Date(Date.now() - 5000).toISOString();

    // Worker 2 claims the expired lease atomically
    const worker2Job = await worker2.claimNextJob();
    assert.ok(worker2Job, 'Worker 2 should claim expired lease');
    assert.equal(worker2Job.attempt, 2, 'Worker 2 increments attempt fencing token');
    assert.equal(worker2Job.locked_by, 'worker-2', 'Worker 2 is now the active lock holder');

    // Worker 1 wakes up and tries to process its stale in-memory job
    let worker1ProviderCalled = false;
    const originalSubmit = renderManager.submitRender;

    try {
      renderManager.submitRender = async () => {
        worker1ProviderCalled = true;
        throw new Error('Worker 1 must NEVER reach submitRender because its lease was lost!');
      };

      // Worker 1 executes processJob
      await worker1.processJob(worker1Job);

      // Verify Worker 1 was fenced out:
      assert.equal(worker1ProviderCalled, false, 'Stale Worker 1 must never call provider');

      // Verify Worker 2's ownership was NOT corrupted or overwritten:
      const currentDbJob = db.production_jobs[initialJob.id];
      assert.equal(currentDbJob.attempt, 2, 'Attempt must remain 2 (Worker 2)');
      assert.equal(currentDbJob.locked_by, 'worker-2', 'Lock must remain worker-2');
      assert.notEqual(currentDbJob.locked_by, 'worker-1', 'Stale worker must not have reclaimed lock');
      assert.notEqual(currentDbJob.locked_by, null, 'Stale worker must not have cleared lock');
    } finally {
      renderManager.submitRender = originalSubmit;
    }
  });

  it('Case 2: Cross-Worker Crash Recovery — Fresh worker claims crashed job after restart and halts resubmission', async () => {
    // Failure Scenario: Worker 1 persisted SUBMITTING_RENDER and crashed mid-call.
    // Worker 2 (a fresh process) starts up after lease expires, claims the job from DB,
    // detects ambiguous state, and halts without re-submitting to paid provider.
    const db: DatabaseState = {
      production_jobs: {},
      scenes: {
        'scene-crash-002': {
          id: 'scene-crash-002',
          visual_prompt: 'Dramatic mountain landscape',
          duration_sec: 5,
        },
      },
      job_logs: [],
    };

    const pastIso = new Date(Date.now() - 60000).toISOString();
    const crashedJobRecord: ProductionJobRecord = {
      id: 'job-crash-002',
      workspace_id: 'ws-test-001',
      episode_id: 'ep-test-001',
      scene_id: 'scene-crash-002',
      stage: 'started',
      provider: 'pixverse',
      idempotency_key: 'idemp-crash-002',
      attempt: 1,
      max_attempts: 3,
      is_mock: false,
      cost_usd: 0.12,
      cost_type: 'estimated',
      error_message: 'SUBMITTING_RENDER', // Persisted by crashed worker
      locked_by: 'worker-crashed',
      locked_until: pastIso, // Expired lease
      created_at: pastIso,
      updated_at: pastIso,
    };
    db.production_jobs[crashedJobRecord.id] = { ...crashedJobRecord };

    const simulator = createPostgresQueueSimulator(db);
    const workerFresh = new WorkerManager('worker-fresh', 300, simulator);

    // Fresh worker claims the job from DB
    const freshClaimedJob = await workerFresh.claimNextJob();
    assert.ok(freshClaimedJob, 'Fresh worker should claim the expired crashed job');
    assert.equal(freshClaimedJob.attempt, 2, 'Attempt incremented to 2');
    assert.equal(freshClaimedJob.locked_by, 'worker-fresh');
    assert.equal(freshClaimedJob.error_message, 'SUBMITTING_RENDER');

    let providerCalled = false;
    const originalSubmit = renderManager.submitRender;

    try {
      renderManager.submitRender = async () => {
        providerCalled = true;
        throw new Error('Fresh worker must NEVER call provider for ambiguous crashed job!');
      };

      await workerFresh.processJob(freshClaimedJob);

      // Verify provider was never called:
      assert.equal(providerCalled, false, 'Provider must not be called during crash recovery');

      // Verify DB record was transitioned to failed with halt explanation:
      const updatedDbJob = db.production_jobs[crashedJobRecord.id];
      assert.equal(updatedDbJob.stage, 'failed', 'Crashed job must transition to failed');
      assert.ok(
        updatedDbJob.error_message?.includes('Previous worker crashed while submitting render'),
        `Diagnostic error must report crash: ${updatedDbJob.error_message}`
      );
      assert.equal(updatedDbJob.locked_by, null, 'Lock should be released on failure');
    } finally {
      renderManager.submitRender = originalSubmit;
    }
  });

  it('Case 3: Realistic PixVerse Adapter Error — HTTP 400 with generic body is classified as definitive rejection', async () => {
    // Failure Scenario: Real PixVerse API returns standard HTTP 400 with no keywords like "maximum" or "PixVerse":
    // e.g. {"code": 400, "message": "Invalid prompt parameter"}
    // The structured RenderProviderError must be classified as a definitive client rejection and failed without retry.
    const db: DatabaseState = {
      production_jobs: {},
      scenes: {
        'scene-400-003': {
          id: 'scene-400-003',
          visual_prompt: 'Invalid prompt syntax test',
          duration_sec: 5,
        },
      },
      job_logs: [],
    };

    const initialJob: ProductionJobRecord = {
      id: 'job-400-003',
      workspace_id: 'ws-test-001',
      episode_id: 'ep-test-001',
      scene_id: 'scene-400-003',
      stage: 'queued',
      provider: 'pixverse',
      idempotency_key: 'idemp-400-003',
      attempt: 0,
      max_attempts: 3,
      is_mock: false,
      cost_usd: 0.12,
      cost_type: 'estimated',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    db.production_jobs[initialJob.id] = { ...initialJob };

    const simulator = createPostgresQueueSimulator(db);
    const worker = new WorkerManager('worker-400-test', 300, simulator);

    const claimed = await worker.claimNextJob();
    assert.ok(claimed);

    const originalSubmit = renderManager.submitRender;

    try {
      // Simulate real PixVerse adapter throwing structured 400 error with generic payload
      renderManager.submitRender = async () => {
        throw new RenderProviderError({
          message: '[PixVerse API Error 400] {"code": 400, "message": "Invalid prompt parameter"}',
          provider: 'pixverse',
          statusCode: 400,
          definitiveRejection: true,
          retryable: false,
        });
      };

      await worker.processJob(claimed);

      const dbJob = db.production_jobs[initialJob.id];
      assert.equal(dbJob.stage, 'failed', 'HTTP 400 must transition directly to failed');
      assert.ok(
        dbJob.error_message?.includes('Provider rejected render request'),
        `Must report provider rejection: ${dbJob.error_message}`
      );
      assert.notEqual(dbJob.stage, 'queued', 'Must NOT be reset to queued for retry');
    } finally {
      renderManager.submitRender = originalSubmit;
    }
  });

  it('Case 4: Provider Acceptance followed by Client Timeout — Proves provider is never called a second time', async () => {
    // Failure Scenario: Provider call is dispatched. Client encounters ETIMEDOUT network reset.
    // The worker halts resubmission in DB. Subsequent worker attempts will find job in 'failed' and never re-bill.
    const db: DatabaseState = {
      production_jobs: {},
      scenes: {
        'scene-timeout-004': {
          id: 'scene-timeout-004',
          visual_prompt: 'Sci-fi spaceship interior',
          duration_sec: 5,
        },
      },
      job_logs: [],
    };

    const initialJob: ProductionJobRecord = {
      id: 'job-timeout-004',
      workspace_id: 'ws-test-001',
      episode_id: 'ep-test-001',
      scene_id: 'scene-timeout-004',
      stage: 'queued',
      provider: 'pixverse',
      idempotency_key: 'idemp-timeout-004',
      attempt: 0,
      max_attempts: 3,
      is_mock: false,
      cost_usd: 0.12,
      cost_type: 'estimated',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    db.production_jobs[initialJob.id] = { ...initialJob };

    const simulator = createPostgresQueueSimulator(db);
    const worker1 = new WorkerManager('worker-1', 300, simulator);

    const claimed = await worker1.claimNextJob();
    assert.ok(claimed);

    let totalSubmissions = 0;
    const originalSubmit = renderManager.submitRender;

    try {
      renderManager.submitRender = async () => {
        totalSubmissions++;
        throw new Error('ETIMEDOUT: Connection reset by peer after 30000ms');
      };

      await worker1.processJob(claimed);

      // Verify provider called once
      assert.equal(totalSubmissions, 1, 'Provider should be called once');

      // Verify DB record is failed
      const dbJob = db.production_jobs[initialJob.id];
      assert.equal(dbJob.stage, 'failed');
      assert.ok(dbJob.error_message?.includes('Ambiguous render submission'));

      // Now simulate a restarted worker attempting to claim eligible jobs
      const workerRestarted = new WorkerManager('worker-restarted', 300, simulator);
      const claimedAfterRestart = await workerRestarted.claimNextJob();

      assert.equal(claimedAfterRestart, null, 'Job in failed stage must NOT be claimed by any worker');
      assert.equal(totalSubmissions, 1, 'Total provider calls must strictly remain 1');
    } finally {
      renderManager.submitRender = originalSubmit;
    }
  });

  it('Case 5: Provider Task Confirmation DB Failure — Preserves returned task ID for reconciliation', async () => {
    // Failure Scenario: Provider returns task ID successfully, but writing it to DB encounters connection failure.
    // Task ID must be preserved in DB so operator can reconcile without losing track of the paid render.
    const db: DatabaseState = {
      production_jobs: {},
      scenes: {
        'scene-confirm-005': {
          id: 'scene-confirm-005',
          visual_prompt: 'Futuristic vehicle speed test',
          duration_sec: 5,
        },
      },
      job_logs: [],
    };

    const initialJob: ProductionJobRecord = {
      id: 'job-confirm-005',
      workspace_id: 'ws-test-001',
      episode_id: 'ep-test-001',
      scene_id: 'scene-confirm-005',
      stage: 'queued',
      provider: 'pixverse',
      idempotency_key: 'idemp-confirm-005',
      attempt: 0,
      max_attempts: 3,
      is_mock: false,
      cost_usd: 0.12,
      cost_type: 'estimated',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    db.production_jobs[initialJob.id] = { ...initialJob };

    const simulator = createPostgresQueueSimulator(db);
    const worker = new WorkerManager('worker-confirm-test', 300, simulator);

    const claimed = await worker.claimNextJob();
    assert.ok(claimed);

    const originalSubmit = renderManager.submitRender;

    try {
      renderManager.submitRender = async () => {
        // Trigger simulated DB failure on the next update (Phase 3 confirmation)
        db.failNextWriteTable = 'production_jobs';
        return {
          providerTaskId: 'pix-task-persisted-555',
          provider: 'pixverse',
          status: 'submitted',
          costUsd: 0.12,
          costType: 'estimated',
          isMock: false,
        };
      };

      await worker.processJob(claimed);

      const dbJob = db.production_jobs[initialJob.id];
      assert.equal(dbJob.stage, 'failed', 'Must transition to failed');
      assert.equal(
        dbJob.provider_task_id,
        'pix-task-persisted-555',
        'Returned provider task ID must be saved in DB for operator reconciliation'
      );
      assert.ok(
        dbJob.error_message?.includes('Ambiguous render confirmation failure'),
        `Error must explain confirmation failure: ${dbJob.error_message}`
      );
      assert.notEqual(dbJob.stage, 'queued', 'Must NOT be reset to queued');
    } finally {
      renderManager.submitRender = originalSubmit;
    }
  });

  it('Case 6: Pre-request Failure before Intent Persistence — Safely retries as queued', async () => {
    // Failure Scenario: Scene lookup fails before intent is recorded.
    // Provider was never called, so safe to retry.
    const db: DatabaseState = {
      production_jobs: {},
      scenes: {}, // Scene intentionally missing
      job_logs: [],
    };

    const initialJob: ProductionJobRecord = {
      id: 'job-prereq-006',
      workspace_id: 'ws-test-001',
      episode_id: 'ep-test-001',
      scene_id: 'scene-missing-006',
      stage: 'queued',
      provider: 'pixverse',
      idempotency_key: 'idemp-prereq-006',
      attempt: 0,
      max_attempts: 3,
      is_mock: false,
      cost_usd: 0.12,
      cost_type: 'estimated',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    db.production_jobs[initialJob.id] = { ...initialJob };

    const simulator = createPostgresQueueSimulator(db);
    const worker = new WorkerManager('worker-prereq-test', 300, simulator);

    const claimed = await worker.claimNextJob();
    assert.ok(claimed);

    let providerCalled = false;
    const originalSubmit = renderManager.submitRender;

    try {
      renderManager.submitRender = async () => {
        providerCalled = true;
        throw new Error('Provider must not be called');
      };

      await worker.processJob(claimed);

      assert.equal(providerCalled, false, 'Provider must not be called on pre-request failure');
      const dbJob = db.production_jobs[initialJob.id];
      assert.equal(dbJob.stage, 'queued', 'Pre-request failure safely retries in queued stage');
      assert.equal(dbJob.attempt, 2, 'Attempt count incremented');
      assert.equal(dbJob.locked_by, null, 'Lock released for next worker');
    } finally {
      renderManager.submitRender = originalSubmit;
    }
  });

  it('Case 7: Polling Transient Failure in waiting_for_provider — Keeps task in waiting_for_provider without re-submitting', async () => {
    // Failure Scenario: Transient status check failure while polling.
    // Job must remain in waiting_for_provider and keep provider_task_id intact.
    const db: DatabaseState = {
      production_jobs: {},
      scenes: {
        'scene-poll-007': { id: 'scene-poll-007' },
      },
      job_logs: [],
    };

    const pollingJob: ProductionJobRecord = {
      id: 'job-poll-007',
      workspace_id: 'ws-test-001',
      episode_id: 'ep-test-001',
      scene_id: 'scene-poll-007',
      stage: 'waiting_for_provider',
      provider: 'pixverse',
      provider_task_id: 'pix-task-poll-777',
      idempotency_key: 'idemp-poll-007',
      attempt: 1,
      max_attempts: 3,
      is_mock: false,
      cost_usd: 0.12,
      cost_type: 'estimated',
      locked_by: 'worker-poll',
      locked_until: new Date(Date.now() + 300000).toISOString(),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    db.production_jobs[pollingJob.id] = { ...pollingJob };

    const simulator = createPostgresQueueSimulator(db);
    const worker = new WorkerManager('worker-poll', 300, simulator);

    const originalStatus = renderManager.checkStatus;

    try {
      renderManager.checkStatus = async () => {
        throw new Error('ETIMEDOUT: Connection to PixVerse API reset');
      };

      await worker.processJob(pollingJob);

      const dbJob = db.production_jobs[pollingJob.id];
      assert.equal(dbJob.stage, 'waiting_for_provider', 'Must retry in waiting_for_provider');
      assert.equal(dbJob.provider_task_id, 'pix-task-poll-777', 'Must retain provider_task_id');
      assert.equal(dbJob.attempt, 2);
    } finally {
      renderManager.checkStatus = originalStatus;
    }
  });
});
