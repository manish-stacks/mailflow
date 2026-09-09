import type { Metadata } from "next";
import { Container } from "@/components/container";
import { site } from "@/lib/site";

export const metadata: Metadata = {
  title: "Terms of service",
  robots: { index: false },
};

export default function TermsPage() {
  return (
    <Container className="max-w-[720px] py-20">
      <span className="tick text-indigo" />
      <h1 className="mt-5 font-display text-4xl font-medium tracking-tight text-ink">Terms of service</h1>
      <p className="mt-6 text-mist">
        Placeholder page. Replace this with {site.name}'s actual terms — acceptable use for sending, billing terms
        for paid plans, and account suspension policy — before launch.
      </p>
    </Container>
  );
}
