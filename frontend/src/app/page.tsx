import type { Metadata } from 'next';
import { SITE } from '@/config/landing';
import { Nav } from '@/components/landing/nav';
import { Hero } from '@/components/landing/hero';
import { Features } from '@/components/landing/features';
import { AiSection, TemplatesSection } from '@/components/landing/ai-templates';
import { AudienceSection, AnalyticsSection } from '@/components/landing/audience-analytics';
import { TeamSection, DeveloperSection, WhiteLabelSection } from '@/components/landing/team-dev-brand';
import { HowItWorks, Pricing } from '@/components/landing/how-pricing';
import { Faq, FinalCta, Footer } from '@/components/landing/faq-footer';
import { FAQS } from '@/config/faqs';
import { DemoProvider } from '@/components/landing/demo';
import { DemoBand } from '@/components/landing/demo-band';
import { PhotoSection } from '@/components/landing/photos';
import { Motion } from '@/components/landing/motion-config';

const title = 'HoverMail — Email Marketing Platform | Every Campaign. One Powerful Platform.';

export const metadata: Metadata = {
  metadataBase: new URL(SITE.url),
  title,
  description: SITE.description,
  alternates: { canonical: '/' },
  openGraph: { title, description: SITE.description, type: 'website', siteName: SITE.name, url: '/' },
  twitter: { card: 'summary_large_image', title, description: SITE.description },
};

export default function LandingPage() {
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: FAQS.map(([q, a]) => ({ '@type': 'Question', name: q, acceptedAnswer: { '@type': 'Answer', text: a } })),
  };
  return (
    <Motion><DemoProvider>
    <div className="bg-white text-hm-ink [scroll-behavior:smooth]">
      <Nav />
      <main id="main">
        <Hero />
        <Features />
        <AiSection />
        <TemplatesSection />
        <AudienceSection />
        <AnalyticsSection />
        <TeamSection />
        <PhotoSection />
        <DeveloperSection />
        <WhiteLabelSection />
        <HowItWorks />
        <Pricing />
        <DemoBand />
        <Faq />
        <FinalCta />
      </main>
      <Footer />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
    </div>
    </DemoProvider></Motion>
  );
}
