import type { Metadata } from "next";
import { Container } from "@/components/container";
import { site } from "@/lib/site";

export const metadata: Metadata = {
  title: "Privacy policy",
  robots: { index: false },
};

export default function PrivacyPage() {
  return (
    <Container className="max-w-[720px] py-20">
      <span className="tick text-indigo" />
      <h1 className="mt-5 font-display text-4xl font-medium tracking-tight text-ink">Privacy policy</h1>
      <p className="mt-6 text-mist">
        Placeholder page. Replace this with {site.name}'s actual privacy policy — what contact and account data is
        collected, how sending data is used, and how people can request deletion — before launch.
      </p>
    </Container>
  );
}
