import type { Metadata } from "next";
import Link from "next/link";
import { Container } from "@/components/container";
import { fetchPlans } from "@/lib/api";
import { faqs, site, type Plan } from "@/lib/site";

export const metadata: Metadata = {
  title: "Pricing",
  description:
    "Simple, transparent MailFlow pricing in INR. Start free with 1,000 contacts, upgrade as your list and sending volume grow.",
  alternates: { canonical: "/pricing" },
};

const rows: { label: keyof Plan }[] = [
  { label: "contacts" },
  { label: "emails" },
  { label: "aiCredits" },
  { label: "seats" },
  { label: "domains" },
];

const rowLabels: Record<string, string> = {
  contacts: "Contacts",
  emails: "Sending volume",
  aiCredits: "AI writer",
  seats: "Team members",
  domains: "Sending domains",
};

export default async function PricingPage() {
  const plans = await fetchPlans();

  return (
    <>
      <section className="border-b border-line py-20 text-center">
        <Container>
          <span className="tick text-indigo" />
          <h1 className="mx-auto mt-5 max-w-[20ch] font-display text-4xl font-medium tracking-tight text-ink sm:text-5xl">
            Pay for the list you have, not the one you hope for.
          </h1>
          <p className="mx-auto mt-6 max-w-[46ch] text-lg text-mist">
            Every plan includes campaigns, segments and analytics. Start free, upgrade when your contacts or
            sending volume outgrow it.
          </p>
        </Container>
      </section>

      <section className="py-20">
        <Container>
          <div className="grid gap-6 md:grid-cols-3">
            {plans.map((plan) => (
              <div
                key={plan.slug}
                className={`flex flex-col rounded-xl border p-8 ${
                  plan.highlighted ? "border-ink bg-ink text-paper md:-translate-y-3 md:shadow-xl" : "border-line bg-paper"
                }`}
              >
                {plan.highlighted && (
                  <span className="postmark mb-4 w-fit px-2.5 py-1 font-mono text-[10px] text-amber-soft">
                    Most chosen
                  </span>
                )}
                <p className={`text-sm font-medium ${plan.highlighted ? "text-amber-soft" : "text-indigo"}`}>
                  {plan.name}
                </p>
                <p className="mt-3 font-display text-4xl font-medium">
                  {plan.priceMonthly === 0 ? "₹0" : `₹${plan.priceMonthly.toLocaleString("en-IN")}`}
                  <span className={`text-base font-normal ${plan.highlighted ? "text-paper/60" : "text-mist"}`}> /month</span>
                </p>
                {plan.priceMonthly > 0 && (
                  <p className={`mt-1 text-xs ${plan.highlighted ? "text-paper/60" : "text-mist"}`}>
                    or ₹{plan.priceYearly.toLocaleString("en-IN")}/year
                  </p>
                )}
                <p className={`mt-4 text-sm ${plan.highlighted ? "text-paper/80" : "text-mist"}`}>{plan.description}</p>

                <ul className={`mt-6 space-y-2.5 text-sm ${plan.highlighted ? "text-paper/90" : "text-ink/90"}`}>
                  <li>{plan.contacts}</li>
                  <li>{plan.emails}</li>
                  <li>{plan.aiCredits}</li>
                  {plan.features.map((f) => (
                    <li key={f} className="flex items-start gap-2.5">
                      <span className={`mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full ${plan.highlighted ? "bg-amber-soft" : "bg-amber"}`} />
                      {f}
                    </li>
                  ))}
                </ul>

                <Link
                  href={`${site.appUrl}/signup?plan=${plan.slug}`}
                  className={`mt-8 block rounded-md px-5 py-3 text-center text-sm font-medium transition-colors ${
                    plan.highlighted ? "bg-paper text-ink hover:bg-amber-soft" : "bg-ink text-paper hover:bg-indigo"
                  }`}
                >
                  {plan.priceMonthly === 0 ? "Start free" : "Choose " + plan.name}
                </Link>
              </div>
            ))}
          </div>
        </Container>
      </section>

      {/* Comparison table */}
      <section className="border-t border-line bg-paperDim py-20">
        <Container>
          <h2 className="font-display text-2xl font-medium tracking-tight text-ink sm:text-3xl">Compare plans</h2>
          <div className="mt-10 overflow-x-auto">
            <table className="w-full min-w-[560px] border-collapse text-left text-sm">
              <thead>
                <tr className="border-b border-line">
                  <th className="py-3 pr-4 text-sm font-medium text-mist">Limit</th>
                  {plans.map((p) => (
                    <th key={p.slug} className="py-3 pr-4 font-display text-base font-medium text-ink">
                      {p.name}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => (
                  <tr key={row.label} className="border-b border-line/70">
                    <td className="py-3 pr-4 text-mist">{rowLabels[row.label]}</td>
                    {plans.map((p) => (
                      <td key={p.slug} className="py-3 pr-4 text-ink/90">
                        {p[row.label] as string}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Container>
      </section>

      {/* FAQ */}
      <section className="py-20">
        <Container className="max-w-[760px]">
          <h2 className="font-display text-2xl font-medium tracking-tight text-ink sm:text-3xl">
            Questions before you start
          </h2>
          <dl className="mt-10 divide-y divide-line border-t border-line">
            {faqs.map((item) => (
              <div key={item.q} className="py-6">
                <dt className="font-display text-base font-medium text-ink">{item.q}</dt>
                <dd className="mt-2 text-sm leading-relaxed text-mist">{item.a}</dd>
              </div>
            ))}
          </dl>
        </Container>
      </section>

      <section className="border-t border-line bg-indigo text-paper">
        <Container className="flex flex-col items-start justify-between gap-8 py-16 md:flex-row md:items-center">
          <h2 className="max-w-[24ch] font-display text-3xl font-medium tracking-tight sm:text-4xl">
            Start free with 1,000 contacts today.
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
