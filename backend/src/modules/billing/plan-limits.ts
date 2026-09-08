import { Plan, Subscription } from '@/database/entities';

export const UNLIMITED = -1;

/** Every limit and feature a workspace can be gated on. */
export interface EffectiveLimits {
  planId: string;
  planName: string;
  planSlug: string;
  maxContacts: number;
  maxEmailsPerMonth: number;
  maxCampaignsPerMonth: number;
  maxTeamMembers: number;
  maxSenderIdentities: number;
  maxDomains: number;
  aiCreditsPerDay: number;
  allowCustomSmtp: boolean;
  allowApiAccess: boolean;
  allowAi: boolean;
  allowSegments: boolean;
  removeBranding: boolean;
}

/**
 * Plan values, then per-subscription overrides on top. Overrides let one client
 * get a bigger contact cap without inventing a whole new plan.
 */
export function effectiveLimits(plan: Plan, sub?: Subscription | null): EffectiveLimits {
  const base: EffectiveLimits = {
    planId: plan.id,
    planName: plan.name,
    planSlug: plan.slug,
    maxContacts: plan.maxContacts,
    maxEmailsPerMonth: plan.maxEmailsPerMonth,
    maxCampaignsPerMonth: plan.maxCampaignsPerMonth,
    maxTeamMembers: plan.maxTeamMembers,
    maxSenderIdentities: plan.maxSenderIdentities,
    maxDomains: plan.maxDomains,
    aiCreditsPerDay: plan.aiCreditsPerDay,
    allowCustomSmtp: plan.allowCustomSmtp,
    allowApiAccess: plan.allowApiAccess,
    allowAi: plan.allowAi,
    allowSegments: plan.allowSegments,
    removeBranding: plan.removeBranding,
  };
  const o = sub?.overrides;
  if (!o) return base;
  for (const key of Object.keys(o)) {
    if (key in base && o[key] !== null && o[key] !== undefined) (base as any)[key] = o[key];
  }
  return base;
}

export const isUnlimited = (limit: number) => limit === UNLIMITED || limit === null || limit === undefined;

/** true when consuming `amount` more would exceed the limit. */
export const wouldExceed = (used: number, amount: number, limit: number) =>
  !isUnlimited(limit) && used + amount > limit;

export const currentPeriod = (d = new Date()) =>
  `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}`;
