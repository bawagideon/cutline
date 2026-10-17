import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { validateMediaUrl, MediaSecurityError } from '../src/lib/providers/storage/downloader.ts';

describe('Safe Media Downloader Security Boundaries', () => {
  it('permits trusted render provider domains', () => {
    const validPixverse = validateMediaUrl('https://media.pixverse.ai/renders/out_01.mp4');
    assert.equal(validPixverse.hostname, 'media.pixverse.ai');

    const validSupabase = validateMediaUrl('https://myproject.supabase.co/storage/v1/object/public/video.mp4');
    assert.equal(validSupabase.hostname, 'myproject.supabase.co');

    const validGoogle = validateMediaUrl('https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4');
    assert.equal(validGoogle.hostname, 'commondatastorage.googleapis.com');
  });

  it('rejects untrusted domains (SSRF and arbitrary host prevention)', () => {
    assert.throws(
      () => validateMediaUrl('https://evil-attacker.com/malicious.mp4'),
      (err: Error) => {
        return err instanceof MediaSecurityError && err.message.includes('Untrusted media host');
      }
    );

    assert.throws(
      () => validateMediaUrl('http://169.254.169.254/latest/meta-data/'),
      (err: Error) => {
        return err instanceof MediaSecurityError;
      }
    );
  });

  it('rejects forbidden protocols like file:// or ftp://', () => {
    assert.throws(
      () => validateMediaUrl('file:///etc/passwd'),
      (err: Error) => err instanceof MediaSecurityError
    );
  });
});
