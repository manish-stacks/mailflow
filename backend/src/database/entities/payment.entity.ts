import { Column, Entity, Index, Unique } from 'typeorm';
import { BaseEntity } from './base.entity';

export type PaymentStatus = 'created' | 'pending' | 'paid' | 'failed' | 'refunded';

@Entity('payments')
@Unique('uq_payment_order', ['orderId'])
export class Payment extends BaseEntity {
  @Index() @Column({ name: 'workspace_id' }) workspaceId: string;
  @Column({ name: 'plan_id', nullable: true }) planId: string;
  @Column({ name: 'user_id', nullable: true }) userId: string;

  @Column({ name: 'invoice_number', nullable: true }) invoiceNumber: string;
  @Column({ type: 'enum', enum: ['razorpay', 'manual'], default: 'razorpay' }) gateway: 'razorpay' | 'manual';
  @Column({ name: 'order_id', nullable: true }) orderId: string;
  @Index() @Column({ name: 'payment_id', nullable: true }) paymentId: string;
  @Column({ name: 'refund_id', nullable: true }) refundId: string;

  /** Paise, not rupees — Razorpay's unit, kept as-is to avoid float rounding. */
  @Column({ type: 'int' }) amount: number;
  @Column({ default: 'INR' }) currency: string;
  @Column({ name: 'billing_cycle', type: 'enum', enum: ['monthly', 'yearly', 'lifetime'], default: 'monthly' })
  billingCycle: 'monthly' | 'yearly' | 'lifetime';

  @Column({ type: 'enum', enum: ['created', 'pending', 'paid', 'failed', 'refunded'], default: 'created' })
  status: PaymentStatus;
  @Column({ nullable: true }) method: string;
  @Column({ name: 'failure_reason', nullable: true }) failureReason: string;
  @Column({ type: 'json', nullable: true }) notes: Record<string, any>;
  @Column({ name: 'paid_at', type: 'datetime', nullable: true }) paidAt: Date;
}
