"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var RazorpayService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.RazorpayService = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const crypto_1 = require("crypto");
/**
 * Thin HTTP client. No SDK: the three endpoints we need are plain REST, and an
 * extra dependency in the payment path is a liability, not a convenience.
 */
let RazorpayService = RazorpayService_1 = class RazorpayService {
    config;
    logger = new common_1.Logger(RazorpayService_1.name);
    base = 'https://api.razorpay.com/v1';
    constructor(config) {
        this.config = config;
    }
    get keyId() { return this.config.get('razorpay.keyId'); }
    get keySecret() { return this.config.get('razorpay.keySecret'); }
    get webhookSecret() { return this.config.get('razorpay.webhookSecret'); }
    get configured() { return !!(this.keyId && this.keySecret); }
    auth() {
        return 'Basic ' + Buffer.from(`${this.keyId}:${this.keySecret}`).toString('base64');
    }
    async call(method, path, body) {
        if (!this.configured) {
            throw new common_1.ServiceUnavailableException('Payments are not configured on this installation');
        }
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 20000);
        try {
            const res = await fetch(`${this.base}${path}`, {
                method,
                headers: { Authorization: this.auth(), 'Content-Type': 'application/json' },
                body: body ? JSON.stringify(body) : undefined,
                signal: controller.signal,
            });
            const json = await res.json().catch(() => ({}));
            if (!res.ok) {
                const message = json?.error?.description || `Razorpay returned ${res.status}`;
                this.logger.error(`Razorpay ${method} ${path} failed: ${message}`);
                throw new common_1.ServiceUnavailableException(`Payment gateway error: ${message}`);
            }
            return json;
        }
        catch (err) {
            if (err?.name === 'AbortError')
                throw new common_1.ServiceUnavailableException('The payment gateway timed out');
            throw err;
        }
        finally {
            clearTimeout(timeout);
        }
    }
    /** `amount` is in paise. Receipt must be unique and under 40 chars. */
    createOrder(input) {
        return this.call('POST', '/orders', {
            amount: input.amount,
            currency: input.currency,
            receipt: input.receipt.slice(0, 40),
            notes: input.notes,
            payment_capture: 1,
        });
    }
    fetchPayment(paymentId) {
        return this.call('GET', `/payments/${paymentId}`);
    }
    refund(paymentId, amount) {
        return this.call('POST', `/payments/${paymentId}/refund`, amount ? { amount } : {});
    }
    /**
     * Checkout callback signature: HMAC-SHA256 of "<order_id>|<payment_id>" with
     * the key secret. Anyone can POST to our verify endpoint, so this is what
     * separates a real payment from a forged one.
     */
    verifyPaymentSignature(orderId, paymentId, signature) {
        if (!orderId || !paymentId || !signature)
            return false;
        const expected = (0, crypto_1.createHmac)('sha256', this.keySecret).update(`${orderId}|${paymentId}`).digest('hex');
        return this.safeEqual(expected, signature);
    }
    /** Webhook signature: HMAC-SHA256 over the raw request body. */
    verifyWebhookSignature(rawBody, signature) {
        if (!this.webhookSecret || !signature)
            return false;
        const expected = (0, crypto_1.createHmac)('sha256', this.webhookSecret).update(rawBody).digest('hex');
        return this.safeEqual(expected, signature);
    }
    safeEqual(a, b) {
        const bufA = Buffer.from(a, 'utf8');
        const bufB = Buffer.from(b, 'utf8');
        if (bufA.length !== bufB.length)
            return false;
        return (0, crypto_1.timingSafeEqual)(bufA, bufB);
    }
};
exports.RazorpayService = RazorpayService;
exports.RazorpayService = RazorpayService = RazorpayService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [config_1.ConfigService])
], RazorpayService);
