'use client';
import Link from 'next/link';
import { useState } from 'react';
import { ArrowRight, ArrowUp, ChevronDown, HelpCircle, Mail, Rocket, ShieldCheck, Sparkles, Users, Zap } from 'lucide-react';
import { EXTERNAL, ROUTES } from '@/config/landing';
import { FAQS } from '@/config/faqs';
import { cn } from '@/lib/utils';
import { cta, Heading, Section } from './ui';
import { Logo } from './logo';
import { DemoButton } from './demo';
import { Reveal } from './motion';

/* ───────────────────────── FAQ ───────────────────────── */

export function Faq() {
  const [open, setOpen] = useState<number | null>(0);
  return (
    <Section id="faq" className="relative overflow-hidden bg-gradient-to-b from-white to-red-50/40">
      <div aria-hidden className="pointer-events-none absolute -right-24 top-10 h-72 w-72 rounded-full bg-red-100/60 blur-3xl" />
      <div className="relative grid gap-12 lg:grid-cols-[360px_1fr] lg:gap-16">
        {/* left */}
        <div className="lg:sticky lg:top-24 lg:self-start">
          <Heading eyebrow="FAQ" title="Questions, Answered" copy="Everything you need to know before you start sending. Can't find it here? Talk to us." center={false} />
          <Reveal className="mt-8 rounded-2xl border border-red-100 bg-white p-5 shadow-[0_12px_32px_-16px_rgba(225,29,38,.25)]">
            <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-red-50 text-hm-red"><HelpCircle className="h-5 w-5" /></span>
            <p className="mt-4 font-semibold text-hm-ink">Still have questions?</p>
            <p className="mt-1 text-sm leading-relaxed text-hm-gray">Book a free demo and we&apos;ll walk you through HoverMail.</p>
            <div className="mt-4 flex flex-wrap items-center gap-4">
              <DemoButton>Get a Free Demo</DemoButton>
              {EXTERNAL.support && (
                <a href={EXTERNAL.support} target="_blank" rel="noopener noreferrer" className={cta.link}>
                  Help &amp; support <ArrowRight className="h-4 w-4" />
                </a>
              )}
            </div>
          </Reveal>
        </div>

        {/* right */}
        <div className="space-y-3">
          {FAQS.map(([q, a], i) => {
            const isOpen = open === i;
            return (
              <div
                key={q}
                className={cn(
                  'overflow-hidden rounded-2xl border bg-white transition-shadow',
                  isOpen ? 'border-red-200 shadow-[0_12px_32px_-16px_rgba(225,29,38,.3)]' : 'border-hm-line hover:border-hm-ink/20',
                )}
              >
                <h3>
                  <button
                    type="button"
                    id={`faq-q-${i}`}
                    aria-expanded={isOpen}
                    aria-controls={`faq-a-${i}`}
                    onClick={() => setOpen(isOpen ? null : i)}
                    className="flex w-full items-center gap-4 px-5 py-4 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-hm-red sm:px-6 sm:py-5"
                  >
                    <span className={cn('flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-bold transition-colors', isOpen ? 'bg-hm-red text-white' : 'bg-hm-bg text-hm-gray')} aria-hidden="true">
                      {String(i + 1).padStart(2, '0')}
                    </span>
                    <span className={cn('flex-1 text-[15px] font-semibold sm:text-base', isOpen ? 'text-hm-ink' : 'text-hm-ink/85')}>{q}</span>
                    <ChevronDown className={cn('h-5 w-5 shrink-0 transition-transform duration-200', isOpen ? 'rotate-180 text-hm-red' : 'text-hm-gray')} aria-hidden="true" />
                  </button>
                </h3>
                <div id={`faq-a-${i}`} role="region" aria-labelledby={`faq-q-${i}`} hidden={!isOpen} className="px-5 pb-5 pl-[4.25rem] pr-6 text-[15px] leading-relaxed text-hm-gray sm:pl-[4.75rem]">
                  {a}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </Section>
  );
}

/* ───────────────────────── FINAL CTA ───────────────────────── */

const CTA_POINTS = [
  { i: Sparkles, t: 'AI-assisted drafts' },
  { i: Zap, t: 'Queued sending at scale' },
  { i: Users, t: 'Built for teams' },
];

export function FinalCta() {
  return (
    <section className="bg-white px-5 py-16 sm:px-8 sm:py-24">
      <Reveal className="relative mx-auto max-w-[1200px] overflow-hidden rounded-[2rem] bg-gradient-to-br from-[#E8202B] via-[#C01822] to-[#7A0B12] px-6 py-16 text-center text-white shadow-[0_30px_80px_-30px_rgba(225,29,38,.55)] sm:px-12 sm:py-20">
        {/* decoration */}
        <div aria-hidden className="pointer-events-none absolute -right-32 -top-32 h-[420px] w-[420px] rotate-45 bg-white/[0.06]" />
        <div aria-hidden className="pointer-events-none absolute -bottom-40 -left-24 h-[420px] w-[420px] rounded-full bg-black/15 blur-3xl" />
        <Mail aria-hidden className="pointer-events-none absolute left-8 top-10 hidden h-16 w-16 -rotate-12 text-white/10 md:block" />
        <Rocket aria-hidden className="pointer-events-none absolute bottom-10 right-10 hidden h-20 w-20 rotate-12 text-white/10 md:block" />

        <div className="relative mx-auto max-w-3xl">
          <span className="inline-flex items-center gap-2 rounded-full border border-white/30 bg-white/10 px-4 py-1.5 text-xs font-semibold uppercase tracking-[0.12em]">
            <Zap className="h-3.5 w-3.5" fill="currentColor" aria-hidden="true" /> Get started today
          </span>
          <h2 className="mt-6 text-balance text-3xl font-extrabold tracking-tight sm:text-5xl sm:leading-[1.1]">
            Your Next Great Email Campaign Starts Here.
          </h2>
          <p className="mx-auto mt-5 max-w-xl text-lg leading-relaxed text-white/80">
            Create, launch, and understand your email campaigns with a workspace built to keep things simple.
          </p>

          <div className="mt-9 flex flex-col items-center justify-center gap-4 sm:flex-row">
            <Link
              href={ROUTES.signUp}
              className="inline-flex h-12 items-center justify-center gap-2 rounded-xl bg-white px-7 text-[15px] font-semibold text-hm-red shadow-lg transition hover:bg-red-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-[#C01822] active:scale-[0.98]"
            >
              Start Creating for Free <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </Link>
            <DemoButton variant="dark">Get a Free Demo</DemoButton>
          </div>

          <ul className="mt-10 flex flex-wrap items-center justify-center gap-x-8 gap-y-3 text-sm text-white/80">
            {CTA_POINTS.map(({ i: Icon, t }) => (
              <li key={t} className="inline-flex items-center gap-2"><Icon className="h-4 w-4" aria-hidden="true" />{t}</li>
            ))}
          </ul>

          <a href="#features" className="mt-8 inline-block rounded text-[15px] font-semibold text-white/85 underline-offset-4 hover:text-white hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white">
            Explore Features
          </a>
        </div>
      </Reveal>
    </section>
  );
}

/* ───────────────────────── FOOTER ───────────────────────── */

function FootLink({ href, children, external }: { href?: string; children: React.ReactNode; external?: boolean }) {
  const cls =
    'group inline-flex items-center gap-1 rounded text-sm text-white/65 transition hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white';
  if (!href) return <span className="text-sm text-white/35">{children}</span>;
  const inner = (
    <>
      <span className="h-px w-0 bg-hm-red transition-all group-hover:w-2.5" aria-hidden="true" />
      {children}
    </>
  );
  if (external) return <a href={href} className={cls} target="_blank" rel="noopener noreferrer">{inner}</a>;
  return href.startsWith('#') || href.startsWith('/docs')
    ? <a href={href} className={cls}>{inner}</a>
    : <Link href={href} className={cls}>{inner}</Link>;
}

const TRUST = [
  { i: ShieldCheck, t: 'Secure & Reliable', d: 'Your data is always safe with us.' },
  { i: Zap, t: 'Lightning Fast', d: 'Built for speed and performance.' },
  { i: Sparkles, t: 'Easy to Use', d: 'No technical skills needed.' },
  { i: Users, t: 'Built for Teams', d: 'Collaborate and get more done.' },
];

export function Footer() {
  return (
    <footer className="relative overflow-hidden bg-hm-ink text-white">
      {/* red accent line + glow */}
      <div aria-hidden className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-hm-red to-transparent" />
      <div aria-hidden className="pointer-events-none absolute -top-40 left-1/2 h-72 w-[600px] -translate-x-1/2 rounded-full bg-hm-red/20 blur-3xl" />

      <div className="relative mx-auto w-full max-w-[1200px] px-5 pt-16 sm:px-8">
        {/* trust strip */}
        <ul className="grid gap-5 rounded-2xl border border-white/10 bg-white/[0.03] p-5 sm:grid-cols-2 lg:grid-cols-4 lg:divide-x lg:divide-white/10">
          {TRUST.map(({ i: Icon, t, d }) => (
            <li key={t} className="flex items-start gap-3 lg:px-4">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-hm-red/15 text-hm-red"><Icon className="h-5 w-5" aria-hidden="true" /></span>
              <span><span className="block text-sm font-semibold">{t}</span><span className="block text-xs leading-snug text-white/55">{d}</span></span>
            </li>
          ))}
        </ul>

        {/* columns */}
        <div className="mt-14 grid gap-10 md:grid-cols-5">
          <div className="md:col-span-2">
            <Logo dark />
            <p className="mt-4 max-w-xs text-sm leading-relaxed text-white/60">
              Create, personalize, automate and analyze email campaigns from one simple workspace.
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <Link href={ROUTES.signUp} className="inline-flex h-10 items-center gap-2 rounded-lg bg-hm-red px-4 text-sm font-semibold text-white transition hover:bg-hm-red-dark focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white">
                Get Started <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </Link>
              <Link href={ROUTES.signIn} className="inline-flex h-10 items-center rounded-lg border border-white/20 px-4 text-sm font-semibold text-white/90 transition hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white">
                Sign In
              </Link>
            </div>
          </div>

          <nav aria-label="Product">
            <p className="mb-4 text-xs font-semibold uppercase tracking-[0.14em] text-white/90">Product</p>
            <ul className="space-y-3">
              <li><FootLink href="#features">Features</FootLink></li>
              <li><FootLink href="#templates">Templates</FootLink></li>
              <li><FootLink href="#pricing">Pricing</FootLink></li>
              <li><FootLink href="#demo">Free demo</FootLink></li>
              <li><FootLink href={ROUTES.apiDocs}>API documentation</FootLink></li>
            </ul>
          </nav>

          <nav aria-label="Support">
            <p className="mb-4 text-xs font-semibold uppercase tracking-[0.14em] text-white/90">Support</p>
            <ul className="space-y-3">
              <li><FootLink href={EXTERNAL.support} external>Help &amp; support</FootLink></li>
              <li><FootLink href={EXTERNAL.privacy} external>Privacy Policy</FootLink></li>
              <li><FootLink href={EXTERNAL.terms} external>Terms of Service</FootLink></li>
            </ul>
          </nav>

          <nav aria-label="Company">
            <p className="mb-4 text-xs font-semibold uppercase tracking-[0.14em] text-white/90">Company</p>
            <ul className="space-y-3">
              <li><FootLink href={EXTERNAL.company} external>{EXTERNAL.companyName ?? 'About'}</FootLink></li>
              <li><FootLink href={ROUTES.signIn}>Sign In</FootLink></li>
            </ul>
          </nav>
        </div>

        {/* bottom bar */}
        <div className="mt-14 flex flex-col items-center justify-between gap-4 border-t border-white/10 py-6 text-xs text-white/45 sm:flex-row">
          <p>© {new Date().getFullYear()} {EXTERNAL.companyName ?? 'HoverMail'}. All rights reserved.</p>
          <div className="flex items-center gap-5">
            <FootLink href={EXTERNAL.privacy} external>Privacy</FootLink>
            <FootLink href={EXTERNAL.terms} external>Terms</FootLink>
            <a
              href="#top"
              className="inline-flex items-center gap-1.5 rounded-full border border-white/15 px-3 py-1.5 text-white/70 transition hover:border-white/40 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
            >
              Back to top <ArrowUp className="h-3.5 w-3.5" aria-hidden="true" />
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}