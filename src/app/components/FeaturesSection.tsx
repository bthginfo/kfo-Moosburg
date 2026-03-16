import { Heart, Clock, EyeOff, Shield, Handshake, Stethoscope } from "lucide-react";
import { ScrollReveal } from "./ScrollReveal";
import { motion } from "motion/react";

const features = [
  { icon: Heart, title: "Schonende\nZahnbewegung" },
  { icon: Clock, title: "Kurze\nBehandlungszeit" },
  { icon: EyeOff, title: "Unsichtbare\nZahnspangen" },
  { icon: Shield, title: "Möglichst Erhalt\naller Zähne" },
  { icon: Handshake, title: "Gemeinsame\nTherapieplanung" },
  { icon: Stethoscope, title: "Dauerhaft stabile\nErgebnisse" },
];

export function FeaturesSection() {
  return (
    <section id="uber-uns" className="bg-[#edf7ff]">
      <div className="px-5 md:px-10">
        <div className="max-w-[80rem] mx-auto py-16 md:py-24">
          <div className="grid gap-12 md:gap-16">
            {/* Header */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-12">
              <ScrollReveal direction="left">
                <h3 className="text-2xl md:text-[2.25rem] leading-tight">
                  Herzlich Willkommen in unserer Praxis für Kieferorthopädie in
                  Moosburg an der Isar
                </h3>
              </ScrollReveal>
              <ScrollReveal direction="right" delay={150}>
                <p>
                  Zusammen mit unserem Team stehen wir sowohl{" "}
                  <strong className="text-[#0d1317]">Kindern und Jugendlichen</strong>{" "}
                  als auch{" "}
                  <strong className="text-[#0d1317]">Erwachsenen</strong> in
                  kieferorthopädischen Fragen zur Seite. Wir bieten Ihnen eine
                  hochwertige kieferorthopädische Behandlung mit moderner Technik
                  und hoher fachlicher Kompetenz in{" "}
                  <strong className="text-[#0d1317]">entspannter</strong> Atmosphäre.
                </p>
              </ScrollReveal>
            </div>

            {/* Features Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4 md:gap-5">
              {features.map((feature, index) => {
                const Icon = feature.icon;
                return (
                  <ScrollReveal key={index} delay={index * 100} scale>
                    <motion.div
                      whileHover={{
                        y: -6,
                        boxShadow: "0 12px 28px rgba(6,50,85,0.12)",
                      }}
                      transition={{ type: "spring", stiffness: 300, damping: 20 }}
                      className="flex flex-col items-center bg-white p-5 md:p-6 gap-3 rounded-[1.25rem] h-full cursor-default"
                    >
                      <motion.div
                        whileHover={{ rotate: [0, -10, 10, 0], scale: 1.15 }}
                        transition={{ duration: 0.5 }}
                        className="w-12 h-12 rounded-full bg-[#f58a07]/10 flex items-center justify-center"
                      >
                        <Icon className="w-6 h-6 text-[#f58a07]" strokeWidth={1.5} />
                      </motion.div>
                      <h4 className="text-center whitespace-pre-line text-sm md:text-base">
                        {feature.title}
                      </h4>
                    </motion.div>
                  </ScrollReveal>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
