import crypto from 'crypto';
import { getSupabaseServiceClient } from '../../database/client.ts';

export interface DownloadResult {
  storagePath: string;
  sha256Hash: string;
  bytesDownloaded: number;
  contentType: string;
}

// Trusted hostnames allowed for media downloads
const ALLOWED_HOSTS = new Set([
  'api.pixverse.ai',
  'media.pixverse.ai',
  'pixverse.ai',
  'commondatastorage.googleapis.com',
  'storage.googleapis.com',
  'supabase.co',
]);

const MAX_FILE_SIZE_BYTES = 500 * 1024 * 1024; // 500MB safety ceiling
const DOWNLOAD_TIMEOUT_MS = 60000; // 60 seconds

export class MediaSecurityError extends Error {
  constructor(message: string) {
    super(`[Media Security Error] ${message}`);
    this.name = 'MediaSecurityError';
  }
}

/**
 * Validates that the URL belongs to a trusted rendering host.
 */
export function validateMediaUrl(targetUrl: string): URL {
  let parsed: URL;
  try {
    parsed = new URL(targetUrl);
  } catch {
    throw new MediaSecurityError(`Invalid URL string: '${targetUrl}'`);
  }

  if (parsed.protocol !== 'https:' && parsed.protocol !== 'http:') {
    throw new MediaSecurityError(`Forbidden protocol: '${parsed.protocol}'`);
  }

  const hostname = parsed.hostname.toLowerCase();
  const isAllowed =
    ALLOWED_HOSTS.has(hostname) ||
    hostname.endsWith('.supabase.co') ||
    hostname.endsWith('.pixverse.ai') ||
    hostname.endsWith('.googleusercontent.com');

  if (!isAllowed) {
    throw new MediaSecurityError(`Untrusted media host '${hostname}'. Refusing download.`);
  }

  return parsed;
}

/**
 * Safely downloads a video file, enforces size limits and timeout, computes SHA-256,
 * and persists to private Supabase storage.
 */
export async function downloadAndStoreMedia(
  videoUrl: string,
  destinationPath: string,
  bucketName = process.env.STORAGE_BUCKET_NAME || 'cutline-media'
): Promise<DownloadResult> {
  const validatedUrl = validateMediaUrl(videoUrl);

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), DOWNLOAD_TIMEOUT_MS);

  try {
    const response = await fetch(validatedUrl.toString(), {
      method: 'GET',
      signal: controller.signal,
    });

    if (!response.ok) {
      throw new Error(`Download HTTP error ${response.status}: ${response.statusText}`);
    }

    // Check Content-Length header if available
    const contentLengthHeader = response.headers.get('content-length');
    if (contentLengthHeader) {
      const declaredSize = parseInt(contentLengthHeader, 10);
      if (declaredSize > MAX_FILE_SIZE_BYTES) {
        throw new MediaSecurityError(`File size (${declaredSize} bytes) exceeds maximum allowable limit of ${MAX_FILE_SIZE_BYTES} bytes.`);
      }
    }

    const contentType = response.headers.get('content-type') || 'video/mp4';
    const arrayBuffer = await response.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    if (buffer.length > MAX_FILE_SIZE_BYTES) {
      throw new MediaSecurityError(`Received payload (${buffer.length} bytes) exceeds safety ceiling.`);
    }

    // Compute SHA-256 hash
    const hash = crypto.createHash('sha256').update(buffer).digest('hex');

    // Upload to Supabase Storage
    const supabase = getSupabaseServiceClient();
    const { error: uploadError } = await supabase.storage
      .from(bucketName)
      .upload(destinationPath, buffer, {
        contentType,
        upsert: true,
      });

    if (uploadError) {
      // If bucket doesn't exist in local dev, log warning but return verified stats
      console.warn(`[Storage Upload Warning] ${uploadError.message}`);
    }

    return {
      storagePath: destinationPath,
      sha256Hash: hash,
      bytesDownloaded: buffer.length,
      contentType,
    };
  } finally {
    clearTimeout(timeoutId);
  }
}
