"use client";
import * as Dialog from "@radix-ui/react-dialog";
import { createContext, useCallback, useContext, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { AnimatePresence, motion } from "framer-motion";
import {
  ArrowRight,
  Building2,
  CalendarCheck,
  CheckCircle2,
  ChevronDown,
  Clock,
  Loader2,
  Mail,
  MessageSquareText,
  ShieldCheck,
  Sparkles,
  User,
  Users,
  X,
  Zap,
} from "lucide-react";
import { DEMO } from "@/config/landing";
import { cn } from "@/lib/utils";
import { cta } from "./ui";

/* ------------------------------------------------------------ shared field styles */
const input =
  "h-12 w-full rounded-xl border border-hm-line bg-white pl-11 pr-3.5 text-[15px] text-hm-ink placeholder:text-hm-gray/70 outline-none transition focus:border-hm-red focus:ring-4 focus:ring-red-100 aria-[invalid=true]:border-red-500 aria-[invalid=true]:ring-red-100";
const label = "mb-1.5 block text-sm font-semibold text-hm-ink";

const schema = z.object({
  name: z.string().trim().min(2, "Please enter your name"),
  email: z.string().trim().email("Enter a valid work email"),
  company: z.string().trim().optional(),
  teamSize: z.string().optional(),
  interests: z.array(z.string()).optional(),
  message: z
    .string()
    .trim()
    .max(600, "Keep it under 600 characters")
    .optional(),
  consent: z.literal(true, {
    errorMap: () => ({ message: "Please confirm so we can contact you" }),
  }),
});
type FormValues = z.infer<typeof schema>;

const INTEREST_OPTIONS = [
  "Campaigns",
  "Template builder",
  "AI writing",
  "Contacts & segments",
  "Analytics",
  "Team & workspaces",
  "API access",
];
const TEAM_SIZES = ["Just me", "2–5", "6–20", "21–50", "50+"];

/* ------------------------------------------------------------ tiny helpers */
function Err({ id, m }: { id: string; m?: string }) {
  return m ? (
    <p id={id} role="alert" className="mt-1 text-xs font-medium text-red-600">
      {m}
    </p>
  ) : null;
}

function IconWrap({
  icon: Icon,
  children,
  top = false,
}: {
  icon: any;
  children: React.ReactNode;
  top?: boolean;
}) {
  return (
    <div className="relative">
      <Icon
        className={cn(
          "pointer-events-none absolute left-3.5 h-[18px] w-[18px] text-hm-gray",
          top ? "top-3.5" : "top-1/2 -translate-y-1/2",
        )}
        aria-hidden="true"
      />
      {children}
    </div>
  );
}

/* ------------------------------------------------------------ context */
const Ctx = createContext<{ open: (email?: string) => void }>({
  open: () => {},
});
export const useDemo = () => useContext(Ctx);

const PERKS = [
  {
    i: Sparkles,
    t: "Tailored walkthrough",
    d: "We focus on the features you care about.",
  },
  { i: Clock, t: "Quick and focused", d: "See HoverMail in action, no fluff." },
  {
    i: ShieldCheck,
    t: "No commitment",
    d: "Ask anything. No pressure to buy.",
  },
];

export function DemoProvider({ children }: { children: React.ReactNode }) {
  const [isOpen, setOpen] = useState(false);
  const [email, setEmail] = useState("");
  const open = useCallback((e?: string) => {
    setEmail(e ?? "");
    setOpen(true);
  }, []);
  return (
    <Ctx.Provider value={{ open }}>
      {children}
      <Dialog.Root open={isOpen} onOpenChange={setOpen}>
        <AnimatePresence>
          {isOpen && (
            <Dialog.Portal forceMount>
              <Dialog.Overlay asChild forceMount>
                <motion.div
                  className="fixed inset-0 z-[60] bg-hm-ink/60 backdrop-blur-sm"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                />
              </Dialog.Overlay>
              <Dialog.Content asChild forceMount aria-describedby="demo-desc">
                <motion.div
                  className="fixed left-1/2 top-1/2 z-[61] grid max-h-[92vh] w-[calc(100vw-1.5rem)] max-w-4xl overflow-hidden rounded-3xl bg-white shadow-2xl md:grid-cols-[320px_1fr]"
                  style={{ x: "-50%", y: "-50%" }}
                  initial={{ opacity: 0, scale: 0.96 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.97 }}
                  transition={{ duration: 0.22 }}
                >
                  {/* left brand panel */}
                  <aside className="relative hidden flex-col justify-between overflow-hidden bg-gradient-to-br from-[#E8202B] via-[#C01822] to-[#7A0B12] p-8 text-white md:flex">
                    <div
                      aria-hidden
                      className="pointer-events-none absolute -right-24 -top-24 h-72 w-72 rotate-45 bg-white/[0.07]"
                    />
                    <div
                      aria-hidden
                      className="pointer-events-none absolute -bottom-24 -left-16 h-64 w-64 rounded-full bg-black/15 blur-3xl"
                    />
                    <div className="relative">
                      <span className="inline-flex items-center gap-1.5 rounded-full border border-white/30 bg-white/10 px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.12em]">
                        <Zap
                          className="h-3.5 w-3.5"
                          fill="currentColor"
                          aria-hidden="true"
                        />{" "}
                        Free demo
                      </span>
                      <p className="mt-5 text-3xl font-extrabold leading-tight tracking-tight">
                        See HoverMail in action.
                      </p>
                      <p className="mt-3 text-sm leading-relaxed text-white/80">
                        Build, send and grow with a workspace made for teams
                        that actually send.
                      </p>
                    </div>
                    <ul className="relative mt-8 space-y-5">
                      {PERKS.map(({ i: Icon, t, d }) => (
                        <li key={t} className="flex items-start gap-3">
                          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white/15 ring-1 ring-white/20">
                            <Icon className="h-5 w-5" aria-hidden="true" />
                          </span>
                          <span>
                            <span className="block text-sm font-semibold">
                              {t}
                            </span>
                            <span className="block text-xs leading-snug text-white/70">
                              {d}
                            </span>
                          </span>
                        </li>
                      ))}
                    </ul>
                  </aside>

                  {/* right form panel */}
                  <div className="relative overflow-y-auto p-6 sm:p-8">
                    <Dialog.Close
                      className="absolute right-4 top-4 rounded-lg p-2 text-hm-gray transition hover:bg-hm-bg hover:text-hm-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-hm-red"
                      aria-label="Close"
                    >
                      <X className="h-5 w-5" />
                    </Dialog.Close>
                    <span className="mb-3 inline-flex h-11 w-11 items-center justify-center rounded-xl bg-red-50 text-hm-red md:hidden">
                      <CalendarCheck className="h-5 w-5" aria-hidden="true" />
                    </span>
                    <Dialog.Title className="pr-8 text-2xl font-bold tracking-tight text-hm-ink">
                      Get a free demo
                    </Dialog.Title>
                    <Dialog.Description
                      id="demo-desc"
                      className="mt-1.5 text-sm leading-relaxed text-hm-gray"
                    >
                      Tell us a little about your team and what you want to see.
                      We will tailor the walkthrough to you.
                    </Dialog.Description>
                    <div className="mt-6">
                      <DemoForm defaultEmail={email} onDone={() => {}} />
                    </div>
                  </div>
                </motion.div>
              </Dialog.Content>
            </Dialog.Portal>
          )}
        </AnimatePresence>
      </Dialog.Root>
    </Ctx.Provider>
  );
}

/* ------------------------------------------------------------ buttons */
export function DemoButton({
  children = "Get a Free Demo",
  variant = "secondary",
  className,
  icon = true,
}: {
  children?: React.ReactNode;
  variant?: "primary" | "secondary" | "dark" | "link";
  className?: string;
  icon?: boolean;
}) {
  const { open } = useDemo();
  const base = {
    primary: cta.primary,
    secondary: cta.secondary,
    link: cta.link,
    dark: "inline-flex h-12 items-center justify-center gap-2 rounded-xl border border-white/30 bg-white/5 px-6 text-[15px] font-semibold text-white transition hover:bg-white/15 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white",
  }[variant];
  return (
    <button
      type="button"
      onClick={() => open()}
      className={cn(base, className)}
    >
      {icon && <CalendarCheck className="h-4 w-4" aria-hidden="true" />}
      {children}
    </button>
  );
}

/** Hero quick-capture: email + button → opens the full form with the email prefilled. */
export function HeroEmailInput() {
  const { open } = useDemo();
  const [v, setV] = useState("");
  const [touched, setTouched] = useState(false);
  const valid = z.string().email().safeParse(v).success;
  return (
    <form
      noValidate
      onSubmit={(e) => {
        e.preventDefault();
        setTouched(true);
        if (valid) open(v);
      }}
      className="mx-auto w-full max-w-lg"
      aria-label="Request a demo"
    >
      <div className="flex flex-col gap-2 rounded-2xl border border-hm-line bg-white p-1.5 shadow-[0_12px_32px_-14px_rgba(225,29,38,.25)] transition focus-within:border-hm-red focus-within:ring-4 focus-within:ring-red-100 sm:flex-row">
        <label htmlFor="hero-email" className="sr-only">
          Work email
        </label>
        <div className="relative flex-1">
          <Mail
            className="pointer-events-none absolute left-3.5 top-1/2 h-[18px] w-[18px] -translate-y-1/2 text-hm-red"
            aria-hidden="true"
          />
          <input
            id="hero-email"
            type="email"
            autoComplete="email"
            inputMode="email"
            placeholder="Enter your work email"
            value={v}
            onChange={(e) => setV(e.target.value)}
            aria-invalid={touched && !valid}
            aria-describedby="hero-email-err"
            className="h-12 w-full rounded-xl bg-transparent pl-11 pr-3 text-[15px] text-hm-ink outline-none placeholder:text-hm-gray/70"
          />
        </div>
        <button
          type="submit"
          className="inline-flex h-12 items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-hm-red to-[#FF3B44] px-6 text-sm font-semibold text-white shadow-lg shadow-red-500/25 transition hover:brightness-110 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-hm-red focus-visible:ring-offset-2 active:scale-[0.98]"
        >
          Get Demo <ArrowRight className="h-4 w-4" aria-hidden="true" />
        </button>
      </div>
      <p
        id="hero-email-err"
        role="alert"
        className="mt-2 h-4 text-left text-xs font-medium text-red-600"
      >
        {touched && !valid ? "Please enter a valid email address." : ""}
      </p>
    </form>
  );
}

/* ------------------------------------------------------------ the form */
export function DemoForm({
  defaultEmail = "",
  onDone,
  compact = false,
}: {
  defaultEmail?: string;
  onDone?: () => void;
  compact?: boolean;
}) {
  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: "",
      email: defaultEmail,
      company: "",
      teamSize: "",
      interests: [],
      message: "",
      consent: undefined as any,
    },
  });
  const [done, setDone] = useState<null | "sent" | "mail">(null);
  const [error, setError] = useState("");
  const msgLen = (watch("message") ?? "").length;

  const onSubmit = async (v: FormValues) => {
    setError("");
    const payload = {
      ...v,
      source: "hovermail-landing",
      requestedAt: new Date().toISOString(),
    };
    try {
      if (DEMO.endpoint) {
        const res = await fetch(DEMO.endpoint, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
          },
          body: JSON.stringify(payload),
        });
        if (!res.ok)
          throw new Error("The request could not be sent. Please try again.");
        setDone("sent");
        onDone?.();
      } else if (DEMO.email) {
        const body = `Name: ${v.name}\nEmail: ${v.email}\nCompany: ${v.company || "-"}\nTeam size: ${v.teamSize || "-"}\nInterested in: ${(v.interests ?? []).join(", ") || "-"}\n\n${v.message || ""}`;
        window.location.href = `mailto:${DEMO.email}?subject=${encodeURIComponent("HoverMail demo request")}&body=${encodeURIComponent(body)}`;
        setDone("mail");
        onDone?.();
      } else {
        throw new Error(
          "Demo requests are not connected yet. Set NEXT_PUBLIC_DEMO_ENDPOINT or NEXT_PUBLIC_DEMO_EMAIL.",
        );
      }
    } catch (e: any) {
      setError(e.message || "Something went wrong.");
    }
  };

  if (done) {
    return (
      <div className="py-8 text-center" role="status">
        <span className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-emerald-50 ring-8 ring-emerald-50/60">
          <CheckCircle2
            className="h-10 w-10 text-emerald-500"
            aria-hidden="true"
          />
        </span>
        <h3 className="mt-6 text-2xl font-bold tracking-tight text-hm-ink">
          {done === "sent" ? "Request received" : "Almost there"}
        </h3>
        <p className="mx-auto mt-2 max-w-sm text-sm leading-relaxed text-hm-gray">
          {done === "sent"
            ? "Thanks! We will get back to you about your demo."
            : "Your email app should have opened. Send the message to complete your request."}
        </p>
        {DEMO.bookingUrl && (
          <a
            href={DEMO.bookingUrl}
            target="_blank"
            rel="noopener noreferrer"
            className={cn(cta.primary, "mt-6")}
          >
            <CalendarCheck className="h-4 w-4" aria-hidden="true" />
            Pick a time
          </a>
        )}
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-5">
      <div className={cn("grid gap-4", !compact && "sm:grid-cols-2")}>
        <div>
          <label htmlFor="d-name" className={label}>
            Full name
          </label>
          <IconWrap icon={User}>
            <input
              id="d-name"
              autoComplete="name"
              placeholder="Jane Cooper"
              className={input}
              aria-invalid={!!errors.name}
              aria-describedby="d-name-e"
              {...register("name")}
            />
          </IconWrap>
          <Err id="d-name-e" m={errors.name?.message} />
        </div>
        <div>
          <label htmlFor="d-email" className={label}>
            Work email
          </label>
          <IconWrap icon={Mail}>
            <input
              id="d-email"
              type="email"
              autoComplete="email"
              placeholder="jane@company.com"
              className={input}
              aria-invalid={!!errors.email}
              aria-describedby="d-email-e"
              {...register("email")}
            />
          </IconWrap>
          <Err id="d-email-e" m={errors.email?.message} />
        </div>
        <div>
          <label htmlFor="d-company" className={label}>
            Company <span className="font-normal text-hm-gray">(optional)</span>
          </label>
          <IconWrap icon={Building2}>
            <input
              id="d-company"
              autoComplete="organization"
              placeholder="Acme Studio"
              className={input}
              {...register("company")}
            />
          </IconWrap>
        </div>
        <div>
          <label htmlFor="d-size" className={label}>
            Team size{" "}
            <span className="font-normal text-hm-gray">(optional)</span>
          </label>
          <IconWrap icon={Users}>
            <select
              id="d-size"
              className={cn(input, "appearance-none pr-10")}
              {...register("teamSize")}
            >
              <option value="">Select…</option>
              {TEAM_SIZES.map((s) => (
                <option key={s}>{s}</option>
              ))}
            </select>
            <ChevronDown
              className="pointer-events-none absolute right-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-hm-gray"
              aria-hidden="true"
            />
          </IconWrap>
        </div>
      </div>

      <fieldset>
        <legend className={label}>What would you like to see?</legend>
        <div className="flex flex-wrap gap-2">
          {INTEREST_OPTIONS.map((o) => (
            <label key={o} className="cursor-pointer">
              <input
                type="checkbox"
                value={o}
                className="peer sr-only"
                {...register("interests")}
              />
              <span className="inline-flex rounded-full border border-hm-line bg-white px-3.5 py-2 text-sm text-hm-ink transition hover:border-hm-ink/40 peer-checked:border-hm-red peer-checked:bg-red-50 peer-checked:font-medium peer-checked:text-hm-red peer-focus-visible:ring-2 peer-focus-visible:ring-hm-red">
                {o}
              </span>
            </label>
          ))}
        </div>
      </fieldset>

      <div>
        <label htmlFor="d-msg" className={label}>
          Anything else?{" "}
          <span className="font-normal text-hm-gray">(optional)</span>
        </label>
        <IconWrap icon={MessageSquareText} top>
          <textarea
            id="d-msg"
            rows={3}
            placeholder="Tell us about your use case…"
            className={cn(input, "h-auto resize-none py-3")}
            aria-describedby="d-msg-e"
            {...register("message")}
          />
        </IconWrap>
        <div className="mt-1 flex items-start justify-between gap-3">
          <Err id="d-msg-e" m={errors.message?.message} />
          <span
            className={cn(
              "ml-auto text-[11px]",
              msgLen > 600 ? "text-red-600" : "text-hm-gray",
            )}
          >
            {msgLen}/600
          </span>
        </div>
      </div>

      <div>
        <label className="flex items-start gap-3 rounded-xl border border-hm-line bg-hm-bg p-3.5 text-sm leading-relaxed text-hm-gray">
          <input
            type="checkbox"
            className="mt-1 h-4 w-4 rounded border-hm-line accent-hm-red"
            aria-describedby="d-consent-e"
            {...register("consent")}
          />
          <span>I agree to be contacted about my demo request.</span>
        </label>
        <Err id="d-consent-e" m={errors.consent?.message} />
      </div>

      {error && (
        <p
          role="alert"
          className="rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-700"
        >
          {error}
        </p>
      )}

      <button
        type="submit"
        disabled={isSubmitting}
        className="flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-hm-red to-[#FF3B44] text-[15px] font-semibold text-white shadow-lg shadow-red-500/25 transition hover:brightness-110 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-hm-red focus-visible:ring-offset-2 active:scale-[0.99] disabled:opacity-60"
      >
        {isSubmitting ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
            Sending…
          </>
        ) : (
          <>
            Request my free demo{" "}
            <ArrowRight className="h-4 w-4" aria-hidden="true" />
          </>
        )}
      </button>
    </form>
  );
}
