export type RenderProviderName = 'pixverse' | 'veo' | 'kling' | 'runway' | 'dev_mock';

export interface RenderTaskRequest {
  prompt: string;
  negativePrompt?: string;
  durationSec: number;
  aspectRatio: '16:9' | '9:16';
  resolution?: '720p' | '1080p';
  seed?: number;
  idempotencyKey?: string;
}

export interface RenderTaskSubmission {
  providerTaskId: string;
  provider: RenderProviderName;
  status: 'submitted' | 'processing';
  costUsd: number;
  costType: 'estimated' | 'provider-reported';
  isMock: boolean;
}

export interface RenderTaskStatus {
  providerTaskId: string;
  status: 'processing' | 'done' | 'failed';
  videoUrl?: string;
  progressPct?: number;
  error?: string;
  latencyMs?: number;
}

export interface ProviderCapability {
  name: RenderProviderName;
  displayName: string;
  implemented: boolean;
  maxDurationSec: number;
  minDurationSec: number;
  supportedAspectRatios: Array<'16:9' | '9:16'>;
  supportsProgress: boolean;
}

export interface IRenderProvider {
  readonly name: RenderProviderName;
  readonly capabilities: ProviderCapability;
  submitRender(request: RenderTaskRequest, apiKey?: string): Promise<RenderTaskSubmission>;
  checkStatus(providerTaskId: string, apiKey?: string): Promise<RenderTaskStatus>;
}
