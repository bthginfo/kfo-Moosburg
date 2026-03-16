import { useState, useEffect } from "react";
import { Calendar } from "lucide-react";

/**
 * Floating "Ersttermin vereinbaren" button, visible only on mobile after scrolling past the hero.
 */
export function StickyMobileCTA() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setVisible(window.scrollY > 500);
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const triggerDrFlex = () => {
    if (typeof (window as any).toggleDrFlexAppointments === "function") {
      (window as any).toggleDrFlexAppointments();
    }
  };

  return (
    <div
      className={`lg:hidden fixed bottom-0 left-0 right-0 z-40 transition-all duration-300 ${
        visible
          ? "translate-y-0 opacity-100"
          : "translate-y-full opacity-0"
      }`}
      style={{ paddingBottom: "env(safe-area-inset-bottom, 0px)" }}
    >
      <div className="bg-white/95 backdrop-blur-md border-t border-[#0d1317]/10 px-4 py-3">
        <button
          onClick={triggerDrFlex}
          className="w-full bg-[#f58a07] text-white hover:bg-[#ce7305] transition-colors rounded-full py-3.5 flex items-center justify-center gap-2 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#f58a07]"
          style={{ fontWeight: 500 }}
          aria-label="Ersttermin online vereinbaren"
        >
          <Calendar className="w-5 h-5" aria-hidden="true" />
          Ersttermin vereinbaren
        </button>
      </div>
    </div>
  );
}
