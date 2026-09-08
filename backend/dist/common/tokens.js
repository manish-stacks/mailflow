"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.randomToken = void 0;
exports.signToken = signToken;
exports.verifyToken = verifyToken;
const crypto_1 = require("crypto");
const b64u = (b) => b.toString('base64url');
/** Signed, opaque tracking token. Never exposes raw ids without a valid HMAC. */
function signToken(payload, secret) {
    const body = b64u(Buffer.from(JSON.stringify(payload)));
    const sig = b64u((0, crypto_1.createHmac)('sha256', secret).update(body).digest()).slice(0, 32);
    return `${body}.${sig}`;
}
function verifyToken(token, secret) {
    if (!token || !token.includes('.'))
        return null;
    const [body, sig] = token.split('.');
    const expected = b64u((0, crypto_1.createHmac)('sha256', secret).update(body).digest()).slice(0, 32);
    if (sig.length !== expected.length)
        return null;
    if (!(0, crypto_1.timingSafeEqual)(Buffer.from(sig), Buffer.from(expected)))
        return null;
    try {
        return JSON.parse(Buffer.from(body, 'base64url').toString());
    }
    catch {
        return null;
    }
}
const randomToken = (bytes = 32) => (0, crypto_1.randomBytes)(bytes).toString('hex');
exports.randomToken = randomToken;
