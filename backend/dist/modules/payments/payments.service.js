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
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
var PaymentsService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.PaymentsService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const entities_1 = require("../../database/entities");
const pagination_dto_1 = require("../../common/dto/pagination.dto");
const email_service_1 = require("../../integrations/email/email.service");
const billing_service_1 = require("../billing/billing.service");
const razorpay_service_1 = require("./razorpay.service");
const CYCLE_DAYS = { monthly: 30, yearly: 365 };
let PaymentsService = PaymentsService_1 = class PaymentsService {
    payments;
    workspaces;
    razorpay;
    billing;
    email;
    logger = new common_1.Logger(PaymentsService_1.name);
    constructor(payments, workspaces, razorpay, billing, email) {
        this.payments = payments;
        this.workspaces = workspaces;
        this.razorpay = razorpay;
        this.billing = billing;
        this.email = email;
    }
    get publicConfig() {
        return { enabled: this.razorpay.configured, keyId: this.razorpay.keyId ?? null };
    }
    /* ---------------------------------------------------------- checkout */
    /**
     * Creates a Razorpay order for a plan change. Nothing about the subscription
     * changes here — the plan is only applied once money is confirmed, either by
     * the browser callback or the webhook, whichever arrives first.
     */
    async checkout(workspaceId, userId, dto) {
        const plan = await this.billing.findPlan(dto.plan);
        const cycle = dto.billingCycle ?? 'monthly';
        const rupees = cycle === 'yearly' ? plan.priceYearly : plan.priceMonthly;
        if (!rupees || rupees <= 0) {
            throw new common_1.BadRequestException('This plan is free — switch to it from the billing page without paying');
        }
        const current = await this.billing.subscriptionFor(workspaceId);
        if (current.plan.id === plan.id && current.subscription.status === 'active' && cycle === current.subscription.billingCycle) {
            throw new common_1.BadRequestException('You are already on this plan for this billing cycle');
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
            billingCycle: cycle, status: 'created',
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
    async verify(workspaceId, dto) {
        const ok = this.razorpay.verifyPaymentSignature(dto.razorpayOrderId, dto.razorpayPaymentId, dto.razorpaySignature);
        if (!ok) {
            await this.payments.update({ orderId: dto.razorpayOrderId }, { status: 'failed', failureReason: 'Signature verification failed' });
            throw new common_1.BadRequestException('Payment could not be verified');
        }
        const payment = await this.payments.findOne({ where: { orderId: dto.razorpayOrderId, workspaceId } });
        if (!payment)
            throw new common_1.NotFoundException('No such payment for this workspace');
        return this.activate(payment, dto.razorpayPaymentId);
    }
    /**
     * Single activation path, reached by both the browser and the webhook.
     * Guarded on the stored status, so a double delivery cannot extend the period twice.
     */
    async activate(payment, razorpayPaymentId, method) {
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
    async handleWebhook(event, payload) {
        const entity = payload?.payment?.entity ?? payload?.order?.entity ?? payload?.refund?.entity;
        if (!entity)
            return { handled: false, reason: 'No entity in payload' };
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
    async history(workspaceId, q) {
        const [rows, total] = await this.payments.findAndCount({
            where: { workspaceId },
            order: { createdAt: 'DESC' },
            skip: (q.page - 1) * q.limit,
            take: q.limit,
        });
        return (0, pagination_dto_1.paginate)(rows, total, q.page, q.limit);
    }
    async findOne(workspaceId, id) {
        const payment = await this.payments.findOne({ where: { id, workspaceId } });
        if (!payment)
            throw new common_1.NotFoundException('Payment not found');
        return payment;
    }
    /** Invoice data for the client's records. Not a tax document by itself. */
    async invoice(workspaceId, id) {
        const payment = await this.findOne(workspaceId, id);
        if (payment.status !== 'paid')
            throw new common_1.BadRequestException('This payment has not been completed');
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
    async nextInvoiceNumber() {
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
    async sendReceipt(workspaceId, payment) {
        const ws = await this.workspaces.findOne({ where: { id: workspaceId } });
        const to = ws?.billingEmail;
        if (!to)
            return;
        const amount = (payment.amount / 100).toLocaleString('en-IN', { style: 'currency', currency: payment.currency || 'INR' });
        await this.email.sendSystem(to, `Payment received — ${payment.invoiceNumber}`, `<p>We have received ${amount} for <b>${payment.notes?.planName ?? 'your plan'}</b>.</p>
       <p>Invoice ${payment.invoiceNumber}<br>Payment reference ${payment.paymentId}</p>
       <p>Your ${payment.billingCycle} subscription is active.</p>`);
    }
};
exports.PaymentsService = PaymentsService;
exports.PaymentsService = PaymentsService = PaymentsService_1 = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(entities_1.Payment)),
    __param(1, (0, typeorm_1.InjectRepository)(entities_1.Workspace)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository,
        razorpay_service_1.RazorpayService,
        billing_service_1.BillingService,
        email_service_1.EmailService])
], PaymentsService);
