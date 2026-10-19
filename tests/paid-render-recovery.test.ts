import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { WorkerManager, type ProductionJobRecord } from '../src/lib/queue/worker-manager.ts';
import { renderManager } from '../src/lib/providers/render/manager.ts';

interface MockDbStore {
  scenes: Record<string, any>;
  jobs: Record<string, ProductionJobRecord>;
  updates: Array<{ table: string; values: any; match: any }>;
  inserts: Array<{ table: string; values: any }>;
  failNextJobUpdate?: boolean;
}

function createMockSupabase(store: MockDbStore) {
  return {
    from: (table: string) => {
      const currentMatch: Record<string, any> = {};
      const builder: any = {
        select: (_cols?: string) => builder,
        eq: (col: string, val: any) => {
          currentMatch[col] = val;
          return builder;
        },
        order: () => builder,
        limit: () => builder,
        single: async () => {
          if (table === 'scenes') {
            const scene = store.scenes[currentMatch.id];
            if (scene) return { data: scene, error: null };
            return { data: null, error: { message: `Scene ${currentMatch.id} not found` } };
          }
          if (table === 'production_jobs') {
            const job = store.jobs[currentMatch.id];
            if (job) return { data: job, error: null };
            return { data: null, error: { message: `Job ${currentMatch.id} not found` } };
          }
          return { data: null, error: null };
        },
        update: (values: any) => {
          return {
            eq: async (col: string, val: any) => {
              currentMatch[col] = val;
              if (table === 'production_jobs' && store.failNextJobUpdate) {
                store.failNextJobUpdate = false;
                return { data: null, error: { message: 'Simulated DB connection failure during job update' } };
              }
              store.updates.push({ table, values, match: { ...currentMatch } });
              if (table === 'production_jobs' && store.jobs[val]) {
                Object.assign(store.jobs[val], values);
              }
              return { data: values, error: null };
            },
          };
        },
        insert: async (values: any) => {
          store.inserts.push({ table, values });
          return { data: values, error: null };
        },
        upsert: async (values: any) => {
          store.inserts.push({ table, values });
          return { data: values, error: null };
        },
      };
      return builder;
    },
    rpc: async () => {
      return { data: null, error: { message: 'RPC not implemented in mock' } };
    },
  };
}

describe('Paid-Render Ambiguous Recovery & Crash Failure-Injection', () => {
  it('Case 1: Halts automatic resubmission when provider throws ambiguous network timeout', async () => {
    // Failure Scenario: Provider call is dispatched after intent is recorded, but client times out.
    // The provider may have initiated the render and charged the user.
    // AUTOMATIC RESUBMISSION MUST BE HALTED to prevent duplicate billing.
    const store: MockDbStore = {
      scenes: {
        'scene-timeout-001': {
          id: 'scene-timeout-001',
          visual_prompt: 'Cyberpunk neon cityscape at night',
          duration_sec: 5,
        },
      },
      jobs: {},
      updates: [],
      inserts: [],
    };

    const mockDb = createMockSupabase(store);
    const worker = new WorkerManager('worker-timeout-test', 300, mockDb);

    const timeoutJob: ProductionJobRecord = {
      id: 'job-timeout-001',
      workspace_id: 'ws-test-001',
      episode_id: 'ep-test-001',
      scene_id: 'scene-timeout-001',
      stage: 'started',
      provider: 'pixverse',
      idempotency_key: 'idemp-timeout-001',
      attempt: 1,
      max_attempts: 3,
      is_mock: false,
      cost_usd: 0.12,
      cost_type: 'estimated',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    store.jobs[timeoutJob.id] = { ...timeoutJob };

    let providerCallsCount = 0;
    const originalSubmit = renderManager.submitRender;

    try {
      renderManager.submitRender = async () => {
        providerCallsCount++;
        throw new Error('ETIMEDOUT: Connection reset by peer after 30000ms');
      };

      await worker.processJob(timeoutJob);

      // Verify provider was contacted exactly once
      assert.equal(providerCallsCount, 1, 'Provider should be contacted exactly once');

      // Verify job is permanently halted in 'failed' stage (NOT reset to 'queued')
      assert.equal(timeoutJob.stage, 'failed', 'Job must transition to failed on ambiguous timeout');
      assert.ok(
        timeoutJob.error_message?.includes('Ambiguous render submission'),
        `Error message must indicate ambiguous submission: ${timeoutJob.error_message}`
      );
      assert.ok(
        timeoutJob.error_message?.includes('ETIMEDOUT'),
        `Error message must retain root cause: ${timeoutJob.error_message}`
      );

      // Verify database update explicitly recorded 'failed' stage
      const failedUpdate = store.updates.find(
        (u) => u.table === 'production_jobs' && u.values.stage === 'failed'
      );
      assert.ok(failedUpdate, 'Must persist stage: failed in database');
      assert.notEqual(
        store.jobs[timeoutJob.id]?.stage,
        'queued',
        'Database record must NOT be reset to queued'
      );

      // Verify a subsequent worker invocation NEVER re-calls the paid provider
      await worker.processJob(timeoutJob);
      assert.equal(
        providerCallsCount,
        1,
        'Subsequent worker run must NOT re-call paid provider'
      );
    } finally {
      renderManager.submitRender = originalSubmit;
    }
  });

  it('Case 2: Halts automatic resubmission and preserves task ID when DB confirmation fails', async () => {
    // Failure Scenario: Provider accepted the render and returned a provider task ID,
    // but the worker encountered a database error while attempting to record provider_task_id.
    // The provider task ID must NOT be discarded, and the job must NOT be reset to 'queued'.
    const store: MockDbStore = {
      scenes: {
        'scene-confirm-fail-002': {
          id: 'scene-confirm-fail-002',
          visual_prompt: 'High-speed drone chase through canyon',
          duration_sec: 5,
        },
      },
      jobs: {},
      updates: [],
      inserts: [],
    };

    const mockDb = createMockSupabase(store);
    const worker = new WorkerManager('worker-confirm-fail-test', 300, mockDb);

    const confirmFailJob: ProductionJobRecord = {
      id: 'job-confirm-fail-002',
      workspace_id: 'ws-test-001',
      episode_id: 'ep-test-001',
      scene_id: 'scene-confirm-fail-002',
      stage: 'started',
      provider: 'pixverse',
      idempotency_key: 'idemp-confirm-002',
      attempt: 1,
      max_attempts: 3,
      is_mock: false,
      cost_usd: 0.12,
      cost_type: 'estimated',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    store.jobs[confirmFailJob.id] = { ...confirmFailJob };

    const originalSubmit = renderManager.submitRender;

    try {
      renderManager.submitRender = async () => {
        // Trigger simulated DB failure on the next update (Phase 3 confirmation)
        store.failNextJobUpdate = true;
        return {
          providerTaskId: 'pix-task-accepted-456',
          provider: 'pixverse',
          status: 'submitted',
          costUsd: 0.12,
          costType: 'estimated',
          isMock: false,
        };
      };

      await worker.processJob(confirmFailJob);

      // Verify job is halted in failed stage, NOT queued
      assert.equal(confirmFailJob.stage, 'failed', 'Job must transition to failed on confirmation DB failure');
      assert.equal(
        confirmFailJob.provider_task_id,
        'pix-task-accepted-456',
        'Provider task ID must be preserved for manual reconciliation'
      );
      assert.ok(
        confirmFailJob.error_message?.includes('Ambiguous render confirmation failure'),
        `Error message must indicate confirmation failure: ${confirmFailJob.error_message}`
      );
      assert.ok(
        confirmFailJob.error_message?.includes('pix-task-accepted-456'),
        'Error message must reference the provider task ID'
      );

      // Verify database record has provider_task_id and failed stage
      assert.equal(store.jobs[confirmFailJob.id]?.stage, 'failed');
      assert.equal(store.jobs[confirmFailJob.id]?.provider_task_id, 'pix-task-accepted-456');
    } finally {
      renderManager.submitRender = originalSubmit;
    }
  });

  it('Case 3: Permanently fails without retry on definitive provider rejection (HTTP 4xx)', async () => {
    // Failure Scenario: Provider explicitly rejected the request due to validation error (e.g. 400).
    // No render was started and no charges were incurred.
    const store: MockDbStore = {
      scenes: {
        'scene-reject-003': {
          id: 'scene-reject-003',
          visual_prompt: 'Invalid scene exceeding duration',
          duration_sec: 12,
        },
      },
      jobs: {},
      updates: [],
      inserts: [],
    };

    const mockDb = createMockSupabase(store);
    const worker = new WorkerManager('worker-reject-test', 300, mockDb);

    const rejectJob: ProductionJobRecord = {
      id: 'job-reject-003',
      workspace_id: 'ws-test-001',
      episode_id: 'ep-test-001',
      scene_id: 'scene-reject-003',
      stage: 'started',
      provider: 'pixverse',
      idempotency_key: 'idemp-reject-003',
      attempt: 1,
      max_attempts: 3,
      is_mock: false,
      cost_usd: 0.12,
      cost_type: 'estimated',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    store.jobs[rejectJob.id] = { ...rejectJob };

    const originalSubmit = renderManager.submitRender;

    try {
      renderManager.submitRender = async () => {
        throw new Error('PixVerse HTTP 400: Scene duration exceeding PixVerse 8s maximum');
      };

      await worker.processJob(rejectJob);

      assert.equal(rejectJob.stage, 'failed', 'Definitive rejection must transition directly to failed');
      assert.ok(
        rejectJob.error_message?.includes('Provider rejected render request'),
        `Error message must indicate provider rejection: ${rejectJob.error_message}`
      );
      assert.notEqual(rejectJob.stage, 'queued', 'Must NOT be retried as queued');
    } finally {
      renderManager.submitRender = originalSubmit;
    }
  });

  it('Case 4: Safely retries pre-request failures before intent is persisted', async () => {
    // Failure Scenario: Scene query fails before intent is recorded.
    // Because no provider call occurred and no intent was persisted, it is safe to retry.
    const store: MockDbStore = {
      scenes: {}, // Scene intentionally missing
      jobs: {},
      updates: [],
      inserts: [],
    };

    const mockDb = createMockSupabase(store);
    const worker = new WorkerManager('worker-prereq-test', 300, mockDb);

    const preReqJob: ProductionJobRecord = {
      id: 'job-prereq-004',
      workspace_id: 'ws-test-001',
      episode_id: 'ep-test-001',
      scene_id: 'scene-missing-004',
      stage: 'started',
      provider: 'pixverse',
      idempotency_key: 'idemp-prereq-004',
      attempt: 1,
      max_attempts: 3,
      is_mock: false,
      cost_usd: 0.12,
      cost_type: 'estimated',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    store.jobs[preReqJob.id] = { ...preReqJob };

    let providerCalled = false;
    const originalSubmit = renderManager.submitRender;

    try {
      renderManager.submitRender = async () => {
        providerCalled = true;
        throw new Error('Provider must not be called when scene is missing');
      };

      await worker.processJob(preReqJob);

      assert.equal(providerCalled, false, 'Provider must never be called on pre-request failure');
      assert.equal(preReqJob.stage, 'queued', 'Pre-request failure must safely retry as queued');
      assert.equal(preReqJob.attempt, 2, 'Attempt count must be incremented');
      assert.ok(
        !preReqJob.error_message?.includes('SUBMITTING_RENDER'),
        'Intent must not have been recorded'
      );
    } finally {
      renderManager.submitRender = originalSubmit;
    }
  });

  it('Case 5: Halts automatic resubmission when recovering an expired lease with SUBMITTING_RENDER intent', async () => {
    // Failure Scenario: Worker crashed while calling the paid provider.
    // Intent 'SUBMITTING_RENDER' was recorded, but provider_task_id is missing.
    // When lease expires and another worker claims it, AUTOMATIC RESUBMISSION IS PROHIBITED.
    const store: MockDbStore = {
      scenes: {
        'scene-crash-005': {
          id: 'scene-crash-005',
          visual_prompt: 'Aerial shot of mountains',
          duration_sec: 5,
        },
      },
      jobs: {},
      updates: [],
      inserts: [],
    };

    const mockDb = createMockSupabase(store);
    const worker = new WorkerManager('worker-recovery-test', 300, mockDb);

    const crashedJob: ProductionJobRecord = {
      id: 'job-crash-ambiguous-005',
      workspace_id: 'ws-test-001',
      episode_id: 'ep-test-001',
      scene_id: 'scene-crash-005',
      stage: 'started',
      provider: 'pixverse',
      provider_task_id: undefined,
      idempotency_key: 'idemp-key-crash-005',
      attempt: 1,
      max_attempts: 3,
      is_mock: false,
      cost_usd: 0.12,
      cost_type: 'estimated',
      error_message: 'SUBMITTING_RENDER', // Intent recorded before crash
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    store.jobs[crashedJob.id] = { ...crashedJob };

    let externalProviderCalled = false;
    const originalSubmit = renderManager.submitRender;

    try {
      renderManager.submitRender = async () => {
        externalProviderCalled = true;
        throw new Error('Should not have been called for ambiguous submission!');
      };

      await worker.processJob(crashedJob);

      // Verify external provider was NEVER called to prevent duplicate billing
      assert.equal(
        externalProviderCalled,
        false,
        'External provider must NOT be re-called when recovering an ambiguous submission'
      );
      assert.equal(crashedJob.stage, 'failed', 'Crashed ambiguous submission must be marked failed');
      assert.ok(
        crashedJob.error_message?.includes('Previous worker crashed while submitting render'),
        `Error message must report previous worker crash: ${crashedJob.error_message}`
      );
    } finally {
      renderManager.submitRender = originalSubmit;
    }
  });

  it('Case 6: Advances directly to waiting_for_provider when task ID is already confirmed on crash recovery', async () => {
    // Failure Scenario: Worker crashed after saving provider_task_id, before transition completed
    const confirmedJob: ProductionJobRecord = {
      id: 'job-crash-confirmed-006',
      workspace_id: 'ws-test-001',
      episode_id: 'ep-test-001',
      scene_id: 'scene-test-006',
      stage: 'started',
      provider: 'pixverse',
      provider_task_id: 'pix-task-confirmed-789',
      idempotency_key: 'idemp-key-confirmed-006',
      attempt: 1,
      max_attempts: 3,
      is_mock: false,
      cost_usd: 0.12,
      cost_type: 'estimated',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    let externalProviderCalled = false;
    const originalSubmit = renderManager.submitRender;

    try {
      renderManager.submitRender = async () => {
        externalProviderCalled = true;
        throw new Error('Duplicate submission detected!');
      };

      const mockDb = createMockSupabase({
        scenes: {},
        jobs: { [confirmedJob.id]: { ...confirmedJob } },
        updates: [],
        inserts: [],
      });
      const worker = new WorkerManager('worker-confirmed-test', 300, mockDb);
      await worker.processJob(confirmedJob);

      assert.equal(
        externalProviderCalled,
        false,
        'Should skip provider submission when provider_task_id already exists'
      );
      assert.equal(confirmedJob.stage, 'waiting_for_provider');
    } finally {
      renderManager.submitRender = originalSubmit;
    }
  });

  it('Case 7: Retries status checks in waiting_for_provider without re-submitting to paid provider', async () => {
    // Failure Scenario: Temporary network error while checking render status
    const pollingJob: ProductionJobRecord = {
      id: 'job-polling-fail-007',
      workspace_id: 'ws-test-001',
      episode_id: 'ep-test-001',
      scene_id: 'scene-test-007',
      stage: 'waiting_for_provider',
      provider: 'pixverse',
      provider_task_id: 'pix-task-polling-999',
      idempotency_key: 'idemp-key-poll-007',
      attempt: 1,
      max_attempts: 3,
      is_mock: false,
      cost_usd: 0.12,
      cost_type: 'estimated',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    const originalStatus = renderManager.checkStatus;

    try {
      // Simulate transient status check network failure
      renderManager.checkStatus = async () => {
        throw new Error('ETIMEDOUT: Connection to PixVerse API reset');
      };

      const mockDb = createMockSupabase({
        scenes: {},
        jobs: { [pollingJob.id]: { ...pollingJob } },
        updates: [],
        inserts: [],
      });
      const worker = new WorkerManager('worker-poll-test', 300, mockDb);
      await worker.processJob(pollingJob);

      // Verify that failure handling keeps the task in waiting_for_provider and preserves provider_task_id
      assert.equal(pollingJob.stage, 'waiting_for_provider');
      assert.equal(pollingJob.provider_task_id, 'pix-task-polling-999');
    } finally {
      renderManager.checkStatus = originalStatus;
    }
  });
});
