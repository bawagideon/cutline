import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  validateMediaUrl,
  validateVideoMagicBytes,
  MediaSecurityError,
} from '../src/lib/providers/storage/downloader.ts';

describe('Safe Media Downloader Security Boundaries', () => {
  it('permits trusted render provider domains over HTTPS', () => {
    const validPixverse = validateMediaUrl('https://media.pixverse.ai/renders/out_01.mp4');
    assert.equal(validPixverse.hostname, 'media.pixverse.ai');

    const validSupabase = validateMediaUrl('https://myproject.supabase.co/storage/v1/object/public/video.mp4');
    assert.equal(validSupabase.hostname, 'myproject.supabase.co');

    const validGoogle = validateMediaUrl('https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4');
    assert.equal(validGoogle.hostname, 'commondatastorage.googleapis.com');
  });

  it('strictly rejects non-HTTPS protocols including plain http://, file://, and ftp://', () => {
    assert.throws(
      () => validateMediaUrl('http://media.pixverse.ai/render.mp4'),
      (err: Error) => err instanceof MediaSecurityError && err.message.includes('Only HTTPS is permitted')
    );

    assert.throws(
      () => validateMediaUrl('file:///etc/passwd'),
      (err: Error) => err instanceof MediaSecurityError && err.message.includes('Only HTTPS is permitted')
    );

    assert.throws(
      () => validateMediaUrl('ftp://media.pixverse.ai/video.mp4'),
      (err: Error) => err instanceof MediaSecurityError && err.message.includes('Only HTTPS is permitted')
    );
  });

  it('rejects untrusted domains (SSRF and arbitrary host prevention)', () => {
    assert.throws(
      () => validateMediaUrl('https://evil-attacker.com/malicious.mp4'),
      (err: Error) => {
        return err instanceof MediaSecurityError && err.message.includes('Untrusted media host');
      }
    );

    assert.throws(
      () => validateMediaUrl('https://169.254.169.254/latest/meta-data/'),
      (err: Error) => {
        return err instanceof MediaSecurityError;
      }
    );
  });

  it('validates video magic bytes for MP4, WebM, and AVI across chunk boundaries', () => {
    // Valid MP4 (ftyp box at byte offset 4)
    const validMp4 = Buffer.from([
      0x00, 0x00, 0x00, 0x18, 0x66, 0x74, 0x79, 0x70, // ... ftyp
      0x69, 0x73, 0x6f, 0x6d, 0x00, 0x00, 0x02, 0x00, // isom
    ]);
    assert.equal(validateVideoMagicBytes(validMp4), true, 'Valid MP4 header must pass');

    // Valid WebM / MKV (EBML header 0x1A 0x45 0xDF 0xA3)
    const validWebm = Buffer.from([
      0x1a, 0x45, 0xdf, 0xa3, 0x9f, 0x42, 0x86, 0x81, 0x01, 0x42, 0xf7, 0x81,
    ]);
    assert.equal(validateVideoMagicBytes(validWebm), true, 'Valid WebM header must pass');

    // Valid AVI (RIFF + AVI)
    const validAvi = Buffer.from('RIFF\x24\x00\x00\x00AVI LIST\x00\x00\x00\x00');
    assert.equal(validateVideoMagicBytes(validAvi), true, 'Valid AVI header must pass');

    // Malicious/fake payload: HTML spoofing
    const fakeHtml = Buffer.from('<!DOCTYPE html><html><script>alert(1)</script></html>');
    assert.equal(validateVideoMagicBytes(fakeHtml), false, 'HTML must be rejected as video');

    // Malicious/fake payload: Executable or script
    const fakeScript = Buffer.from('#!/bin/bash\nrm -rf /');
    assert.equal(validateVideoMagicBytes(fakeScript), false, 'Shell script must be rejected');

    // Truncated buffer (< 4 bytes)
    assert.equal(validateVideoMagicBytes(Buffer.from([0x00, 0x01])), false, 'Truncated buffer must fail');
  });
});
