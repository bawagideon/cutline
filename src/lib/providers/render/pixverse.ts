import type { IRenderProvider, ProviderCapability, RenderTaskRequest, RenderTaskStatus, RenderTaskSubmission } from './types.ts';

export class PixVerseProvider implements IRenderProvider {
  readonly name = 'pixverse';
  readonly capabilities: ProviderCapability = {
    name: 'pixverse',
    displayName: 'PixVerse',
    implemented: true,
    minDurationSec: 5,
    maxDurationSec: 8,
    supportedAspectRatios: ['16:9', '9:16'],
    supportsProgress: false, // PixVerse API returns status=done without incremental progress percentage
  };

  private defaultApiUrl = 'https://api.pixverse.ai';

  async submitRender(request: RenderTaskRequest, apiKey?: string): Promise<RenderTaskSubmission> {
    const key = apiKey || process.env.PIXVERSE_API_KEY;
    if (!key) {
      throw new Error('[PixVerse Error] No API key configured. Please configure PixVerse in Integrations vault.');
    }

    if (request.durationSec > this.capabilities.maxDurationSec) {
      throw new Error(`[PixVerse Error] Requested duration ${request.durationSec}s exceeds PixVerse maximum supported limit of ${this.capabilities.maxDurationSec}s.`);
    }

    const apiUrl = process.env.PIXVERSE_API_URL || this.defaultApiUrl;

    const headers: Record<string, string> = {
      'API-KEY': key,
      'Content-Type': 'application/json',
    };
    if (request.idempotencyKey) {
      headers['Idempotency-Key'] = request.idempotencyKey;
    }

    const response = await fetch(`${apiUrl}/openapi/v2/video/generate`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        prompt: request.prompt,
        negative_prompt: request.negativePrompt || '',
        aspect_ratio: request.aspectRatio,
        duration: request.durationSec <= 5 ? 5 : 8,
        quality: request.resolution === '1080p' ? '1080p' : '720p',
        seed: request.seed,
      }),
      signal: AbortSignal.timeout(15000),
    });

    if (!response.ok) {
      const errText = await response.text();
      throw new Error(`[PixVerse API Error ${response.status}] ${errText}`);
    }

    const data = await response.json();
    const taskId = data.Resp?.video_id || data.video_id || data.task_id;

    if (!taskId) {
      throw new Error(`[PixVerse Error] Invalid response from PixVerse: missing video task ID.`);
    }

    return {
      providerTaskId: String(taskId),
      provider: 'pixverse',
      status: 'submitted',
      costUsd: 0.12, // Standard PixVerse render credit estimate (rate card based, not settled billing event)
      costType: 'estimated',
      isMock: false,
    };
  }

  async checkStatus(providerTaskId: string, apiKey?: string): Promise<RenderTaskStatus> {
    const key = apiKey || process.env.PIXVERSE_API_KEY;
    if (!key) {
      throw new Error('[PixVerse Error] No API key configured.');
    }

    const apiUrl = process.env.PIXVERSE_API_URL || this.defaultApiUrl;
    const response = await fetch(`${apiUrl}/openapi/v2/video/result/${providerTaskId}`, {
      method: 'GET',
      headers: {
        'API-KEY': key,
      },
      signal: AbortSignal.timeout(10000),
    });

    if (!response.ok) {
      const errText = await response.text();
      return {
        providerTaskId,
        status: 'failed',
        error: `PixVerse HTTP ${response.status}: ${errText}`,
      };
    }

    const data = await response.json();
    const statusVal = (data.Resp?.status || data.status || '').toLowerCase();

    if (statusVal === 'success' || statusVal === 'done' || statusVal === 'completed') {
      const videoUrl = data.Resp?.url || data.video_url || data.url;
      return {
        providerTaskId,
        status: 'done',
        videoUrl,
      };
    }

    if (statusVal === 'failed' || statusVal === 'error') {
      return {
        providerTaskId,
        status: 'failed',
        error: data.Resp?.error_message || data.error || 'Rendering failed at provider.',
      };
    }

    return {
      providerTaskId,
      status: 'processing',
    };
  }
}
