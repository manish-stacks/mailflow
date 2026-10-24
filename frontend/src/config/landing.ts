/**
 * Landing-page configuration. Everything that is not a real in-app route is env-driven so
 * marketing can wire it later without touching components. Unset links render as plain text
 * (never as dead anchors, never as invented URLs).
 */
const env = (v?: string) => (v && v.trim() ? v.trim() : undefined);

export const SITE = {
  name: 'HoverMail',
  tagline: 'Every Campaign. One Powerful Platform.',
  description:
    'Create, personalize, automate and analyze email campaigns from one simple workspace. Campaigns, templates, AI writing, contacts, teams and API access.',
  url: env(process.env.NEXT_PUBLIC_SITE_URL) ?? 'http://localhost:3000',
};

/** Real routes that exist in this app. */
export const ROUTES = {
  signIn: '/login',
  signUp: '/register',
  dashboard: '/dashboard',
  templates: '/templates',
  newCampaign: '/campaigns/new',
  analytics: '/analytics',
  contacts: '/contacts',
  apiKeys: '/settings/api-keys',
  /** Static file shipped in /public/docs. */
  apiDocs: '/docs/api-keys.md',
};

/** Optional external links — set in .env to enable. */
export const EXTERNAL = {
  support: env(process.env.NEXT_PUBLIC_SUPPORT_URL),
  privacy: env(process.env.NEXT_PUBLIC_PRIVACY_URL),
  terms: env(process.env.NEXT_PUBLIC_TERMS_URL),
  company: env(process.env.NEXT_PUBLIC_COMPANY_URL),
  companyName: env(process.env.NEXT_PUBLIC_COMPANY_NAME),
};

/**
 * Demo requests. Set ONE of these (checked in order):
 *  - NEXT_PUBLIC_DEMO_ENDPOINT: URL that accepts a JSON POST (your backend, Formspree, Make, Zapier…)
 *  - NEXT_PUBLIC_DEMO_EMAIL:    opens the visitor's mail app addressed to this inbox
 * Optional NEXT_PUBLIC_DEMO_BOOKING_URL (Calendly, Cal.com…) adds a "pick a time" button after submit.
 */
export const DEMO = {
  endpoint: env(process.env.NEXT_PUBLIC_DEMO_ENDPOINT),
  email: env(process.env.NEXT_PUBLIC_DEMO_EMAIL),
  bookingUrl: env(process.env.NEXT_PUBLIC_DEMO_BOOKING_URL),
};
