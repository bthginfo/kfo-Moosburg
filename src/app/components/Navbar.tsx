import { useState, useEffect, useCallback } from "react";
import { Menu, X, Phone } from "lucide-react";
import { Link } from "react-router";
import { useActiveSection } from "./hooks/useActiveSection";
import { useStoryblokContent, assetUrl } from "../../storyblok/useStoryblokContent";
import { DEFAULTS } from "../../storyblok/contentDefaults";

const navLinks = [
  { href: "#uber-uns", label: "Über uns", sectionId: "uber-uns" },
  { href: "#leistungen", label: "Leistungen", sectionId: "leistungen" },
  { href: "#team", label: "Team", sectionId: "team" },
  { href: "#anamnesebogen", label: "Anamnesebogen", sectionId: "anamnesebogen" },
  { href: "#kontakt", label: "Kontakt", sectionId: "kontakt" },
];

export function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const activeSection = useActiveSection();
  const { story, isConnected } = useStoryblokContent("einstellungen");

  // Resolve content: Storyblok or defaults
  const c = isConnected && story ? story.content : null;
  const logoSrc = c ? assetUrl(c.nav_logo_image, "") : "";

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Lock body scroll when mobile menu is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => { document.body.style.overflow = ""; };
  }, [isOpen]);

  const handleNavClick = useCallback(() => setIsOpen(false), []);

  return (
    <>
      <nav
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
              const isActive = activeSection === link.sectionId;
              return (
                <a
                  key={link.href}
                  href={link.href}
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
              href="tel:087617222750"
              className="text-[#4a5d69] hover:text-[#f58a07] transition-colors px-4 py-4 flex items-center gap-1.5"
              style={{ fontWeight: 500 }}
            >
              <Phone className="w-3.5 h-3.5" />
              08761 7222750
            </a>
            <div className="ml-3">
              <button
                onClick={() => {
                  if (typeof (window as any).toggleDrFlexAppointments === "function") {
                    (window as any).toggleDrFlexAppointments();
                  }
                }}
                className="bg-[#063255] text-[#dceaf5] hover:bg-[#f58a07] hover:text-white transition-all duration-200 rounded-full px-7 py-2.5 cursor-pointer hover:shadow-lg hover:shadow-[#f58a07]/20"
                style={{ fontWeight: 500 }}
              >
                Ersttermin vereinbaren
              </button>
            </div>
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="lg:hidden text-[#0d1317] p-2 rounded-lg hover:bg-[#edf7ff] transition-colors"
            aria-label={isOpen ? "Menü schließen" : "Menü öffnen"}
          >
            {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>

        {/* Mobile Menu Overlay */}
        {isOpen && (
          <div
            className="lg:hidden fixed inset-0 top-[52px] bg-black/30 z-40"
            onClick={handleNavClick}
          />
        )}

        {/* Mobile Menu */}
        <div
          className={`lg:hidden fixed top-[52px] left-0 right-0 bg-white z-50 transition-all duration-300 overflow-hidden ${
            isOpen ? "max-h-[calc(100vh-52px)] opacity-100" : "max-h-0 opacity-0"
          }`}
          style={{ boxShadow: isOpen ? "0 12px 32px rgba(0,0,0,0.1)" : "none" }}
        >
          <div className="px-5 py-6 space-y-1">
            {navLinks.map((link) => {
              const isActive = activeSection === link.sectionId;
              return (
                <a
                  key={link.href}
                  href={link.href}
                  onClick={handleNavClick}
                  className={`block py-3 px-4 rounded-xl transition-colors ${
                    isActive
                      ? "text-[#f58a07] bg-[#f58a07]/5"
                      : "text-[#4a5d69] hover:text-[#f58a07] hover:bg-[#edf7ff]"
                  }`}
                  style={{ fontWeight: 500 }}
                >
                  {link.label}
                </a>
              );
            })}
            <a
              href="tel:087617222750"
              className="flex items-center gap-2 text-[#4a5d69] py-3 px-4 rounded-xl hover:bg-[#edf7ff] transition-colors"
              style={{ fontWeight: 500 }}
            >
              <Phone className="w-4 h-4" />
              08761 7222750
            </a>
            <div className="pt-3">
              <button
                onClick={() => {
                  handleNavClick();
                  if (typeof (window as any).toggleDrFlexAppointments === "function") {
                    (window as any).toggleDrFlexAppointments();
                  }
                }}
                className="block w-full bg-[#f58a07] text-white text-center hover:bg-[#ce7305] transition-colors rounded-full px-8 py-3.5 cursor-pointer"
                style={{ fontWeight: 500 }}
              >
                Ersttermin vereinbaren
              </button>
            </div>
          </div>
        </div>
      </nav>
    </>
  );
}