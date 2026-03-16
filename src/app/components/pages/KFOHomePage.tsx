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

export function KFOHomePage() {
  return (
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
  );
}
