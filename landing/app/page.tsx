import Link from "next/link";
import { Container } from "@/components/container";
import { fetchPlans } from "@/lib/api";
import { features, howItWorks, site, stats } from "@/lib/site";

export default async function Home() {
  const plans = await fetchPlans();

  return (
    <>
      {/* Hero */}
      <section className="overflow-hidden border-b border-line">
        <Container className="grid gap-14 py-20 md:grid-cols-[1.1fr_0.9fr] md:py-28">
          <div>
            <span className="tick text-indigo" />
            <h1 className="mt-5 max-w-[15ch] font-display text-[2.75rem] font-medium leading-[1.08] tracking-tight text-ink sm:text-6xl">
              Send campaigns your list actually opens.
            </h1>
            <p className="mt-6 max-w-[46ch] text-lg leading-relaxed text-mist">
              {site.name} handles your contacts, writes the first draft, sends from a domain people trust, and
              tells you exactly what happened after — opens, clicks and all.
            </p>
            <div className="mt-8 flex flex-wrap items-center gap-4">
              <Link
                href={`${site.appUrl}/signup`}
                className="rounded-md bg-ink px-6 py-3 text-sm font-medium text-paper transition-colors hover:bg-indigo"
              >
                Start free
              </Link>
              <Link
                href="/pricing"
                className="rounded-md border border-ink/20 px-6 py-3 text-sm font-medium text-ink transition-colors hover:border-ink"
              >
                See pricing
              </Link>
            </div>
            <p className="mt-5 text-sm text-mist">No card required · 1,000 contacts free, always.</p>
          </div>

          <SendMockup />
        </Container>
      </section>

      {/* Stats band */}
      <section className="border-b border-line bg-ink text-paper">
        <Container className="grid grid-cols-1 gap-8 py-10 sm:grid-cols-3">
          {stats.map((s) => (
            <div key={s.label}>
              <p className="font-mono text-3xl text-amber-soft">{s.value}</p>
              <p className="mt-1 text-sm text-paper/70">{s.label}</p>
            </div>
          ))}
        </Container>
      </section>

      {/* Features */}
      <section id="features" className="border-b border-line py-24">
        <Container>
          <div className="max-w-[52ch]">
            <span className="tick text-indigo" />
            <h2 className="mt-5 font-display text-3xl font-medium tracking-tight text-ink sm:text-4xl">
              Everything between your list and their inbox.
            </h2>
            <p className="mt-4 text-lg text-mist">
              Built as one workspace, not six tabs — contacts, writing, sending and the numbers that come back.
            </p>
          </div>

          <div className="mt-14 grid gap-px overflow-hidden rounded-xl border border-line bg-line md:grid-cols-3">
            {features.map((f, i) => (
              <div
                key={f.title}
                className={`bg-paper p-8 ${i === 0 ? "md:col-span-2 md:row-span-2 md:p-10" : ""}`}
              >
                <p className="text-sm font-medium text-indigo">{f.tag}</p>
                <h3 className="mt-3 font-display text-xl font-medium text-ink">{f.title}</h3>
                <p className="mt-3 text-sm leading-relaxed text-mist">{f.body}</p>
              </div>
            ))}
          </div>
        </Container>
      </section>

      {/* How it works */}
      <section className="border-b border-line bg-paperDim py-24">
        <Container>
          <span className="tick text-indigo" />
          <h2 className="mt-5 font-display text-3xl font-medium tracking-tight text-ink sm:text-4xl">
            Three steps, start to inbox.
          </h2>

          <div className="relative mt-16 grid gap-12 md:grid-cols-3">
            <div className="route-line absolute left-0 right-0 top-6 hidden text-mist/40 md:block" />
            {howItWorks.map((step, i) => (
              <div key={step.title} className="relative">
                <div className="postmark relative z-10 flex h-12 w-12 items-center justify-center bg-paperDim font-mono text-sm text-ink">
                  {String(i + 1).padStart(2, "0")}
                </div>
                <h3 className="mt-5 font-display text-lg font-medium text-ink">{step.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-mist">{step.body}</p>
              </div>
            ))}
          </div>
        </Container>
      </section>

      {/* Pricing teaser */}
      <section className="py-24">
        <Container>
          <div className="flex flex-col items-start justify-between gap-6 md:flex-row md:items-end">
            <div className="max-w-[46ch]">
              <span className="tick text-indigo" />
              <h2 className="mt-5 font-display text-3xl font-medium tracking-tight text-ink sm:text-4xl">
                Priced for the size of your list, not your ambition.
              </h2>
              <p className="mt-4 text-lg text-mist">Start free. Move up only when your list and sends actually need it.</p>
            </div>
            <Link
              href="/pricing"
              className="whitespace-nowrap rounded-md border border-ink/20 px-6 py-3 text-sm font-medium text-ink transition-colors hover:border-ink"
            >
              Compare all plans
            </Link>
          </div>

          <div className="mt-12 grid gap-6 md:grid-cols-3">
            {plans.map((plan) => (
              <div
                key={plan.slug}
                className={`rounded-xl border p-8 ${
                  plan.highlighted ? "border-ink bg-ink text-paper" : "border-line bg-paper"
                }`}
              >
                <p className={`text-sm font-medium ${plan.highlighted ? "text-amber-soft" : "text-indigo"}`}>
                  {plan.name}
                </p>
                <p className="mt-3 font-display text-3xl font-medium">
                  {plan.priceMonthly === 0 ? "₹0" : `₹${plan.priceMonthly.toLocaleString("en-IN")}`}
                  <span className={`text-sm font-normal ${plan.highlighted ? "text-paper/60" : "text-mist"}`}> /month</span>
                </p>
                <p className={`mt-3 text-sm ${plan.highlighted ? "text-paper/80" : "text-mist"}`}>{plan.description}</p>
                <Link
                  href={`${site.appUrl}/signup?plan=${plan.slug}`}
                  className={`mt-6 block rounded-md px-5 py-2.5 text-center text-sm font-medium transition-colors ${
                    plan.highlighted ? "bg-paper text-ink hover:bg-amber-soft" : "bg-ink text-paper hover:bg-indigo"
                  }`}
                >
                  {plan.priceMonthly === 0 ? "Start free" : "Choose plan"}
                </Link>
              </div>
            ))}
          </div>
        </Container>
      </section>

      {/* Final CTA */}
      <section className="border-t border-line bg-indigo text-paper">
        <Container className="flex flex-col items-start justify-between gap-8 py-16 md:flex-row md:items-center">
          <div>
            <h2 className="max-w-[24ch] font-display text-3xl font-medium tracking-tight sm:text-4xl">
              Your next campaign could be sending in ten minutes.
            </h2>
          </div>
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

function SendMockup() {
  return (
    <div className="relative rounded-xl border border-line bg-paperDim p-6">
      <div className="flex items-center justify-between border-b border-line pb-4">
        <p className="font-mono text-xs text-mist">Q3-product-update.campaign</p>
        <span className="postmark px-2.5 py-1 font-mono text-[10px] text-indigo">SENT</span>
      </div>

      <div className="mt-5 space-y-3">
        {[
          { label: "Delivered", value: "12,406", width: "100%" },
          { label: "Opened", value: "6,982", width: "56%" },
          { label: "Clicked", value: "1,340", width: "22%" },
        ].map((row) => (
          <div key={row.label}>
            <div className="flex items-center justify-between text-xs text-mist">
              <span>{row.label}</span>
              <span className="font-mono text-ink">{row.value}</span>
            </div>
            <div className="mt-1.5 h-1.5 w-full overflow-hidden rounded-full bg-line">
              <div className="h-full rounded-full bg-indigo" style={{ width: row.width }} />
            </div>
          </div>
        ))}
      </div>

      <div className="relative mt-8 h-6">
        <div className="route-line absolute left-0 right-0 top-1/2 -translate-y-1/2 text-mist/50" />
        <div className="travel-dot absolute top-1/2 h-2 w-2 -translate-y-1/2 rounded-full bg-amber" />
      </div>
      <p className="mt-2 text-center font-mono text-[11px] text-mist">workspace → inbox, 1.8s median</p>
    </div>
  );
}
