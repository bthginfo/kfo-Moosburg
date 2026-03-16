import { useState } from "react";
import { MapPin, Phone, Mail, Clock, ExternalLink } from "lucide-react";
import { ScrollReveal } from "./ScrollReveal";

export function ContactSection() {
  const [mapActive, setMapActive] = useState(false);

  return (
    <section id="kontakt">
      <div className="px-5 md:px-10">
        <div className="max-w-[80rem] mx-auto py-16 md:py-24">
          {/* Header */}
          <ScrollReveal>
            <div className="mb-10 md:mb-16 max-w-2xl">
              <h2 className="text-2xl md:text-[3rem] leading-tight">Anfahrt &amp; Kontakt</h2>
              <div className="h-4" />
              <p>
                Parkplätze finden Sie in der öffentlichen Tiefgarage direkt unter
                der Praxis (Einfahrt Bahnhofstr. 1) oder als Kurzparker vor der
                Bäckerei Welter (Münchener Str. 2-4).
              </p>
            </div>
          </ScrollReveal>

          {/* Content: Info + Map */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-16">
            {/* Left: Contact details */}
            <ScrollReveal direction="left" delay={100}>
              <div className="space-y-6">
                {/* Address card */}
                <div className="flex items-start gap-4 p-5 bg-[#edf7ff] rounded-2xl">
                  <div className="w-10 h-10 rounded-full bg-[#f58a07]/10 flex items-center justify-center shrink-0 mt-0.5">
                    <MapPin className="w-5 h-5 text-[#f58a07]" />
                  </div>
                  <div>
                    <div className="text-[#0d1317]" style={{ fontWeight: 600 }}>
                      Kieferorthopädie Moosburg
                    </div>
                    <div className="text-[#4a5d69] text-sm mt-0.5" style={{ fontWeight: 500 }}>
                      Dr. Amann &amp; Dr. Burg
                    </div>
                    <div className="text-[#4a5d69] text-sm mt-2" style={{ fontWeight: 400 }}>
                      Münchener Straße 4a
                      <br />
                      85368 Moosburg an der Isar
                    </div>
                  </div>
                </div>

                {/* Contact items */}
                <div className="space-y-3">
                  <a
                    href="tel:087617222750"
                    className="flex items-center gap-4 p-4 rounded-2xl hover:bg-[#edf7ff] transition-colors group"
                  >
                    <div className="w-10 h-10 rounded-full bg-[#edf7ff] group-hover:bg-white flex items-center justify-center shrink-0 transition-colors">
                      <Phone className="w-5 h-5 text-[#063255]" />
                    </div>
                    <div>
                      <div className="text-[#4a5d69] text-xs" style={{ fontWeight: 500 }}>
                        Telefon
                      </div>
                      <div className="text-[#063255]" style={{ fontWeight: 600 }}>
                        08761 7222750
                      </div>
                    </div>
                  </a>

                  <a
                    href="https://wa.me/491743873065?text=Hallo%2C%20ich%20möchte%20gerne%20einen%20Termin%20vereinbaren."
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-4 p-4 rounded-2xl hover:bg-[#edf7ff] transition-colors group"
                  >
                    <div className="w-10 h-10 rounded-full bg-[#edf7ff] group-hover:bg-white flex items-center justify-center shrink-0 transition-colors">
                      <svg className="w-5 h-5 text-[#25D366]" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                      </svg>
                    </div>
                    <div>
                      <div className="text-[#4a5d69] text-xs" style={{ fontWeight: 500 }}>
                        WhatsApp <span className="text-[#4a5d69]/50">(Nur Nachrichten)</span>
                      </div>
                      <div className="text-[#063255]" style={{ fontWeight: 600 }}>
                        +49 174 3873065
                      </div>
                    </div>
                  </a>

                  <a
                    href="mailto:praxis@kfo-moosburg.de?subject=Anfrage%20an%20KFO%20Moosburg"
                    className="flex items-center gap-4 p-4 rounded-2xl hover:bg-[#edf7ff] transition-colors group"
                  >
                    <div className="w-10 h-10 rounded-full bg-[#edf7ff] group-hover:bg-white flex items-center justify-center shrink-0 transition-colors">
                      <Mail className="w-5 h-5 text-[#063255]" />
                    </div>
                    <div>
                      <div className="text-[#4a5d69] text-xs" style={{ fontWeight: 500 }}>
                        E-Mail
                      </div>
                      <div className="text-[#063255]" style={{ fontWeight: 600 }}>
                        praxis@kfo-moosburg.de
                      </div>
                    </div>
                  </a>
                </div>

                {/* Opening hours + Social */}
                <div className="flex items-start gap-4 p-5 bg-[#edf7ff] rounded-2xl">
                  <div className="w-10 h-10 rounded-full bg-[#f58a07]/10 flex items-center justify-center shrink-0 mt-0.5">
                    <Clock className="w-5 h-5 text-[#f58a07]" />
                  </div>
                  <div>
                    <div className="text-[#0d1317]" style={{ fontWeight: 600 }}>
                      Öffnungszeiten
                    </div>
                    <p className="text-[#4a5d69] text-sm mt-1" style={{ fontWeight: 400, marginBottom: 0 }}>
                      Unsere aktuellen Öffnungszeiten finden Sie bei{" "}
                      <a
                        href="https://www.google.de/search?q=kfo+moosburg"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-[#063255] hover:text-[#f58a07] transition-colors inline-flex items-center gap-0.5"
                        style={{ fontWeight: 500 }}
                      >
                        Google
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    </p>
                  </div>
                </div>

                {/* Social */}
                <div className="flex gap-3">
                  <a
                    href="https://www.instagram.com/kieferorthopaedie_moosburg/?hl=de"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-11 h-11 rounded-full bg-[#edf7ff] hover:bg-[#f58a07] flex items-center justify-center transition-colors group"
                    aria-label="Instagram"
                  >
                    <svg className="w-5 h-5 text-[#0d1317] group-hover:text-white transition-colors" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z" />
                    </svg>
                  </a>
                </div>
              </div>
            </ScrollReveal>

            {/* Right: Google Maps with scroll protection */}
            <ScrollReveal direction="right" delay={200}>
              <div className="rounded-[1.25rem] overflow-hidden h-80 md:h-auto relative">
                {!mapActive && (
                  <button
                    onClick={() => setMapActive(true)}
                    className="absolute inset-0 z-10 bg-[#063255]/10 backdrop-blur-[1px] flex flex-col items-center justify-center gap-3 cursor-pointer transition-all hover:bg-[#063255]/5 group"
                  >
                    <div className="w-14 h-14 rounded-full bg-white shadow-lg flex items-center justify-center group-hover:scale-110 transition-transform">
                      <MapPin className="w-6 h-6 text-[#f58a07]" />
                    </div>
                    <span
                      className="text-[#063255] bg-white/90 backdrop-blur-sm rounded-full px-4 py-1.5 text-sm shadow-md"
                      style={{ fontWeight: 500 }}
                    >
                      Karte aktivieren
                    </span>
                  </button>
                )}
                <iframe
                  src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d2645.456669718668!2d11.931745076738354!3d48.466953528173065!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x479e3d88016ac899%3A0xed130e306716fd3a!2sKieferorthop%C3%A4die%20Moosburg%20Dr.%20Amann%20%26%20Dr.%20Burg!5e0!3m2!1sde!2sde!4v1712132681998!5m2!1sde!2sde"
                  width="100%"
                  height="100%"
                  style={{
                    border: 0,
                    minHeight: "400px",
                    pointerEvents: mapActive ? "auto" : "none",
                  }}
                  allowFullScreen
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                  title="Standort Kieferorthopädie Moosburg"
                />
              </div>
            </ScrollReveal>
          </div>
        </div>
      </div>
    </section>
  );
}