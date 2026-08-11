import { ScrollReveal } from "../ScrollReveal";
import { HeroSection } from "../HeroSection";
import { FeaturesSection } from "../FeaturesSection";
import { AboutSection } from "../AboutSection";
import { ReviewsSection } from "../ReviewsSection";
import { ServicesSection } from "../ServicesSection";
import { RetainerSection } from "../RetainerSection";
import { CTASection } from "../CTASection";
import { TeamSection } from "../TeamSection";
import { AnamneseSection } from "../AnamneseSection";
import { GallerySection } from "../GallerySection";
import { ContactSection } from "../ContactSection";
import { HomeContentProvider } from "../hooks/useHomeContent";
import { PageMeta } from "../PageMeta";

export function KFOHomePage() {
  return (
    <HomeContentProvider>
      <PageMeta
        title="Kieferorthopädie Moosburg | Praxis Dr. Amann & Dr. Burg"
        description="Praxis für Kieferorthopädie in Moosburg an der Isar: moderne Zahnspangen und individuelle Behandlung für Kinder, Jugendliche und Erwachsene."
        path="/"
      />
      <main>
        <HeroSection />
        <ScrollReveal>
          <FeaturesSection />
        </ScrollReveal>
        <ScrollReveal>
          <AboutSection />
        </ScrollReveal>
        <ScrollReveal>
          <ReviewsSection />
        </ScrollReveal>
        <ServicesSection />
        <ScrollReveal>
          <RetainerSection />
        </ScrollReveal>
        <CTASection />
        <ScrollReveal>
          <TeamSection />
        </ScrollReveal>
        <AnamneseSection />
        <ScrollReveal>
          <GallerySection />
        </ScrollReveal>
        <ScrollReveal>
          <ContactSection />
        </ScrollReveal>
      </main>
    </HomeContentProvider>
  );
}
