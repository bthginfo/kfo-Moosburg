import { motion } from "motion/react";

export function CTASection() {
  return (
    <section className="relative py-16 md:py-20 overflow-hidden" style={{ backgroundColor: "#063255" }}>
      {/* Decorative floating elements */}
      <motion.div
        animate={{ x: [0, 15, 0], y: [0, -10, 0] }}
        transition={{ duration: 7, repeat: Infinity, ease: "easeInOut" }}
        className="absolute top-0 right-0 w-64 h-64 rounded-full opacity-10"
        style={{ backgroundColor: "#f58a07", transform: "translate(30%, -40%)" }}
      />
      <motion.div
        animate={{ x: [0, -10, 0], y: [0, 12, 0] }}
        transition={{ duration: 9, repeat: Infinity, ease: "easeInOut" }}
        className="absolute bottom-0 left-0 w-48 h-48 rounded-full opacity-10"
        style={{ backgroundColor: "#f58a07", transform: "translate(-30%, 40%)" }}
      />
      <motion.div
        animate={{ scale: [1, 1.5, 1], opacity: [0.3, 0.6, 0.3] }}
        transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
        className="absolute top-1/2 left-1/4 w-3 h-3 rounded-full"
        style={{ backgroundColor: "#f58a07" }}
      />
      <motion.div
        animate={{ scale: [1, 1.8, 1], opacity: [0.2, 0.5, 0.2] }}
        transition={{ duration: 4, repeat: Infinity, ease: "easeInOut", delay: 1 }}
        className="absolute top-1/3 right-1/3 w-2 h-2 rounded-full"
        style={{ backgroundColor: "#f58a07" }}
      />
      <motion.div
        animate={{ y: [0, -20, 0], opacity: [0.1, 0.25, 0.1] }}
        transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
        className="absolute bottom-1/4 right-1/5 w-4 h-4 rounded-full"
        style={{ backgroundColor: "#f58a07" }}
      />

      {/* Content */}
      <div className="relative z-10 max-w-3xl mx-auto px-6 text-center">
        {/* Icon / Badge */}
        <motion.div
          initial={{ scale: 0, rotate: -30 }}
          whileInView={{ scale: 1, rotate: 0 }}
          viewport={{ once: true }}
          transition={{ type: "spring", stiffness: 200, delay: 0.1 }}
          className="inline-flex items-center justify-center w-14 h-14 rounded-2xl mb-6"
          style={{ backgroundColor: "rgba(245,138,7,0.15)" }}
        >
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#f58a07" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M8 2v4M16 2v4M3 10h18M5 4h14a2 2 0 012 2v14a2 2 0 01-2 2H5a2 2 0 01-2-2V6a2 2 0 012-2z" />
            <path d="M9 16l2 2 4-4" />
          </svg>
        </motion.div>

        <motion.h2
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="text-white text-2xl md:text-4xl mb-3"
        >
          Bereit für Ihr{" "}
          <span style={{ color: "#f58a07" }}>neues Lächeln</span>?
        </motion.h2>

        <motion.p
          initial={{ opacity: 0, y: 15 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.35 }}
          className="text-sm md:text-base mx-auto max-w-lg mb-8"
          style={{ color: "rgba(255,255,255,0.65)" }}
        >
          Vereinbaren Sie jetzt Ihren kostenlosen Ersttermin – wir beraten Sie
          gerne persönlich und unverbindlich.
        </motion.p>

        {/* Buttons */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.5 }}
          className="flex flex-col sm:flex-row items-center justify-center gap-3"
        >
          <motion.button
            whileHover={{ scale: 1.05, boxShadow: "0 10px 30px rgba(245,138,7,0.35)" }}
            whileTap={{ scale: 0.97 }}
            onClick={() => {
              if (typeof (window as any).toggleDrFlexAppointments === "function") {
                (window as any).toggleDrFlexAppointments();
              }
            }}
            className="group relative inline-flex items-center gap-2 text-white rounded-full px-8 py-3.5 cursor-pointer transition-colors"
            style={{ backgroundColor: "#f58a07", fontWeight: 500 }}
          >
            Ersttermin vereinbaren
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="transition-transform duration-200 group-hover:translate-x-1"
            >
              <path d="M5 12h14M12 5l7 7-7 7" />
            </svg>
          </motion.button>

          <motion.a
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.97 }}
            href="#kontakt"
            className="inline-flex items-center gap-2 text-white/80 hover:text-white border border-white/20 hover:border-white/40 rounded-full px-7 py-3.5 transition-all duration-200"
            style={{ fontWeight: 500, textDecoration: "none" }}
          >
            Kontakt aufnehmen
          </motion.a>
        </motion.div>

        {/* Trust line */}
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.7 }}
          className="mt-8 flex items-center justify-center gap-4 text-xs"
          style={{ color: "rgba(255,255,255,0.4)" }}
        >
          <span className="flex items-center gap-1.5">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="#f58a07" stroke="none">
              <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
            </svg>
            5,0/5 Google Bewertung
          </span>
          <span className="w-px h-3 bg-white/20" />
          <span>Kostenlose Erstberatung</span>
          <span className="w-px h-3 bg-white/20 hidden sm:block" />
          <span className="hidden sm:inline">Termine auch online</span>
        </motion.div>
      </div>
    </section>
  );
}