import { ExternalLink, ShieldCheck, Star } from "lucide-react";
import { motion } from "motion/react";
import { ScrollReveal } from "./ScrollReveal";
import { useHomeContent } from "./hooks/useHomeContent";
import { safeHref } from "../lib/safeContent";

function GoogleIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4" />
      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 0 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
    </svg>
  );
}

export function ReviewsSection() {
  const c = useHomeContent();
  const googleUrl = safeHref(c.reviews_google_url, "https://www.google.com/search?q=Kieferorthop%C3%A4die+Moosburg");
  const rating = Number.parseFloat(String(c.reviews_google_rating || ""));
  const safeRating = Number.isFinite(rating) ? Math.max(0, Math.min(5, rating)) : 5;
  const reviewCount = String(c.reviews_google_count || "").replace(/[^0-9.,+]/g, "");

  return (
    <section className="bg-white" aria-labelledby="reviews-heading">
      <div className="px-5 md:px-10">
        <div className="max-w-[80rem] mx-auto py-16 md:py-24">
          <ScrollReveal>
            <div className="grid items-center gap-8 rounded-[1.5rem] border border-[#dceaf5] bg-[#edf7ff] p-7 md:grid-cols-[1fr_auto] md:p-12">
              <div>
                <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-white px-4 py-2 text-sm text-[#29475d]">
                  <ShieldCheck className="h-4 w-4 text-[#2f7d76]" />
                  Direkt bei Google geprüft
                </div>
                <h2 id="reviews-heading" className="text-2xl md:text-[3rem]">{c.reviews_title}</h2>
                <p className="mt-4 max-w-2xl text-[#4a5d69]">
                  Aktuelle Bewertungen lesen Sie direkt im Google-Unternehmensprofil. So sehen Sie immer den
                  unveränderten und neuesten Stand – ohne Tracking-Skript auf dieser Website.
                </p>
                <a
                  href={googleUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-6 inline-flex items-center gap-2 rounded-full bg-[#063255] px-6 py-3 text-white no-underline transition-colors hover:bg-[#0a4a7f]"
                >
                  Bewertungen bei Google öffnen
                  <ExternalLink className="h-4 w-4" />
                </a>
              </div>

              <motion.a
                href={googleUrl}
                target="_blank"
                rel="noopener noreferrer"
                whileHover={{ y: -4 }}
                className="flex min-w-[15rem] flex-col items-center rounded-2xl bg-white p-7 text-center no-underline shadow-sm"
                aria-label={`${safeRating.toFixed(1)} von 5 Sternen bei Google`}
              >
                <GoogleIcon className="mb-3 h-8 w-8" />
                <strong className="text-4xl text-[#0d1317]">{safeRating.toFixed(1).replace(".", ",")}</strong>
                <div className="my-2 flex gap-1" aria-hidden="true">
                  {Array.from({ length: 5 }).map((_, index) => (
                    <Star key={index} className="h-5 w-5 fill-yellow-400 text-yellow-400" />
                  ))}
                </div>
                {reviewCount && <span className="text-sm text-[#647c8c]">{reviewCount} Rezensionen</span>}
              </motion.a>
            </div>
          </ScrollReveal>
        </div>
      </div>
    </section>
  );
}
