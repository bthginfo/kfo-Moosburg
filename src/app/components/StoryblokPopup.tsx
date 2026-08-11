import { useState, useEffect, useCallback, useId, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import { X, Calendar, Sparkles } from "lucide-react";
import { DEFAULTS } from "../../storyblok/contentDefaults";
import { openBooking } from "../../config/booking";
import { safeHref } from "../lib/safeContent";
import { lockBodyScroll } from "../lib/bodyScrollLock";

const SESSION_KEY = "kfo-popup-dismissed";

export function PracticePopup() {
  const [visible, setVisible] = useState(false);
  const [hasTriggered, setHasTriggered] = useState(false);
  const dialogRef = useRef<HTMLDivElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const titleId = useId();
  const descriptionId = useId();

  const config = {
    enabled: DEFAULTS.popup_enabled,
    title: DEFAULTS.popup_title,
    text: String(DEFAULTS.popup_text),
    cta_text: DEFAULTS.popup_cta_text,
    cta_link: DEFAULTS.popup_cta_link,
    cta_is_drflex: DEFAULTS.popup_cta_is_drflex,
    delay_seconds: DEFAULTS.popup_delay,
    show_once_per_session: DEFAULTS.popup_once_per_session,
    image: "",
    background_color: "",
  };

  useEffect(() => {
    if (!config.enabled || hasTriggered) return;

    // Check if already dismissed this session
    if (config.show_once_per_session) {
      try {
        if (sessionStorage.getItem(SESSION_KEY)) return;
      } catch { /* silent */ }
    }

    const timer = setTimeout(() => {
      setVisible(true);
      setHasTriggered(true);
    }, config.delay_seconds * 1000);

    return () => clearTimeout(timer);
  }, [config.enabled, config.delay_seconds, config.show_once_per_session, hasTriggered]);

  const handleClose = useCallback(() => {
    setVisible(false);
    try {
      sessionStorage.setItem(SESSION_KEY, "1");
    } catch { /* silent */ }
  }, []);

  useEffect(() => {
    if (!visible || !config.enabled) return;

    const previouslyFocused = document.activeElement instanceof HTMLElement
      ? document.activeElement
      : null;
    const focusFrame = window.requestAnimationFrame(() => closeButtonRef.current?.focus());

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        handleClose();
        return;
      }

      if (event.key !== "Tab" || !dialogRef.current) return;
      const focusable = Array.from(
        dialogRef.current.querySelectorAll<HTMLElement>(
          'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
        )
      );
      if (focusable.length === 0) {
        event.preventDefault();
        return;
      }

      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };

    const releaseScrollLock = lockBodyScroll();
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      window.cancelAnimationFrame(focusFrame);
      releaseScrollLock();
      document.removeEventListener("keydown", handleKeyDown);
      previouslyFocused?.focus();
    };
  }, [visible, config.enabled, handleClose]);

  const handleCTA = useCallback(() => {
    if (config.cta_is_drflex) {
      openBooking();
    } else if (config.cta_link) {
      const href = safeHref(config.cta_link, "");
      if (href) window.location.assign(href);
    }
    handleClose();
  }, [config.cta_is_drflex, config.cta_link, handleClose]);

  if (!config.enabled) return null;

  const bgColor = config.background_color || "#ffffff";
  const isDark = bgColor !== "#ffffff" && bgColor !== "" && bgColor !== "white";

  return (
    <AnimatePresence>
      {visible && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[300]"
            aria-hidden="true"
          />

          {/* Popup */}
          <motion.div
            initial={{ opacity: 0, scale: 0.85, y: 40 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            transition={{ type: "spring", damping: 22, stiffness: 250 }}
            className="fixed inset-0 z-[301] flex items-center justify-center overflow-y-auto p-4"
            onMouseDown={(event) => {
              if (event.target === event.currentTarget) handleClose();
            }}
          >
            <div
              ref={dialogRef}
              role="dialog"
              aria-modal="true"
              aria-labelledby={titleId}
              aria-describedby={descriptionId}
              className="relative w-full max-w-md max-h-[calc(100dvh-2rem)] rounded-3xl shadow-2xl overflow-y-auto overscroll-contain"
              style={{ backgroundColor: bgColor }}
            >
              {/* Close button */}
              <button
                ref={closeButtonRef}
                type="button"
                onClick={handleClose}
                className={`absolute top-4 right-4 z-10 w-9 h-9 rounded-full flex items-center justify-center transition-colors cursor-pointer ${
                  isDark
                    ? "bg-white/15 hover:bg-white/25 text-white"
                    : "bg-[#f6f7f9] hover:bg-[#eaebf0] text-[#4a5d69]"
                }`}
                aria-label="Popup schließen"
              >
                <X className="w-4 h-4" />
              </button>

              {/* Optional Image */}
              {config.image && (
                <div className="h-40 overflow-hidden">
                  <img
                    src={config.image}
                    alt=""
                    className="w-full h-full object-cover"
                  />
                </div>
              )}

              {/* Content */}
              <div className="p-7 md:p-8">
                {/* Decorative icon */}
                <motion.div
                  animate={{ rotate: [0, 5, 0, -5, 0] }}
                  transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
                  className="w-14 h-14 rounded-2xl flex items-center justify-center mb-5"
                  style={{
                    backgroundColor: isDark ? "rgba(245,138,7,0.2)" : "rgba(245,138,7,0.1)",
                  }}
                >
                  <Sparkles className="w-6 h-6 text-[#f58a07]" />
                </motion.div>

                <h2
                  id={titleId}
                  className={`text-xl md:text-2xl mb-3 ${isDark ? "text-white" : "text-[#0d1317]"}`}
                  style={{ fontWeight: 700 }}
                >
                  {config.title}
                </h2>

                <p
                  id={descriptionId}
                  className={`text-sm mb-6 ${isDark ? "text-white/75" : "text-[#4a5d69]"}`}
                  style={{ marginBottom: 0 }}
                >
                  {config.text.split("**").map((part, i) =>
                    i % 2 === 1 ? (
                      <strong key={i} className={isDark ? "text-white" : "text-[#0d1317]"}>
                        {part}
                      </strong>
                    ) : (
                      <span key={i}>{part}</span>
                    )
                  )}
                </p>

                <div className="h-6" />

                {/* CTA Buttons */}
                <div className="flex flex-col gap-2.5">
                  <motion.button
                    type="button"
                    whileHover={{ scale: 1.03 }}
                    whileTap={{ scale: 0.97 }}
                    onClick={handleCTA}
                    className="w-full bg-[#f58a07] hover:bg-[#ce7305] text-white rounded-full px-6 py-3.5 flex items-center justify-center gap-2 transition-colors cursor-pointer"
                    style={{ fontWeight: 500 }}
                  >
                    <Calendar className="w-4 h-4" />
                    {config.cta_text}
                  </motion.button>

                  <button
                    type="button"
                    onClick={handleClose}
                    className={`w-full rounded-full px-6 py-3 text-sm transition-colors cursor-pointer ${
                      isDark
                        ? "text-white/60 hover:text-white"
                        : "text-[#4a5d69] hover:text-[#0d1317]"
                    }`}
                    style={{ fontWeight: 400 }}
                  >
                    Vielleicht später
                  </button>
                </div>
              </div>

              {/* Decorative corner shape */}
              <div
                className="absolute top-0 right-0 w-24 h-24 rounded-bl-[3rem] opacity-10"
                style={{ backgroundColor: "#f58a07" }}
              />
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
