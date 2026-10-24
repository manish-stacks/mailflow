import Link from 'next/link';
import { ArrowRight, BarChart3, CheckCircle2, LayoutDashboard, Send, Sparkles, Users } from 'lucide-react';
import { ROUTES } from '@/config/landing';
import { cta, Illustrative, Tag, Window } from './ui';
import { MiniChart } from './charts';
import { Float, HeroIn, ScrollPreview } from './motion';
import { DemoButton, HeroEmailInput } from './demo';

function Stat({ label, value, delta }: { label: string; value: string; delta: string }) {
  return (
    <div className="rounded-xl border border-hm-line bg-white p-3">
      <p className="text-[11px] font-medium text-hm-gray">{label}</p>
      <p className="mt-1 text-xl font-semibold tracking-tight text-hm-ink">{value}</p>
      <p className="text-[11px] text-emerald-600">{delta}</p>
    </div>
  );
}

export function DashboardMock() {
  return (
    <Window title="app.hovermail.com / dashboard">
      <div className="flex min-h-[420px]">
        <div className="hidden w-44 shrink-0 border-r border-hm-line bg-white p-3 sm:block">
          <div className="space-y-1 text-xs font-medium text-hm-gray">
            {[[LayoutDashboard, 'Dashboard', true], [Send, 'Campaigns'], [Users, 'Contacts'], [BarChart3, 'Analytics']].map(([I, l, a]: any) => (
              <div key={l} className={`flex items-center gap-2 rounded-lg px-2.5 py-2 ${a ? 'bg-red-50 text-hm-red' : ''}`}><I className="h-3.5 w-3.5" />{l}</div>
            ))}
          </div>
          <div className="mt-5 rounded-lg bg-hm-red px-3 py-2 text-center text-xs font-semibold text-white">+ New Campaign</div>
        </div>
        <div className="min-w-0 flex-1 space-y-3 bg-hm-bg p-4">
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            <Stat label="Emails sent" value="24,810" delta="▲ vs last month" />
            <Stat label="Open rate" value="42.3%" delta="▲ 2.1 pts" />
            <Stat label="Click rate" value="6.8%" delta="▲ 0.9 pts" />
            <Stat label="Active subscribers" value="8,420" delta="▲ new this month" />
          </div>
          <div className="grid gap-3 lg:grid-cols-5">
            <div className="rounded-xl border border-hm-line bg-white p-3 lg:col-span-3">
              <div className="mb-2 flex items-center justify-between"><p className="text-xs font-semibold text-hm-ink">Campaign performance</p><span className="text-[11px] text-hm-gray">Last 7 sends</span></div>
              <MiniChart labels={['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']} series={[
                { name: 'Opens', color: '#F32735', area: true, data: [18, 24, 31, 28, 40, 36, 44] },
                { name: 'Clicks', color: '#171717', data: [4, 7, 9, 8, 12, 10, 14] },
              ]} height={150} />
            </div>
            <div className="rounded-xl border border-hm-line bg-white p-3 lg:col-span-2">
              <p className="mb-2 flex items-center gap-1.5 text-xs font-semibold text-hm-ink"><Sparkles className="h-3.5 w-3.5 text-hm-red" /> AI campaign summary</p>
              <p className="text-[12px] leading-relaxed text-hm-gray">Clicks rose compared with your previous send. Try a clearer call to action next time.</p>
              <div className="mt-3"><Tag tone="amber">Sample insight</Tag></div>
            </div>
          </div>
          <div className="grid gap-3 lg:grid-cols-5">
            <div className="rounded-xl border border-hm-line bg-white p-3 lg:col-span-3">
              <p className="mb-2 text-xs font-semibold text-hm-ink">Recent campaigns</p>
              {[['Spring collection launch', 'Completed', 'green'], ['Monthly newsletter', 'Scheduled', 'amber'], ['Welcome series', 'Draft', 'gray']].map(([n, s, t]: any) => (
                <div key={n} className="flex items-center justify-between border-t border-hm-line py-2 first:border-0"><span className="truncate text-xs text-hm-ink">{n}</span><Tag tone={t}>{s}</Tag></div>
              ))}
            </div>
            <div className="rounded-xl border border-hm-line bg-white p-3 lg:col-span-2">
              <p className="mb-2 text-xs font-semibold text-hm-ink">Audience</p>
              {[['Newsletter list', '5,120'], ['Segment: engaged', '2,340'], ['Segment: new', '960']].map(([n, c]) => (
                <div key={n} className="flex items-center justify-between py-1.5 text-xs"><span className="text-hm-gray">{n}</span><span className="font-medium text-hm-ink">{c}</span></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </Window>
  );
}

export function Hero() {
  return (
    <section className="relative overflow-hidden bg-white pb-20 pt-14 sm:pt-20">
      <div className="pointer-events-none absolute inset-0" aria-hidden="true">
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#E5E7EB55_1px,transparent_1px),linear-gradient(to_bottom,#E5E7EB55_1px,transparent_1px)] bg-[size:56px_56px] [mask-image:radial-gradient(ellipse_70%_60%_at_50%_0%,#000_30%,transparent_75%)]" />
        <div className="absolute left-1/2 top-[-120px] h-[380px] w-[760px] -translate-x-1/2 rounded-full bg-hm-red/10 blur-3xl" />
      </div>
      <div className="relative mx-auto w-full max-w-[1200px] px-5 sm:px-8">
        <div className="mx-auto max-w-3xl text-center">
          <HeroIn>
            <a href="#ai" className="mb-6 inline-flex items-center gap-2 rounded-full border border-hm-line bg-white px-3.5 py-1.5 text-xs font-semibold uppercase tracking-[0.12em] text-hm-red shadow-sm transition hover:border-hm-red/40">
              <Sparkles className="h-3.5 w-3.5" aria-hidden="true" /> Email marketing, simplified
            </a>
          </HeroIn>
          <HeroIn delay={0.08}>
            <h1 className="text-balance text-4xl font-extrabold tracking-tight text-hm-ink sm:text-6xl sm:leading-[1.04] lg:text-7xl">
              Create Better Emails. <span className="text-hm-red">Launch Faster.</span> Grow Smarter.
            </h1>
          </HeroIn>
          <HeroIn delay={0.16}>
            <p className="mx-auto mt-6 max-w-2xl text-pretty text-lg leading-relaxed text-hm-gray sm:text-xl">
              Build beautiful email campaigns, organize your audience, and turn insights into action with AI-powered tools — all from one simple workspace.
            </p>
          </HeroIn>
          <HeroIn delay={0.24} className="mt-9 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Link href={ROUTES.signUp} className={cta.primary}>Start Creating for Free <ArrowRight className="h-4 w-4" /></Link>
            <DemoButton>Get a Free Demo</DemoButton>
          </HeroIn>
          <HeroIn delay={0.32} className="mt-6">
            <p className="mb-3 text-sm text-hm-gray">Or have us walk you through it — leave your email:</p>
            <HeroEmailInput />
            <p className="mt-1 text-sm text-hm-gray">Powerful campaign tools. Simple setup. Your brand, your way. <a href="#features" className="font-semibold text-hm-ink underline-offset-4 hover:underline">Explore features</a></p>
          </HeroIn>
        </div>

        <div className="relative mx-auto mt-16 max-w-[1080px]">
          <ScrollPreview><DashboardMock /></ScrollPreview>
          <Float className="absolute -left-3 top-24 hidden lg:block xl:-left-14" delay={0.2}>
            <div className="flex items-center gap-3 rounded-xl border border-hm-line bg-white px-4 py-3 shadow-lg">
              <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600"><CheckCircle2 className="h-5 w-5" /></span>
              <div className="text-left"><p className="text-sm font-semibold text-hm-ink">Campaign sent</p><p className="text-xs text-hm-gray">Spring collection launch</p></div>
            </div>
          </Float>
          <Float className="absolute -right-3 bottom-28 hidden lg:block xl:-right-14" delay={1.4}>
            <div className="flex items-center gap-3 rounded-xl border border-hm-line bg-white px-4 py-3 shadow-lg">
              <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-red-50 text-hm-red"><Sparkles className="h-5 w-5" /></span>
              <div className="text-left"><p className="text-sm font-semibold text-hm-ink">AI draft ready</p><p className="text-xs text-hm-gray">Review &amp; edit before sending</p></div>
            </div>
          </Float>
          <Illustrative>Product preview with illustrative sample data — not real customer results.</Illustrative>
        </div>
      </div>
    </section>
  );
}
