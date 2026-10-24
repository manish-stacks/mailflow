import { ArrowRight, BarChart3, Building2, Check, Clock, Code2, FileText, LayoutTemplate, Mail, PenLine, Palette, Rocket, ShieldCheck, Sparkles, Target, TrendingUp, UserCog, Users, Zap } from 'lucide-react';
import { Float, Item, Reveal, Stagger } from './motion';
import { Tag } from './ui';

type Tone = 'red' | 'blue' | 'green' | 'amber' | 'sky' | 'teal' | 'rose' | 'orange';
/** Full class strings so Tailwind can see them. */
const TONES: Record<Tone, { card: string; icon: string; check: string }> = {
  red: { card: 'border-red-100 bg-gradient-to-br from-red-50/80 via-white to-white', icon: 'bg-hm-red', check: 'text-hm-red' },
  blue: { card: 'border-blue-100 bg-gradient-to-br from-blue-50/80 via-white to-white', icon: 'bg-blue-500', check: 'text-blue-600' },
  green: { card: 'border-emerald-100 bg-gradient-to-br from-emerald-50/80 via-white to-white', icon: 'bg-emerald-500', check: 'text-emerald-600' },
  amber: { card: 'border-amber-100 bg-gradient-to-br from-amber-50/80 via-white to-white', icon: 'bg-amber-500', check: 'text-amber-600' },
  sky: { card: 'border-sky-100 bg-gradient-to-br from-sky-50/80 via-white to-white', icon: 'bg-sky-500', check: 'text-sky-600' },
  teal: { card: 'border-teal-100 bg-gradient-to-br from-teal-50/80 via-white to-white', icon: 'bg-teal-500', check: 'text-teal-600' },
  rose: { card: 'border-rose-100 bg-gradient-to-br from-rose-50/80 via-white to-white', icon: 'bg-rose-500', check: 'text-rose-600' },
  orange: { card: 'border-orange-100 bg-gradient-to-br from-orange-50/80 via-white to-white', icon: 'bg-orange-500', check: 'text-orange-600' },
};

type Status = 'plan' | 'soon' | undefined;
type Feature = { icon: any; title: string; tone: Tone; href: string; desc: string; points: string[]; status?: Status; note?: string; illo: string };

const FEATURES: Feature[] = [
  { icon: Mail, title: 'Campaign Management', tone: 'red', href: '#features', illo: 'campaign', desc: 'Create, schedule, pause and manage email campaigns. Monitor status and performance in one place.', points: ['Easy campaign creation', 'Schedule and pause sends', 'Status at a glance'] },
  { icon: LayoutTemplate, title: 'Flexible Email Template Builder', tone: 'blue', href: '#templates', illo: 'builder', desc: 'Design professional emails with a drag-and-drop block builder, or write your own HTML.', points: ['Drag & drop blocks', 'Save reusable templates', 'Custom HTML support'] },
  { icon: Sparkles, title: 'AI Email Assistant', tone: 'green', href: '#ai', illo: 'ai', status: 'plan', desc: 'Describe your product, audience and goal — get a draft subject, preview text, body and CTA.', points: ['Smart content drafts', 'Choose your tone', 'Edit before you send'], note: 'AI credits depend on your plan.' },
  { icon: FileText, title: 'Ready-to-Use Templates', tone: 'sky', href: '#templates', illo: 'templates', desc: 'Start from starter templates for newsletters, promotions and announcements, then make them yours.', points: ['Starter templates', 'Fully customizable', 'Save your own'], note: 'You remain responsible for content and sending requirements.' },
  { icon: Users, title: 'Contacts & Segmentation', tone: 'blue', href: '#audience', illo: 'contacts', status: 'plan', desc: 'Import contacts from CSV, organize lists and build rule-based segments for targeted sends.', points: ['CSV import', 'Lists & segments', 'Unsubscribes respected'], note: 'Dynamic segments depend on your plan.' },
  { icon: BarChart3, title: 'Campaign Analytics', tone: 'rose', href: '#analytics', illo: 'analytics', desc: 'Track delivery, opens, clicks, bounces and unsubscribes, and see results over time.', points: ['Visual reports', 'Performance over time', 'AI summaries — coming soon'] },
  { icon: UserCog, title: 'Team Management', tone: 'green', href: '#team', illo: 'team', desc: 'Invite teammates with Owner, Admin, Editor or Viewer roles and collaborate with controlled access.', points: ['Role-based access', 'Shared workspace', 'Keep your team in sync'], note: 'Team seats depend on your plan.' },
  { icon: Building2, title: 'Multiple Senders & Workspaces', tone: 'amber', href: '#team', illo: 'senders', status: 'plan', desc: 'Manage workspaces, sender identities and sending domains from one login.', points: ['Multiple senders', 'DNS domain verification', 'Separate workspaces'], note: 'Limits depend on your plan.' },
  { icon: Code2, title: 'Developer API Access', tone: 'teal', href: '#developers', illo: 'api', status: 'plan', desc: 'Use API keys to connect campaigns, contacts and lists to your own apps and workflows.', points: ['REST API', 'Key-based auth', 'Documentation included'], note: 'Eligible plans only.' },
  { icon: PenLine, title: 'AI Writing Assistant', tone: 'orange', href: '#ai', illo: 'writing', status: 'plan', desc: 'Rewrite subject lines and copy — shorter, more professional and more — in seconds.', points: ['Rewrite copy', 'Improve subject lines', 'Always editable'], note: 'Depends on your plan.' },
  { icon: Palette, title: 'White-Label Experience', tone: 'red', href: '#white-label', illo: 'white', status: 'plan', desc: 'Eligible plans can remove HoverMail branding from emails for a consistent brand experience.', points: ['No HoverMail branding', 'Your brand, your emails', 'Plan-based option'], note: 'Not included on every plan.' },
  { icon: Zap, title: 'Guided Setup', tone: 'sky', href: '#how-it-works', illo: 'setup', desc: 'Add a sender, verify your domain, import contacts and send. Verification must be done before your first campaign.', points: ['Sender identities', 'Domain verification', 'CSV import'] },
];

/* ---- tiny CSS product illustrations (decorative) ---- */
function Illo({ k }: { k: string }) {
  const box = 'absolute bottom-4 right-4 hidden w-[42%] max-w-[150px] rounded-lg border border-hm-line bg-white p-2 shadow-sm sm:block';
  const bar = 'rounded-full bg-hm-line';
  switch (k) {
    case 'campaign': return <div className={box}><div className="mb-1.5 h-1.5 w-8 rounded bg-hm-red" />{[0, 1, 2].map((i) => <div key={i} className="mb-1 flex items-center gap-1"><span className={`h-1.5 flex-1 ${bar}`} /><span className="h-1.5 w-4 rounded-full bg-emerald-300" /></div>)}</div>;
    case 'builder': return <div className={box}><div className="mb-1 h-8 rounded bg-blue-100" /><div className={`mb-1 h-1.5 w-full ${bar}`} /><div className={`mb-1.5 h-1.5 w-2/3 ${bar}`} /><div className="h-2.5 w-10 rounded bg-hm-red" /></div>;
    case 'ai': return <div className="absolute bottom-4 right-5 hidden h-14 w-14 items-center justify-center rounded-2xl bg-emerald-100 text-lg font-extrabold text-emerald-700 sm:flex">AI<Sparkles className="absolute -right-1 -top-1 h-4 w-4 text-emerald-500" /></div>;
    case 'templates': return <div className="absolute bottom-4 right-4 hidden gap-1.5 sm:flex">{[0, 1].map((i) => <div key={i} className="w-12 rounded-md border border-hm-line bg-white p-1 shadow-sm"><div className="mb-1 h-1.5 w-5 rounded bg-hm-red" /><div className="mb-1 h-6 rounded bg-sky-100" /><div className={`h-1 w-full ${bar}`} /></div>)}</div>;
    case 'contacts': return <div className={box}>{[0, 1, 2].map((i) => <div key={i} className="mb-1 flex items-center gap-1.5"><span className="h-3 w-3 rounded-full bg-blue-200" /><span className={`h-1.5 flex-1 ${bar}`} /></div>)}</div>;
    case 'analytics': return <div className={box}><div className="flex h-10 items-end gap-1">{[40, 65, 50, 85, 70, 100].map((h, i) => <span key={i} className="flex-1 rounded-sm bg-hm-red/80" style={{ height: `${h}%` }} />)}</div></div>;
    case 'team': return <div className={box}>{[0, 1, 2].map((i) => <div key={i} className="mb-1 flex items-center gap-1.5"><span className="h-3 w-3 rounded-full bg-emerald-200" /><span className={`h-1.5 flex-1 ${bar}`} /><span className="h-1.5 w-3 rounded bg-hm-line" /></div>)}</div>;
    case 'senders': return <div className={box}><div className="mb-1 text-[8px] text-hm-gray">Sender identities</div>{['brand-one', 'brand-two'].map((d) => <div key={d} className="mb-1 flex items-center gap-1 rounded bg-hm-bg px-1 py-0.5 text-[8px] text-hm-ink"><Check className="h-2 w-2 text-emerald-500" />{d}</div>)}</div>;
    case 'api': return <div className="absolute bottom-4 right-4 hidden w-[46%] max-w-[165px] rounded-lg bg-hm-ink p-2 font-mono text-[8px] leading-tight text-white/80 shadow-sm sm:block"><span className="text-teal-300">GET</span> /api/campaigns<br /><span className="text-white/40">x-api-key: mf_…</span></div>;
    case 'writing': return <div className={box}><div className="mb-1 text-[8px] text-hm-gray">Rewrite</div><div className={`mb-1 h-1.5 w-full ${bar}`} /><div className="mt-1.5 rounded bg-hm-red py-0.5 text-center text-[8px] font-semibold text-white">Improve</div></div>;
    case 'white': return <div className={box}><div className="mb-1 text-[8px] font-semibold text-hm-ink">Your Brand</div><div className="mb-1 h-6 rounded bg-hm-bg" /><div className="h-2 w-8 rounded bg-hm-ink" /></div>;
    default: return <div className={box}>{['Sender', 'Domain', 'Import'].map((s, i) => <div key={s} className="mb-1 flex items-center gap-1 text-[8px] text-hm-ink"><span className="flex h-3 w-3 items-center justify-center rounded-full bg-sky-100 text-[7px] font-bold text-sky-700">{i + 1}</span>{s}</div>)}</div>;
  }
}

const GROWTH = [
  { icon: Clock, title: 'Save Time', text: 'Templates, AI drafts and scheduling in one place' },
  { icon: Target, title: 'Stay Relevant', text: 'Segment and personalize for your audience' },
  { icon: TrendingUp, title: 'Learn Faster', text: 'Use campaign data to plan the next send' },
  { icon: ShieldCheck, title: 'Stay in Control', text: 'Roles, suppression and unsubscribe handling' },
];

export function Features() {
  return (
    <section id="features" className="relative scroll-mt-20 overflow-hidden bg-gradient-to-b from-hm-bg via-white to-white py-20 sm:py-24">
      <div className="mx-auto w-full max-w-[1280px] px-5 sm:px-8">
        {/* header */}
        <div className="relative mx-auto max-w-3xl text-center">
          <Reveal>
            <span className="inline-flex items-center gap-1.5 rounded-full border border-red-100 bg-red-50 px-3.5 py-1.5 text-xs font-semibold text-hm-red"><Zap className="h-3.5 w-3.5" aria-hidden="true" />Powerful Features</span>
            <h2 className="mt-5 text-balance text-4xl font-extrabold tracking-tight text-hm-ink sm:text-5xl sm:leading-[1.08] lg:text-6xl">
              Everything You Need to <span className="block text-hm-red">Run Email Marketing</span>
            </h2>
            <p className="mx-auto mt-5 max-w-2xl text-pretty text-base leading-relaxed text-hm-gray sm:text-lg">
              From your first campaign to advanced marketing workflows, HoverMail brings your entire email operation together.
            </p>
          </Reveal>

          {/* decorative: paper plane (left) + growth card (right) */}
          <Float className="pointer-events-none absolute -left-40 top-2 hidden xl:block" amount={10}>
            <svg width="190" height="130" viewBox="0 0 190 130" fill="none" aria-hidden="true">
              <path d="M10 120C40 100 20 60 60 60s30 40 70 5S150 30 160 22" stroke="#F32735" strokeWidth="1.6" strokeDasharray="4 5" strokeLinecap="round" />
              <path d="m160 8 28-6-14 30-8-10-14-4 28-18-20 16-4 14-2-10Z" fill="#F32735" opacity=".95" />
            </svg>
          </Float>
          <Float className="pointer-events-none absolute -right-52 top-0 hidden xl:block" delay={1} amount={7}>
            <div className="-rotate-6 rounded-xl border border-hm-line bg-white p-3 shadow-lg" aria-hidden="true">
              <div className="flex h-14 w-28 items-end gap-1.5">{[30, 45, 60, 80, 95].map((h, i) => <span key={i} className="flex-1 rounded-sm bg-hm-red" style={{ height: `${h}%`, opacity: 0.45 + i * 0.13 }} />)}</div>
              <p className="mt-2 text-[10px] font-semibold text-hm-ink">More Opens · More Growth</p>
            </div>
          </Float>
        </div>

        {/* cards */}
        <Stagger as="ul" className="mt-14 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {FEATURES.map((f) => {
            const t = TONES[f.tone];
            return (
              <Item as="li" key={f.title} className={`group relative flex min-h-[300px] flex-col overflow-hidden rounded-2xl border p-5 transition duration-300 hover:-translate-y-1 hover:shadow-[0_14px_32px_-14px_rgba(23,23,23,.22)] ${t.card}`}>
                <div className="flex items-start justify-between">
                  <span className={`flex h-12 w-12 items-center justify-center rounded-xl text-white shadow-sm ${t.icon}`}><f.icon className="h-6 w-6" aria-hidden="true" /></span>
                  {f.status === 'plan' && <Tag tone="gray">Plan-based</Tag>}
                </div>
                <h3 className="mt-4 flex items-start justify-between gap-2 text-[17px] font-bold leading-snug tracking-tight text-hm-ink">
                  {f.title}
                  <a href={f.href} aria-label={`Learn more about ${f.title}`} className="mt-0.5 shrink-0 rounded text-hm-gray transition group-hover:translate-x-0.5 group-hover:text-hm-red focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-hm-red"><ArrowRight className="h-4 w-4" /></a>
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-hm-gray">{f.desc}</p>
                <ul className="mt-4 space-y-1.5 pr-[40%] text-[13px] text-hm-ink/80">
                  {f.points.map((p) => (
                    <li key={p} className="flex items-start gap-1.5"><Check className={`mt-0.5 h-3.5 w-3.5 shrink-0 ${t.check}`} aria-hidden="true" />{p}</li>
                  ))}
                </ul>
                {f.note && <p className="mt-auto pt-4 text-[11px] leading-snug text-hm-gray/90 sm:pr-[40%]">{f.note}</p>}
                <Illo k={f.illo} />
              </Item>
            );
          })}
        </Stagger>

        {/* growth band */}
        <Reveal className="mt-6">
          <div className="grid items-center gap-6 rounded-2xl border border-red-100 bg-gradient-to-r from-red-50 via-white to-red-50/60 p-6 sm:p-8 lg:grid-cols-[1.1fr_2fr]">
            <div className="flex items-center gap-5">
              <span className="hidden h-16 w-16 shrink-0 items-center justify-center rounded-full bg-red-100 text-hm-red sm:flex"><Rocket className="h-7 w-7" aria-hidden="true" /></span>
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.14em] text-hm-red">Built for growth</p>
                <h3 className="mt-1 text-2xl font-extrabold leading-tight tracking-tight text-hm-ink sm:text-3xl">More Than Just Emails — <span className="text-hm-red">It&rsquo;s Your Growth Engine</span></h3>
                <p className="mt-2 text-sm leading-relaxed text-hm-gray">Powerful features and flexible plans to help you turn email campaigns into real business results.</p>
              </div>
            </div>
            <ul className="grid grid-cols-2 gap-4 lg:grid-cols-4 lg:divide-x lg:divide-red-100">
              {GROWTH.map((g) => (
                <li key={g.title} className="text-center lg:px-3">
                  <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-red-100 text-hm-red"><g.icon className="h-5 w-5" aria-hidden="true" /></span>
                  <p className="mt-2 text-sm font-bold text-hm-ink">{g.title}</p>
                  <p className="mt-0.5 text-xs leading-snug text-hm-gray">{g.text}</p>
                </li>
              ))}
            </ul>
          </div>
        </Reveal>
      </div>
    </section>
  );
}