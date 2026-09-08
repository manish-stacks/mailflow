import { BadRequestException, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Payment, Workspace } from '@/database/entities';
import { paginate, PaginationDto } from '@/common/dto/pagination.dto';
import { EmailService } from '@/integrations/email/email.service';
import { BillingService } from '@/modules/billing/billing.service';
import { RazorpayService } from './razorpay.service';
import { CheckoutDto, VerifyPaymentDto } from './dto';

const CYCLE_DAYS = { monthly: 30, yearly: 365 };

@Injectable()
export class PaymentsService {
  private readonly logger = new Logger(PaymentsService.name);

  constructor(
    @InjectRepository(Payment) private payments: Repository<Payment>,
    @InjectRepository(Workspace) private workspaces: Repository<Workspace>,
    private razorpay: RazorpayService,
    private billing: BillingService,
    private email: EmailService,
  ) {}

  get publicConfig() {
    return { enabled: this.razorpay.configured, keyId: this.razorpay.keyId ?? null };
  }

  /* ---------------------------------------------------------- checkout */

  /**
   * Creates a Razorpay order for a plan change. Nothing about the subscription
   * changes here — the plan is only applied once money is confirmed, either by
   * the browser callback or the webhook, whichever arrives first.
   */
  async checkout(workspaceId: string, userId: string, dto: CheckoutDto) {
    const plan = await this.billing.findPlan(dto.plan);
    const cycle = dto.billingCycle ?? 'monthly';

    const rupees = cycle === 'yearly' ? plan.priceYearly : plan.priceMonthly;
    if (!rupees || rupees <= 0) {
      throw new BadRequestException('This plan is free — switch to it from the billing page without paying');
    }

    const current = await this.billing.subscriptionFor(workspaceId);
    if (current.plan.id === plan.id && current.subscription.status === 'active' && cycle === current.subscription.billingCycle) {
      throw new BadRequestException('You are already on this plan for this billing cycle');
    }

    const amount = Math.round(rupees * 100); // paise
    const receipt = `mf_${Date.now().toString(36)}_${workspaceId.slice(0, 8)}`;

    const order = await this.razorpay.createOrder({
      amount,
      currency: plan.currency || 'INR',
      receipt,
      notes: { workspaceId, planId: plan.id, planSlug: plan.slug, billingCycle: cycle },
    });

    const payment = await this.payments.save(this.payments.create({
      workspaceId, planId: plan.id, userId,
      orderId: order.id, amount, currency: order.currency,
      billingCycle: cycle as any, status: 'created',
      notes: { planSlug: plan.slug, planName: plan.name, receipt },
    }));

    const ws = await this.workspaces.findOne({ where: { id: workspaceId } });

    return {
      paymentId: payment.id,
      orderId: order.id,
      amount,
      currency: order.currency,
      keyId: this.razorpay.keyId,
      plan: { id: plan.id, name: plan.name, slug: plan.slug },
      billingCycle: cycle,
      prefill: { name: ws?.billingName || ws?.name, email: ws?.billingEmail || undefined },
    };
  }

  /**
   * Browser callback after Razorpay Checkout closes. The signature is what makes
   * this trustworthy — the payload itself is fully attacker-controlled.
   */
  async verify(workspaceId: string, dto: VerifyPaymentDto) {
    const ok = this.razorpay.verifyPaymentSignature(dto.razorpayOrderId, dto.razorpayPaymentId, dto.razorpaySignature);
    if (!ok) {
      await this.payments.update(
        { orderId: dto.razorpayOrderId },
        { status: 'failed', failureReason: 'Signature verification failed' },
      );
      throw new BadRequestException('Payment could not be verified');
    }

    const payment = await this.payments.findOne({ where: { orderId: dto.razorpayOrderId, workspaceId } });
    if (!payment) throw new NotFoundException('No such payment for this workspace');

    return this.activate(payment, dto.razorpayPaymentId);
  }

  /**
   * Single activation path, reached by both the browser and the webhook.
   * Guarded on the stored status, so a double delivery cannot extend the period twice.
   */
  private async activate(payment: Payment, razorpayPaymentId?: string, method?: string) {
    if (payment.status === 'paid') {
      return { alreadyProcessed: true, subscription: await this.billing.subscriptionFor(payment.workspaceId) };
    }

    const invoiceNumber = payment.invoiceNumber ?? await this.nextInvoiceNumber();
    await this.payments.update(payment.id, {
      status: 'paid',
      paymentId: razorpayPaymentId ?? payment.paymentId,
      method: method ?? payment.method,
      paidAt: new Date(),
      invoiceNumber,
      failureReason: null,
    });

    const result = await this.billing.assignPlan(payment.workspaceId, payment.planId, {
      billingCycle: payment.billingCycle,
    });

    await this.sendReceipt(payment.workspaceId, { ...payment, invoiceNumber }).catch(() => null);
    this.logger.log(`Payment ${payment.id} captured — workspace ${payment.workspaceId} on ${result.plan.name}`);

    return { alreadyProcessed: false, subscription: result };
  }

  /* ----------------------------------------------------------- webhook */

  /**
   * Source of truth. If the customer closes the tab right after paying, the
   * browser callback never fires and only this path activates the plan.
   */
  async handleWebhook(event: string, payload: any) {
    const entity = payload?.payment?.entity ?? payload?.order?.entity ?? payload?.refund?.entity;
    if (!entity) return { handled: false, reason: 'No entity in payload' };

    const orderId = entity.order_id ?? entity.id;
    const payment = await this.payments.findOne({ where: { orderId } });
    if (!payment) {
      this.logger.warn(`Webhook ${event} for unknown order ${orderId}`);
      return { handled: false, reason: 'Unknown order' };
    }

    switch (event) {
      case 'payment.captured':
      case 'order.paid': {
        await this.activate(payment, entity.id, entity.method);
        return { handled: true };
      }
      case 'payment.failed': {
        if (payment.status !== 'paid') {
          await this.payments.update(payment.id, {
            status: 'failed',
            paymentId: entity.id,
            method: entity.method,
            failureReason: (entity.error_description || entity.error_reason || 'Payment failed').slice(0, 480),
          });
        }
        return { handled: true };
      }
      case 'refund.created':
      case 'refund.processed': {
        await this.payments.update(payment.id, { status: 'refunded', refundId: entity.id });
        // A refund ends paid access; the workspace drops to free limits.
        await this.billing.assignPlan(payment.workspaceId, 'free', { billingCycle: 'free' });
        return { handled: true };
      }
      default:
        return { handled: false, reason: `Unhandled event ${event}` };
    }
  }

  /* ----------------------------------------------------------- history */

  async history(workspaceId: string, q: PaginationDto) {
    const [rows, total] = await this.payments.findAndCount({
      where: { workspaceId },
      order: { createdAt: 'DESC' },
      skip: (q.page - 1) * q.limit,
      take: q.limit,
    });
    return paginate(rows, total, q.page, q.limit);
  }

  async findOne(workspaceId: string, id: string) {
    const payment = await this.payments.findOne({ where: { id, workspaceId } });
    if (!payment) throw new NotFoundException('Payment not found');
    return payment;
  }

  /** Invoice data for the client's records. Not a tax document by itself. */
  async invoice(workspaceId: string, id: string) {
    const payment = await this.findOne(workspaceId, id);
    if (payment.status !== 'paid') throw new BadRequestException('This payment has not been completed');
    const ws = await this.workspaces.findOne({ where: { id: workspaceId } });
    return {
      invoiceNumber: payment.invoiceNumber,
      issuedAt: payment.paidAt,
      billedTo: {
        name: ws?.billingName || ws?.name,
        email: ws?.billingEmail,
        address: ws?.billingAddress,
        gstin: ws?.billingGstin,
      },
      item: {
        description: `${payment.notes?.planName ?? 'Plan'} — ${payment.billingCycle} subscription`,
        amount: payment.amount / 100,
        currency: payment.currency,
      },
      total: payment.amount / 100,
      currency: payment.currency,
      paymentId: payment.paymentId,
      method: payment.method,
    };
  }

  /** Sequential per financial year, gap-free enough for accounting. */
  private async nextInvoiceNumber() {
    const now = new Date();
    const fyStart = now.getMonth() >= 3 ? now.getFullYear() : now.getFullYear() - 1;
    const prefix = `MF/${String(fyStart).slice(2)}-${String(fyStart + 1).slice(2)}/`;
    const last = await this.payments
      .createQueryBuilder('p')
      .where('p.invoice_number LIKE :prefix', { prefix: `${prefix}%` })
      .orderBy('p.invoice_number', 'DESC')
      .getOne();
    const seq = last?.invoiceNumber ? parseInt(last.invoiceNumber.split('/').pop(), 10) + 1 : 1;
    return `${prefix}${String(seq).padStart(5, '0')}`;
  }

  private async sendReceipt(workspaceId: string, payment: Partial<Payment>) {
    const ws = await this.workspaces.findOne({ where: { id: workspaceId } });
    const to = ws?.billingEmail;
    if (!to) return;
    const amount = (payment.amount / 100).toLocaleString('en-IN', { style: 'currency', currency: payment.currency || 'INR' });
    await this.email.sendSystem(to, `Payment received — ${payment.invoiceNumber}`,
      `<p>We have received ${amount} for <b>${payment.notes?.planName ?? 'your plan'}</b>.</p>
       <p>Invoice ${payment.invoiceNumber}<br>Payment reference ${payment.paymentId}</p>
       <p>Your ${payment.billingCycle} subscription is active.</p>`);
  }
}
