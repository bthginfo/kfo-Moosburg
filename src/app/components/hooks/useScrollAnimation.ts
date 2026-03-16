import { useEffect, useRef } from "react";

/**
 * Hook for scroll-triggered fade-in animations.
 * Attaches an IntersectionObserver to the returned ref.
 */
export function useScrollAnimation<T extends HTMLElement>(
  options?: { threshold?: number; delay?: number }
) {
  const ref = useRef<T>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    // Set initial hidden state
    el.style.opacity = "0";
    el.style.transform = "translateY(24px)";
    el.style.transition = `opacity 0.7s ease ${options?.delay ?? 0}ms, transform 0.7s ease ${options?.delay ?? 0}ms`;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          el.style.opacity = "1";
          el.style.transform = "translateY(0)";
          observer.unobserve(el);
        }
      },
      { threshold: options?.threshold ?? 0.12 }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [options?.threshold, options?.delay]);

  return ref;
}
