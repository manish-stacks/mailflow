import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import {
  Contact, ContactList, Plan, SenderDomain, SenderIdentity, Subscription, UsagePeriod, WorkspaceMember,
} from '@/database/entities';
import { EffectiveLimits, currentPeriod, effectiveLimits, isUnlimited, wouldExceed } from './plan-limits';

export type Quota =
  | 'contacts' | 'emails' | 'campaigns' | 'members' | 'senders' | 'domains' | 'ai';

export type Feature = 'customSmtp' | 'apiAccess' | 'ai' | 'segments';

@Injectable()
export class BillingService {
  constructor(
    @InjectRepository(Plan) private plans: Repository<Plan>,
    @InjectRepository(Subscription) private subs: Repository<Subscription>,
    @InjectRepository(UsagePeriod) private usage: Repository<UsagePeriod>,
    @InjectRepository(Contact) private contacts: Repository<Contact>,
    @InjectRepository(WorkspaceMember) private members: Repository<WorkspaceMember>,
    @InjectRepository(SenderIdentity) private senders: Repository<SenderIdentity>,
    @InjectRepository(SenderDomain) private domains: Repository<SenderDomain>,
    private db: DataSource,
  ) {}

  /* ------------------------------------------------------------ plans */

  listPublic() {
    return this.plans.find({ where: { isPublic: true, isActive: true }, order: { sortOrder: 'ASC' } });
  }

  listAll() {
    return this.plans.find({ order: { sortOrder: 'ASC' } });
  }

  async findPlan(idOrSlug: string) {
    const plan = await this.plans.findOne({ where: [{ id: idOrSlug }, { slug: idOrSlug }] });
    if (!plan) throw new NotFoundException('Plan not found');
    return plan;
  }

  async createPlan(dto: Partial<Plan>) {
    if (!dto.slug) throw new BadRequestException('Plan slug is required');
    const exists = await this.plans.findOne({ where: { slug: dto.slug } });
    if (exists) throw new BadRequestException('A plan with that slug already exists');
    return this.plans.save(this.plans.create(dto));
  }

  async updatePlan(id: string, dto: Partial<Plan>) {
    const plan = await this.findPlan(id);
    delete (dto as any).id;
    await this.plans.update(plan.id, dto);
    return this.findPlan(plan.id);
  }

  /** Plans are archived, never deleted, so existing subscriptions keep resolving. */
  async archivePlan(id: string) {
    const plan = await this.findPlan(id);
    const inUse = await this.subs.count({ where: { planId: plan.id } });
    await this.plans.update(plan.id, { isActive: false, isPublic: false });
    return { message: inUse ? `Plan archived — ${inUse} workspace(s) stay on it` : 'Plan archived' };
  }

  /* ---------------------------------------------------- subscriptions */

  /** Every workspace has a subscription; missing ones fall back to the free plan. */
  async subscriptionFor(workspaceId: string): Promise<{ subscription: Subscription; plan: Plan; limits: EffectiveLimits }> {
    let sub = await this.subs.findOne({ where: { workspaceId } });
    if (!sub) {
      const free = await this.plans.findOne({ where: { slug: 'free' } })
        ?? (await this.plans.find({ order: { sortOrder: 'ASC' }, take: 1 }))[0];
      if (!free) throw new NotFoundException('No plans are configured — seed saas.sql first');
      sub = await this.subs.save(this.subs.create({
        workspaceId, planId: free.id, status: 'active', billingCycle: 'free',
        currentPeriodStart: new Date(),
      }));
    }
    const plan = await this.plans.findOne({ where: { id: sub.planId } });
    if (!plan) throw new NotFoundException('The plan on this subscription no longer exists');
    return { subscription: sub, plan, limits: effectiveLimits(plan, sub) };
  }

  async limitsFor(workspaceId: string) {
    return (await this.subscriptionFor(workspaceId)).limits;
  }

  /** Assign or change a plan. Payment capture is intentionally out of scope here. */
  async assignPlan(workspaceId: string, planIdOrSlug: string, opts: {
    billingCycle?: 'monthly' | 'yearly' | 'lifetime' | 'free';
    trialDays?: number; overrides?: Record<string, any>; notes?: string;
  } = {}) {
    const plan = await this.findPlan(planIdOrSlug);
    const existing = await this.subs.findOne({ where: { workspaceId } });
    const now = new Date();
    const cycle = opts.billingCycle ?? (plan.priceMonthly > 0 ? 'monthly' : 'free');
    const end = new Date(now);
    if (cycle === 'monthly') end.setMonth(end.getMonth() + 1);
    else if (cycle === 'yearly') end.setFullYear(end.getFullYear() + 1);

    const payload: Partial<Subscription> = {
      workspaceId, planId: plan.id, status: opts.trialDays ? 'trialing' : 'active',
      billingCycle: cycle, currentPeriodStart: now,
      currentPeriodEnd: cycle === 'lifetime' || cycle === 'free' ? null : end,
      trialEndsAt: opts.trialDays ? new Date(now.getTime() + opts.trialDays * 864e5) : null,
      cancelledAt: null,
      overrides: opts.overrides ?? existing?.overrides ?? null,
      notes: opts.notes ?? existing?.notes,
    };

    if (existing) await this.subs.update(existing.id, payload);
    else await this.subs.save(this.subs.create(payload));

    return this.subscriptionFor(workspaceId);
  }

  async cancel(workspaceId: string) {
    const { subscription } = await this.subscriptionFor(workspaceId);
    await this.subs.update(subscription.id, { status: 'cancelled', cancelledAt: new Date() });
    return { message: 'Subscription cancelled. Access continues until the period ends.' };
  }

  async setStatus(workspaceId: string, status: Subscription['status']) {
    const { subscription } = await this.subscriptionFor(workspaceId);
    await this.subs.update(subscription.id, { status });
    return { message: `Subscription is now ${status}` };
  }

  /* ----------------------------------------------------------- usage */

  private async period(workspaceId: string) {
    const period = currentPeriod();
    let row = await this.usage.findOne({ where: { workspaceId, period } });
    if (!row) {
      await this.usage.createQueryBuilder().insert().into(UsagePeriod)
        .values({ workspaceId, period }).orIgnore().execute();
      row = await this.usage.findOne({ where: { workspaceId, period } });
    }
    return row;
  }

  /** Counters are incremented atomically — two workers sending at once cannot lose a count. */
  async increment(workspaceId: string, field: keyof Pick<UsagePeriod, 'emailsSent' | 'campaignsCreated' | 'contactsImported' | 'aiCalls'>, by = 1) {
    const row = await this.period(workspaceId);
    await this.usage.increment({ id: row.id }, field, by);
  }

  async usageFor(workspaceId: string) {
    const row = await this.period(workspaceId);
    const [contacts, members, senders, domains] = await Promise.all([
      this.contacts.count({ where: { workspaceId } }),
      this.members.count({ where: { workspaceId } }),
      this.senders.count({ where: { workspaceId } }),
      this.domains.count({ where: { workspaceId } }),
    ]);
    return {
      period: row.period,
      contacts, members, senders, domains,
      emailsSent: row.emailsSent,
      campaignsCreated: row.campaignsCreated,
      contactsImported: row.contactsImported,
      aiCalls: row.aiCalls,
    };
  }

  /** Everything the billing screen needs, in one call. */
  async summary(workspaceId: string) {
    const { subscription, plan, limits } = await this.subscriptionFor(workspaceId);
    const usage = await this.usageFor(workspaceId);
    const pct = (used: number, limit: number) => (isUnlimited(limit) ? 0 : Math.min(100, Math.round((used / Math.max(1, limit)) * 100)));
    return {
      subscription: {
        id: subscription.id, status: subscription.status, billingCycle: subscription.billingCycle,
        currentPeriodStart: subscription.currentPeriodStart, currentPeriodEnd: subscription.currentPeriodEnd,
        trialEndsAt: subscription.trialEndsAt, cancelledAt: subscription.cancelledAt,
      },
      plan: { id: plan.id, name: plan.name, slug: plan.slug, priceMonthly: plan.priceMonthly, priceYearly: plan.priceYearly, currency: plan.currency },
      limits,
      usage,
      meters: [
        { key: 'contacts', label: 'Contacts', used: usage.contacts, limit: limits.maxContacts, percent: pct(usage.contacts, limits.maxContacts) },
        { key: 'emails', label: 'Emails this month', used: usage.emailsSent, limit: limits.maxEmailsPerMonth, percent: pct(usage.emailsSent, limits.maxEmailsPerMonth) },
        { key: 'members', label: 'Team members', used: usage.members, limit: limits.maxTeamMembers, percent: pct(usage.members, limits.maxTeamMembers) },
        { key: 'senders', label: 'Sender identities', used: usage.senders, limit: limits.maxSenderIdentities, percent: pct(usage.senders, limits.maxSenderIdentities) },
        { key: 'domains', label: 'Domains', used: usage.domains, limit: limits.maxDomains, percent: pct(usage.domains, limits.maxDomains) },
      ],
    };
  }

  /* -------------------------------------------------------- gatekeeping */

  async assertFeature(workspaceId: string, feature: Feature) {
    const limits = await this.limitsFor(workspaceId);
    const map: Record<Feature, boolean> = {
      customSmtp: limits.allowCustomSmtp,
      apiAccess: limits.allowApiAccess,
      ai: limits.allowAi,
      segments: limits.allowSegments,
    };
    if (!map[feature]) {
      throw new ForbiddenException(`Your ${limits.planName} plan does not include this feature. Upgrade to continue.`);
    }
    return limits;
  }

  /**
   * Throws before the work happens, never half-way through it.
   * `amount` is how many units this operation is about to consume.
   */
  async assertQuota(workspaceId: string, quota: Quota, amount = 1) {
    const { subscription, limits } = await this.subscriptionFor(workspaceId);

    if (subscription.status === 'suspended') {
      throw new ForbiddenException('This workspace is suspended. Contact support to reactivate it.');
    }
    if (subscription.status === 'cancelled' && subscription.currentPeriodEnd && subscription.currentPeriodEnd < new Date()) {
      throw new ForbiddenException('Your subscription has ended. Renew to keep sending.');
    }
    // A paid period that lapsed without a renewal payment stops metered work.
    // Nothing is deleted — paying again restores the same workspace intact.
    if (subscription.currentPeriodEnd && subscription.currentPeriodEnd < new Date()
        && ['active', 'trialing', 'past_due'].includes(subscription.status)) {
      throw new ForbiddenException('Your billing period has ended. Renew your plan to continue.');
    }

    const usage = await this.usageFor(workspaceId);
    const checks: Record<Quota, { used: number; limit: number; label: string }> = {
      contacts: { used: usage.contacts, limit: limits.maxContacts, label: 'contacts' },
      emails: { used: usage.emailsSent, limit: limits.maxEmailsPerMonth, label: 'emails this month' },
      campaigns: { used: usage.campaignsCreated, limit: limits.maxCampaignsPerMonth, label: 'campaigns this month' },
      members: { used: usage.members, limit: limits.maxTeamMembers, label: 'team members' },
      senders: { used: usage.senders, limit: limits.maxSenderIdentities, label: 'sender identities' },
      domains: { used: usage.domains, limit: limits.maxDomains, label: 'domains' },
      ai: { used: usage.aiCalls, limit: limits.aiCreditsPerDay, label: 'AI credits' },
    };

    const c = checks[quota];
    if (wouldExceed(c.used, amount, c.limit)) {
      throw new ForbiddenException(
        `Your ${limits.planName} plan allows ${c.limit} ${c.label} — you are at ${c.used}. Upgrade to continue.`,
      );
    }
    return { limits, remaining: isUnlimited(c.limit) ? null : c.limit - c.used };
  }

  /** Non-throwing variant for UI hints. */
  async can(workspaceId: string, quota: Quota, amount = 1) {
    try {
      await this.assertQuota(workspaceId, quota, amount);
      return true;
    } catch {
      return false;
    }
  }
}
