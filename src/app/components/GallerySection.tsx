import { useState, useEffect, useCallback } from "react";
import { X, ChevronLeft, ChevronRight } from "lucide-react";
import { ScrollReveal } from "./ScrollReveal";
import { motion, AnimatePresence } from "motion/react";
import { useHomeContent } from "./hooks/useHomeContent";

interface GalleryImage {
  src: string;
  alt: string;
}

function Lightbox({
  images,
  index,
  onClose,
  onPrev,
  onNext,
}: {
  images: GalleryImage[];
  index: number;
  onClose: () => void;
  onPrev: () => void;
  onNext: () => void;
}) {
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowLeft") onPrev();
      if (e.key === "ArrowRight") onNext();
    };
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", handleKey);
    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", handleKey);
    };
  }, [onClose, onPrev, onNext]);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.25 }}
      className="fixed inset-0 z-[100] bg-black/90 flex items-center justify-center"
      onClick={onClose}
    >
      {/* Close */}
      <button
        onClick={onClose}
        className="absolute top-4 right-4 text-white/70 hover:text-white z-10 w-12 h-12 flex items-center justify-center rounded-full bg-white/10 hover:bg-white/20 transition-colors cursor-pointer"
        aria-label="Schließen"
      >
        <X className="w-6 h-6" />
      </button>

      {/* Prev */}
      <button
        onClick={(e) => { e.stopPropagation(); onPrev(); }}
        className="absolute left-3 md:left-6 text-white/70 hover:text-white z-10 w-12 h-12 flex items-center justify-center rounded-full bg-white/10 hover:bg-white/20 transition-colors cursor-pointer"
        aria-label="Vorheriges Bild"
      >
        <ChevronLeft className="w-6 h-6" />
      </button>

      {/* Next */}
      <button
        onClick={(e) => { e.stopPropagation(); onNext(); }}
        className="absolute right-3 md:right-6 text-white/70 hover:text-white z-10 w-12 h-12 flex items-center justify-center rounded-full bg-white/10 hover:bg-white/20 transition-colors cursor-pointer"
        aria-label="Nächstes Bild"
      >
        <ChevronRight className="w-6 h-6" />
      </button>

      {/* Image */}
      <motion.img
        key={images[index].src}
        initial={{ opacity: 0, scale: 0.92 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.3 }}
        src={images[index].src}
        alt={images[index].alt}
        className="max-w-[90vw] max-h-[85vh] object-contain rounded-xl"
        onClick={(e) => e.stopPropagation()}
      />

      {/* Counter */}
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 text-white/60 text-sm">
        {index + 1} / {images.length}
      </div>
    </motion.div>
  );
}

export function GallerySection() {
  const c = useHomeContent();
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);

  const galleryImages: GalleryImage[] = [1, 2, 3, 4, 5, 6, 7, 8].map((i) => ({
    src: c[`gallery_image_${i}`],
    alt: c[`gallery_alt_${i}`] || `Praxis Bild ${i}`,
  })).filter(img => img.src);

  const closeLightbox = useCallback(() => setLightboxIndex(null), []);
  const prevImage = useCallback(
    () => setLightboxIndex((i) => (i !== null ? (i - 1 + galleryImages.length) % galleryImages.length : null)),
    [galleryImages.length]
  );
  const nextImage = useCallback(
    () => setLightboxIndex((i) => (i !== null ? (i + 1) % galleryImages.length : null)),
    [galleryImages.length]
  );

  return (
    <>
      <section className="bg-white">
        <div className="px-5 md:px-10">
          <div className="max-w-[80rem] mx-auto py-16 md:py-24">
            <ScrollReveal>
              <div className="text-center mb-10 md:mb-12">
                <h2 className="text-2xl md:text-[3rem]">{c.gallery_title}</h2>
                <div className="h-2" />
                <p className="text-[#4a5d69]">{c.gallery_subtitle}</p>
              </div>
            </ScrollReveal>

            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-4">
              {galleryImages.map((img, index) => (
                <ScrollReveal key={index} delay={index * 80} scale>
                  <motion.button
                    whileHover={{ y: -4 }}
                    transition={{ type: "spring", stiffness: 300 }}
                    onClick={() => setLightboxIndex(index)}
                    className="rounded-2xl overflow-hidden cursor-pointer group w-full"
                    aria-label={`${img.alt} vergrößern`}
                  >
                    <motion.img
                      whileHover={{ scale: 1.08 }}
                      transition={{ duration: 0.4 }}
                      src={img.src}
                      alt={img.alt}
                      className="w-full h-40 sm:h-48 md:h-56 object-cover"
                      loading="lazy"
                    />
                  </motion.button>
                </ScrollReveal>
              ))}
            </div>
          </div>
        </div>
      </section>

      <AnimatePresence>
        {lightboxIndex !== null && (
          <Lightbox
            images={galleryImages}
            index={lightboxIndex}
            onClose={closeLightbox}
            onPrev={prevImage}
            onNext={nextImage}
          />
        )}
      </AnimatePresence>
    </>
  );
}