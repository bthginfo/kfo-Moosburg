import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Cookie, ChevronDown, ChevronUp, Shield } from "lucide-react";

const COOKIE_KEY = "kfo-moosburg-cookie-consent";

interface CookiePreferences {
  necessary: boolean;
  analytics: boolean;
  marketing: boolean;
}

function getStoredConsent(): CookiePreferences | null {
  try {
    const val = localStorage.getItem(COOKIE_KEY);
    return val ? JSON.parse(val) : null;
  } catch {
    return null;
  }
}

function storeConsent(prefs: CookiePreferences) {
  try {
    localStorage.setItem(COOKIE_KEY, JSON.stringify(prefs));
  } catch {
    // silent fail
  }
}

export function CookieBanner() {
  const [visible, setVisible] = useState(false);
  const [showDetails, setShowDetails] = useState(false);
  const [preferences, setPreferences] = useState<CookiePreferences>({
    necessary: true,
    analytics: false,
    marketing: false,
  });

  useEffect(() => {
    // Small delay so it doesn't flash on page load
    const timer = setTimeout(() => {
      const stored = getStoredConsent();
      if (!stored) {
        setVisible(true);
      }
    }, 1200);
    return () => clearTimeout(timer);
  }, []);

  const handleAcceptAll = useCallback(() => {
    const allAccepted: CookiePreferences = { necessary: true, analytics: true, marketing: true };
    storeConsent(allAccepted);
    setVisible(false);
  }, []);

  const handleAcceptSelected = useCallback(() => {
    storeConsent(preferences);
    setVisible(false);
  }, [preferences]);

  const handleRejectAll = useCallback(() => {
    const onlyNecessary: CookiePreferences = { necessary: true, analytics: false, marketing: false };
    storeConsent(onlyNecessary);
    setVisible(false);
  }, []);

  const togglePref = useCallback((key: keyof CookiePreferences) => {
    if (key === "necessary") return; // always on
    setPreferences((prev) => ({ ...prev, [key]: !prev[key] }));
  }, []);

  return (
    <AnimatePresence>
      {visible && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/30 backdrop-blur-[2px] z-[200]"
          />

          {/* Banner */}
          <motion.div
            initial={{ y: 100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 100, opacity: 0 }}
            transition={{ type: "spring", damping: 25, stiffness: 200 }}
            className="fixed bottom-0 left-0 right-0 z-[201] p-4 md:p-6"
          >
            <div className="max-w-3xl mx-auto bg-white rounded-2xl shadow-2xl shadow-black/15 overflow-hidden border border-[#eaebf0]">
              {/* Main content */}
              <div className="p-5 md:p-7">
                <div className="flex items-start gap-4">
                  <div className="w-11 h-11 rounded-xl bg-[#f58a07]/10 flex items-center justify-center shrink-0">
                    <Cookie className="w-5 h-5 text-[#f58a07]" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-[#0d1317] text-base md:text-lg mb-1" style={{ fontWeight: 600 }}>
                      Cookie-Einstellungen
                    </h3>
                    <p className="text-[#4a5d69] text-sm" style={{ marginBottom: 0 }}>
                      Wir verwenden Cookies, um Ihnen die bestmögliche Erfahrung auf unserer Website zu bieten.
                      Einige Cookies sind notwendig, andere helfen uns, unsere Website und Ihr Erlebnis zu verbessern.{" "}
                      <a
                        href="/impressum-datenschutz#datenschutz"
                        className="text-[#f58a07] hover:underline"
                        style={{ fontWeight: 500 }}
                      >
                        Mehr erfahren
                      </a>
                    </p>
                  </div>
                </div>

                {/* Details toggle */}
                <button
                  onClick={() => setShowDetails(!showDetails)}
                  className="mt-4 flex items-center gap-1.5 text-[#4a5d69] hover:text-[#063255] text-sm transition-colors cursor-pointer"
                  style={{ fontWeight: 500 }}
                >
                  <Shield className="w-3.5 h-3.5" />
                  Cookie-Details anpassen
                  {showDetails ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                </button>

                {/* Detail options */}
                <AnimatePresence>
                  {showDetails && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.25 }}
                      className="overflow-hidden"
                    >
                      <div className="mt-4 space-y-3">
                        {/* Necessary */}
                        <CookieOption
                          label="Notwendig"
                          description="Erforderlich für die Grundfunktionen der Website."
                          checked={true}
                          disabled
                          onChange={() => {}}
                        />
                        {/* Analytics */}
                        <CookieOption
                          label="Analyse"
                          description="Google Analytics – hilft uns, die Nutzung der Website zu verstehen und zu verbessern."
                          checked={preferences.analytics}
                          onChange={() => togglePref("analytics")}
                        />
                        {/* Marketing */}
                        <CookieOption
                          label="Marketing"
                          description="Werden für personalisierte Inhalte und Werbung verwendet."
                          checked={preferences.marketing}
                          onChange={() => togglePref("marketing")}
                        />
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Buttons */}
                <div className="mt-5 flex flex-col sm:flex-row gap-2.5">
                  <button
                    onClick={handleAcceptAll}
                    className="flex-1 bg-[#f58a07] hover:bg-[#ce7305] text-white rounded-full px-6 py-3 transition-colors cursor-pointer"
                    style={{ fontWeight: 500 }}
                  >
                    Alle akzeptieren
                  </button>
                  {showDetails && (
                    <button
                      onClick={handleAcceptSelected}
                      className="flex-1 bg-[#063255] hover:bg-[#0a4a7f] text-white rounded-full px-6 py-3 transition-colors cursor-pointer"
                      style={{ fontWeight: 500 }}
                    >
                      Auswahl bestätigen
                    </button>
                  )}
                  <button
                    onClick={handleRejectAll}
                    className="flex-1 bg-white border border-[#eaebf0] hover:border-[#4a5d69] text-[#4a5d69] hover:text-[#0d1317] rounded-full px-6 py-3 transition-colors cursor-pointer"
                    style={{ fontWeight: 500 }}
                  >
                    Nur notwendige
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

function CookieOption({
  label,
  description,
  checked,
  disabled,
  onChange,
}: {
  label: string;
  description: string;
  checked: boolean;
  disabled?: boolean;
  onChange: () => void;
}) {
  return (
    <label
      className={`flex items-start gap-3 p-3 rounded-xl border transition-colors ${
        checked ? "bg-[#edf7ff] border-[#f58a07]/20" : "bg-[#f9fafb] border-[#eaebf0]"
      } ${disabled ? "" : "cursor-pointer hover:border-[#f58a07]/40"}`}
    >
      <div className="pt-0.5">
        <div
          className={`w-5 h-5 rounded-md border-2 flex items-center justify-center transition-colors ${
            checked
              ? "bg-[#f58a07] border-[#f58a07]"
              : "bg-white border-[#cbd5e1]"
          } ${disabled ? "opacity-60" : ""}`}
        >
          {checked && (
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
              <path d="M2.5 6L5 8.5L9.5 3.5" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          )}
        </div>
        <input
          type="checkbox"
          checked={checked}
          disabled={disabled}
          onChange={onChange}
          className="sr-only"
        />
      </div>
      <div className="flex-1 min-w-0">
        <div className="text-[#0d1317] text-sm" style={{ fontWeight: 600 }}>
          {label}
          {disabled && (
            <span className="text-[#979cae] text-xs ml-2" style={{ fontWeight: 400 }}>
              (immer aktiv)
            </span>
          )}
        </div>
        <div className="text-[#4a5d69] text-xs mt-0.5">{description}</div>
      </div>
    </label>
  );
}
