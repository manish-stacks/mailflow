import { Injectable, Logger, ServiceUnavailableException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createHmac, timingSafeEqual } from 'crypto';

export interface RazorpayOrder {
  id: string; amount: number; currency: string; status: string; receipt: string;
}

/**
 * Thin HTTP client. No SDK: the three endpoints we need are plain REST, and an
 * extra dependency in the payment path is a liability, not a convenience.
 */
@Injectable()
export class RazorpayService {
  private readonly logger = new Logger(RazorpayService.name);
  private readonly base = 'https://api.razorpay.com/v1';

  constructor(private config: ConfigService) {}

  get keyId(): string { return this.config.get('razorpay.keyId'); }
  private get keySecret(): string { return this.config.get('razorpay.keySecret'); }
  private get webhookSecret(): string { return this.config.get('razorpay.webhookSecret'); }

  get configured(): boolean { return !!(this.keyId && this.keySecret); }

  private auth() {
    return 'Basic ' + Buffer.from(`${this.keyId}:${this.keySecret}`).toString('base64');
  }

  private async call<T>(method: string, path: string, body?: any): Promise<T> {
    if (!this.configured) {
      throw new ServiceUnavailableException('Payments are not configured on this installation');
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
      const json: any = await res.json().catch(() => ({}));
      if (!res.ok) {
        const message = json?.error?.description || `Razorpay returned ${res.status}`;
        this.logger.error(`Razorpay ${method} ${path} failed: ${message}`);
        throw new ServiceUnavailableException(`Payment gateway error: ${message}`);
      }
      return json as T;
    } catch (err: any) {
      if (err?.name === 'AbortError') throw new ServiceUnavailableException('The payment gateway timed out');
      throw err;
    } finally {
      clearTimeout(timeout);
    }
  }

  /** `amount` is in paise. Receipt must be unique and under 40 chars. */
  createOrder(input: { amount: number; currency: string; receipt: string; notes?: Record<string, string> }) {
    return this.call<RazorpayOrder>('POST', '/orders', {
      amount: input.amount,
      currency: input.currency,
      receipt: input.receipt.slice(0, 40),
      notes: input.notes,
      payment_capture: 1,
    });
  }

  fetchPayment(paymentId: string) {
    return this.call<any>('GET', `/payments/${paymentId}`);
  }

  refund(paymentId: string, amount?: number) {
    return this.call<any>('POST', `/payments/${paymentId}/refund`, amount ? { amount } : {});
  }

  /**
   * Checkout callback signature: HMAC-SHA256 of "<order_id>|<payment_id>" with
   * the key secret. Anyone can POST to our verify endpoint, so this is what
   * separates a real payment from a forged one.
   */
  verifyPaymentSignature(orderId: string, paymentId: string, signature: string): boolean {
    if (!orderId || !paymentId || !signature) return false;
    const expected = createHmac('sha256', this.keySecret).update(`${orderId}|${paymentId}`).digest('hex');
    return this.safeEqual(expected, signature);
  }

  /** Webhook signature: HMAC-SHA256 over the raw request body. */
  verifyWebhookSignature(rawBody: string, signature: string): boolean {
    if (!this.webhookSecret || !signature) return false;
    const expected = createHmac('sha256', this.webhookSecret).update(rawBody).digest('hex');
    return this.safeEqual(expected, signature);
  }

  private safeEqual(a: string, b: string) {
    const bufA = Buffer.from(a, 'utf8');
    const bufB = Buffer.from(b, 'utf8');
    if (bufA.length !== bufB.length) return false;
    return timingSafeEqual(bufA, bufB);
  }
}
