import { Column, Entity, Index, Unique } from 'typeorm';
import { BaseEntity } from './base.entity';

export type BillingCycle = 'monthly' | 'yearly' | 'lifetime' | 'free';
export type SubscriptionStatus = 'trialing' | 'active' | 'past_due' | 'cancelled' | 'suspended';
export type MailProvider = 'smtp' | 'gmail' | 'outlook' | 'ses' | 'brevo' | 'sendgrid' | 'mailgun';

/** -1 on any numeric limit means unlimited. */
@Entity('plans')
export class Plan extends BaseEntity {
  @Column() name: string;
  @Index({ unique: true }) @Column() slug: string;
  @Column({ nullable: true }) description: string;
  @Column({ name: 'price_monthly', type: 'decimal', precision: 10, scale: 2, default: 0, transformer: { to: (v) => v, from: (v) => Number(v) } })
  priceMonthly: number;
  @Column({ name: 'price_yearly', type: 'decimal', precision: 10, scale: 2, default: 0, transformer: { to: (v) => v, from: (v) => Number(v) } })
  priceYearly: number;
  @Column({ default: 'INR' }) currency: string;

  @Column({ name: 'max_contacts', default: 1000 }) maxContacts: number;
  @Column({ name: 'max_emails_per_month', default: 5000 }) maxEmailsPerMonth: number;
  @Column({ name: 'max_campaigns_per_month', default: -1 }) maxCampaignsPerMonth: number;
  @Column({ name: 'max_team_members', default: 2 }) maxTeamMembers: number;
  @Column({ name: 'max_sender_identities', default: 1 }) maxSenderIdentities: number;
  @Column({ name: 'max_domains', default: 1 }) maxDomains: number;
  @Column({ name: 'ai_credits_per_day', default: 20 }) aiCreditsPerDay: number;

  @Column({ name: 'allow_custom_smtp', type: 'tinyint', default: 0, transformer: { to: (v) => (v ? 1 : 0), from: (v) => !!v } })
  allowCustomSmtp: boolean;
  @Column({ name: 'allow_api_access', type: 'tinyint', default: 0, transformer: { to: (v) => (v ? 1 : 0), from: (v) => !!v } })
  allowApiAccess: boolean;
  @Column({ name: 'allow_ai', type: 'tinyint', default: 1, transformer: { to: (v) => (v ? 1 : 0), from: (v) => !!v } })
  allowAi: boolean;
  @Column({ name: 'allow_segments', type: 'tinyint', default: 1, transformer: { to: (v) => (v ? 1 : 0), from: (v) => !!v } })
  allowSegments: boolean;
  @Column({ name: 'remove_branding', type: 'tinyint', default: 0, transformer: { to: (v) => (v ? 1 : 0), from: (v) => !!v } })
  removeBranding: boolean;

  @Column({ name: 'is_public', type: 'tinyint', default: 1, transformer: { to: (v) => (v ? 1 : 0), from: (v) => !!v } })
  isPublic: boolean;
  @Column({ name: 'is_active', type: 'tinyint', default: 1, transformer: { to: (v) => (v ? 1 : 0), from: (v) => !!v } })
  isActive: boolean;
  @Column({ name: 'sort_order', default: 0 }) sortOrder: number;
}

@Entity('subscriptions')
@Unique('uq_sub_workspace', ['workspaceId'])
export class Subscription extends BaseEntity {
  @Column({ name: 'workspace_id' }) workspaceId: string;
  @Index() @Column({ name: 'plan_id' }) planId: string;
  @Column({ type: 'enum', enum: ['trialing', 'active', 'past_due', 'cancelled', 'suspended'], default: 'active' })
  status: SubscriptionStatus;
  @Column({ name: 'billing_cycle', type: 'enum', enum: ['monthly', 'yearly', 'lifetime', 'free'], default: 'monthly' })
  billingCycle: BillingCycle;
  @Column({ name: 'current_period_start', type: 'datetime' }) currentPeriodStart: Date;
  @Column({ name: 'current_period_end', type: 'datetime', nullable: true }) currentPeriodEnd: Date;
  @Column({ name: 'trial_ends_at', type: 'datetime', nullable: true }) trialEndsAt: Date;
  @Column({ name: 'cancelled_at', type: 'datetime', nullable: true }) cancelledAt: Date;
  /** Per-customer limit overrides, merged over the plan at read time. */
  @Column({ type: 'json', nullable: true }) overrides: Partial<Record<string, number | boolean>>;
  @Column({ nullable: true }) notes: string;
}

@Entity('usage_periods')
@Unique('uq_usage_ws_period', ['workspaceId', 'period'])
export class UsagePeriod extends BaseEntity {
  @Column({ name: 'workspace_id' }) workspaceId: string;
  @Column({ length: 7 }) period: string;
  @Column({ name: 'emails_sent', default: 0 }) emailsSent: number;
  @Column({ name: 'campaigns_created', default: 0 }) campaignsCreated: number;
  @Column({ name: 'contacts_imported', default: 0 }) contactsImported: number;
  @Column({ name: 'ai_calls', default: 0 }) aiCalls: number;
}

@Entity('email_connections')
@Unique('uq_mailconn_ws', ['workspaceId'])
export class EmailConnection extends BaseEntity {
  @Column({ name: 'workspace_id' }) workspaceId: string;
  @Column({ default: 'Primary' }) label: string;
  @Column({ type: 'enum', enum: ['smtp', 'gmail', 'outlook', 'ses', 'brevo', 'sendgrid', 'mailgun'], default: 'smtp' })
  provider: MailProvider;
  @Column() host: string;
  @Column({ default: 587 }) port: number;
  @Column({ type: 'tinyint', default: 0, transformer: { to: (v) => (v ? 1 : 0), from: (v) => !!v } })
  secure: boolean;
  @Column({ nullable: true }) username: string;
  /** AES-256-GCM ciphertext. Never selected into an API response. */
  @Column({ name: 'password_enc', type: 'text', nullable: true }) passwordEnc: string;
  @Column({ name: 'from_name', nullable: true }) fromName: string;
  @Column({ name: 'from_email', nullable: true }) fromEmail: string;
  @Column({ name: 'daily_limit', default: 0 }) dailyLimit: number;
  @Column({ name: 'rate_per_minute', default: 0 }) ratePerMinute: number;
  @Column({ type: 'enum', enum: ['untested', 'verified', 'failed'], default: 'untested' })
  status: 'untested' | 'verified' | 'failed';
  @Column({ name: 'last_error', nullable: true }) lastError: string;
  @Column({ name: 'last_tested_at', type: 'datetime', nullable: true }) lastTestedAt: Date;
  @Column({ name: 'is_active', type: 'tinyint', default: 1, transformer: { to: (v) => (v ? 1 : 0), from: (v) => !!v } })
  isActive: boolean;
}
