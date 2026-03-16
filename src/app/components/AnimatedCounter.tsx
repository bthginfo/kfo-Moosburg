import { useEffect, useState, useRef } from "react";

interface AnimatedCounterProps {
  target: string;
  duration?: number;
}

export function AnimatedCounter({ target, duration = 1800 }: AnimatedCounterProps) {
  const [display, setDisplay] = useState("0");
  const ref = useRef<HTMLSpanElement>(null);
  const hasAnimated = useRef(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !hasAnimated.current) {
          hasAnimated.current = true;

          // Extract numeric part and suffix
          const match = target.match(/^([\d.]+)(.*)$/);
          if (!match) {
            setDisplay(target);
            return;
          }

          const numericTarget = parseFloat(match[1]);
          const suffix = match[2];
          const isFloat = match[1].includes(".");
          const startTime = performance.now();

          const animate = (now: number) => {
            const elapsed = now - startTime;
            const progress = Math.min(elapsed / duration, 1);
            // Ease out cubic
            const eased = 1 - Math.pow(1 - progress, 3);
            const current = numericTarget * eased;

            if (isFloat) {
              setDisplay(current.toFixed(1) + suffix);
            } else {
              setDisplay(Math.floor(current).toLocaleString("de-DE") + suffix);
            }

            if (progress < 1) {
              requestAnimationFrame(animate);
            }
          };

          requestAnimationFrame(animate);
          observer.unobserve(el);
        }
      },
      { threshold: 0.5 }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [target, duration]);

  return <span ref={ref}>{display}</span>;
}
