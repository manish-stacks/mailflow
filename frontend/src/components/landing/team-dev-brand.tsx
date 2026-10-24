import Link from 'next/link';
import { ArrowRight, Building2, ChevronsUpDown, Mail } from 'lucide-react';
import { ROUTES } from '@/config/landing';
import { cta, Heading, Illustrative, Section, Tag, Window } from './ui';

export function TeamSection() {
  return (
    <Section id="team">
      <Heading eyebrow="Teams & workspaces" title="One Workspace. Multiple Business Needs." copy="Eligible accounts can manage teams, sender identities and multiple workspaces with controlled access. Limits depend on your plan." />
      <div className="mx-auto mt-14 max-w-[960px]">
        <Window title="Workspace settings">
          <div className="grid gap-4 bg-hm-bg p-4 sm:grid-cols-2 sm:p-5">
            <div className="space-y-4">
              <div className="rounded-xl border border-hm-line bg-white p-3">
                <p className="mb-2 text-[11px] font-medium uppercase tracking-wide text-hm-gray">Workspace switcher</p>
                <div className="flex items-center gap-2.5 rounded-lg border border-hm-line p-2"><span className="flex h-8 w-8 items-center justify-center rounded-md bg-hm-red text-sm font-semibold text-white">A</span><div className="flex-1 text-xs"><p className="font-medium text-hm-ink">Acme Studio</p><p className="text-hm-gray">Owner</p></div><ChevronsUpDown className="h-4 w-4 text-hm-gray" /></div>
                <div className="mt-2 flex items-center gap-2 px-2 py-1.5 text-xs text-hm-gray"><Building2 className="h-3.5 w-3.5" />Northwind Retail</div>
              </div>
              <div className="rounded-xl border border-hm-line bg-white p-3">
                <p className="mb-2 text-[11px] font-medium uppercase tracking-wide text-hm-gray">Sender identities</p>
                {[['Acme Studio · hello@example.com', 'Verified', 'green'], ['Acme Offers · offers@example.com', 'Pending', 'amber']].map(([n, s, t]) => (
                  <div key={n} className="flex items-center justify-between gap-2 py-1.5 text-xs"><span className="flex min-w-0 items-center gap-2 text-hm-ink"><Mail className="h-3.5 w-3.5 shrink-0 text-hm-gray" /><span className="truncate">{n}</span></span><Tag tone={t as any}>{s}</Tag></div>
                ))}
              </div>
            </div>
            <div className="rounded-xl border border-hm-line bg-white p-3">
              <p className="mb-2 text-[11px] font-medium uppercase tracking-wide text-hm-gray">Team members &amp; roles</p>
              {[['Jamie Cole', 'Owner'], ['Riya Nair', 'Admin'], ['Chris Park', 'Editor'], ['Dana Wu', 'Viewer']].map(([n, r]) => (
                <div key={n} className="flex items-center justify-between border-t border-hm-line py-2.5 first:border-0 text-xs"><span className="flex items-center gap-2 text-hm-ink"><span className="flex h-6 w-6 items-center justify-center rounded-full bg-hm-bg text-[10px] font-semibold">{n[0]}</span>{n}</span><span className="rounded-md border border-hm-line px-2 py-0.5 text-hm-gray">{r}</span></div>
              ))}
              <p className="mt-3 border-t border-hm-line pt-3 text-xs text-hm-gray">Company settings · Time zone · Branding options</p>
            </div>
          </div>
        </Window>
        <Illustrative>Names and addresses are fictional examples.</Illustrative>
      </div>
    </Section>
  );
}

const SNIPPET = `curl https://<your-api-host>/api/campaigns \\
  -H "x-api-key: mf_a1b2c3d4.e5f6g7h8..."`;

export function DeveloperSection() {
  return (
    <Section id="developers" tone="dark">
      <div className="grid items-center gap-12 lg:grid-cols-2">
        <div className="min-w-0">
          <Heading dark center={false} eyebrow="API & developers" title="Email Infrastructure That Fits Your Workflow" copy="Connect email functionality to your products and workflows with developer-focused API access on eligible plans." />
          <ul className="mt-7 space-y-3 text-[15px] text-white/75">
            <li>Create workspace API keys in Settings (workspace owners and admins).</li>
            <li>Authenticate with an <code className="rounded bg-white/10 px-1.5 py-0.5 text-[13px]">x-api-key</code> header or Bearer token.</li>
            <li>Covers campaigns, contacts, lists, segments, templates, senders, domains, suppression, import and analytics.</li>
          </ul>
          <div className="mt-8 flex flex-wrap items-center gap-4">
            <Link href={ROUTES.apiKeys} className="inline-flex h-12 items-center gap-2 rounded-xl bg-hm-red px-6 text-[15px] font-semibold text-white transition hover:bg-hm-red-dark focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-hm-ink">Explore the API <ArrowRight className="h-4 w-4" /></Link>
            <a href={ROUTES.apiDocs} className="text-[15px] font-semibold text-white underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white rounded">Read the API key guide</a>
          </div>
          <p className="mt-4 text-xs text-white/50">API access is available on eligible plans only.</p>
        </div>
        <div className="min-w-0">
          <div className="overflow-hidden rounded-2xl border border-white/10 bg-black/40">
            <div className="flex items-center justify-between border-b border-white/10 px-4 py-2.5 text-xs text-white/60"><span>Example request</span><Tag tone="amber">Illustrative</Tag></div>
            <pre className="overflow-x-auto p-5 text-[13px] leading-relaxed text-white/90"><code>{SNIPPET}</code></pre>
          </div>
          <p className="mt-3 text-xs text-white/50">Replace the host and key with your own. See the guide for the full list of supported endpoints.</p>
        </div>
      </div>
    </Section>
  );
}

export function WhiteLabelSection() {
  return (
    <Section id="white-label">
      <div className="grid items-center gap-12 lg:grid-cols-2">
        <Window title="Email preview — no third-party branding">
          <div className="bg-hm-bg p-5">
            <div className="mx-auto max-w-sm rounded-lg bg-white p-6 shadow-sm">
              <div className="mb-4 flex items-center gap-2"><span className="h-6 w-6 rounded bg-hm-ink" /><span className="text-sm font-semibold text-hm-ink">Your Brand</span></div>
              <p className="text-lg font-semibold text-hm-ink">Your monthly update</p>
              <p className="mt-2 text-sm leading-relaxed text-hm-gray">A clean message that carries only your name, colors and voice.</p>
              <div className="mt-4 inline-block rounded-md bg-hm-ink px-4 py-2 text-xs font-semibold text-white">Read more</div>
              <p className="mt-6 border-t border-hm-line pt-3 text-[11px] text-hm-gray">Your Brand · Unsubscribe</p>
            </div>
          </div>
        </Window>
        <div>
          <Heading center={false} eyebrow="White-label" title="Make Email Marketing Feel Like Your Brand" copy="Deliver a more consistent brand experience with white-label options available on eligible plans." />
          <p className="mt-6 rounded-xl border border-hm-line bg-hm-bg p-4 text-sm leading-relaxed text-hm-gray">Branding removal and its scope depend on your subscription. Check the plan comparison below to see which plans include it.</p>
          <div className="mt-6"><a href="#pricing" className={cta.link}>See which plans include it <ArrowRight className="h-4 w-4" /></a></div>
        </div>
      </div>
    </Section>
  );
}
