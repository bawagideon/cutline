import type { IRenderProvider, ProviderCapability, RenderProviderName, RenderTaskRequest, RenderTaskStatus, RenderTaskSubmission } from './types.ts';
import { PixVerseProvider } from './pixverse.ts';
import { DevMockProvider } from './mock.ts';
import { UnimplementedRenderProvider } from './unimplemented.ts';

export class RenderManager {
  private providers: Map<RenderProviderName, IRenderProvider> = new Map();

  constructor() {
    this.providers.set('pixverse', new PixVerseProvider());
    this.providers.set('dev_mock', new DevMockProvider());
    this.providers.set('veo', new UnimplementedRenderProvider('veo', 'Google Veo'));
    this.providers.set('kling', new UnimplementedRenderProvider('kling', 'Kling AI'));
    this.providers.set('runway', new UnimplementedRenderProvider('runway', 'Runway Gen-3'));
  }

  getProvider(name: RenderProviderName): IRenderProvider {
    const provider = this.providers.get(name);
    if (!provider) {
      throw new Error(`[RenderManager] Unknown render provider '${name}'.`);
    }
    return provider;
  }

  listCapabilities(): ProviderCapability[] {
    return Array.from(this.providers.values()).map((p) => p.capabilities);
  }

  /**
   * Validates scene duration against the provider's limits.
   * Returns validation result with boolean and explanation if over limit.
   */
  validateSceneDuration(
    providerName: RenderProviderName,
    durationSec: number
  ): { valid: boolean; maxDuration: number; reason?: string } {
    const provider = this.getProvider(providerName);
    const max = provider.capabilities.maxDurationSec;
    if (durationSec > max) {
      return {
        valid: false,
        maxDuration: max,
        reason: `${durationSec}s exceeds maximum limit of ${max}s for ${provider.capabilities.displayName}.`,
      };
    }
    return { valid: true, maxDuration: max };
  }

  /**
   * Submits a render to the designated provider.
   * NEVER silently falls back to mock mode in production!
   */
  async submitRender(
    providerName: RenderProviderName,
    request: RenderTaskRequest,
    apiKey?: string
  ): Promise<RenderTaskSubmission> {
    const provider = this.getProvider(providerName);

    if (!provider.capabilities.implemented) {
      throw new Error(`[RenderManager] Provider '${provider.capabilities.displayName}' is not implemented. Production renders require an operational provider.`);
    }

    const durationCheck = this.validateSceneDuration(providerName, request.durationSec);
    if (!durationCheck.valid) {
      throw new Error(`[RenderManager] ${durationCheck.reason}`);
    }

    return await provider.submitRender(request, apiKey);
  }

  async checkStatus(
    providerName: RenderProviderName,
    providerTaskId: string,
    apiKey?: string
  ): Promise<RenderTaskStatus> {
    const provider = this.getProvider(providerName);
    return await provider.checkStatus(providerTaskId, apiKey);
  }
}

export const renderManager = new RenderManager();
