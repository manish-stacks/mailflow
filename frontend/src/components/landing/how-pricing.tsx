'use client';
import Link from 'next/link';
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { ArrowRight, Check, Minus } from 'lucide-react';
import { api } from '@/lib/api';
import { formatLimit, formatMoney, cn } from '@/lib/utils';
import type { Plan } from '@/types';
import { ROUTES } from '@/config/landing';
import { cta, Heading, Section } from './ui';

const STEPS = [
  ['01', 'Set Up Your Workspace', 'Configure your business, sender identities, and required email settings.'],
  ['02', 'Create Your First Campaign', 'Import contacts, choose a template, and write or generate your email.'],
  ['03', 'Send and Improve', 'Launch your campaign, review performance, and use insights to improve future sends.'],
];

export function HowItWorks() {
  return (
    <Section id="how-it-works" tone="gray">
      <Heading eyebrow="How it works" title="Get Started Without the Complexity" />
      <ol className="mt-14 grid gap-5 md:grid-cols-3">
        {STEPS.map(([n, t, d]) => (
          <li key={n} className="rounded-2xl border border-hm-line bg-white p-7">
            <span className="text-sm font-semibold text-hm-red">{n}</span>
            <h3 className="mt-3 text-xl font-semibold tracking-tight text-hm-ink">{t}</h3>
            <p className="mt-2 leading-relaxed text-hm-gray">{d}</p>
          </li>
        ))}
      </ol>
      <p className="mx-auto mt-6 max-w-xl text-center text-sm text-hm-gray">Before your first send, verify your sender identity and sending domain. Verification must be completed before campaigns can go out.</p>
      <div className="mt-8 text-center"><Link href={ROUTES.signUp} className={cta.primary}>Get Started</Link></div>
    </Section>
  );
}

/** Rows shown in the comparison — all read from the real Plan model, nothing hard-coded. */
const LIMITS: { key: keyof Plan; label: string }[] = [
  { key: 'maxContacts', label: 'Contacts' },
  { key: 'maxEmailsPerMonth', label: 'Emails / month' },
  { key: 'maxCampaignsPerMonth', label: 'Campaigns / month' },
  { key: 'maxTeamMembers', label: 'Team members' },
  { key: 'maxSenderIdentities', label: 'Sender identities' },
  { key: 'maxDomains', label: 'Sending domains' },
  { key: 'aiCreditsPerDay', label: 'AI credits / day' },
];
const FLAGS: { key: keyof Plan; label: string }[] = [
  { key: 'allowAi', label: 'AI writing assistant' },
  { key: 'allowSegments', label: 'Dynamic segments' },
  { key: 'allowCustomSmtp', label: 'Own mail server' },
  { key: 'allowApiAccess', label: 'API access' },
  { key: 'removeBranding', label: 'White-label (remove branding)' },
];

/** Shown only when the plans API is unreachable. No numbers, by design. */
const PLACEHOLDERS = [
  { name: 'Starter', blurb: 'For getting your first campaigns out.' },
  { name: 'Professional', blurb: 'For growing teams that send regularly.' },
  { name: 'Business / Agency', blurb: 'For multiple brands and advanced needs.' },
];

export function Pricing() {
  const [cycle, setCycle] = useState<'monthly' | 'yearly'>('monthly');
  const { data, isLoading, isError } = useQuery({
    queryKey: ['public-plans'],
    queryFn: () => api.get<Plan[]>('/plans', undefined),
    retry: 0,
  });
  const plans = (data ?? []).filter((p) => p.isPublic !== false && p.isActive !== false).sort((a, b) => a.sortOrder - b.sortOrder);
  const hasYearly = plans.some((p) => p.priceYearly > 0);

  return (
    <Section id="pricing">
      <Heading eyebrow="Pricing" title="A Plan for Every Stage of Growth" copy="Compare limits and features across plans. Billing intervals and plan restrictions are shown on each plan." />
      {hasYearly && (
        <div className="mt-8 flex justify-center">
          <div role="group" aria-label="Billing interval" className="inline-flex rounded-xl border border-hm-line bg-hm-bg p-1">
            {(['monthly', 'yearly'] as const).map((c) => (
              <button key={c} type="button" aria-pressed={cycle === c} onClick={() => setCycle(c)}
                className={cn('rounded-lg px-4 py-2 text-sm font-medium capitalize transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-hm-red', cycle === c ? 'bg-white text-hm-ink shadow-sm' : 'text-hm-gray hover:text-hm-ink')}>{c}</button>
            ))}
          </div>
        </div>
      )}

      {isLoading && (
        <div className="mt-12 grid gap-5 md:grid-cols-3" aria-busy="true" aria-label="Loading plans">
          {[0, 1, 2].map((i) => <div key={i} className="h-[420px] animate-pulse rounded-2xl bg-hm-bg" />)}
        </div>
      )}

      {!isLoading && plans.length > 0 && (
        <ul className={cn('mt-12 grid gap-5', plans.length >= 4 ? 'md:grid-cols-2 xl:grid-cols-4' : 'md:grid-cols-3')}>
          {plans.map((p, idx) => {
            const price = cycle === 'yearly' ? p.priceYearly : p.priceMonthly;
            const featured = plans.length > 2 && idx === 1;
            return (
              <li key={p.id} className={cn('flex flex-col rounded-2xl border bg-white p-6', featured ? 'border-hm-red shadow-[0_12px_32px_-16px_rgba(243,39,53,.45)]' : 'border-hm-line')}>
                <h3 className="text-lg font-semibold text-hm-ink">{p.name}</h3>
                {p.description && <p className="mt-1 min-h-[40px] text-sm text-hm-gray">{p.description}</p>}
                <p className="mt-4 text-4xl font-semibold tracking-tight text-hm-ink">
                  {price ? formatMoney(price, p.currency) : 'Free'}
                  {!!price && <span className="text-sm font-normal text-hm-gray"> / {cycle === 'yearly' ? 'year' : 'month'}</span>}
                </p>
                <Link href={ROUTES.signUp} className={cn(featured ? cta.primary : cta.secondary, 'mt-5 w-full')}>Get started</Link>
                <dl className="mt-6 space-y-2 border-t border-hm-line pt-5 text-sm">
                  {LIMITS.map((l) => (
                    <div key={l.key} className="flex justify-between gap-3"><dt className="text-hm-gray">{l.label}</dt><dd className="font-medium text-hm-ink">{formatLimit(p[l.key] as number)}</dd></div>
                  ))}
                </dl>
                <ul className="mt-5 space-y-2 border-t border-hm-line pt-5 text-sm">
                  {FLAGS.map((f) => {
                    const on = !!p[f.key];
                    return (
                      <li key={f.key} className={cn('flex items-center gap-2', on ? 'text-hm-ink' : 'text-hm-gray/70')}>
                        {on ? <Check className="h-4 w-4 text-hm-red" aria-label="Included" /> : <Minus className="h-4 w-4" aria-label="Not included" />}{f.label}
                      </li>
                    );
                  })}
                </ul>
              </li>
            );
          })}
        </ul>
      )}

      {!isLoading && plans.length === 0 && (
        <div className="mt-12">
          <ul className="grid gap-5 md:grid-cols-3">
            {PLACEHOLDERS.map((p) => (
              <li key={p.name} className="rounded-2xl border border-dashed border-hm-line bg-hm-bg p-6">
                <h3 className="text-lg font-semibold text-hm-ink">{p.name}</h3>
                <p className="mt-1 text-sm text-hm-gray">{p.blurb}</p>
                <p className="mt-5 text-sm font-medium text-hm-ink">Pricing and limits configured per plan</p>
                <p className="mt-2 text-xs text-hm-gray">Plan details can include campaign and contact limits, team seats, AI usage, workspaces and sender identities, API access, white-label and support level.</p>
              </li>
            ))}
          </ul>
          <p className="mt-4 text-center text-xs text-hm-gray">{isError ? 'Live plan data is unavailable right now.' : 'No public plans are published yet.'} Placeholders shown — no prices implied.</p>
        </div>
      )}

      <div className="mt-10 text-center"><Link href={ROUTES.signUp} className={cta.link}>Compare Plans <ArrowRight className="h-4 w-4" /></Link></div>
    </Section>
  );
}
