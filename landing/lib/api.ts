import { plans as fallbackPlans, type Plan } from "./site";

// Base URL of the backend's /api prefix. Override in .env.local for staging/prod.
const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000/api";

/** Shape returned by GET /api/plans (backend/src/database/entities/billing.entity.ts -> Plan). */
type ApiPlan = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  priceMonthly: number;
  priceYearly: number;
  currency: string;
  maxContacts: number;
  maxEmailsPerMonth: number;
  maxTeamMembers: number;
  maxSenderIdentities: number;
  maxDomains: number;
  aiCreditsPerDay: number;
  allowCustomSmtp: boolean;
  allowApiAccess: boolean;
  allowAi: boolean;
  allowSegments: boolean;
  removeBranding: boolean;
  sortOrder: number;
};

function fmt(n: number, unit: string, unlimitedLabel = "Unlimited") {
  return n === -1 ? unlimitedLabel : `${n.toLocaleString("en-IN")} ${unit}`;
}

function toPlanView(p: ApiPlan, isMiddle: boolean): Plan {
  const features: string[] = [
    `${fmt(p.maxSenderIdentities, "sender identities", "Unlimited sender identities")}`,
    p.allowSegments ? "Segments & link-level tracking" : "",
    p.allowCustomSmtp ? "Custom SMTP & provider connections" : "",
    p.allowApiAccess ? "API access" : "",
    p.removeBranding ? "Branding removed" : "MailFlow branding on emails",
  ].filter(Boolean);

  return {
    slug: p.slug,
    name: p.name,
    priceMonthly: Number(p.priceMonthly) || 0,
    priceYearly: Number(p.priceYearly) || 0,
    description: p.description ?? "",
    contacts: fmt(p.maxContacts, "contacts", "Unlimited contacts"),
    emails: fmt(p.maxEmailsPerMonth, "emails / month", "Unlimited emails / month"),
    aiCredits: p.allowAi ? fmt(p.aiCreditsPerDay, "AI credits / day", "Unlimited AI credits") : "AI writer not included",
    seats: fmt(p.maxTeamMembers, "team members", "Unlimited team members"),
    domains: fmt(p.maxDomains, "sending domains", "Unlimited sending domains"),
    features,
    highlighted: isMiddle,
  };
}

/**
 * Fetches live pricing from the backend (`GET /api/plans`, public, no auth).
 * Falls back to the static plans in `lib/site.ts` if the API is unreachable —
 * e.g. during a build where the backend isn't running — so the site never breaks.
 */
export async function fetchPlans(): Promise<Plan[]> {
  try {
    const res = await fetch(`${API_URL}/plans`, { next: { revalidate: 300 } });
    if (!res.ok) throw new Error(`Plans request failed: ${res.status}`);
    const data: ApiPlan[] = await res.json();
    if (!Array.isArray(data) || data.length === 0) return fallbackPlans;

    const sorted = [...data].sort((a, b) => a.sortOrder - b.sortOrder);
    const middleIndex = Math.floor((sorted.length - 1) / 2);
    return sorted.map((p, i) => toPlanView(p, sorted.length > 1 && i === middleIndex));
  } catch {
    return fallbackPlans;
  }
}
