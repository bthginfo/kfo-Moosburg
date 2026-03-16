import { IMAGES } from "./images";
import { FileText } from "lucide-react";
import { ScrollReveal } from "./ScrollReveal";
import { motion } from "motion/react";
import { useHomeContent } from "./hooks/useHomeContent";

export function AnamneseSection() {
  const c = useHomeContent();

  return (
    <section id="anamnesebogen" className="overflow-hidden">
      <div className="grid grid-cols-1 md:grid-cols-2">
        {/* Image */}
        <ScrollReveal direction="left" className="h-64 md:h-auto relative">
          <img
            src={c.anamnese_image}
            alt="Anamnesebogen digital ausfüllen"
            className="w-full h-full object-cover block"
            loading="lazy"
          />
        </ScrollReveal>
        {/* Content */}
        <div
          className="flex flex-col justify-center items-start text-white p-8 md:p-16 lg:p-20"
          style={{ backgroundColor: "#f58a07" }}
        >
          <ScrollReveal direction="right">
            <motion.div
              animate={{ rotate: [0, 5, 0, -5, 0] }}
              transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
              className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center mb-5"
            >
              <FileText className="w-6 h-6 text-white" />
            </motion.div>
          </ScrollReveal>
          <ScrollReveal direction="right" delay={100}>
            <h2 className="text-white text-2xl md:text-[3rem] leading-tight">{c.anamnese_title}</h2>
          </ScrollReveal>
          <div className="h-4" />
          <ScrollReveal direction="right" delay={200}>
            <p style={{ color: "rgba(255,255,255,0.85)" }}>
              {c.anamnese_description}
            </p>
          </ScrollReveal>
          <div className="h-6 md:h-8" />
          <ScrollReveal direction="right" delay={300}>
            <motion.a
              whileHover={{ scale: 1.05, boxShadow: "0 8px 24px rgba(0,0,0,0.15)" }}
              whileTap={{ scale: 0.97 }}
              href={c.anamnese_cta_link}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-block bg-white text-[#f58a07] hover:bg-[#063255] hover:text-white transition-colors duration-200 rounded-full px-8 py-3.5"
              style={{ fontWeight: 500, textDecoration: "none" }}
            >
              {c.anamnese_cta_text}
            </motion.a>
          </ScrollReveal>
        </div>
      </div>
    </section>
  );
}