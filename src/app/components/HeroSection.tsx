import { IMAGES } from "./images";
import { ChevronDown } from "lucide-react";
import { motion } from "motion/react";
import { useHomeContent } from "./hooks/useHomeContent";

const fadeUp = (delay: number) => ({
  initial: { opacity: 0, y: 30 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.7, delay, ease: [0.25, 0.46, 0.45, 0.94] },
});

export function HeroSection() {
  const c = useHomeContent();

  return (
    <header className="bg-[#dceaf5] overflow-hidden pt-20 md:pt-24 relative">
      <div className="px-5 md:px-10">
        <div className="max-w-[80rem] mx-auto py-12 md:py-24">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center mt-4 md:mt-12">
            {/* Left Content */}
            <div className="flex flex-col items-start">
              {/* Trust badge */}
              <motion.div {...fadeUp(0.1)} className="flex items-center gap-2 mb-6 bg-white/60 backdrop-blur-sm rounded-full px-4 py-2">
                <div className="flex -space-x-1">
                  {[...Array(5)].map((_, i) => (
                    <svg key={i} className="w-4 h-4 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                  ))}
                </div>
                <span className="text-[#4a5d69] text-sm" style={{ fontWeight: 500 }}>
                  {c.hero_trust_badge}
                </span>
              </motion.div>

              <motion.h1 {...fadeUp(0.25)} className="text-3xl md:text-5xl lg:text-[4rem]">
                {c.hero_title_line1}
                <br />
                {c.hero_title_line2}
              </motion.h1>
              <div className="h-4" />
              <motion.p {...fadeUp(0.4)} className="text-base md:text-lg max-w-md whitespace-pre-line">
                {c.hero_subtitle}
              </motion.p>
              <div className="h-8" />
              <motion.div {...fadeUp(0.55)} className="flex flex-wrap gap-3">
                <button
                  onClick={() => {
                    if (typeof (window as any).toggleDrFlexAppointments === "function") {
                      (window as any).toggleDrFlexAppointments();
                    }
                  }}
                  className="bg-[#f58a07] text-white hover:bg-[#ce7305] transition-all duration-200 rounded-full px-8 py-3.5 cursor-pointer hover:shadow-lg hover:shadow-[#f58a07]/30"
                  style={{ fontWeight: 500 }}
                >
                  {c.hero_cta_primary}
                </button>
                <a
                  href="#uber-uns"
                  className="bg-white/70 text-[#063255] hover:bg-white transition-all duration-200 rounded-full px-7 py-3.5 backdrop-blur-sm"
                  style={{ fontWeight: 500 }}
                >
                  {c.hero_cta_secondary}
                </a>
              </motion.div>
              <div className="h-8 md:h-16" />
            </div>

            {/* Right Image */}
            <motion.div
              initial={{ opacity: 0, scale: 0.9, x: 40 }}
              animate={{ opacity: 1, scale: 1, x: 0 }}
              transition={{ duration: 0.9, delay: 0.3, ease: [0.25, 0.46, 0.45, 0.94] }}
              className="relative min-h-[300px] md:min-h-[500px]"
            >
              <img
                src={c.hero_image}
                alt="Kieferorthopädie Moosburg – Moderne Praxis"
                className="relative z-[2] w-full h-full object-cover rounded-2xl shadow-2xl"
                loading="eager"
              />
              {/* Orange decorative shapes with float animation */}
              <motion.div
                animate={{ y: [0, -12, 0] }}
                transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                className="hidden md:block z-[3] absolute rounded-t-[1.25rem]"
                style={{
                  backgroundColor: "#f58a0780",
                  width: "8rem",
                  height: "10rem",
                  bottom: 0,
                  left: "17%",
                }}
              />
              <motion.div
                animate={{ y: [0, -8, 0] }}
                transition={{ duration: 5, repeat: Infinity, ease: "easeInOut", delay: 1 }}
                className="hidden md:block z-[1] absolute rounded-t-[1.25rem]"
                style={{
                  backgroundColor: "#f58a0780",
                  width: "8rem",
                  height: "20rem",
                  bottom: 0,
                  right: "15%",
                }}
              />
            </motion.div>
          </div>
        </div>
      </div>

      {/* Scroll indicator */}
      <div className="hidden md:flex justify-center pb-6 animate-bounce">
        <a href="#uber-uns" aria-label="Nach unten scrollen" className="text-[#4a5d69]/50 hover:text-[#f58a07] transition-colors">
          <ChevronDown className="w-6 h-6" />
        </a>
      </div>
    </header>
  );
}