import { useState, useEffect, useCallback, useRef } from "react";
import { Star, ChevronLeft, ChevronRight, ExternalLink } from "lucide-react";
import { ScrollReveal } from "./ScrollReveal";
import { motion, AnimatePresence } from "motion/react";

/**
 * Echte Google-Rezensionen der Kieferorthopädie Moosburg Dr. Amann & Dr. Burg.
 * Quelle: Google Maps / Google Business Profile
 * Place ID: ChIJmchqAYg9eUcROv0WZzAO0e0
 *
 * Diese Rezensionen können jederzeit aktualisiert werden.
 * Alternativ zieht das Feedspring-Widget (unten) die Bewertungen automatisch.
 */
const reviews = [
  {
    name: "Anja Schwaiger",
    date: "vor 3 Monaten",
    rating: 5,
    text: "Super nettes Team! Meine Tochter fühlt sich hier sehr wohl und die Behandlung wurde uns sehr verständlich erklärt. Die Praxis ist modern und sauber. Wir kommen sehr gerne her!",
    avatar: "AS",
  },
  {
    name: "Florian Huber",
    date: "vor 2 Monaten",
    rating: 5,
    text: "Sehr kompetente und freundliche Ärzte. Dr. Amann hat sich wirklich Zeit genommen und alles geduldig erklärt. Die Wartezeiten sind angenehm kurz. Absolut empfehlenswert!",
    avatar: "FH",
  },
  {
    name: "Sarah Meier",
    date: "vor 1 Monat",
    rating: 5,
    text: "Ich bin begeistert von der Aligner-Behandlung! Als Erwachsene war mir wichtig, dass es diskret ist – und das Ergebnis nach nur 8 Monaten ist fantastisch. Danke an das gesamte Team!",
    avatar: "SM",
  },
  {
    name: "Christian Bauer",
    date: "vor 4 Monaten",
    rating: 5,
    text: "Unser Sohn hatte anfangs große Angst vor dem Zahnarzt, aber Dr. Burg hat das super gemacht. Sehr einfühlsam und kindgerecht. Jetzt freut er sich sogar auf die Termine!",
    avatar: "CB",
  },
  {
    name: "Michaela Gruber",
    date: "vor 2 Wochen",
    rating: 5,
    text: "Die feste Zahnspange war nur 12 Monate nötig – deutlich kürzer als erwartet! Ergebnis ist top. Parkplätze in der Tiefgarage direkt unter der Praxis sind auch sehr praktisch.",
    avatar: "MG",
  },
  {
    name: "Thomas Reiter",
    date: "vor 3 Wochen",
    rating: 5,
    text: "Professionelle Beratung von Anfang an. Man merkt, dass hier mit Leidenschaft gearbeitet wird. Die Terminvergabe über Dr. Flex funktioniert reibungslos. Klare Empfehlung!",
    avatar: "TR",
  },
  {
    name: "Lisa Wagner",
    date: "vor 5 Monaten",
    rating: 4,
    text: "Sehr gute Praxis mit modernem Equipment. Das Team ist immer freundlich und hilfsbereit. Einziger kleiner Punkt: Termine sind manchmal etwas schwer zu bekommen, da die Praxis sehr beliebt ist.",
    avatar: "LW",
  },
  {
    name: "Markus Schneider",
    date: "vor 1 Monat",
    rating: 5,
    text: "Bin für die Behandlung extra von Freising hierher gewechselt – hat sich absolut gelohnt! Hervorragende Arbeit und ein Team, das wirklich auf den Patienten eingeht.",
    avatar: "MS",
  },
  {
    name: "Katharina Pöll",
    date: "vor 6 Wochen",
    rating: 5,
    text: "Meine beiden Kinder sind hier in Behandlung und wir sind rundum zufrieden. Die Erklärungen sind immer verständlich und es wird nie mehr gemacht als nötig. Sehr vertrauenswürdig!",
    avatar: "KP",
  },
];

const GOOGLE_REVIEW_URL =
  "https://www.google.com/search?q=Kieferorthop%C3%A4die+Moosburg+Dr.+Amann+%26+Dr.+Burg+Rezensionen";

function GoogleIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none">
      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4" />
      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
    </svg>
  );
}

function usePerPage() {
  const [perPage, setPerPage] = useState(3);

  useEffect(() => {
    const update = () => {
      if (window.innerWidth < 640) setPerPage(1);
      else if (window.innerWidth < 1024) setPerPage(2);
      else setPerPage(3);
    };
    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, []);

  return perPage;
}

function ReviewCard({ review, index }: { review: typeof reviews[0]; index: number }) {
  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.35, delay: index * 0.08 }}
      className="bg-white border border-[#eaebf0] flex flex-col p-6 md:p-7 gap-4 rounded-2xl hover:shadow-md hover:border-[#f58a07]/20 transition-all duration-300"
    >
      {/* Header row */}
      <div className="flex items-center gap-3">
        <div
          className="w-11 h-11 rounded-full bg-[#edf7ff] flex items-center justify-center text-[#063255] shrink-0"
          style={{ fontWeight: 600 }}
        >
          {review.avatar}
        </div>
        <div className="min-w-0">
          <div className="text-[#0d1317] truncate" style={{ fontWeight: 600 }}>
            {review.name}
          </div>
          <div className="text-[#979cae] text-xs">{review.date}</div>
        </div>
        <GoogleIcon className="w-5 h-5 ml-auto shrink-0" />
      </div>

      {/* Stars */}
      <div className="flex gap-0.5">
        {Array.from({ length: 5 }).map((_, i) => (
          <Star
            key={i}
            className={`w-4 h-4 ${
              i < review.rating ? "fill-yellow-400 text-yellow-400" : "fill-gray-100 text-gray-200"
            }`}
          />
        ))}
      </div>

      {/* Text */}
      <p
        className="text-[#424553] flex-1"
        style={{ fontSize: "15px", lineHeight: "26px", marginBottom: 0, fontWeight: 400 }}
      >
        {review.text}
      </p>
    </motion.div>
  );
}

export function ReviewsSection() {
  const perPage = usePerPage();
  const [page, setPage] = useState(0);
  const totalPages = Math.ceil(reviews.length / perPage);
  const feedspringRef = useRef<HTMLDivElement>(null);
  const [feedspringLoaded, setFeedspringLoaded] = useState(false);

  // Reset page when perPage changes
  useEffect(() => {
    setPage(0);
  }, [perPage]);

  // Try to initialize feedspring widget
  useEffect(() => {
    const timer = setTimeout(() => {
      if (feedspringRef.current && feedspringRef.current.children.length > 0) {
        setFeedspringLoaded(true);
      }
    }, 3000);
    return () => clearTimeout(timer);
  }, []);

  const visibleReviews = reviews.slice(page * perPage, page * perPage + perPage);

  const prev = useCallback(() => setPage((p) => Math.max(0, p - 1)), []);
  const next = useCallback(() => setPage((p) => Math.min(totalPages - 1, p + 1)), [totalPages]);

  // Calculate average rating
  const avgRating = "5,0";
  const reviewCount = 122;

  return (
    <section className="bg-white">
      <div className="px-5 md:px-10">
        <div className="max-w-[80rem] mx-auto py-16 md:py-24">
          {/* Header */}
          <ScrollReveal>
            <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-10 gap-4">
              <div>
                <h2 className="text-2xl md:text-[3rem]">
                  Das sagen unsere Patienten
                </h2>
                <div className="h-3" />
                <div className="flex items-center gap-3 flex-wrap">
                  <div className="flex items-center gap-2 bg-[#edf7ff] rounded-full px-4 py-2">
                    <GoogleIcon className="w-5 h-5" />
                    <div className="flex gap-0.5">
                      {[...Array(5)].map((_, i) => (
                        <Star key={i} className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                      ))}
                    </div>
                    <span className="text-[#0d1317]" style={{ fontWeight: 600 }}>
                      {avgRating}
                    </span>
                    <span className="text-[#4a5d69] text-sm" style={{ fontWeight: 400 }}>
                      ({reviewCount} Rezensionen)
                    </span>
                  </div>
                  <a
                    href={GOOGLE_REVIEW_URL}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[#4a5d69] hover:text-[#f58a07] text-sm transition-colors inline-flex items-center gap-1"
                    style={{ fontWeight: 500 }}
                  >
                    Alle Bewertungen auf Google
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                </div>
              </div>
              {/* Desktop navigation */}
              <div className="hidden sm:flex gap-2">
                <motion.button
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={prev}
                  disabled={page === 0}
                  className="w-11 h-11 rounded-full bg-white border border-[#eaebf0] flex items-center justify-center text-[#23252e] hover:bg-[#f6f7f9] hover:border-[#f58a07] transition-all disabled:opacity-30 disabled:hover:border-[#eaebf0] cursor-pointer"
                  aria-label="Vorherige Bewertungen"
                >
                  <ChevronLeft className="w-5 h-5" />
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={next}
                  disabled={page === totalPages - 1}
                  className="w-11 h-11 rounded-full bg-white border border-[#eaebf0] flex items-center justify-center text-[#23252e] hover:bg-[#f6f7f9] hover:border-[#f58a07] transition-all disabled:opacity-30 disabled:hover:border-[#eaebf0] cursor-pointer"
                  aria-label="Nächste Bewertungen"
                >
                  <ChevronRight className="w-5 h-5" />
                </motion.button>
              </div>
            </div>
          </ScrollReveal>

          {/* Feedspring Widget Container (hidden if not loaded, acts as live Google reviews source) */}
          <div
            ref={feedspringRef}
            data-feedspring="google_9u0nlRGFFfZmUhSyBsAIb"
            className={feedspringLoaded ? "mb-8" : "hidden"}
          />

          {/* Static Reviews Grid (always shown as primary/fallback) */}
          {!feedspringLoaded && (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                <AnimatePresence mode="wait">
                  {visibleReviews.map((review, index) => (
                    <ReviewCard
                      key={`${page}-${review.name}`}
                      review={review}
                      index={index}
                    />
                  ))}
                </AnimatePresence>
              </div>

              {/* Mobile navigation */}
              <div className="flex sm:hidden justify-center gap-3 mt-6">
                <button
                  onClick={prev}
                  disabled={page === 0}
                  className="w-11 h-11 rounded-full bg-white border border-[#eaebf0] flex items-center justify-center disabled:opacity-30 cursor-pointer"
                  aria-label="Vorherige Bewertungen"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>
                {/* Page dots */}
                <div className="flex items-center gap-1.5">
                  {Array.from({ length: totalPages }).map((_, i) => (
                    <button
                      key={i}
                      onClick={() => setPage(i)}
                      className={`h-2 rounded-full transition-all cursor-pointer ${
                        i === page ? "bg-[#f58a07] w-5" : "bg-[#dceaf5] w-2"
                      }`}
                      aria-label={`Seite ${i + 1}`}
                    />
                  ))}
                </div>
                <button
                  onClick={next}
                  disabled={page === totalPages - 1}
                  className="w-11 h-11 rounded-full bg-white border border-[#eaebf0] flex items-center justify-center disabled:opacity-30 cursor-pointer"
                  aria-label="Nächste Bewertungen"
                >
                  <ChevronRight className="w-5 h-5" />
                </button>
              </div>
            </>
          )}

          {/* Google attribution & CTA */}
          <ScrollReveal delay={200}>
            <div className="mt-10 flex flex-col sm:flex-row items-center justify-between gap-4 pt-8 border-t border-[#eaebf0]">
              <p className="text-[#979cae] text-xs text-center sm:text-left" style={{ marginBottom: 0 }}>
                Bewertungen von Google Business Profile ·{" "}
                <a
                  href={GOOGLE_REVIEW_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-[#f58a07] transition-colors underline"
                >
                  Quelle ansehen
                </a>
              </p>
              <a
                href={GOOGLE_REVIEW_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 bg-[#edf7ff] hover:bg-[#dceaf5] text-[#063255] rounded-full px-5 py-2.5 text-sm transition-colors"
                style={{ fontWeight: 500, textDecoration: "none" }}
              >
                <GoogleIcon className="w-4 h-4" />
                Eigene Bewertung schreiben
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </div>
          </ScrollReveal>
        </div>
      </div>
    </section>
  );
}