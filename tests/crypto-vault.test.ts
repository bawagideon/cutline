import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { encryptSecret, decryptSecret, maskApiKey } from '../src/lib/crypto/vault.ts';

describe('AES-256-GCM Crypto Vault', () => {
  it('encrypts and decrypts secret plaintext correctly', () => {
    const rawApiKey = 'sk-proj-pixverse-live-abcdef1234567890';
    const encryptedJson = encryptSecret(rawApiKey);

    // Verify format contains ciphertext, iv, and tag
    const parsed = JSON.parse(encryptedJson);
    assert.ok(parsed.ciphertext, 'ciphertext must be present');
    assert.ok(parsed.iv, 'iv must be present');
    assert.ok(parsed.tag, 'tag must be present');
    assert.equal(parsed.version, 1);

    // Decrypt and compare
    const decrypted = decryptSecret(encryptedJson);
    assert.equal(decrypted, rawApiKey, 'decrypted text must match raw input');
  });

  it('fails decryption if ciphertext is tampered with', () => {
    const rawApiKey = 'sk-gemini-secure-token-9988';
    const encryptedJson = encryptSecret(rawApiKey);
    const parsed = JSON.parse(encryptedJson);

    // Tamper with the ciphertext base64
    const tamperedCiphertext = Buffer.from(parsed.ciphertext, 'base64');
    tamperedCiphertext[0] ^= 0xff; // flip bits
    parsed.ciphertext = tamperedCiphertext.toString('base64');

    assert.throws(
      () => decryptSecret(JSON.stringify(parsed)),
      /Unsupported state or unable to authenticate data/,
      'Tampered payload must trigger authentication failure'
    );
  });

  it('masks API keys honestly, preserving only the last 4 characters', () => {
    assert.equal(maskApiKey('AIzaSyD-a91f'), '••••••••a91f');
    assert.equal(maskApiKey('sk-1234567890abcdef'), '••••••••cdef');
    assert.equal(maskApiKey('abc'), '••••');
  });
});
