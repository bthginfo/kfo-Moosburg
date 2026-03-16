import { IMAGES } from "./images";
import { Users, Award, Heart } from "lucide-react";
import { ScrollReveal } from "./ScrollReveal";
import { AnimatedCounter } from "./AnimatedCounter";
import { motion } from "motion/react";

const stats = [
  { icon: Users, value: "2.000+", label: "Patienten" },
  { icon: Award, value: "15+", label: "Jahre Erfahrung" },
  { icon: Heart, value: "5,0", label: "Google Rating" },
];

export function AboutSection() {
  return (
    <section className="overflow-hidden">
      <div className="px-5 md:px-10">
        <div className="max-w-[80rem] mx-auto py-16 md:py-24">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-16 items-center">
            {/* Left: Text */}
            <div className="flex flex-col justify-center items-start order-2 md:order-1">
              <ScrollReveal direction="left">
                <h3 className="text-2xl md:text-[2.25rem] leading-tight">
                  Ihr Ansprechpartner des Vertrauens
                </h3>
              </ScrollReveal>
              <div className="h-4" />
              <ScrollReveal direction="left" delay={100}>
                <p>
                  Wir legen großen Wert darauf, sowohl auf die Bedürfnisse unserer
                  jungen Patienten einzugehen, als auch für die Eltern ein
                  Ansprechpartner des{" "}
                  <strong className="text-[#0d1317]">Vertrauens</strong> zu sein.
                  Unser Ziel sind bestmögliche Ergebnisse in{" "}
                  <strong className="text-[#0d1317]">Funktion</strong> und{" "}
                  <strong className="text-[#0d1317]">Ästhetik</strong>.
                </p>
              </ScrollReveal>
              <div className="h-2" />
              <ScrollReveal direction="left" delay={200}>
                <p>
                  Dabei ist es uns besonders wichtig die Behandlung so{" "}
                  <strong className="text-[#0d1317]">angenehm</strong> und{" "}
                  <strong className="text-[#0d1317]">kurz</strong> wie möglich zu
                  halten. Wir freuen uns auf Sie!
                </p>
              </ScrollReveal>

              {/* Stats row */}
              <div className="grid grid-cols-3 gap-4 mt-8 w-full">
                {stats.map((stat, i) => {
                  const Icon = stat.icon;
                  return (
                    <ScrollReveal key={i} delay={300 + i * 120} scale>
                      <motion.div
                        whileHover={{ y: -4, boxShadow: "0 8px 24px rgba(6,50,85,0.1)" }}
                        transition={{ type: "spring", stiffness: 300 }}
                        className="flex flex-col items-center text-center p-3 md:p-4 bg-[#edf7ff] rounded-2xl"
                      >
                        <Icon className="w-5 h-5 text-[#f58a07] mb-1.5" strokeWidth={1.5} />
                        <div className="text-[#063255] text-lg md:text-xl" style={{ fontWeight: 700 }}>
                          <AnimatedCounter target={stat.value} />
                        </div>
                        <div className="text-[#4a5d69] text-xs" style={{ fontWeight: 500 }}>
                          {stat.label}
                        </div>
                      </motion.div>
                    </ScrollReveal>
                  );
                })}
              </div>
            </div>

            {/* Right: Image */}
            <ScrollReveal direction="right" className="relative order-1 md:order-2">
              <div className="relative overflow-hidden rounded-[1.25rem] h-[300px] md:h-[40rem] group">
                <motion.img
                  whileHover={{ scale: 1.03 }}
                  transition={{ duration: 0.5 }}
                  src={IMAGES.teamGroup}
                  alt="Team der Kieferorthopädie Moosburg"
                  className="w-full h-full object-cover"
                  loading="lazy"
                />
              </div>
              {/* Orange decorative square */}
              <motion.div
                animate={{ rotate: [0, 3, 0, -3, 0] }}
                transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
                className="hidden md:block absolute -bottom-[5%] -right-[5%] bg-[#f58a07] rounded-[1.25rem] w-48 h-48 -z-10"
                style={{ mixBlendMode: "multiply" }}
              />
            </ScrollReveal>
          </div>
        </div>
      </div>
    </section>
  );
}