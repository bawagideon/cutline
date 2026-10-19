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
 * Validates that the URL belongs to a trusted rendering host and uses HTTPS.
 */
export function validateMediaUrl(targetUrl: string): URL {
  let parsed: URL;
  try {
    parsed = new URL(targetUrl);
  } catch {
    throw new MediaSecurityError(`Invalid URL string: '${targetUrl}'`);
  }

  // Strictly enforce HTTPS
  if (parsed.protocol !== 'https:') {
    throw new MediaSecurityError(`Forbidden protocol: '${parsed.protocol}'. Only HTTPS is permitted for media downloads.`);
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
 *
 * Security guarantees:
 * 1. HTTPS only.
 * 2. Manual redirect validation on every hop to prevent SSRF bypasses.
 * 3. Streaming byte-level limits before memory buffering.
 * 4. Fail-closed: Never reports success if storage write fails.
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
    let currentUrl = validatedUrl.toString();
    let hops = 0;
    let finalResponse: Response | null = null;

    // Follow redirects manually with revalidation on every hop (max 3 hops)
    while (hops <= 3) {
      const response: Response = await fetch(currentUrl, {
        method: 'GET',
        signal: controller.signal,
        redirect: 'manual',
      });

      if (response.status >= 300 && response.status < 400) {
        const location = response.headers.get('location');
        if (!location) {
          throw new MediaSecurityError('Redirect response missing Location header.');
        }
        const nextUrl = new URL(location, currentUrl);
        validateMediaUrl(nextUrl.toString()); // Enforce trust on redirect destination
        currentUrl = nextUrl.toString();
        hops++;
        if (hops > 3) {
          throw new MediaSecurityError('Exceeded maximum allowable redirect hops (3).');
        }
        continue;
      }

      if (!response.ok) {
        throw new Error(`Download HTTP error ${response.status}: ${response.statusText}`);
      }

      finalResponse = response;
      break;
    }

    if (!finalResponse || !finalResponse.body) {
      throw new MediaSecurityError('No response body received from media provider.');
    }

    // Verify declared Content-Length
    const contentLengthHeader = finalResponse.headers.get('content-length');
    if (contentLengthHeader) {
      const declaredSize = parseInt(contentLengthHeader, 10);
      if (declaredSize > MAX_FILE_SIZE_BYTES) {
        throw new MediaSecurityError(
          `File size (${declaredSize} bytes) exceeds maximum allowable limit of ${MAX_FILE_SIZE_BYTES} bytes.`
        );
      }
    }

    const contentType = finalResponse.headers.get('content-type') || 'video/mp4';

    // Stream chunks with running byte counter and streaming hash computation
    const reader = finalResponse.body.getReader();
    const chunks: Uint8Array[] = [];
    let receivedBytes = 0;
    const hasher = crypto.createHash('sha256');
    let validatedSignature = false;

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      if (value) {
        receivedBytes += value.length;
        if (receivedBytes > MAX_FILE_SIZE_BYTES) {
          reader.cancel().catch(() => {});
          throw new MediaSecurityError(`Streamed media exceeded maximum safety ceiling of ${MAX_FILE_SIZE_BYTES} bytes.`);
        }

        // Validate media magic bytes from initial chunk
        if (!validatedSignature && receivedBytes >= 8) {
          const sample = Buffer.from(value);
          // Check for MP4 ftyp / ISO box or WebM header
          const isFtyp = sample.length >= 8 && sample.slice(4, 8).toString('ascii') === 'ftyp';
          const isWebm = sample.length >= 4 && sample[0] === 0x1a && sample[1] === 0x45 && sample[2] === 0xdf && sample[3] === 0xa3;
          const isMoov = sample.length >= 8 && sample.slice(4, 8).toString('ascii') === 'moov';

          // If content-type claimed video/mp4 or webm, verify magic bytes
          if (!isFtyp && !isWebm && !isMoov && (contentType.includes('video') || contentType.includes('mp4'))) {
            reader.cancel().catch(() => {});
            throw new MediaSecurityError('Invalid media format: Header does not match recognized video signatures.');
          }
          validatedSignature = true;
        }

        hasher.update(value);
        chunks.push(value);
      }
    }

    const buffer = Buffer.concat(chunks);
    const hash = hasher.digest('hex');

    // Upload to Supabase Storage
    const hasLiveSupabase = Boolean(
      process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY
    );

    if (hasLiveSupabase) {
      const supabase = getSupabaseServiceClient();
      const { error: uploadError } = await supabase.storage
        .from(bucketName)
        .upload(destinationPath, buffer, {
          contentType,
          upsert: true,
        });

      if (uploadError) {
        // Fail closed: Do NOT return successful result if storage persistence failed
        throw new MediaSecurityError(
          `Failed to persist media to storage bucket '${bucketName}': ${uploadError.message}`
        );
      }
    } else if (process.env.NODE_ENV === 'production') {
      throw new MediaSecurityError('Production storage credentials are missing.');
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
