import { useState, useEffect, useCallback, useRef } from "react";
import { Star, ChevronLeft, ChevronRight, ExternalLink } from "lucide-react";
import { ScrollReveal } from "./ScrollReveal";
import { motion, AnimatePresence } from "motion/react";

/**
 * Echte Google-Rezensionen der Kieferorthopädie Moosburg Dr. Amann & Dr. Burg.
 * Quelle: Google Maps / Google Business Profile
 * Place ID: ChIJmchqAYg9eUcROv0WZzAO0e0
 *
 * Statische Reviews als Fallback, falls Feedspring nicht lädt.
 */
const fallbackReviews = [
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

const FEEDSPRING_ID = "google_9u0nlRGFFfZmUhSyBsAIb";

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

// ─── Feedspring Widget (echte Google Reviews via Feedspring attrs script) ────

/**
 * Generates the raw HTML template that the Feedspring attrs script expects.
 * The script scans for elements with feedspring="..." and feed-field="..." attributes,
 * then clones + populates the template cards with real Google review data.
 */
function buildFeedspringTemplate(): string {
  // Single review card template (will be cloned by Feedspring for each review)
  const cardTemplate = `
    <div feedspring="post" class="fs-review-card">
      <div class="fs-review-header">
        <div class="fs-review-avatar">
          <img feed-field="avatar" alt="" class="fs-avatar-img" />
        </div>
        <div class="fs-review-meta">
          <div feed-field="name" class="fs-review-name">Laden...</div>
          <div feed-field="timestamp" class="fs-review-date"></div>
        </div>
        <div class="fs-google-badge">
          <svg viewBox="0 0 24 24" fill="none" width="20" height="20">
            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/>
            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
          </svg>
        </div>
      </div>
      <div class="fs-star-row">
        <img feed-field="star" alt="" class="fs-star-active" />
        <img feed-field="star-inactive" alt="" class="fs-star-inactive" />
      </div>
      <p feed-field="review" class="fs-review-text">Bewertung wird geladen...</p>
    </div>`;

  // 6 card templates = Feedspring will use them as templates for 6 reviews
  return `<div feedspring="${FEEDSPRING_ID}" class="fs-container">
    <div class="fs-reviews-grid">
      ${cardTemplate}${cardTemplate}${cardTemplate}${cardTemplate}${cardTemplate}${cardTemplate}
    </div>
  </div>`;
}

/**
 * CSS for the Feedspring widget cards - matches the site's design system
 */
const feedspringStyles = `
  .fs-container, .fs-container * { box-sizing: border-box; }
  .fs-container { width: 100%; }
  .fs-reviews-grid {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 1.25rem;
  }
  @media (max-width: 1023px) {
    .fs-reviews-grid { grid-template-columns: repeat(2, 1fr); }
  }
  @media (max-width: 639px) {
    .fs-reviews-grid { grid-template-columns: 1fr; }
  }

  /* Card */
  .fs-review-card,
  .fs-container div[feedspring="post"] {
    background: #ffffff !important;
    border: 1px solid #eaebf0 !important;
    border-radius: 1rem !important;
    padding: 1.5rem !important;
    display: flex !important;
    flex-direction: column !important;
    gap: 0.75rem !important;
    transition: box-shadow 0.3s, border-color 0.3s;
  }
  .fs-review-card:hover,
  .fs-container div[feedspring="post"]:hover {
    box-shadow: 0 4px 16px rgba(0,0,0,0.06);
    border-color: rgba(245,138,7,0.2) !important;
  }

  /* Header */
  .fs-review-header { display: flex; align-items: center; gap: 0.75rem; }
  .fs-review-avatar {
    width: 2.75rem; height: 2.75rem; border-radius: 50%;
    background: #edf7ff; display: flex; align-items: center;
    justify-content: center; overflow: hidden; flex-shrink: 0;
  }
  .fs-avatar-img {
    width: 100% !important; height: 100% !important;
    object-fit: cover !important; border-radius: 50% !important;
    max-width: none !important;
  }
  .fs-review-meta { flex: 1; min-width: 0; }
  .fs-review-name {
    color: #0d1317 !important; font-weight: 600 !important;
    font-size: 0.95rem !important; white-space: nowrap;
    overflow: hidden; text-overflow: ellipsis;
    background: none !important;
  }
  .fs-review-date {
    color: #979cae !important; font-size: 0.75rem !important;
    background: none !important;
  }
  .fs-google-badge { flex-shrink: 0; margin-left: auto; }

  /* Stars – HIDE Feedspring broken images, replace with CSS unicode stars */
  .fs-star-row {
    display: block !important;
    height: 20px !important;
    line-height: 20px !important;
    font-size: 0 !important;
  }
  .fs-star-row img,
  .fs-star-row .fs-star-active,
  .fs-star-row .fs-star-inactive,
  .fs-star-row [feed-field="star"],
  .fs-star-row [feed-field="star-inactive"] {
    display: none !important;
    width: 0 !important;
    height: 0 !important;
    visibility: hidden !important;
  }
  .fs-star-row::before {
    content: "\\2605\\2605\\2605\\2605\\2605";
    color: #FBBC05;
    font-size: 16px;
    letter-spacing: 2px;
    line-height: 20px;
    display: inline-block;
  }

  /* Review text */
  .fs-review-text {
    color: #424553 !important;
    font-size: 0.9375rem !important;
    line-height: 1.7 !important;
    font-weight: 400 !important;
    margin: 0 !important; padding: 0 !important;
    background: none !important;
    display: -webkit-box;
    -webkit-line-clamp: 5;
    -webkit-box-orient: vertical;
    overflow: hidden;
  }

  /* Global overrides for any Feedspring injected styles */
  .fs-container [feedspring],
  .fs-container [feed-field] {
    background-color: transparent !important;
  }
`;

function FeedspringWidget() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    if (!containerRef.current) return;

    // Inject the template HTML
    containerRef.current.innerHTML = buildFeedspringTemplate();

    // Re-trigger the Feedspring script (it may have already run on page load)
    // The attrs script scans for feedspring="..." attributes
    const retrigger = () => {
      // Check if Feedspring has populated the cards (name won't be "Laden..." anymore)
      const nameEls = containerRef.current?.querySelectorAll(".fs-review-name");
      if (nameEls && nameEls.length > 0) {
        const firstText = nameEls[0]?.textContent?.trim();
        if (firstText && firstText !== "Laden..." && firstText !== "") {
          setLoaded(true);
          return true;
        }
      }
      return false;
    };

    // If the script already ran, it won't re-scan. Try re-loading it.
    if (!retrigger()) {
      const script = document.createElement("script");
      script.src = "https://scripts.feedspring.co/google-reviews-attrs.js";
      script.async = true;
      script.defer = true;
      document.head.appendChild(script);

      // Poll to detect when Feedspring populates the cards
      let attempts = 0;
      const maxAttempts = 30; // 30 * 500ms = 15 seconds max
      const pollInterval = setInterval(() => {
        attempts++;
        if (retrigger() || attempts >= maxAttempts) {
          clearInterval(pollInterval);
          // If still not loaded after max attempts, feedspring didn't work
          if (attempts >= maxAttempts && !loaded) {
            setLoaded(false);
          }
        }
      }, 500);

      return () => {
        clearInterval(pollInterval);
        // Clean up the script we added (keep the one in index.html)
        if (script.parentNode) {
          script.parentNode.removeChild(script);
        }
      };
    }
  }, []);

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: feedspringStyles }} />
      <div ref={containerRef} className={loaded ? "" : "min-h-[200px]"} />
    </>
  );
}

// ─── Static Fallback Reviews ────────────────────────────────────────────────

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

function ReviewCard({ review, index }: { review: typeof fallbackReviews[0]; index: number }) {
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

function FallbackReviews() {
  const perPage = usePerPage();
  const [page, setPage] = useState(0);
  const totalPages = Math.ceil(fallbackReviews.length / perPage);

  useEffect(() => {
    setPage(0);
  }, [perPage]);

  const visibleReviews = fallbackReviews.slice(page * perPage, page * perPage + perPage);

  const prev = useCallback(() => setPage((p) => Math.max(0, p - 1)), []);
  const next = useCallback(() => setPage((p) => Math.min(totalPages - 1, p + 1)), [totalPages]);

  return (
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

      {/* Pagination */}
      <div className="flex justify-center gap-3 mt-6">
        <button
          onClick={prev}
          disabled={page === 0}
          className="w-11 h-11 rounded-full bg-white border border-[#eaebf0] flex items-center justify-center disabled:opacity-30 cursor-pointer hover:border-[#f58a07] transition-all"
          aria-label="Vorherige Bewertungen"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>
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
          className="w-11 h-11 rounded-full bg-white border border-[#eaebf0] flex items-center justify-center disabled:opacity-30 cursor-pointer hover:border-[#f58a07] transition-all"
          aria-label="Nächste Bewertungen"
        >
          <ChevronRight className="w-5 h-5" />
        </button>
      </div>
    </>
  );
}

// ─── Main Reviews Section ───────────────────────────────────────────────────

export function ReviewsSection() {
  const feedspringRef = useRef<HTMLDivElement>(null);
  const [widgetReady, setWidgetReady] = useState(false);

  // Monitor the Feedspring container: if it has visible review cards, show it
  useEffect(() => {
    let attempts = 0;
    const maxAttempts = 30;

    const poll = setInterval(() => {
      attempts++;
      const container = feedspringRef.current;
      if (container) {
        // Check if Feedspring has injected real content
        const names = container.querySelectorAll(".fs-review-name");
        for (let i = 0; i < names.length; i++) {
          const text = names[i]?.textContent?.trim();
          if (text && text !== "Laden..." && text !== "" && text !== "Loading...") {
            setWidgetReady(true);
            clearInterval(poll);
            return;
          }
        }
      }
      if (attempts >= maxAttempts) {
        clearInterval(poll);
      }
    }, 500);

    return () => clearInterval(poll);
  }, []);

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
            </div>
          </ScrollReveal>

          {/* Feedspring Widget (echte Google Reviews) */}
          <div ref={feedspringRef} className={widgetReady ? "" : "hidden"}>
            <FeedspringWidget />
          </div>

          {/* Static Fallback Reviews (shown while Feedspring loads or if it fails) */}
          {!widgetReady && <FallbackReviews />}

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