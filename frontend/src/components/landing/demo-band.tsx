import { CalendarCheck, CheckCircle2, Clock, Users } from 'lucide-react';
import { Section } from './ui';
import { Reveal } from './motion';
import { DemoForm } from './demo';

export function DemoBand() {
  return (
    <Section id="demo" tone="dark">
      <div className="grid items-start gap-12 lg:grid-cols-5">
        <Reveal className="lg:col-span-2">
          <p className="mb-3 text-xs font-semibold uppercase tracking-[0.14em] text-hm-red">Free demo</p>
          <h2 className="text-balance text-3xl font-semibold tracking-tight sm:text-4xl sm:leading-[1.12]">See HoverMail in action — tailored to your team.</h2>
          <p className="mt-4 text-lg leading-relaxed text-white/70">Walk through campaigns, templates, AI writing, audiences and analytics with someone who can answer your questions.</p>
          <ul className="mt-8 space-y-4 text-[15px] text-white/80">
            {[[CalendarCheck, 'Pick the features you care about'], [Users, 'Bring your team — all welcome'], [Clock, 'No obligation, no card required'], [CheckCircle2, 'Get answers on plans, limits and setup']].map(([I, t]: any) => (
              <li key={t} className="flex items-center gap-3"><span className="flex h-9 w-9 items-center justify-center rounded-lg bg-white/10"><I className="h-4 w-4 text-hm-red" aria-hidden="true" /></span>{t}</li>
            ))}
          </ul>
        </Reveal>
        <Reveal delay={0.1} className="lg:col-span-3">
          <div className="rounded-2xl bg-white p-6 text-hm-ink shadow-2xl sm:p-8">
            <h3 className="mb-5 text-xl font-semibold tracking-tight">Request your free demo</h3>
            <DemoForm />
          </div>
        </Reveal>
      </div>
    </Section>
  );
}
