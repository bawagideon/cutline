import crypto from 'crypto';

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 12; // 96 bits for GCM
const AUTH_TAG_LENGTH = 16; // 128 bits

/**
 * Returns the 32-byte master key from the environment.
 * In development, provides a documented deterministic fallback if unset.
 * In production, fails fast immediately.
 */
function getMasterKey(): Buffer {
  const hexKey = process.env.VAULT_MASTER_KEY;
  if (!hexKey) {
    if (process.env.NODE_ENV === 'production') {
      throw new Error('[VAULT SECURITY ERROR] VAULT_MASTER_KEY is not defined in production environment.');
    }
    // Safe deterministic fallback for development/test only
    return Buffer.from('0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef', 'hex');
  }

  const keyBuffer = Buffer.from(hexKey, 'hex');
  if (keyBuffer.length !== 32) {
    throw new Error(`[VAULT ERROR] VAULT_MASTER_KEY must be exactly 32 bytes (64 hex chars). Got ${keyBuffer.length} bytes.`);
  }
  return keyBuffer;
}

export interface EncryptedPayload {
  ciphertext: string; // base64
  iv: string;         // base64
  tag: string;        // base64
  version: number;
}

/**
 * Encrypts a plaintext string (e.g. API key or token JSON) using AES-256-GCM.
 */
export function encryptSecret(plaintext: string, version = 1): string {
  const masterKey = getMasterKey();
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv(ALGORITHM, masterKey, iv);

  let ciphertext = cipher.update(plaintext, 'utf8', 'base64');
  ciphertext += cipher.final('base64');
  const tag = cipher.getAuthTag();

  const payload: EncryptedPayload = {
    ciphertext,
    iv: iv.toString('base64'),
    tag: tag.toString('base64'),
    version,
  };

  return JSON.stringify(payload);
}

/**
 * Decrypts an AES-256-GCM payload string. Fails if ciphertext or auth tag was tampered with.
 */
export function decryptSecret(serializedPayload: string): string {
  const masterKey = getMasterKey();
  let payload: EncryptedPayload;

  try {
    payload = JSON.parse(serializedPayload);
  } catch {
    throw new Error('[VAULT ERROR] Invalid encrypted payload format.');
  }

  const iv = Buffer.from(payload.iv, 'base64');
  const tag = Buffer.from(payload.tag, 'base64');
  if (tag.length !== AUTH_TAG_LENGTH) {
    throw new Error('[VAULT ERROR] Invalid auth tag length.');
  }
  const decipher = crypto.createDecipheriv(ALGORITHM, masterKey, iv);
  decipher.setAuthTag(tag);

  let plaintext = decipher.update(payload.ciphertext, 'base64', 'utf8');
  plaintext += decipher.final('utf8');
  return plaintext;
}

/**
 * Generates an honest key mask for display in the UI (e.g. '••••••••a91f').
 * Plaintext keys are never sent to the browser.
 */
export function maskApiKey(apiKey: string): string {
  if (!apiKey || apiKey.length < 4) {
    return '••••';
  }
  const lastFour = apiKey.slice(-4);
  return `••••••••${lastFour}`;
}
