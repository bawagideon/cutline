import crypto from 'node:crypto';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
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
 * Validates file magic bytes across chunk boundaries.
 * Recognizes MP4/MOV ('ftyp', 'moov', 'mdat'), WebM/MKV (EBML), and AVI ('RIFF'...'AVI ').
 */
export function validateVideoMagicBytes(headerBuffer: Buffer): boolean {
  if (headerBuffer.length < 4) return false;

  // WebM / Matroska EBML: 0x1A, 0x45, 0xDF, 0xA3
  if (
    headerBuffer[0] === 0x1a &&
    headerBuffer[1] === 0x45 &&
    headerBuffer[2] === 0xdf &&
    headerBuffer[3] === 0xa3
  ) {
    return true;
  }

  // MP4 / MOV / QuickTime: bytes 4..7 are 'ftyp', 'moov', or 'mdat'
  if (headerBuffer.length >= 8) {
    const boxType = headerBuffer.subarray(4, 8).toString('ascii');
    if (boxType === 'ftyp' || boxType === 'moov' || boxType === 'mdat') {
      return true;
    }
  }

  // AVI: bytes 0..3 'RIFF' and bytes 8..11 'AVI '
  if (headerBuffer.length >= 12) {
    const riff = headerBuffer.subarray(0, 4).toString('ascii');
    const avi = headerBuffer.subarray(8, 12).toString('ascii');
    if (riff === 'RIFF' && avi === 'AVI ') {
      return true;
    }
  }

  return false;
}

/**
 * Safely downloads a video file, enforces size limits and timeout, computes SHA-256,
 * validates magic bytes across chunk boundaries, streams to disk (avoiding 500MB V8 heap exhaustion),
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
  const tmpPath = path.join(os.tmpdir(), `cutline-dl-${crypto.randomUUID()}.tmp`);

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

    // Stream directly to temporary disk file with incremental SHA-256 and header accumulation
    const reader = finalResponse.body.getReader();
    const fileWriteStream = fs.createWriteStream(tmpPath);
    let receivedBytes = 0;
    const hasher = crypto.createHash('sha256');
    let headerBuffer = Buffer.alloc(0);
    let validatedSignature = false;

    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        if (value) {
          receivedBytes += value.length;
          if (receivedBytes > MAX_FILE_SIZE_BYTES) {
            reader.cancel().catch(() => {});
            throw new MediaSecurityError(`Streamed media exceeded maximum safety ceiling of ${MAX_FILE_SIZE_BYTES} bytes.`);
          }

          // Accumulate first 32 bytes for cross-chunk magic byte validation
          if (!validatedSignature) {
            headerBuffer = Buffer.concat([headerBuffer, Buffer.from(value)]);
            if (headerBuffer.length >= 12) {
              if (!validateVideoMagicBytes(headerBuffer)) {
                reader.cancel().catch(() => {});
                throw new MediaSecurityError('Invalid media format: Header does not match recognized video signatures.');
              }
              validatedSignature = true;
            }
          }

          hasher.update(value);
          const writeOk = fileWriteStream.write(Buffer.from(value));
          if (!writeOk) {
            await new Promise<void>((resolve) => fileWriteStream.once('drain', () => resolve()));
          }
        }
      }

      // Check header if file was smaller than 12 bytes or validateSignature hasn't triggered
      if (!validatedSignature) {
        if (!validateVideoMagicBytes(headerBuffer)) {
          throw new MediaSecurityError('Invalid media format: Header does not match recognized video signatures.');
        }
        validatedSignature = true;
      }
    } finally {
      await new Promise<void>((resolve, reject) => {
        fileWriteStream.end((err?: Error | null) => {
          if (err) reject(err);
          else resolve();
        });
      });
    }

    const hash = hasher.digest('hex');

    // Upload to Supabase Storage via disk stream (O(1) memory)
    const hasLiveSupabase = Boolean(
      process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY
    );

    if (hasLiveSupabase) {
      const supabase = getSupabaseServiceClient();
      const readStream = fs.createReadStream(tmpPath);
      const { error: uploadError } = await supabase.storage
        .from(bucketName)
        .upload(destinationPath, readStream, {
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
      bytesDownloaded: receivedBytes,
      contentType,
    };
  } finally {
    clearTimeout(timeoutId);
    // Always clean up temp file from disk
    await fs.promises.unlink(tmpPath).catch(() => {});
  }
}
