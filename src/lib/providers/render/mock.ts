import type { IRenderProvider, ProviderCapability, RenderTaskRequest, RenderTaskStatus, RenderTaskSubmission } from './types.ts';

/**
 * Dev mock renderer for offline testing and visual layout verification.
 * STRICTLY REFUSES to run in production or when ALLOW_DEV_MOCK_RENDER is not explicitly set to 'true'.
 */
export class DevMockProvider implements IRenderProvider {
  readonly name = 'dev_mock';
  readonly capabilities: ProviderCapability = {
    name: 'dev_mock',
    displayName: 'Dev Mock Renderer',
    implemented: true,
    minDurationSec: 1,
    maxDurationSec: 30,
    supportedAspectRatios: ['16:9', '9:16'],
    supportsProgress: true,
  };

  private ensureAllowed() {
    const isAllowed = process.env.ALLOW_DEV_MOCK_RENDER === 'true';
    const isProduction = process.env.NODE_ENV === 'production';

    if (isProduction || !isAllowed) {
      throw new Error(
        '[SECURITY GUARD] Dev Mock Renderer is disabled in production. Set ALLOW_DEV_MOCK_RENDER=true in non-production environments to enable local visual testing.'
      );
    }
  }

  async submitRender(request: RenderTaskRequest): Promise<RenderTaskSubmission> {
    this.ensureAllowed();
    void request;

    return {
      providerTaskId: `mock_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      provider: 'dev_mock',
      status: 'submitted',
      costUsd: 0.0,
      costType: 'estimated',
      isMock: true,
    };
  }

  async checkStatus(providerTaskId: string): Promise<RenderTaskStatus> {
    this.ensureAllowed();

    return {
      providerTaskId,
      status: 'done',
      videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4',
      progressPct: 100,
    };
  }
}
