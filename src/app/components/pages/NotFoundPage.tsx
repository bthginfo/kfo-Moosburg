import { useEffect } from "react";
import { Home, Phone } from "lucide-react";
import { Link } from "react-router";
import { PageMeta } from "../PageMeta";

export function NotFoundPage() {
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <main className="min-h-[70vh] pt-24 md:pt-28 px-5 md:px-10 flex items-center">
      <PageMeta
        title="Seite nicht gefunden | KFO Moosburg"
        description="Die aufgerufene Seite wurde nicht gefunden."
        noIndex
      />
      <div className="w-full max-w-2xl mx-auto py-16 md:py-24 text-center">
        <p
          className="text-[#f58a07] text-sm uppercase tracking-[0.18em]"
          style={{ fontWeight: 600 }}
        >
          Fehler 404
        </p>
        <h1 className="mt-4 text-3xl md:text-[3.25rem] leading-tight text-[#0d1317]">
          Diese Seite gibt es leider nicht.
        </h1>
        <p className="mt-5 text-[#4a5d69] max-w-xl mx-auto">
          Vielleicht ist der Link veraltet oder die Adresse wurde falsch eingegeben. Über die Startseite finden Sie schnell wieder zu allen Praxisinformationen.
        </p>

        <div className="mt-8 flex flex-col sm:flex-row items-stretch sm:items-center justify-center gap-3">
          <Link
            to="/"
            className="inline-flex items-center justify-center gap-2 rounded-full bg-[#063255] px-7 py-3.5 text-white hover:bg-[#f58a07] transition-colors"
            style={{ fontWeight: 500 }}
          >
            <Home className="w-4 h-4" />
            Zur Startseite
          </Link>
          <a
            href="tel:087617222750"
            className="inline-flex items-center justify-center gap-2 rounded-full border border-[#d7e1e8] bg-white px-7 py-3.5 text-[#063255] hover:border-[#f58a07] hover:text-[#f58a07] transition-colors"
            style={{ fontWeight: 500 }}
          >
            <Phone className="w-4 h-4" />
            Praxis anrufen
          </a>
        </div>
      </div>
    </main>
  );
}
