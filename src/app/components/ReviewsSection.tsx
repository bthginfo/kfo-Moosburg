import { useCallback, useEffect, useState } from "react";
import { ChevronLeft, ChevronRight, ExternalLink, Star } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { ScrollReveal } from "./ScrollReveal";
import { useHomeContent } from "./hooks/useHomeContent";
import { safeHref } from "../lib/safeContent";

const reviews = [
  { name: "Anja Schwaiger", date: "vor 3 Monaten", rating: 5, avatar: "AS", text: "Super nettes Team! Meine Tochter fühlt sich hier sehr wohl und die Behandlung wurde uns sehr verständlich erklärt. Die Praxis ist modern und sauber. Wir kommen sehr gerne her!" },
  { name: "Florian Huber", date: "vor 2 Monaten", rating: 5, avatar: "FH", text: "Sehr kompetente und freundliche Ärzte. Dr. Amann hat sich wirklich Zeit genommen und alles geduldig erklärt. Die Wartezeiten sind angenehm kurz. Absolut empfehlenswert!" },
  { name: "Sarah Meier", date: "vor 1 Monat", rating: 5, avatar: "SM", text: "Ich bin begeistert von der Aligner-Behandlung! Als Erwachsene war mir wichtig, dass es diskret ist – und das Ergebnis nach nur 8 Monaten ist fantastisch. Danke an das gesamte Team!" },
  { name: "Christian Bauer", date: "vor 4 Monaten", rating: 5, avatar: "CB", text: "Unser Sohn hatte anfangs große Angst vor dem Zahnarzt, aber Dr. Burg hat das super gemacht. Sehr einfühlsam und kindgerecht. Jetzt freut er sich sogar auf die Termine!" },
  { name: "Michaela Gruber", date: "vor 2 Wochen", rating: 5, avatar: "MG", text: "Die feste Zahnspange war nur 12 Monate nötig – deutlich kürzer als erwartet! Ergebnis ist top. Parkplätze in der Tiefgarage direkt unter der Praxis sind auch sehr praktisch." },
  { name: "Thomas Reiter", date: "vor 3 Wochen", rating: 5, avatar: "TR", text: "Professionelle Beratung von Anfang an. Man merkt, dass hier mit Leidenschaft gearbeitet wird. Die Terminvergabe über Dr. Flex funktioniert reibungslos. Klare Empfehlung!" },
  { name: "Lisa Wagner", date: "vor 5 Monaten", rating: 4, avatar: "LW", text: "Sehr gute Praxis mit modernem Equipment. Das Team ist immer freundlich und hilfsbereit. Einziger kleiner Punkt: Termine sind manchmal etwas schwer zu bekommen, da die Praxis sehr beliebt ist." },
  { name: "Markus Schneider", date: "vor 1 Monat", rating: 5, avatar: "MS", text: "Bin für die Behandlung extra von Freising hierher gewechselt – hat sich absolut gelohnt! Hervorragende Arbeit und ein Team, das wirklich auf den Patienten eingeht." },
  { name: "Katharina Pöll", date: "vor 6 Wochen", rating: 5, avatar: "KP", text: "Meine beiden Kinder sind hier in Behandlung und wir sind rundum zufrieden. Die Erklärungen sind immer verständlich und es wird nie mehr gemacht als nötig. Sehr vertrauenswürdig!" },
] as const;

function GoogleIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" aria-hidden="true">
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
    const update = () => setPerPage(window.innerWidth < 640 ? 1 : window.innerWidth < 1024 ? 2 : 3);
    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, []);
  return perPage;
}

export function ReviewsSection() {
  const c = useHomeContent();
  const perPage = usePerPage();
  const [page, setPage] = useState(0);
  const totalPages = Math.ceil(reviews.length / perPage);
  const googleUrl = safeHref(c.reviews_google_url, "https://www.google.com/search?q=Kieferorthop%C3%A4die+Moosburg");

  useEffect(() => setPage(0), [perPage]);
  const previous = useCallback(() => setPage((value) => Math.max(0, value - 1)), []);
  const next = useCallback(() => setPage((value) => Math.min(totalPages - 1, value + 1)), [totalPages]);
  const visibleReviews = reviews.slice(page * perPage, page * perPage + perPage);

  return (
    <section className="bg-white" aria-labelledby="reviews-heading">
      <div className="px-5 md:px-10">
        <div className="mx-auto max-w-[80rem] py-16 md:py-24">
          <ScrollReveal>
            <div className="mb-10 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
              <div>
                <h2 id="reviews-heading" className="text-2xl md:text-[3rem]">{c.reviews_title}</h2>
                <div className="h-3" />
                <div className="flex flex-wrap items-center gap-3">
                  <div className="flex items-center gap-2 rounded-full bg-[#edf7ff] px-4 py-2">
                    <GoogleIcon className="h-5 w-5" />
                    <div className="flex gap-0.5" aria-hidden="true">
                      {Array.from({ length: 5 }).map((_, index) => <Star key={index} className="h-4 w-4 fill-yellow-400 text-yellow-400" />)}
                    </div>
                    <strong className="text-[#0d1317]">{c.reviews_google_rating}</strong>
                    <span className="text-sm text-[#4a5d69]">({c.reviews_google_count} Rezensionen)</span>
                  </div>
                  <a href={googleUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-sm font-medium text-[#4a5d69] transition-colors hover:text-[#f58a07]">
                    Alle Bewertungen auf Google <ExternalLink className="h-3.5 w-3.5" />
                  </a>
                </div>
              </div>
            </div>
          </ScrollReveal>

          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
            <AnimatePresence mode="popLayout">
              {visibleReviews.map((review, index) => (
                <motion.article key={`${page}-${review.name}`} layout initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} transition={{ duration: 0.35, delay: index * 0.08 }} className="flex flex-col gap-4 rounded-2xl border border-[#eaebf0] bg-white p-6 transition-all hover:border-[#f58a07]/20 hover:shadow-md md:p-7">
                  <div className="flex items-center gap-3">
                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[#edf7ff] font-semibold text-[#063255]">{review.avatar}</div>
                    <div className="min-w-0">
                      <div className="truncate font-semibold text-[#0d1317]">{review.name}</div>
                      <div className="text-xs text-[#979cae]">{review.date}</div>
                    </div>
                    <GoogleIcon className="ml-auto h-5 w-5 shrink-0" />
                  </div>
                  <div className="flex gap-0.5" aria-label={`${review.rating} von 5 Sternen`}>
                    {Array.from({ length: 5 }).map((_, star) => <Star key={star} className={`h-4 w-4 ${star < review.rating ? "fill-yellow-400 text-yellow-400" : "fill-gray-100 text-gray-200"}`} />)}
                  </div>
                  <p className="mb-0 flex-1 text-[15px] leading-[26px] text-[#424553]">{review.text}</p>
                </motion.article>
              ))}
            </AnimatePresence>
          </div>

          <div className="mt-6 flex justify-center gap-3">
            <button type="button" onClick={previous} disabled={page === 0} className="flex h-11 w-11 items-center justify-center rounded-full border border-[#eaebf0] bg-white transition-all hover:border-[#f58a07] disabled:opacity-30" aria-label="Vorherige Bewertungen"><ChevronLeft className="h-5 w-5" /></button>
            <div className="flex items-center gap-1.5">
              {Array.from({ length: totalPages }).map((_, index) => <button key={index} type="button" onClick={() => setPage(index)} className={`h-2 rounded-full transition-all ${index === page ? "w-5 bg-[#f58a07]" : "w-2 bg-[#dceaf5]"}`} aria-label={`Bewertungsseite ${index + 1}`} aria-current={index === page ? "page" : undefined} />)}
            </div>
            <button type="button" onClick={next} disabled={page === totalPages - 1} className="flex h-11 w-11 items-center justify-center rounded-full border border-[#eaebf0] bg-white transition-all hover:border-[#f58a07] disabled:opacity-30" aria-label="Nächste Bewertungen"><ChevronRight className="h-5 w-5" /></button>
          </div>

          <ScrollReveal delay={200}>
            <div className="mt-10 flex flex-col items-center justify-between gap-4 border-t border-[#eaebf0] pt-8 sm:flex-row">
              <p className="mb-0 text-center text-xs text-[#979cae] sm:text-left">Bewertungen von Google Business Profile · <a href={googleUrl} target="_blank" rel="noopener noreferrer" className="underline transition-colors hover:text-[#f58a07]">Quelle ansehen</a></p>
              <a href={googleUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 rounded-full bg-[#edf7ff] px-5 py-2.5 text-sm font-medium text-[#063255] no-underline transition-colors hover:bg-[#dceaf5]"><GoogleIcon className="h-4 w-4" /> Eigene Bewertung schreiben <ExternalLink className="h-3.5 w-3.5" /></a>
            </div>
          </ScrollReveal>
        </div>
      </div>
    </section>
  );
}
