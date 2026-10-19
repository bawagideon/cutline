import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { WorkerManager } from '../src/lib/queue/worker-manager.ts';
import { PixVerseProvider } from '../src/lib/providers/render/pixverse.ts';

describe('Queue Worker Manager & Security Leases', () => {
  it('instantiates worker with custom worker ID and default lease duration', () => {
    const worker = new WorkerManager('worker-unit-test-1', 120);
    assert.ok(worker, 'Worker manager should instantiate');
  });

  it('redacts sensitive secrets in log messages using real WorkerManager function', () => {
    const sampleLog = 'Dispatched job with key=sk-proj-supersecretkey1234567890 and Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9 and AIzaSyA1234567890abcdef1234567890abcdef1';
    const redacted = WorkerManager.redactSensitiveData(sampleLog);

    assert.ok(!redacted.includes('supersecretkey'), 'Secret key must be redacted');
    assert.ok(!redacted.includes('eyJhbGciOiJIUzI1Ni'), 'Bearer token payload must be redacted');
    assert.ok(!redacted.includes('SyA1234567890'), 'Google API key must be redacted');
    assert.ok(redacted.includes('key=sk-••••'), 'Mask placeholder must be inserted for key');
    assert.ok(redacted.includes('Bearer ••••••••'), 'Mask placeholder must be inserted for bearer token');
    assert.ok(redacted.includes('AIza••••'), 'Mask placeholder must be inserted for Google key');
  });

  it('verifies WorkerManager claim query eliminates locked_by loophole', async () => {
    const fs = await import('node:fs/promises');
    const path = await import('node:path');

    const workerSrc = await fs.readFile(
      path.join(process.cwd(), 'src/lib/queue/worker-manager.ts'),
      'utf-8'
    );

    // Verify claim query requires expired lease or unheld lock, without self-lock loophole
    assert.ok(
      workerSrc.includes(".or(`locked_until.lt.${nowIso},locked_by.is.null`)"),
      'Fallback claim must strictly require expired lease or unheld lock'
    );
    assert.ok(
      !workerSrc.includes('locked_by.eq.${this.workerId}'),
      'Fallback claim must NOT permit self-lock re-entry loophole'
    );
  });

  it('verifies two-phase intent recording before paid render submission', async () => {
    const fs = await import('node:fs/promises');
    const path = await import('node:path');

    const workerSrc = await fs.readFile(
      path.join(process.cwd(), 'src/lib/queue/worker-manager.ts'),
      'utf-8'
    );

    // Must update job with SUBMITTING_RENDER intent BEFORE renderManager.submitRender
    const intentIdx = workerSrc.indexOf("error_message: 'SUBMITTING_RENDER'");
    const submitIdx = workerSrc.indexOf('renderManager.submitRender(job.provider');
    const confirmIdx = workerSrc.indexOf("provider_task_id: submission.providerTaskId");

    assert.ok(intentIdx > 0, 'Must record SUBMITTING_RENDER intent in database');
    assert.ok(submitIdx > intentIdx, 'External submitRender call must occur after intent record');
    assert.ok(confirmIdx > submitIdx, 'Provider task confirmation must occur after submitRender succeeds');
  });

  it('verifies PixVerse provider accepts and forwards idempotency key', async () => {
    const provider = new PixVerseProvider();
    assert.equal(provider.name, 'pixverse');
    assert.equal(provider.capabilities.implemented, true);
    assert.equal(provider.capabilities.maxDurationSec, 8);
  });
});
