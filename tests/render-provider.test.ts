import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { RenderManager } from '../src/lib/providers/render/manager.ts';
import { DevMockProvider } from '../src/lib/providers/render/mock.ts';

describe('Render Provider Pipeline & Duration Limits', () => {
  const manager = new RenderManager();

  it('allows valid scene durations within PixVerse limits (<= 8s)', () => {
    const check5s = manager.validateSceneDuration('pixverse', 5);
    assert.equal(check5s.valid, true);
    assert.equal(check5s.maxDuration, 8);

    const check8s = manager.validateSceneDuration('pixverse', 8);
    assert.equal(check8s.valid, true);
    assert.equal(check8s.maxDuration, 8);
  });

  it('rejects scene duration exceeding PixVerse 8s maximum (e.g. 12s)', () => {
    const check12s = manager.validateSceneDuration('pixverse', 12);
    assert.equal(check12s.valid, false);
    assert.equal(check12s.maxDuration, 8);
    assert.match(check12s.reason || '', /12s exceeds maximum limit of 8s for PixVerse/);
  });

  it('explicitly reports Veo, Kling, Runway as unimplemented', () => {
    const veo = manager.getProvider('veo');
    assert.equal(veo.capabilities.implemented, false);

    const kling = manager.getProvider('kling');
    assert.equal(kling.capabilities.implemented, false);

    const runway = manager.getProvider('runway');
    assert.equal(runway.capabilities.implemented, false);
  });

  it('rejects DevMockProvider in production or when ALLOW_DEV_MOCK_RENDER is not enabled', async () => {
    const mock = new DevMockProvider();
    const originalEnv = process.env.NODE_ENV;
    const originalAllow = process.env.ALLOW_DEV_MOCK_RENDER;

    try {
      // Test production lock
      (process.env as Record<string, string | undefined>)['NODE_ENV'] = 'production';
      process.env.ALLOW_DEV_MOCK_RENDER = 'true';

      await assert.rejects(
        async () => {
          await mock.submitRender({ prompt: 'test', durationSec: 5, aspectRatio: '16:9' });
        },
        /SECURITY GUARD/
      );

      // Test without ALLOW_DEV_MOCK_RENDER
      (process.env as Record<string, string | undefined>)['NODE_ENV'] = 'development';
      delete process.env.ALLOW_DEV_MOCK_RENDER;

      await assert.rejects(
        async () => {
          await mock.submitRender({ prompt: 'test', durationSec: 5, aspectRatio: '16:9' });
        },
        /SECURITY GUARD/
      );
    } finally {
      (process.env as Record<string, string | undefined>)['NODE_ENV'] = originalEnv;
      if (originalAllow) process.env.ALLOW_DEV_MOCK_RENDER = originalAllow;
    }
  });
});
