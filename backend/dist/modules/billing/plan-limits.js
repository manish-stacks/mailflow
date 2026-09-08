"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.currentPeriod = exports.wouldExceed = exports.isUnlimited = exports.UNLIMITED = void 0;
exports.effectiveLimits = effectiveLimits;
exports.UNLIMITED = -1;
/**
 * Plan values, then per-subscription overrides on top. Overrides let one client
 * get a bigger contact cap without inventing a whole new plan.
 */
function effectiveLimits(plan, sub) {
    const base = {
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
    if (!o)
        return base;
    for (const key of Object.keys(o)) {
        if (key in base && o[key] !== null && o[key] !== undefined)
            base[key] = o[key];
    }
    return base;
}
const isUnlimited = (limit) => limit === exports.UNLIMITED || limit === null || limit === undefined;
exports.isUnlimited = isUnlimited;
/** true when consuming `amount` more would exceed the limit. */
const wouldExceed = (used, amount, limit) => !(0, exports.isUnlimited)(limit) && used + amount > limit;
exports.wouldExceed = wouldExceed;
const currentPeriod = (d = new Date()) => `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}`;
exports.currentPeriod = currentPeriod;
