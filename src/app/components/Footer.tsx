import { Link } from "react-router";
import { useStoryblokContent, assetUrl } from "../../storyblok/useStoryblokContent";

export function Footer() {
  const { story, isConnected } = useStoryblokContent("einstellungen");
  const c = isConnected && story ? story.content : null;
  const logoSrc = c ? assetUrl(c.footer_logo_image, "") : "";

  return (
    <footer
      className="text-white relative overflow-hidden"
      style={{ backgroundColor: "#063255", paddingTop: "4rem", paddingBottom: "2rem" }}
    >
      <div className="px-5 md:px-10">
        <div className="max-w-[80rem] mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-[0.75fr_1.25fr] gap-8 md:gap-4">
            {/* Left: Logo */}
            <div className="flex flex-col items-start">
              {logoSrc ? (
                <img
                  src={logoSrc}
                  alt="KFO Moosburg"
                  className="h-8 md:h-10 w-auto"
                />
              ) : (
                <span className="text-2xl" style={{ fontWeight: 600 }}>
                  KFO <span className="text-[#f58a07]">Moosburg</span>
                </span>
              )}
              <div className="h-2" />
              <p className="text-[#dceaf5]/70 text-sm" style={{ fontWeight: 300 }}>
                Dr. Amann &amp; Dr. Burg
                <br />
                Kieferorthopädie Moosburg
              </p>
            </div>

            {/* Right: Links */}
            <div className="grid grid-cols-2 gap-6 md:gap-8">
              {/* Rechtliches */}
              <div className="flex flex-col items-start">
                <div className="text-[#edf7ff]" style={{ fontSize: "1.125rem", fontWeight: 600 }}>
                  Rechtliches
                </div>
                <div className="h-3" />
                <Link
                  to="/impressum-datenschutz#impressum"
                  className="text-[#dceaf5]/70 hover:text-white transition-colors mt-2"
                  style={{ fontWeight: 400 }}
                >
                  Impressum
                </Link>
                <Link
                  to="/impressum-datenschutz#datenschutz"
                  className="text-[#dceaf5]/70 hover:text-white transition-colors mt-2"
                  style={{ fontWeight: 400 }}
                >
                  Datenschutz
                </Link>
              </div>

              {/* Kontakt */}
              <div className="flex flex-col items-start">
                <div className="text-[#edf7ff]" style={{ fontSize: "1.125rem", fontWeight: 600 }}>
                  Kontakt
                </div>
                <div className="h-3" />
                <a
                  href="tel:087617222750"
                  className="text-[#dceaf5]/70 hover:text-white transition-colors mt-2"
                  style={{ fontWeight: 400 }}
                >
                  08761 7222750
                </a>
                <a
                  href="mailto:praxis@kfo-moosburg.de?subject=Anfrage%20an%20KFO%20Moosburg"
                  className="text-[#dceaf5]/70 hover:text-white transition-colors mt-2"
                  style={{ fontWeight: 400 }}
                >
                  praxis@kfo-moosburg.de
                </a>
                <a
                  href="https://www.instagram.com/kieferorthopaedie_moosburg/?hl=de"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-3 w-9 h-9 rounded-full bg-white/10 hover:bg-[#f58a07] flex items-center justify-center transition-colors"
                  aria-label="Instagram"
                >
                  <svg
                    className="w-4 h-4 text-[#dceaf5]"
                    viewBox="0 0 24 24"
                    fill="currentColor"
                  >
                    <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z" />
                  </svg>
                </a>
              </div>
            </div>
          </div>

          {/* Bottom */}
          <div className="mt-12 md:mt-16 pt-6 border-t border-white/10 flex flex-col sm:flex-row justify-between items-center gap-4">
            <p
              className="text-[#dceaf5]/50 text-sm"
              style={{ fontWeight: 300, marginBottom: 0 }}
            >
              &copy; {new Date().getFullYear()} Kieferorthopädie Moosburg.
              Alle Rechte vorbehalten.
            </p>
            <div className="flex gap-4">
              <Link
                to="/impressum-datenschutz#impressum"
                className="text-[#dceaf5]/50 hover:text-[#dceaf5] text-sm transition-colors"
                style={{ fontWeight: 300 }}
              >
                Impressum
              </Link>
              <Link
                to="/impressum-datenschutz#datenschutz"
                className="text-[#dceaf5]/50 hover:text-[#dceaf5] text-sm transition-colors"
                style={{ fontWeight: 300 }}
              >
                Datenschutz
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Extra bottom padding on mobile for sticky CTA */}
      <div className="h-20 lg:hidden" />

      {/* Decorative orange shapes */}
      <div
        className="hidden md:block absolute"
        style={{
          backgroundColor: "#f58a07",
          borderTopLeftRadius: "1.25rem",
          borderBottomLeftRadius: "1.25rem",
          width: "2rem",
          height: "10rem",
          top: "10%",
          right: 0,
        }}
      />
      <div
        className="hidden md:block absolute"
        style={{
          backgroundColor: "#f58a07",
          borderTopRightRadius: "1.25rem",
          width: "2rem",
          height: "6rem",
          bottom: 0,
          left: 0,
        }}
      />
    </footer>
  );
}