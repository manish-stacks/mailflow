"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.maskSecret = void 0;
exports.encryptSecret = encryptSecret;
exports.decryptSecret = decryptSecret;
const crypto_1 = require("crypto");
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
function keyFrom(secret) {
    if (!secret)
        throw new Error('ENCRYPTION_KEY is not set — cannot store connection secrets');
    // Accepts any length; normalises to a 32-byte key.
    return (0, crypto_1.createHash)('sha256').update(secret).digest();
}
function encryptSecret(plain, secret) {
    const key = keyFrom(secret);
    const iv = (0, crypto_1.randomBytes)(12);
    const cipher = (0, crypto_1.createCipheriv)('aes-256-gcm', key, iv);
    const enc = Buffer.concat([cipher.update(plain, 'utf8'), cipher.final()]);
    const tag = cipher.getAuthTag();
    return [VERSION, iv.toString('base64'), tag.toString('base64'), enc.toString('base64')].join('.');
}
function decryptSecret(payload, secret) {
    try {
        const [version, ivB64, tagB64, dataB64] = payload.split('.');
        if (version !== VERSION)
            return null;
        const decipher = (0, crypto_1.createDecipheriv)('aes-256-gcm', keyFrom(secret), Buffer.from(ivB64, 'base64'));
        decipher.setAuthTag(Buffer.from(tagB64, 'base64'));
        return Buffer.concat([decipher.update(Buffer.from(dataB64, 'base64')), decipher.final()]).toString('utf8');
    }
    catch {
        return null; // tampered, wrong key, or corrupt — treat as "no credential"
    }
}
/** Shows enough of a secret to be recognisable without revealing it. */
const maskSecret = (s) => (!s ? '' : s.length <= 4 ? '••••' : `${'•'.repeat(Math.min(8, s.length - 2))}${s.slice(-2)}`);
exports.maskSecret = maskSecret;
