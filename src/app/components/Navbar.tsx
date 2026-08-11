import { useState, useEffect, useCallback, useRef } from "react";
import { Menu, X, Phone } from "lucide-react";
import { Link, useLocation } from "react-router";
import { useActiveSection } from "./hooks/useActiveSection";
import { useStoryblokContent, assetUrl } from "../../storyblok/useStoryblokContent";
import { DEFAULTS } from "../../storyblok/contentDefaults";
import { openBooking } from "../../config/booking";
import { safeTelephoneHref } from "../lib/safeContent";
import { useAccessibleModal } from "../lib/useAccessibleModal";

const navLinks = [
  { label: "Über uns", sectionId: "uber-uns" },
  { label: "Leistungen", sectionId: "leistungen" },
  { label: "Team", sectionId: "team" },
  { label: "Anamnesebogen", sectionId: "anamnesebogen" },
  { label: "Kontakt", sectionId: "kontakt" },
];

export function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const menuButtonRef = useRef<HTMLButtonElement>(null);
  const mobileDialogRef = useRef<HTMLDivElement>(null);
  const mobileCloseRef = useRef<HTMLButtonElement>(null);
  const location = useLocation();
  const isHomePage = location.pathname === "/";
  const activeSection = useActiveSection(location.pathname);
  const { story, isConnected } = useStoryblokContent("einstellungen");

  // Resolve content: Storyblok or defaults
  const c = isConnected && story ? story.content : null;
  const logoSrc = c ? assetUrl(c.nav_logo_image, "") : "";
  const navPhone = String(c?.nav_phone || DEFAULTS.nav_phone);
  const navPhoneHref = safeTelephoneHref(navPhone) || safeTelephoneHref(DEFAULTS.nav_phone);
  const navCtaText = String(c?.nav_cta_text || DEFAULTS.nav_cta_text);
  const handleNavClick = useCallback(() => setIsOpen(false), []);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    if (!isOpen) return;

    const desktopQuery = window.matchMedia("(min-width: 1024px)");
    const handleDesktopChange = () => {
      if (desktopQuery.matches) handleNavClick();
    };

    desktopQuery.addEventListener("change", handleDesktopChange);
    return () => {
      desktopQuery.removeEventListener("change", handleDesktopChange);
    };
  }, [handleNavClick, isOpen]);

  useAccessibleModal({
    open: isOpen,
    containerRef: mobileDialogRef,
    initialFocusRef: mobileCloseRef,
    returnFocusRef: menuButtonRef,
    onClose: handleNavClick,
  });

  useEffect(() => {
    setIsOpen(false);
  }, [location.pathname, location.hash]);

  const sectionHref = (sectionId: string) => `${isHomePage ? "" : "/"}#${sectionId}`;

  return (
    <>
      <nav
        aria-label="Hauptnavigation"
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
          scrolled
            ? "bg-white/95 backdrop-blur-md shadow-[0_1px_12px_rgba(0,0,0,0.08)]"
            : "bg-white"
        }`}
      >
        <div className="max-w-[80rem] mx-auto flex items-center justify-between px-4 md:px-8 py-2.5">
          {/* Logo */}
          <Link to="/" onClick={handleNavClick} className="flex items-center gap-1 group">
            {logoSrc ? (
              <img
                src={logoSrc}
                alt="KFO Moosburg"
                className="h-8 md:h-10 w-auto"
              />
            ) : (
              <span className="text-[#063255] text-xl md:text-2xl transition-colors" style={{ fontWeight: 600 }}>
                KFO <span className="text-[#f58a07] group-hover:text-[#ce7305] transition-colors">Moosburg</span>
              </span>
            )}
          </Link>

          {/* Desktop Nav */}
          <div className="hidden lg:flex items-center">
            {navLinks.map((link) => {
              const isActive = isHomePage && activeSection === link.sectionId;
              return (
                <a
                  key={link.sectionId}
                  href={sectionHref(link.sectionId)}
                  className={`relative px-4 py-4 transition-colors ${
                    isActive ? "text-[#f58a07]" : "text-[#4a5d69] hover:text-[#f58a07]"
                  }`}
                  style={{ fontWeight: 500 }}
                >
                  {link.label}
                  {isActive && (
                    <span className="absolute bottom-1 left-4 right-4 h-0.5 bg-[#f58a07] rounded-full" />
                  )}
                </a>
              );
            })}
            <a
              href={navPhoneHref}
              className="text-[#4a5d69] hover:text-[#f58a07] transition-colors px-4 py-4 flex items-center gap-1.5"
              style={{ fontWeight: 500 }}
            >
              <Phone className="w-3.5 h-3.5" />
              {navPhone}
            </a>
            <div className="ml-3">
              <button
                type="button"
                onClick={openBooking}
                className="bg-[#063255] text-[#dceaf5] hover:bg-[#f58a07] hover:text-white transition-all duration-200 rounded-full px-7 py-2.5 cursor-pointer hover:shadow-lg hover:shadow-[#f58a07]/20"
                style={{ fontWeight: 500 }}
              >
                {navCtaText}
              </button>
            </div>
          </div>

          {/* Mobile Menu Button */}
          <button
            ref={menuButtonRef}
            type="button"
            onClick={() => setIsOpen(!isOpen)}
            className="lg:hidden text-[#0d1317] p-2 rounded-lg hover:bg-[#edf7ff] transition-colors"
            aria-label={isOpen ? "Menü schließen" : "Menü öffnen"}
            aria-expanded={isOpen}
            aria-controls="mobile-navigation"
          >
            {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </nav>

      {isOpen && (
        <div
          ref={mobileDialogRef}
          id="mobile-navigation"
          role="dialog"
          aria-modal="true"
          aria-labelledby="mobile-navigation-title"
          tabIndex={-1}
          className="fixed inset-x-0 bottom-0 top-[60px] z-[60] lg:hidden"
        >
          <div className="absolute inset-0 bg-black/30" aria-hidden="true" onMouseDown={handleNavClick} />
          <div className="relative z-10 max-h-full overflow-y-auto overscroll-contain bg-white shadow-[0_12px_32px_rgba(0,0,0,0.1)]">
            <div className="flex items-center justify-between border-b border-[#e1e9ee] px-5 py-3">
              <span id="mobile-navigation-title" className="text-sm font-semibold text-[#063255]">Navigation</span>
              <button
                ref={mobileCloseRef}
                type="button"
                onClick={handleNavClick}
                className="flex h-10 w-10 items-center justify-center rounded-lg text-[#0d1317] transition-colors hover:bg-[#edf7ff] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#f58a07]"
                aria-label="Menü schließen"
              >
                <X className="h-6 w-6" />
              </button>
            </div>
            <nav aria-label="Mobile Hauptnavigation" className="space-y-1 px-5 py-5">
              {navLinks.map((link) => {
                const isActive = isHomePage && activeSection === link.sectionId;
                return (
                  <a
                    key={link.sectionId}
                    href={sectionHref(link.sectionId)}
                    onClick={handleNavClick}
                    className={`block rounded-xl px-4 py-3 transition-colors ${
                      isActive
                        ? "bg-[#f58a07]/5 text-[#f58a07]"
                        : "text-[#4a5d69] hover:bg-[#edf7ff] hover:text-[#f58a07]"
                    }`}
                    style={{ fontWeight: 500 }}
                  >
                    {link.label}
                  </a>
                );
              })}
              <a
                href={navPhoneHref}
                onClick={handleNavClick}
                className="flex items-center gap-2 rounded-xl px-4 py-3 text-[#4a5d69] transition-colors hover:bg-[#edf7ff]"
                style={{ fontWeight: 500 }}
              >
                <Phone className="h-4 w-4" />
                {navPhone}
              </a>
              <div className="pt-3">
                <button
                  type="button"
                  onClick={() => {
                    handleNavClick();
                    openBooking();
                  }}
                  className="block w-full cursor-pointer rounded-full bg-[#f58a07] px-8 py-3.5 text-center text-white transition-colors hover:bg-[#ce7305]"
                  style={{ fontWeight: 500 }}
                >
                  {navCtaText}
                </button>
              </div>
            </nav>
          </div>
        </div>
      )}
    </>
  );
}
