import { createHmac, randomBytes, timingSafeEqual } from 'crypto';

const b64u = (b: Buffer) => b.toString('base64url');

/** Signed, opaque tracking token. Never exposes raw ids without a valid HMAC. */
export function signToken(payload: Record<string, any>, secret: string): string {
  const body = b64u(Buffer.from(JSON.stringify(payload)));
  const sig = b64u(createHmac('sha256', secret).update(body).digest()).slice(0, 32);
  return `${body}.${sig}`;
}

export function verifyToken<T = any>(token: string, secret: string): T | null {
  if (!token || !token.includes('.')) return null;
  const [body, sig] = token.split('.');
  const expected = b64u(createHmac('sha256', secret).update(body).digest()).slice(0, 32);
  if (sig.length !== expected.length) return null;
  if (!timingSafeEqual(Buffer.from(sig), Buffer.from(expected))) return null;
  try { return JSON.parse(Buffer.from(body, 'base64url').toString()); } catch { return null; }
}

export const randomToken = (bytes = 32) => randomBytes(bytes).toString('hex');
