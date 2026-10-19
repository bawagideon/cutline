import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {
  downloadAndStoreMedia,
  validateVideoMagicBytes,
  MediaSecurityError,
} from '../src/lib/providers/storage/downloader.ts';

describe('Safe Media Downloader Resilience & Stream Error Propagation', () => {
  it('correctly validates MP4 magic bytes when split across chunk boundaries', () => {
    // Simulate chunk 1 with first 6 bytes
    const chunk1 = Buffer.from([0x00, 0x00, 0x00, 0x18, 0x66, 0x74]); // [0..3 size, 'ft']
    // Simulate chunk 2 with remaining header bytes
    const chunk2 = Buffer.from([0x79, 0x70, 0x69, 0x73, 0x6f, 0x6d]); // ['yp', 'isom']

    // Combined buffer across chunk boundary
    const combined = Buffer.concat([chunk1, chunk2]);
    assert.equal(validateVideoMagicBytes(combined), true, 'Split MP4 ftyp box must be recognized');
  });

  it('rejects spoofed payloads split across chunk boundaries', () => {
    // Malicious PHP or bash payload split into chunks
    const chunk1 = Buffer.from('<?ph');
    const chunk2 = Buffer.from('p echo "malicious"; ?>');
    const combined = Buffer.concat([chunk1, chunk2]);

    assert.equal(validateVideoMagicBytes(combined), false, 'Split malicious script must be rejected');
  });

  it('rejects downloads exceeding maximum file size ceiling without leaking temp files', async () => {
    // Count temporary files before test
    const getTmpCount = () =>
      fs.readdirSync(os.tmpdir()).filter((f) => f.startsWith('cutline-dl-')).length;
    const initialCount = getTmpCount();

    const originalFetch = globalThis.fetch;
    try {
      // Mock fetch returning a response exceeding MAX_FILE_SIZE_BYTES (500MB) via content-length
      globalThis.fetch = async () =>
        new Response(new Uint8Array(10), {
          status: 200,
          headers: {
            'content-length': String(600 * 1024 * 1024), // 600MB
            'content-type': 'video/mp4',
          },
        });

      await assert.rejects(
        async () => {
          await downloadAndStoreMedia('https://media.pixverse.ai/render-huge.mp4', 'episodes/ep1/scenes/scene1.mp4');
        },
        (err: Error) => {
          assert.ok(err instanceof MediaSecurityError, 'Must throw MediaSecurityError');
          assert.ok(err.message.includes('exceeds maximum allowable limit'));
          return true;
        }
      );

      // Verify no temporary files remain
      const finalCount = getTmpCount();
      assert.equal(finalCount, initialCount, 'No leaked temporary files on size rejection');
    } finally {
      globalThis.fetch = originalFetch;
    }
  });

  it('rejects untrusted redirect destinations during multi-hop streaming', async () => {
    const originalFetch = globalThis.fetch;
    try {
      // Hop 1: Trusted domain redirects to evil internal IP
      globalThis.fetch = async () =>
        new Response(null, {
          status: 302,
          headers: {
            location: 'https://169.254.169.254/latest/meta-data/',
          },
        });

      await assert.rejects(
        async () => {
          await downloadAndStoreMedia('https://media.pixverse.ai/redirect-test.mp4', 'episodes/ep1/scenes/scene1.mp4');
        },
        (err: Error) => {
          assert.ok(err instanceof MediaSecurityError);
          assert.ok(err.message.includes('Untrusted media host'));
          return true;
        }
      );
    } finally {
      globalThis.fetch = originalFetch;
    }
  });

  it('handles stream write errors and cleans up temporary disk file', async () => {
    const getTmpFiles = () =>
      fs.readdirSync(os.tmpdir()).filter((f) => f.startsWith('cutline-dl-'));
    const beforeFiles = new Set(getTmpFiles());

    const originalFetch = globalThis.fetch;
    try {
      // Mock a valid video stream that fails mid-flight
      const validVideoHeader = Buffer.from([
        0x00, 0x00, 0x00, 0x18, 0x66, 0x74, 0x79, 0x70,
        0x69, 0x73, 0x6f, 0x6d, 0x00, 0x00, 0x02, 0x00,
      ]);

      const stream = new ReadableStream({
        start(controller) {
          controller.enqueue(new Uint8Array(validVideoHeader));
          // Emit error mid-stream
          controller.error(new Error('ECONNRESET: Media stream interrupted'));
        },
      });

      globalThis.fetch = async () =>
        new Response(stream, {
          status: 200,
          headers: { 'content-type': 'video/mp4' },
        });

      await assert.rejects(
        async () => {
          await downloadAndStoreMedia('https://media.pixverse.ai/render-broken.mp4', 'episodes/ep1/scenes/scene1.mp4');
        },
        (err: Error) => {
          assert.ok(err.message.includes('interrupted') || err instanceof MediaSecurityError || err instanceof Error);
          return true;
        }
      );

      // Verify all temporary files created during this test were unlinked
      const afterFiles = getTmpFiles().filter((f) => !beforeFiles.has(f));
      assert.equal(afterFiles.length, 0, 'Temporary file must be unlinked on stream failure');
    } finally {
      globalThis.fetch = originalFetch;
    }
  });
});
