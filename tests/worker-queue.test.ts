import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { WorkerManager } from '../src/lib/queue/worker-manager.ts';

describe('Queue Worker Manager & Security Leases', () => {
  it('instantiates worker with custom worker ID and default lease duration', () => {
    const worker = new WorkerManager('worker-unit-test-1', 120);
    assert.ok(worker, 'Worker manager should instantiate');
  });

  it('redacts sensitive secrets in log messages using real WorkerManager function', () => {
    const sampleLog = 'Dispatched job with key=sk-proj-supersecretkey1234567890 and Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9';
    const redacted = WorkerManager.redactSensitiveData(sampleLog);

    assert.ok(!redacted.includes('supersecretkey'), 'Secret key must be redacted');
    assert.ok(!redacted.includes('eyJhbGciOiJIUzI1Ni'), 'Bearer token payload must be redacted');
    assert.ok(redacted.includes('key=sk-••••'), 'Mask placeholder must be inserted for key');
    assert.ok(redacted.includes('Bearer ••••••••'), 'Mask placeholder must be inserted for bearer token');
  });
});
