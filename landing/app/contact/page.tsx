import type { Metadata } from "next";
import { Container } from "@/components/container";
import { site } from "@/lib/site";

export const metadata: Metadata = {
  title: "Contact",
  description: "Get in touch with the MailFlow team — sales questions, support, or anything else.",
  alternates: { canonical: "/contact" },
};

export default function ContactPage() {
  return (
    <section className="py-20">
      <Container className="grid gap-14 md:grid-cols-[0.9fr_1.1fr]">
        <div>
          <span className="tick text-indigo" />
          <h1 className="mt-5 font-display text-4xl font-medium tracking-tight text-ink sm:text-5xl">
            Talk to us.
          </h1>
          <p className="mt-6 max-w-[42ch] text-lg text-mist">
            Questions about a plan, migrating an existing list, or something the docs didn't cover — write in
            and we'll reply within a business day.
          </p>
          <div className="mt-8 space-y-1 text-sm">
            <p className="text-mist">Email</p>
            <a href="mailto:hello@mailflow.example.com" className="text-ink underline underline-offset-4">
              hello@mailflow.example.com
            </a>
          </div>
        </div>

        <form className="space-y-5 rounded-xl border border-line bg-paperDim p-8">
          <div className="grid gap-5 sm:grid-cols-2">
            <Field label="Name" name="name" type="text" />
            <Field label="Work email" name="email" type="email" />
          </div>
          <Field label="Company" name="company" type="text" />
          <div>
            <label htmlFor="message" className="mb-1.5 block text-sm text-mist">
              Message
            </label>
            <textarea
              id="message"
              name="message"
              rows={5}
              className="w-full rounded-lg border border-line bg-paper px-4 py-3 text-sm text-ink outline-none focus:border-indigo"
            />
          </div>
          <button
            type="submit"
            className="rounded-md bg-ink px-6 py-3 text-sm font-medium text-paper transition-colors hover:bg-indigo"
          >
            Send message
          </button>
          <p className="text-xs text-mist">
            This form posts nowhere yet — wire it to your backend's contact endpoint or an email service before
            going live.
          </p>
        </form>
      </Container>
    </section>
  );
}

function Field({ label, name, type }: { label: string; name: string; type: string }) {
  return (
    <div>
      <label htmlFor={name} className="mb-1.5 block text-sm text-mist">
        {label}
      </label>
      <input
        id={name}
        name={name}
        type={type}
        className="w-full rounded-lg border border-line bg-paper px-4 py-3 text-sm text-ink outline-none focus:border-indigo"
      />
    </div>
  );
}
