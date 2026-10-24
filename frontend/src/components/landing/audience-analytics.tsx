import Link from 'next/link';
import { ArrowRight, Filter, Search, ShieldCheck, Sparkles, Upload } from 'lucide-react';
import { ROUTES } from '@/config/landing';
import { cta, Heading, Illustrative, Section, Tag, Window } from './ui';
import { MiniChart } from './charts';

const CONTACTS = [
  ['Alex Morgan', 'alex@example.com', 'Active', 'green'],
  ['Priya Shah', 'priya@example.com', 'Active', 'green'],
  ['Sam Rivera', 'sam@example.com', 'Unsubscribed', 'gray'],
  ['Jordan Lee', 'jordan@example.com', 'Bounced', 'red'],
  ['Taylor Kim', 'taylor@example.com', 'Active', 'green'],
] as const;

export function AudienceSection() {
  return (
    <Section id="audience">
      <div className="grid items-center gap-12 lg:grid-cols-5">
        <div className="lg:col-span-2">
          <Heading center={false} eyebrow="Audience" title="The Right Message for the Right Audience" copy="Keep your audience organized and create more relevant campaigns with structured lists and targeted segments." />
          <ul className="mt-7 space-y-3 text-[15px] text-hm-gray">
            {['Import contacts from CSV', 'Organize contacts into lists', 'Build rule-based segments (plan-dependent)', 'Search, filter and review each contact'].map((t) => (
              <li key={t} className="flex items-start gap-2.5"><span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-hm-red" />{t}</li>
            ))}
          </ul>
          <div className="mt-7 flex items-start gap-3 rounded-xl border border-hm-line bg-hm-bg p-4 text-sm leading-relaxed text-hm-gray">
            <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-hm-red" />
            <p>Send only to people who have agreed to hear from you. HoverMail supports unsubscribe links, status tracking and a suppression list so unsubscribed, bounced and suppressed contacts are respected.</p>
          </div>
          <div className="mt-7"><Link href={ROUTES.contacts} className={cta.link}>Manage contacts <ArrowRight className="h-4 w-4" /></Link></div>
        </div>
        <div className="lg:col-span-3">
          <Window title="Contacts">
            <div className="grid sm:grid-cols-[170px_1fr]">
              <div className="hidden border-r border-hm-line bg-hm-bg p-3 text-xs sm:block">
                <p className="mb-2 font-semibold text-hm-ink">Lists</p>
                {['Newsletter · 5,120', 'Customers · 1,840', 'Event guests · 460'].map((l, i) => <p key={l} className={`rounded-md px-2 py-1.5 ${i === 0 ? 'bg-white font-medium text-hm-ink shadow-sm' : 'text-hm-gray'}`}>{l}</p>)}
                <p className="mb-2 mt-4 font-semibold text-hm-ink">Segments</p>
                {['Engaged', 'New this month'].map((l) => <p key={l} className="px-2 py-1.5 text-hm-gray">{l}</p>)}
              </div>
              <div className="p-4">
                <div className="flex flex-wrap items-center gap-2">
                  <div className="flex h-9 min-w-0 flex-1 items-center gap-2 rounded-lg border border-hm-line px-3 text-xs text-hm-gray"><Search className="h-3.5 w-3.5" />Search contacts</div>
                  <div className="flex h-9 items-center gap-1.5 rounded-lg border border-hm-line px-3 text-xs text-hm-ink"><Filter className="h-3.5 w-3.5" />Filter</div>
                  <div className="flex h-9 items-center gap-1.5 rounded-lg bg-hm-ink px-3 text-xs font-semibold text-white"><Upload className="h-3.5 w-3.5" />Import</div>
                </div>
                <div className="mt-3 divide-y divide-hm-line rounded-lg border border-hm-line">
                  {CONTACTS.map(([n, e, s, t]) => (
                    <div key={e} className="flex items-center justify-between gap-2 px-3 py-2.5">
                      <div className="min-w-0"><p className="truncate text-xs font-medium text-hm-ink">{n}</p><p className="truncate text-[11px] text-hm-gray">{e}</p></div>
                      <Tag tone={t as any}>{s}</Tag>
                    </div>
                  ))}
                </div>
                <div className="mt-3 rounded-lg border border-hm-line bg-hm-bg p-3 text-xs"><p className="font-semibold text-hm-ink">Contact preview · Alex Morgan</p><p className="mt-1 text-hm-gray">Lists: Newsletter · Status: Active · Custom attributes supported</p></div>
              </div>
            </div>
          </Window>
          <Illustrative>Sample contacts (example.com addresses) for illustration.</Illustrative>
        </div>
      </div>
    </Section>
  );
}

const KPIS = [['Emails sent', '12,500'], ['Delivery rate', '98.4%'], ['Open rate', '41.7%'], ['Click rate', '6.2%'], ['Bounce rate', '1.6%'], ['Unsubscribes', '38']];

export function AnalyticsSection() {
  return (
    <Section id="analytics" tone="gray">
      <Heading eyebrow="Analytics" title="Understand Every Campaign. Know What to Do Next." copy="Track the metrics that matter and see how each send performs over time." />
      <div className="mx-auto mt-14 max-w-[1040px]">
        <Window title="Campaign analytics">
          <div className="bg-hm-bg p-4 sm:p-5">
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
              {KPIS.map(([l, v]) => <div key={l} className="rounded-xl border border-hm-line bg-white p-3"><p className="text-[11px] text-hm-gray">{l}</p><p className="mt-1 text-lg font-semibold tracking-tight text-hm-ink">{v}</p></div>)}
            </div>
            <div className="mt-3 grid gap-3 lg:grid-cols-3">
              <div className="rounded-xl border border-hm-line bg-white p-4 lg:col-span-2">
                <div className="mb-2 flex items-center justify-between text-xs"><p className="font-semibold text-hm-ink">Performance over time</p>
                  <span className="flex gap-3 text-hm-gray"><span className="flex items-center gap-1"><i className="h-2 w-2 rounded-full bg-hm-red" />Opens</span><span className="flex items-center gap-1"><i className="h-2 w-2 rounded-full bg-hm-ink" />Clicks</span></span></div>
                <MiniChart height={190} labels={['Day 1', 'Day 2', 'Day 3', 'Day 4', 'Day 5', 'Day 6', 'Day 7']} series={[
                  { name: 'o', color: '#F32735', area: true, data: [900, 1500, 1100, 800, 600, 450, 300] },
                  { name: 'c', color: '#171717', data: [120, 260, 210, 150, 110, 80, 60] },
                ]} />
              </div>
              <div className="rounded-xl border border-hm-line bg-white p-4">
                <p className="flex items-center gap-1.5 text-xs font-semibold text-hm-ink"><Sparkles className="h-3.5 w-3.5 text-hm-red" />AI insights</p>
                <p className="mt-3 text-sm leading-relaxed text-hm-gray">Your campaign received more clicks than the previous campaign. Consider testing a clearer call to action in your next send.</p>
                <div className="mt-4 flex flex-wrap gap-2"><Tag tone="amber">Sample summary</Tag><Tag tone="amber">Coming soon</Tag></div>
              </div>
            </div>
          </div>
        </Window>
        <Illustrative>All figures above are illustrative demo data, not HoverMail customer results. Core analytics are available today; AI-written summaries are planned and not yet released.</Illustrative>
        <div className="mt-8 text-center"><Link href={ROUTES.analytics} className={cta.link}>Discover Campaign Analytics <ArrowRight className="h-4 w-4" /></Link></div>
      </div>
    </Section>
  );
}
