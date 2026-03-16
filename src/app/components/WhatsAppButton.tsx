import { useState, useEffect } from "react";
import { MessageCircle } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

export function WhatsAppButton() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const handleScroll = () => setVisible(window.scrollY > 600);
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <AnimatePresence>
      {visible && (
        <motion.a
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0, opacity: 0 }}
          transition={{ type: "spring", stiffness: 300, damping: 20 }}
          whileHover={{ scale: 1.15 }}
          whileTap={{ scale: 0.9 }}
          href="https://wa.me/491743873065?text=Hallo%2C%20ich%20möchte%20gerne%20einen%20Termin%20vereinbaren."
          target="_blank"
          rel="noopener noreferrer"
          aria-label="WhatsApp Nachricht senden"
          className="hidden md:flex fixed bottom-8 left-6 z-40 w-14 h-14 rounded-full bg-[#25D366] text-white items-center justify-center shadow-lg hover:shadow-xl"
        >
          <MessageCircle className="w-6 h-6" fill="white" strokeWidth={0} />
        </motion.a>
      )}
    </AnimatePresence>
  );
}
