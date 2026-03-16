import { IMAGES } from "./images";
import { ScrollReveal } from "./ScrollReveal";
import { motion } from "motion/react";

const teamMembers = [
  {
    name: "Dr. Christoph Amann",
    role: "Fachzahnarzt für Kieferorthopädie",
    image: IMAGES.drAmann,
  },
  {
    name: "Dr. Julian Burg",
    role: "M.Sc. Kieferorthopädie",
    image: IMAGES.drBurg,
  },
];

export function TeamSection() {
  return (
    <section id="team">
      <div className="px-5 md:px-10">
        <div className="max-w-[80rem] mx-auto py-16 md:py-24">
          {/* Header */}
          <ScrollReveal>
            <div className="mb-10 md:mb-16 max-w-2xl">
              <h2 className="text-2xl md:text-[3rem] leading-tight">Unser Praxisteam</h2>
              <div className="h-4" />
              <p>Bei uns sind Sie in guten und professionellen Händen</p>
            </div>
          </ScrollReveal>

          {/* Team Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 md:gap-8 max-w-3xl">
            {teamMembers.map((member, index) => (
              <ScrollReveal key={index} delay={index * 150} scale>
                <motion.div
                  whileHover={{ y: -6 }}
                  transition={{ type: "spring", stiffness: 300 }}
                  className="relative overflow-hidden rounded-[1.25rem] group cursor-pointer"
                >
                  <motion.img
                    whileHover={{ scale: 1.05 }}
                    transition={{ duration: 0.5 }}
                    src={member.image}
                    alt={member.name}
                    className="w-full object-cover h-80 md:h-[30rem]"
                    loading="lazy"
                  />
                  {/* Gradient overlay */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent" />
                  {/* Info */}
                  <div className="absolute bottom-0 left-0 right-0 p-5 md:p-7">
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      viewport={{ once: true }}
                      transition={{ delay: 0.3 + index * 0.15, duration: 0.5 }}
                    >
                      <div className="text-white/70 text-xs md:text-sm" style={{ fontWeight: 400 }}>
                        {member.role}
                      </div>
                      <div className="text-white text-lg md:text-xl mt-0.5" style={{ fontWeight: 600 }}>
                        {member.name}
                      </div>
                    </motion.div>
                  </div>
                </motion.div>
              </ScrollReveal>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
