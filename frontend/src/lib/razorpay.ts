import { api } from './api';

declare global {
  interface Window { Razorpay?: any }
}

const SCRIPT_SRC = 'https://checkout.razorpay.com/v1/checkout.js';

/** Loaded on demand — no reason to ship the gateway script to every page. */
export function loadRazorpay(): Promise<boolean> {
  if (typeof window === 'undefined') return Promise.resolve(false);
  if (window.Razorpay) return Promise.resolve(true);

  return new Promise((resolve) => {
    const existing = document.querySelector<HTMLScriptElement>(`script[src="${SCRIPT_SRC}"]`);
    if (existing) {
      existing.addEventListener('load', () => resolve(true));
      existing.addEventListener('error', () => resolve(false));
      return;
    }
    const script = document.createElement('script');
    script.src = SCRIPT_SRC;
    script.async = true;
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
}

export interface CheckoutSession {
  paymentId: string;
  orderId: string;
  amount: number;
  currency: string;
  keyId: string;
  plan: { id: string; name: string; slug: string };
  billingCycle: 'monthly' | 'yearly';
  prefill?: { name?: string; email?: string };
}

export interface PayResult { status: 'paid' | 'dismissed' | 'failed'; message?: string }

/**
 * Opens Razorpay Checkout and verifies the result server-side.
 *
 * A dismissal is not a failure: the order stays open and the webhook still
 * activates the plan if the payment actually went through after the tab closed.
 */
export async function payWithRazorpay(session: CheckoutSession): Promise<PayResult> {
  const ready = await loadRazorpay();
  if (!ready) return { status: 'failed', message: 'Could not reach the payment gateway. Check your connection and try again.' };

  return new Promise<PayResult>((resolve) => {
    const rzp = new window.Razorpay({
      key: session.keyId,
      order_id: session.orderId,
      amount: session.amount,
      currency: session.currency,
      name: 'MailFlow',
      description: `${session.plan.name} — ${session.billingCycle}`,
      prefill: { name: session.prefill?.name, email: session.prefill?.email },
      theme: { color: '#4f46e5' },
      handler: async (response: any) => {
        try {
          await api.post('/payments/verify', {
            razorpayOrderId: response.razorpay_order_id,
            razorpayPaymentId: response.razorpay_payment_id,
            razorpaySignature: response.razorpay_signature,
          });
          resolve({ status: 'paid' });
        } catch (err: any) {
          // Money may still have been captured — the webhook is the backstop.
          resolve({ status: 'failed', message: err?.message || 'We could not confirm the payment. If you were charged, it will apply within a few minutes.' });
        }
      },
      modal: { ondismiss: () => resolve({ status: 'dismissed' }) },
    });

    rzp.on('payment.failed', (res: any) => {
      resolve({ status: 'failed', message: res?.error?.description || 'The payment was declined.' });
    });

    rzp.open();
  });
}
