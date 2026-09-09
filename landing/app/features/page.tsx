import type { Metadata } from "next";
import Link from "next/link";
import { Container } from "@/components/container";
import { features, site } from "@/lib/site";

export const metadata: Metadata = {
  title: "Features",
  description:
    "Contacts and segments, an AI writer, deliverability tools, link-level analytics and an API — everything MailFlow gives you to run email campaigns.",
  alternates: { canonical: "/features" },
};

const detail: Record<string, string[]> = {
  Campaigns: ["Drag-free editor with saved drafts", "Subject line A/B testing", "Resend to unopened, automatically"],
  "AI writer": ["Subject line and body drafts on demand", "Daily credit counter, no surprise bills", "Every draft fully editable before send"],
  Contacts: ["Custom fields and tags", "Behavioural segments (opens, clicks, activity)", "Automatic bounce and suppression handling"],
  Deliverability: ["Domain verification (SPF, DKIM, DMARC guidance)", "Bring your own SMTP or provider", "Per-sender daily and per-minute rate limits"],
  Analytics: ["Opens, clicks, bounces, unsubscribes", "Link-level click tracking", "Per-campaign and per-workspace views"],
  "API access": ["Scoped API keys per workspace", "Campaigns, contacts and lists over REST", "Built for teams embedding email in their own product"],
};

export default function FeaturesPage() {
  return (
    <>
      <section className="border-b border-line py-20">
        <Container>
          <span className="tick text-indigo" />
          <h1 className="mt-5 max-w-[22ch] font-display text-4xl font-medium tracking-tight text-ink sm:text-5xl">
            Everything it takes to run a send, in one workspace.
          </h1>
          <p className="mt-6 max-w-[52ch] text-lg text-mist">
            {site.name} covers the full path from a raw contact list to a campaign report — so you're not
            stitching together a list tool, a writer and an analytics tab.
          </p>
        </Container>
      </section>

      <section className="py-20">
        <Container className="space-y-20">
          {features.map((f, i) => (
            <div key={f.title} className={`grid gap-8 md:grid-cols-2 md:items-center ${i % 2 === 1 ? "md:[&>*:first-child]:order-2" : ""}`}>
              <div>
                <p className="text-sm font-medium text-indigo">{f.tag}</p>
                <h2 className="mt-3 font-display text-2xl font-medium text-ink sm:text-3xl">{f.title}</h2>
                <p className="mt-4 max-w-[48ch] text-base leading-relaxed text-mist">{f.body}</p>
              </div>
              <ul className="space-y-3 rounded-xl border border-line bg-paperDim p-8">
                {(detail[f.tag] ?? []).map((point) => (
                  <li key={point} className="flex items-start gap-3 text-sm text-ink/90">
                    <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-amber" />
                    {point}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </Container>
      </section>

      <section className="border-t border-line bg-indigo text-paper">
        <Container className="flex flex-col items-start justify-between gap-8 py-16 md:flex-row md:items-center">
          <h2 className="max-w-[24ch] font-display text-3xl font-medium tracking-tight sm:text-4xl">
            See it against your own list — free.
          </h2>
          <Link
            href={`${site.appUrl}/signup`}
            className="whitespace-nowrap rounded-md bg-paper px-7 py-3 text-sm font-medium text-ink transition-colors hover:bg-amber-soft"
          >
            Start free
          </Link>
        </Container>
      </section>
    </>
  );
}
