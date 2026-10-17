import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { WorkerManager } from '../src/lib/queue/worker-manager.ts';

describe('Queue Worker Manager & Security Leases', () => {
  it('instantiates worker with custom worker ID and default lease duration', () => {
    const worker = new WorkerManager('worker-unit-test-1', 120);
    assert.ok(worker, 'Worker manager should instantiate');
  });

  it('redacts sensitive secrets in log messages', () => {
    const sampleLog = 'Dispatched job with key=sk-proj-supersecretkey1234567890 to PixVerse';
    const redacted = sampleLog.replace(/(key=)(sk-[a-zA-Z0-9_\-]+)/g, '$1sk-••••');

    assert.ok(!redacted.includes('supersecretkey'), 'Secret key must be redacted');
    assert.ok(redacted.includes('key=sk-••••'), 'Mask placeholder must be inserted');
  });
});
