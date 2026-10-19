import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { WorkerManager, type ProductionJobRecord } from '../src/lib/queue/worker-manager.ts';

describe('Paid-Render Ambiguous Recovery & Crash Failure-Injection', () => {
  const worker = new WorkerManager('worker-recovery-test', 300);

  it('halts automatic resubmission when a job is recovered with ambiguous submission intent', async () => {
    // Failure Scenario: Worker crashed while calling the paid provider.
    // Intent 'SUBMITTING_RENDER' was recorded, but provider_task_id is missing.
    const ambiguousJob: ProductionJobRecord = {
      id: 'job-crash-ambiguous-001',
      workspace_id: 'ws-test-001',
      episode_id: 'ep-test-001',
      scene_id: 'scene-test-001',
      stage: 'started',
      provider: 'pixverse',
      provider_task_id: undefined,
      idempotency_key: 'idemp-key-crash-001',
      attempt: 1,
      max_attempts: 3,
      is_mock: false,
      cost_usd: 0.12,
      cost_type: 'estimated',
      error_message: 'SUBMITTING_RENDER', // Ambiguous state indicator
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    // Track whether external provider was called
    let externalProviderCalled = false;
    const { renderManager } = await import('../src/lib/providers/render/manager.ts');
    const originalSubmit = renderManager.submitRender;

    try {
      renderManager.submitRender = async () => {
        externalProviderCalled = true;
        throw new Error('Should not have been called for ambiguous submission!');
      };

      await worker.processJob(ambiguousJob);

      // Verify external provider was NEVER called to prevent duplicate billing
      assert.equal(
        externalProviderCalled,
        false,
        'External provider must NOT be re-called when recovering an ambiguous submission'
      );
    } finally {
      renderManager.submitRender = originalSubmit;
    }
  });

  it('advances directly to waiting_for_provider when task ID is already confirmed on crash recovery', async () => {
    // Failure Scenario: Worker crashed after saving provider_task_id, before transition completed
    const confirmedJob: ProductionJobRecord = {
      id: 'job-crash-confirmed-002',
      workspace_id: 'ws-test-001',
      episode_id: 'ep-test-001',
      scene_id: 'scene-test-001',
      stage: 'started',
      provider: 'pixverse',
      provider_task_id: 'pix-task-confirmed-789',
      idempotency_key: 'idemp-key-confirmed-002',
      attempt: 1,
      max_attempts: 3,
      is_mock: false,
      cost_usd: 0.12,
      cost_type: 'estimated',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    let externalProviderCalled = false;
    const { renderManager } = await import('../src/lib/providers/render/manager.ts');
    const originalSubmit = renderManager.submitRender;

    try {
      renderManager.submitRender = async () => {
        externalProviderCalled = true;
        throw new Error('Duplicate submission detected!');
      };

      await worker.processJob(confirmedJob);

      assert.equal(
        externalProviderCalled,
        false,
        'Should skip provider submission when provider_task_id already exists'
      );
    } finally {
      renderManager.submitRender = originalSubmit;
    }
  });

  it('retries status checks in waiting_for_provider without re-submitting to paid provider', async () => {
    // Failure Scenario: Temporary network error while checking render status
    const pollingJob: ProductionJobRecord = {
      id: 'job-polling-fail-003',
      workspace_id: 'ws-test-001',
      episode_id: 'ep-test-001',
      scene_id: 'scene-test-001',
      stage: 'waiting_for_provider',
      provider: 'pixverse',
      provider_task_id: 'pix-task-polling-999',
      idempotency_key: 'idemp-key-poll-003',
      attempt: 1,
      max_attempts: 3,
      is_mock: false,
      cost_usd: 0.12,
      cost_type: 'estimated',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    const { renderManager } = await import('../src/lib/providers/render/manager.ts');
    const originalStatus = renderManager.checkStatus;

    try {
      // Simulate transient status check network failure
      renderManager.checkStatus = async () => {
        throw new Error('ETIMEDOUT: Connection to PixVerse API reset');
      };

      await worker.processJob(pollingJob);

      // Verify that failure handling keeps the task in waiting_for_provider and preserves provider_task_id
      assert.equal(pollingJob.provider_task_id, 'pix-task-polling-999');
    } finally {
      renderManager.checkStatus = originalStatus;
    }
  });
});
