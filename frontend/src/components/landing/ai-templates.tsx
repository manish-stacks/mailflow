import Link from "next/link";
import {
  ArrowRight,
  Check,
  Heading1,
  ImageIcon,
  MousePointerClick,
  Sparkles,
  Type,
  GripVertical,
  PencilLine,
  Mail,
  LayoutTemplate,
  Send,
  Rocket,
  Zap,
  Palette,
  SlidersHorizontal,
  BarChart3,
  ChevronDown,
  RefreshCw,
  Code2,
  Pencil,
  Target,
  MessageSquareText,
  ShieldCheck,
  Tag as TagIcon,
  Truck,
  Layers,
} from "lucide-react";
import { ROUTES } from "@/config/landing";
import { cta, Heading, Illustrative, Section, Tag, Window } from "./ui";
import Image from "next/image";

const STEPS = [
  {
    t: "Describe your campaign",
    d: "Tell us what you want to say and who you want to reach.",
    i: PencilLine,
  },
  {
    t: "Generate email copy",
    d: "Let AI write compelling content for your campaign.",
    i: Mail,
  },
  {
    t: "Customize your template",
    d: "Choose from beautiful templates or build your own.",
    i: LayoutTemplate,
  },
  { t: "Preview your email", d: "See how it looks before you send.", i: Send },
  { t: "Review and launch", d: "Hit send and track your results.", i: Rocket },
];

const PERKS = [
  {
    t: "AI-Powered",
    d: "Smart content, better results.",
    i: Zap,
    c: "bg-red-50 text-hm-red",
  },
  {
    t: "Beautiful Templates",
    d: "Professionally designed & responsive.",
    i: Palette,
    c: "bg-violet-50 text-violet-600",
  },
  {
    t: "Fully Customizable",
    d: "Make it yours, your way.",
    i: SlidersHorizontal,
    c: "bg-rose-50 text-rose-500",
  },
  {
    t: "Built to Send",
    d: "Queued delivery at scale.",
    i: Mail,
    c: "bg-sky-50 text-sky-600",
  },
  {
    t: "Track & Optimize",
    d: "Real-time analytics & insights.",
    i: BarChart3,
    c: "bg-emerald-50 text-emerald-600",
  },
];

function Select({
  icon: Icon,
  label,
  value,
}: {
  icon: any;
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-xl border border-hm-line bg-white px-3.5 py-2.5">
      <p className="flex items-center gap-1.5 text-xs font-semibold text-hm-ink">
        <Icon className="h-3.5 w-3.5 text-hm-gray" />
        {label}
      </p>
      <div className="mt-1 flex items-center justify-between text-sm text-hm-ink">
        <span className="truncate">{value}</span>
        <ChevronDown className="h-4 w-4 shrink-0 text-hm-gray" />
      </div>
    </div>
  );
}

export function AiSection() {
  return (
    <Section
      id="ai"
      className="relative overflow-hidden bg-gradient-to-b from-white via-white to-red-50/30"
    >
      {/* soft corner glows */}
      <div
        aria-hidden
        className="pointer-events-none absolute -left-24 top-0 h-72 w-72 rounded-full bg-red-100/50 blur-3xl"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute -right-24 top-10 h-72 w-72 rounded-full bg-red-100/60 blur-3xl"
      />

      {/* header */}
      <div className="relative text-center">
        <span className="inline-flex items-center gap-1.5 rounded-full bg-red-50 px-3.5 py-1.5 text-xs font-semibold uppercase tracking-[0.12em] text-hm-red">
          <Sparkles className="h-3.5 w-3.5" /> AI tools
        </span>
        <h2 className="mx-auto mt-5 max-w-3xl text-balance text-4xl font-extrabold tracking-tight text-hm-ink sm:text-5xl sm:leading-[1.1]">
          From Idea to Email{" "}
          <span className="text-hm-red">Campaign in Minutes</span>
        </h2>
        <p className="mx-auto mt-5 max-w-xl text-pretty text-base leading-relaxed text-hm-gray sm:text-lg">
          Tell HoverMail what you want to communicate. Let AI help you draft,
          design, and refine your next campaign.
        </p>
        <p
          aria-hidden
          className="absolute left-2 top-2 hidden -rotate-6 text-left text-xl italic leading-tight text-hm-ink/70 xl:block"
          style={{ fontFamily: "cursive" }}
        >
          Your idea
          <br />→ Our AI
        </p>
        <p
          aria-hidden
          className="absolute right-2 top-6 hidden rotate-[-8deg] text-right text-xl italic leading-tight text-hm-ink/60 xl:block"
          style={{ fontFamily: "cursive" }}
        >
          Professional Emails
          <br />
          in Minutes
        </p>
      </div>

      {/* body */}
      <div className="relative mt-14 grid items-start gap-8 lg:grid-cols-[250px_1fr_1fr] xl:grid-cols-[280px_1fr_1.05fr]">
        {/* steps */}
        <ol className="relative space-y-6">
          <span
            aria-hidden
            className="absolute left-[15px] top-6 hidden h-[calc(100%-3rem)] w-px border-l border-dashed border-hm-line lg:block"
          />
          {STEPS.map(({ t, d, i: Icon }, idx) => (
            <li key={t} className="relative flex items-start gap-4">
              <span
                className={`relative z-10 flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-bold ${idx === 0 ? "bg-hm-red text-white ring-4 ring-red-100" : "bg-hm-bg text-hm-gray ring-1 ring-hm-line"}`}
              >
                {idx + 1}
              </span>
              <span
                className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-white shadow-sm ring-1 ${idx === 0 ? "text-hm-red ring-red-100" : "text-hm-gray ring-hm-line"}`}
              >
                <Icon className="h-5 w-5" />
              </span>
              <span>
                <span
                  className={`block text-sm font-semibold ${idx === 0 ? "text-hm-ink" : "text-hm-ink/70"}`}
                >
                  {t}
                </span>
                <span className="mt-0.5 block text-xs leading-relaxed text-hm-gray">
                  {d}
                </span>
              </span>
            </li>
          ))}
        </ol>

        {/* assistant */}
        <div
          role="img"
          aria-label="AI email assistant — product illustration"
          className="rounded-3xl border border-hm-line bg-white p-5 shadow-[0_12px_40px_-14px_rgba(225,29,38,.18)] sm:p-6"
        >
          <div aria-hidden>
            <div className="flex items-start gap-3">
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-red-50 text-hm-red">
                <PencilLine className="h-5 w-5" />
              </span>
              <div className="flex-1">
                <p className="text-lg font-bold text-hm-ink">
                  AI Email Assistant
                </p>
                <p className="text-xs text-hm-gray">
                  Describe your campaign in simple words. Our AI will do the
                  rest.
                </p>
              </div>
              <Sparkles className="h-5 w-5 text-hm-red" />
            </div>

            <div className="mt-5 rounded-2xl border border-hm-line p-4">
              <p className="text-xs font-semibold text-hm-ink">
                What is your campaign about?
              </p>
              <div className="mt-2 min-h-[84px] rounded-xl border border-hm-line bg-white p-3 text-sm leading-relaxed text-hm-ink">
                Launch our new collection with a special discount for our loyal
                customers.
                <p className="mt-3 text-right text-[11px] text-hm-gray">
                  74/500
                </p>
              </div>
              <div className="mt-3 grid grid-cols-2 gap-3">
                <Select
                  icon={MessageSquareText}
                  label="Tone"
                  value="Professional and friendly"
                />
                <Select
                  icon={Target}
                  label="Goal"
                  value="Drive launch clicks"
                />
              </div>
              <div className="mt-4 flex h-12 items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-hm-red to-[#FF3B44] text-[15px] font-semibold text-white shadow-lg shadow-red-500/25">
                <Sparkles className="h-4 w-4" /> Generate draft{" "}
                <ArrowRight className="h-4 w-4" />
              </div>
              <div className="my-3 flex items-center gap-3 text-xs text-hm-gray">
                <span className="h-px flex-1 bg-hm-line" />
                Or
                <span className="h-px flex-1 bg-hm-line" />
              </div>
              <div className="flex h-11 items-center justify-center gap-2 rounded-xl border border-hm-line bg-white text-sm font-medium text-hm-ink">
                <LayoutTemplate className="h-4 w-4 text-hm-gray" /> Start from a
                template
              </div>
            </div>
          </div>
        </div>

        {/* draft preview */}
        <div
          role="img"
          aria-label="Generated draft preview — product illustration"
          className="rounded-3xl bg-gradient-to-br from-sky-50/70 to-white p-4 ring-1 ring-hm-line sm:p-5"
        >
          <div aria-hidden>
            <span className="inline-flex items-center gap-1.5 rounded-full border border-sky-100 bg-white px-3 py-1 text-[11px] font-medium text-sky-600">
              <Sparkles className="h-3 w-3" /> AI generated draft — preview
            </span>

            <div className="mt-3 rounded-2xl bg-white p-4 shadow-sm ring-1 ring-hm-line">
              <div className="flex items-start justify-between gap-3">
                <p className="text-xs text-hm-gray">
                  Subject:
                  <span className="mt-0.5 block text-sm font-bold text-hm-ink">
                    ✨ Introducing Our New Collection – Special Launch Offer!
                  </span>
                </p>
                <span className="inline-flex shrink-0 items-center gap-1 rounded-lg bg-sky-50 px-2.5 py-1.5 text-[11px] font-medium text-sky-600">
                  <RefreshCw className="h-3 w-3" />
                  Regenerate
                </span>
              </div>

         
<div className="mt-3 rounded-xl border border-hm-line p-3">
  <p className="flex items-center gap-1.5 text-xs font-semibold text-hm-ink">
    <span className="flex h-4 w-5 items-center justify-center rounded-sm bg-hm-red text-white">
      <Mail className="h-2.5 w-2.5" />
    </span>
    Your<span className="font-normal text-hm-gray">Brand</span>
  </p>

  {/* Email banner image */}
  <div className="relative mt-2 h-20 overflow-hidden rounded-lg bg-neutral-100">
    <Image
      src="/image.jpg"
      alt="New collection promotional banner"
      fill
      sizes="(max-width: 768px) 100vw, 500px"
      className="object-contain object-center"
    />

    {/* Optional gradient overlay */}

    {/* Banner text */}
   
  </div>

  {/* Email content */}
  <div className="mt-3 text-[11px] leading-relaxed text-hm-ink">
    <p>Hi there,</p>
    <p>We're excited to launch our brand new collection! 🎉</p>
    <p className="text-hm-gray">
      Get ready to explore fresh styles, premium quality and
      exclusive launch discounts — just for you.
    </p>
  </div>

  <span className="mt-3 inline-flex items-center gap-1 rounded-lg bg-hm-red px-3 py-1.5 text-[11px] font-semibold text-white">
    Shop the Collection <ArrowRight className="h-3 w-3" />
  </span>

  <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-[10px] text-hm-gray">
    <span className="inline-flex items-center gap-1">
      <ShieldCheck className="h-3 w-3" />
      Premium Quality
    </span>
    <span className="inline-flex items-center gap-1">
      <TagIcon className="h-3 w-3" />
      Exclusive Discounts
    </span>
    <span className="inline-flex items-center gap-1">
      <Truck className="h-3 w-3" />
      Fast Shipping
    </span>
  </div>
</div>

            </div>

            <div className="mt-3 flex items-center justify-around text-xs font-medium text-hm-gray">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-red-50 px-3.5 py-2 text-hm-red">
                <Mail className="h-3.5 w-3.5" />
                Email Preview
              </span>
              <span className="inline-flex items-center gap-1.5">
                <Code2 className="h-3.5 w-3.5" />
                HTML Code
              </span>
              <span className="inline-flex items-center gap-1.5">
                <Pencil className="h-3.5 w-3.5" />
                Edit
              </span>
            </div>
          </div>
        </div>
      </div>

      <p className="relative mx-auto mt-6 flex max-w-2xl items-start justify-center gap-2 text-center text-sm text-hm-gray">
        <Check className="mt-0.5 h-4 w-4 shrink-0 text-hm-red" />
        AI-generated content can contain mistakes. Always review and edit before
        you send.
      </p>
      <Illustrative>
        <span className="block text-center">
          Sample prompt and output for illustration.
        </span>
      </Illustrative>

      {/* perks strip */}
      <ul className="relative mt-10 grid gap-5 rounded-2xl border border-red-100 bg-red-50/40 p-5 sm:grid-cols-2 lg:grid-cols-5 lg:divide-x lg:divide-red-100">
        {PERKS.map(({ t, d, i: Icon, c }) => (
          <li key={t} className="flex items-center gap-3 lg:px-4">
            <span
              className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-full ${c}`}
            >
              <Icon className="h-5 w-5" />
            </span>
            <span>
              <span className="block text-sm font-semibold text-hm-ink">
                {t}
              </span>
              <span className="block text-xs leading-snug text-hm-gray">
                {d}
              </span>
            </span>
          </li>
        ))}
      </ul>

      <div className="relative mt-8 text-center">
        <Link href={ROUTES.signUp} className={cta.link}>
          Explore AI Features <ArrowRight className="h-4 w-4" />
        </Link>
      </div>
    </Section>
  );
}

const MODES = [
  {
    t: "Visual builder",
    d: "Drag-and-drop blocks: heading, text, image, button, divider, spacer, footer.",
  },
  {
    t: "AI-assisted drafts",
    d: "Generate subject, preview text and copy, then drop it into your template.",
  },
  {
    t: "Starter templates",
    d: "Begin from a starter and make it yours. Content and sending rules remain your responsibility.",
  },
  {
    t: "Reusable templates",
    d: "Save designs to your workspace and reuse them across campaigns.",
  },
];
const CATS = [
  "Newsletters",
  "Product launches",
  "Promotions and offers",
  "Welcome emails",
  "Customer updates",
  "Event invitations",
  "Business announcements",
];

export function TemplatesSection() {
  return (
    <Section id="templates" tone="gray">
      <Heading
        eyebrow="Templates"
        title="Design Emails Your Audience Wants to Open"
        copy="Build from blocks, start from a starter, or let AI draft the first version."
      />
      <div className="mt-14 grid items-start gap-10 lg:grid-cols-2">
        <div>
          <ul className="grid gap-3 sm:grid-cols-2">
            {MODES.map((m) => (
              <li
                key={m.t}
                className="rounded-xl border border-hm-line bg-white p-4"
              >
                <p className="font-semibold text-hm-ink">{m.t}</p>
                <p className="mt-1 text-sm leading-relaxed text-hm-gray">
                  {m.d}
                </p>
              </li>
            ))}
          </ul>
          <p className="mt-7 text-sm font-semibold text-hm-ink">Use cases</p>
          <ul className="mt-3 flex flex-wrap gap-2">
            {CATS.map((c) => (
              <li
                key={c}
                className="rounded-full border border-hm-line bg-white px-3 py-1.5 text-sm text-hm-ink"
              >
                {c}
              </li>
            ))}
          </ul>
          <p className="mt-4 text-xs text-hm-gray">
            Starter template availability depends on what is configured in your
            workspace.
          </p>
          <div className="mt-8">
            <Link href={ROUTES.templates} className={cta.link}>
              Explore Email Templates <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
        <Window title="Template builder">
          <div className="grid grid-cols-[120px_1fr] sm:grid-cols-[140px_1fr]">
            <div className="space-y-2 border-r border-hm-line bg-hm-bg p-3 text-xs">
              <p className="font-semibold text-hm-ink">Blocks</p>
              {[
                [Heading1, "Heading"],
                [Type, "Text"],
                [ImageIcon, "Image"],
                [MousePointerClick, "Button"],
              ].map(([I, l]: any) => (
                <div
                  key={l}
                  className="flex items-center gap-2 rounded-lg border border-hm-line bg-white px-2 py-1.5 text-hm-gray"
                >
                  <GripVertical className="h-3 w-3" />
                  <I className="h-3.5 w-3.5" />
                  {l}
                </div>
              ))}
            </div>
            <div className="bg-hm-bg p-4">
              <div className="space-y-2 rounded-lg bg-white p-4 shadow-sm">
                <div className="flex items-center gap-1.5 rounded border border-dashed border-hm-red/50 p-1.5">
                  <span className="h-5 w-5 rounded bg-hm-red" />
                  <span className="text-xs font-semibold text-hm-ink">
                    Your logo
                  </span>
                </div>
                <div className="rounded border border-dashed border-transparent p-1.5 hover:border-hm-line">
                  <p className="text-base font-semibold text-hm-ink">
                    Your headline goes here
                  </p>
                </div>
                <div className="h-20 rounded bg-gradient-to-br from-hm-bg to-hm-line" />
                <p className="p-1.5 text-xs leading-relaxed text-hm-gray">
                  Hi {"{{first_name}}"}, write your message here. Personalize
                  with contact fields.
                </p>
                <div className="ml-1.5 inline-block rounded-md bg-hm-red px-3 py-1.5 text-xs font-semibold text-white">
                  Call to action
                </div>
              </div>
            </div>
          </div>
        </Window>
      </div>
    </Section>
  );
}
