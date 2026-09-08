import { createCipheriv, createDecipheriv, createHash, randomBytes } from 'crypto';

/**
 * AES-256-GCM for secrets we must be able to read back (client SMTP passwords).
 * Passwords users authenticate with are hashed with bcrypt instead — this is only
 * for credentials we have to replay to a third party.
 *
 * Format: v1.<iv-b64>.<tag-b64>.<ciphertext-b64>
 * Rotating ENCRYPTION_KEY invalidates every stored connection password, so
 * clients would need to re-enter them.
 */
const VERSION = 'v1';

function keyFrom(secret: string): Buffer {
  if (!secret) throw new Error('ENCRYPTION_KEY is not set — cannot store connection secrets');
  // Accepts any length; normalises to a 32-byte key.
  return createHash('sha256').update(secret).digest();
}

export function encryptSecret(plain: string, secret: string): string {
  const key = keyFrom(secret);
  const iv = randomBytes(12);
  const cipher = createCipheriv('aes-256-gcm', key, iv);
  const enc = Buffer.concat([cipher.update(plain, 'utf8'), cipher.final()]);
  const tag = cipher.getAuthTag();
  return [VERSION, iv.toString('base64'), tag.toString('base64'), enc.toString('base64')].join('.');
}

export function decryptSecret(payload: string, secret: string): string | null {
  try {
    const [version, ivB64, tagB64, dataB64] = payload.split('.');
    if (version !== VERSION) return null;
    const decipher = createDecipheriv('aes-256-gcm', keyFrom(secret), Buffer.from(ivB64, 'base64'));
    decipher.setAuthTag(Buffer.from(tagB64, 'base64'));
    return Buffer.concat([decipher.update(Buffer.from(dataB64, 'base64')), decipher.final()]).toString('utf8');
  } catch {
    return null; // tampered, wrong key, or corrupt — treat as "no credential"
  }
}

/** Shows enough of a secret to be recognisable without revealing it. */
export const maskSecret = (s?: string | null) =>
  (!s ? '' : s.length <= 4 ? '••••' : `${'•'.repeat(Math.min(8, s.length - 2))}${s.slice(-2)}`);
