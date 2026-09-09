export const site = {
  name: "MailFlow",
  tagline: "Email marketing, sent right.",
  description:
    "MailFlow is an email marketing platform for growing teams — build your list, write with AI, send from your own domain, and see exactly what happened after you hit send.",
  url: "https://mailflow.example.com",
  // Where the actual product (the app in /frontend) is hosted. Update once deployed.
  appUrl: "https://app.mailflow.example.com",
};

export const nav = [
  { label: "Features", href: "/features" },
  { label: "Pricing", href: "/pricing" },
  { label: "Contact", href: "/contact" },
];

export const features = [
  {
    title: "Campaigns that don't fight your workflow",
    body: "Build a campaign, pick a list or a segment, schedule it or send now. Drafts, A/B subject lines, and resend-to-unopened are built in, not bolted on.",
    tag: "Campaigns",
  },
  {
    title: "AI that drafts, not decides",
    body: "Give it a topic and a tone. It writes subject lines and body copy you can edit line by line — every generation counted against a visible daily credit, never a surprise.",
    tag: "AI writer",
  },
  {
    title: "Lists and segments that stay accurate",
    body: "Tag contacts, build segments from real behaviour — opens, clicks, custom fields — and keep bounces and unsubscribes out of your sends automatically.",
    tag: "Contacts",
  },
  {
    title: "Send from a domain people trust",
    body: "Verify your own sending domain, connect SMTP or a provider you already use — Gmail, Outlook, SES, Brevo, SendGrid, Mailgun — and set a daily rate that protects your reputation.",
    tag: "Deliverability",
  },
  {
    title: "Numbers you can act on",
    body: "Opens, clicks, bounces and unsubscribes per campaign, tracked at the link level, so you know what to send next — not just what happened last time.",
    tag: "Analytics",
  },
  {
    title: "Build on top of it",
    body: "A documented API and scoped API keys for teams who want campaigns and contacts inside their own product or internal tools.",
    tag: "API access",
  },
];

export const howItWorks = [
  {
    title: "Bring your contacts",
    body: "Import a CSV or connect your existing list. MailFlow checks for duplicates and suppressed addresses before anything gets sent.",
  },
  {
    title: "Write or generate the email",
    body: "Start from a template, write it yourself, or let the AI writer draft subject lines and body copy for you to edit.",
  },
  {
    title: "Send and watch it land",
    body: "Schedule the send from your verified domain, then track opens, clicks and unsubscribes as they come in, in real time.",
  },
];

export const stats = [
  { value: "99.95%", label: "platform uptime" },
  { value: "<3s", label: "median send-queue latency" },
  { value: "7", label: "mail providers supported" },
];

export type Plan = {
  slug: string;
  name: string;
  priceMonthly: number;
  priceYearly: number;
  description: string;
  contacts: string;
  emails: string;
  aiCredits: string;
  seats: string;
  domains: string;
  features: string[];
  highlighted?: boolean;
};

/**
 * Fallback only — used if the backend at NEXT_PUBLIC_API_URL is unreachable.
 * Real pricing is fetched live from GET /api/plans (see lib/api.ts, used in
 * app/page.tsx and app/pricing/page.tsx). Keep this roughly in sync so the
 * fallback looks reasonable, but it is not the source of truth.
 */
export const plans: Plan[] = [
  {
    slug: "free",
    name: "Free",
    priceMonthly: 0,
    priceYearly: 0,
    description: "For testing the waters with a small list.",
    contacts: "1,000 contacts",
    emails: "5,000 emails / month",
    aiCredits: "20 AI credits / day",
    seats: "2 team members",
    domains: "1 sending domain",
    features: ["1 sender identity", "Segments", "Basic analytics", "MailFlow branding on emails"],
  },
  {
    slug: "growth",
    name: "Growth",
    priceMonthly: 1499,
    priceYearly: 14990,
    description: "For teams sending every week and growing a list.",
    contacts: "10,000 contacts",
    emails: "50,000 emails / month",
    aiCredits: "100 AI credits / day",
    seats: "5 team members",
    domains: "3 sending domains",
    features: [
      "5 sender identities",
      "Custom SMTP & provider connections",
      "API access",
      "Branding removed",
      "Segments & link-level tracking",
    ],
    highlighted: true,
  },
  {
    slug: "business",
    name: "Business",
    priceMonthly: 4999,
    priceYearly: 49990,
    description: "For teams that treat email as core infrastructure.",
    contacts: "Unlimited contacts",
    emails: "250,000 emails / month",
    aiCredits: "Unlimited AI credits",
    seats: "Unlimited team members",
    domains: "Unlimited sending domains",
    features: [
      "Unlimited sender identities",
      "Custom SMTP & provider connections",
      "API access with higher rate limits",
      "Priority support",
      "Dedicated onboarding for domain warm-up",
    ],
  },
];

export const faqs = [
  {
    q: "Do I need my own domain to send?",
    a: "You can send from a shared address on the Free plan while you test things out. Every paid plan lets you verify your own domain so mail lands as you@yourcompany.com.",
  },
  {
    q: "Which mail providers can I connect?",
    a: "SMTP, Gmail, Outlook, Amazon SES, Brevo, SendGrid and Mailgun. You can also let MailFlow handle sending directly.",
  },
  {
    q: "What happens if I go over my contact or email limit?",
    a: "We'll email you before you hit the ceiling. You can upgrade at any time and the new limits apply immediately — nothing gets paused without warning.",
  },
  {
    q: "How do AI credits work?",
    a: "Every subject line or body draft the AI writer generates uses one credit. Credits reset daily, and editing what it wrote costs nothing further.",
  },
  {
    q: "Can I cancel or switch plans later?",
    a: "Yes, from your workspace billing settings at any time. Downgrades apply from your next billing cycle.",
  },
];
