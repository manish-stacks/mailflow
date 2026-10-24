import {
  Mail, LayoutGrid, Zap, BarChart3, ShieldCheck, Sparkles, Users,
  LayoutDashboard, Send, FileText, Workflow, Settings, BookUser, LineChart,
} from 'lucide-react';
import { BrandLogo } from '@/components/brand-logo';

const RED = '#E11D26';

const features = [
  { icon: Mail, title: 'Powerful Campaigns', desc: 'Create, schedule and track your email campaigns with ease.' },
  { icon: LayoutGrid, title: 'Beautiful Templates', desc: 'Choose from ready-to-use templates or build your own with our drag & drop editor.' },
  { icon: Zap, title: 'Automation & Workflows', desc: 'Save time with smart automation and personalized journeys.' },
  { icon: BarChart3, title: 'Detailed Analytics', desc: 'Track opens, clicks, bounces and optimize for better results.' },
];

const perks = [
  { icon: ShieldCheck, title: 'Secure & Reliable', desc: 'Your data is always safe with us.' },
  { icon: Zap, title: 'Lightning Fast', desc: 'Built for speed and performance.' },
  { icon: Sparkles, title: 'Easy to Use', desc: 'No technical skills needed.' },
  { icon: Users, title: 'Built for Teams', desc: 'Collaborate and get more done.' },
];

function Dashboard() {
  const nav = [
    { l: 'Dashboard', i: LayoutDashboard, a: true },
    { l: 'Campaigns', i: Send },
    { l: 'Templates', i: FileText },
    { l: 'Automation', i: Workflow },
    { l: 'Contacts', i: BookUser },
    { l: 'Analytics', i: LineChart },
    { l: 'Settings', i: Settings },
  ];
  const rows = [
    { n: 'Product Launch', t: 'Sent 2 hours ago', p: '98%' },
    { n: 'Newsletter - Oct', t: 'Sent 1 day ago', p: '95%' },
    { n: 'Welcome Series', t: 'Sent 3 days ago', p: '92%' },
  ];
  return (
    <div className="flex h-full w-full overflow-hidden rounded-lg bg-white text-[8px] text-neutral-700">
      <div className="w-[26%] border-r border-neutral-100 p-2">
        <div className="mb-3 text-[9px] font-bold text-neutral-900">
          HM Hover<span style={{ color: RED }}>Mail</span>
        </div>
        {nav.map(({ l, i: Icon, a }) => (
          <div
            key={l}
            className={`mb-1 flex items-center gap-1.5 rounded px-1.5 py-1 ${a ? 'text-white' : 'text-neutral-500'}`}
            style={a ? { background: RED } : undefined}
          >
            <Icon size={9} /> {l}
          </div>
        ))}
      </div>
      <div className="flex-1 p-2">
        <div className="grid grid-cols-3 gap-1.5">
          {[['Total Sent', '24,821', '↑ 12%'], ['Open Rate', '68.4%', '↑ 8%'], ['Click Rate', '12.6%', '↑ 4%']].map(([a, b, c]) => (
            <div key={a} className="rounded border border-neutral-100 p-1.5 shadow-sm">
              <div className="text-[7px] text-neutral-400">{a}</div>
              <div className="text-[11px] font-bold text-neutral-900">{b}</div>
              <div className="text-[7px] text-emerald-500">{c}</div>
            </div>
          ))}
        </div>
        <svg viewBox="0 0 200 60" className="mt-2 h-14 w-full rounded border border-neutral-100 bg-gradient-to-b from-red-50 to-white p-1">
          <polyline fill="none" stroke={RED} strokeWidth="1.5" points="0,45 25,35 50,40 75,28 100,32 125,20 150,26 175,14 200,10" />
        </svg>
        <div className="mt-2 rounded border border-neutral-100 p-1.5">
          <div className="mb-1 font-semibold text-neutral-900">Recent Campaigns</div>
          {rows.map((r) => (
            <div key={r.n} className="flex items-center justify-between py-0.5">
              <div className="flex items-center gap-1.5">
                <span className="h-3 w-3 rounded" style={{ background: RED }} />
                <div>
                  <div className="font-medium text-neutral-800">{r.n}</div>
                  <div className="text-[6px] text-neutral-400">{r.t}</div>
                </div>
              </div>
              <span>{r.p}</span>
              <span className="rounded-full bg-emerald-50 px-1.5 py-0.5 text-[6px] text-emerald-600">Delivered</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="grid min-h-screen bg-white lg:grid-cols-2">
      {/* LEFT */}
      <div className="flex flex-col justify-center bg-gradient-to-br from-white to-neutral-50 px-6 py-12 sm:px-12 lg:px-16">
        <div className="mx-auto w-full max-w-[480px]">
          <div className="mb-12"><BrandLogo href="/" size="lg" /></div>
          {children}
        </div>
      </div>

      {/* RIGHT */}
      <div className="relative hidden overflow-hidden bg-gradient-to-br from-[#E8202B] via-[#C01822] to-[#7A0B12] text-white lg:block">
        <div className="pointer-events-none absolute -right-40 -top-40 h-[560px] w-[560px] rotate-45 bg-white/5" />
        <div className="pointer-events-none absolute -bottom-40 left-1/3 h-[480px] w-[480px] rounded-full bg-black/10 blur-3xl" />

        <div className="relative flex h-full flex-col px-14 py-12">
          <div className="flex items-start justify-between">
            <span className="inline-flex items-center gap-2 rounded-full border border-white/30 bg-white/10 px-4 py-2 text-sm font-medium">
              <Zap size={14} fill="currentColor" /> Powerful Email Platform
            </span>
            <span className="-rotate-12 pr-4 text-right text-xl italic leading-tight text-white/90" style={{ fontFamily: 'cursive' }}>
              Your Email<br />Growth Partner
            </span>
          </div>

          <h2 className="mt-4 max-w-[520px] text-5xl font-extrabold leading-[1.1] tracking-tight">
            Build, Send, Grow with <span className="text-[#FF4650]">HoverMail</span>
          </h2>
          <p className="mt-5 max-w-[470px] text-[15px] leading-relaxed text-white/85">
            More than just an email platform. HoverMail gives you all the tools to create beautiful campaigns, automate
            workflows and get real results — faster.
          </p>

          <div className="relative mt-8 flex-1">
            <ul className="relative z-10 max-w-[360px] space-y-5">
              {features.map(({ icon: Icon, title, desc }) => (
                <li key={title} className="flex items-start gap-4">
                  <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-white/15 ring-1 ring-white/20 backdrop-blur">
                    <Icon size={24} />
                  </div>
                  <div>
                    <div className="font-semibold">{title}</div>
                    <div className="mt-0.5 text-[13px] leading-snug text-white/75">{desc}</div>
                  </div>
                </li>
              ))}
            </ul>

            <div
              className="absolute -right-24 top-6 hidden h-[300px] w-[480px] xl:block"
              style={{ transform: 'perspective(1200px) rotateY(-14deg) rotateX(6deg) rotate(-3deg)', transformOrigin: 'left center' }}
            >
              <div className="h-full rounded-t-xl border-[6px] border-neutral-800 bg-neutral-900 shadow-2xl">
                <Dashboard />
              </div>
              <div className="mx-[-14px] h-3 rounded-b-xl bg-gradient-to-b from-neutral-400 to-neutral-600 shadow-xl" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-5 rounded-2xl border border-white/25 bg-white/5 p-5 backdrop-blur xl:grid-cols-4">
            {perks.map(({ icon: Icon, title, desc }) => (
              <div key={title} className="flex items-start gap-3">
                <Icon size={24} className="mt-0.5 shrink-0" />
                <div>
                  <div className="text-sm font-semibold">{title}</div>
                  <div className="text-xs leading-snug text-white/70">{desc}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}