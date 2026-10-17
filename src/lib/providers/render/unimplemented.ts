import type { IRenderProvider, ProviderCapability, RenderProviderName, RenderTaskRequest, RenderTaskStatus, RenderTaskSubmission } from './types.ts';

export class UnimplementedProviderError extends Error {
  constructor(providerName: string) {
    super(`[Cutline Provider Error] '${providerName}' is not implemented. Cutline does not simulate video generation.`);
    this.name = 'UnimplementedProviderError';
  }
}

export class UnimplementedRenderProvider implements IRenderProvider {
  readonly name: RenderProviderName;
  readonly capabilities: ProviderCapability;

  constructor(name: RenderProviderName, displayName: string) {
    this.name = name;
    this.capabilities = {
      name,
      displayName,
      implemented: false,
      minDurationSec: 5,
      maxDurationSec: 10,
      supportedAspectRatios: ['16:9', '9:16'],
      supportsProgress: false,
    };
  }

  async submitRender(_request: RenderTaskRequest): Promise<RenderTaskSubmission> {
    throw new UnimplementedProviderError(this.capabilities.displayName);
  }

  async checkStatus(_providerTaskId: string): Promise<RenderTaskStatus> {
    throw new UnimplementedProviderError(this.capabilities.displayName);
  }
}
