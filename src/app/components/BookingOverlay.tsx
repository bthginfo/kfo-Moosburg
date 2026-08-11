import { useEffect, useId, useRef, useState } from "react";
import { LoaderCircle, X } from "lucide-react";
import { BOOKING_OPEN_EVENT, DRFLEX_EMBED_URL } from "../../config/booking";
import { lockBodyScroll } from "../lib/bodyScrollLock";

export function BookingOverlay() {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const titleId = useId();
  const closeRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const show = () => {
      setLoading(true);
      setOpen(true);
    };
    window.addEventListener(BOOKING_OPEN_EVENT, show);
    return () => window.removeEventListener(BOOKING_OPEN_EVENT, show);
  }, []);

  useEffect(() => {
    if (!open) return;
    const previouslyFocused = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    const releaseScrollLock = lockBodyScroll();
    const focusFrame = window.requestAnimationFrame(() => closeRef.current?.focus());
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        setOpen(false);
      }
    };
    document.addEventListener("keydown", onKeyDown);
    return () => {
      window.cancelAnimationFrame(focusFrame);
      document.removeEventListener("keydown", onKeyDown);
      releaseScrollLock();
      previouslyFocused?.focus();
    };
  }, [open]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[400] bg-white" role="dialog" aria-modal="true" aria-labelledby={titleId}>
      <h2 id={titleId} className="sr-only">Online-Termin bei DR.FLEX vereinbaren</h2>
      {loading && (
        <div className="absolute inset-0 z-[1] flex flex-col items-center justify-center gap-3 bg-[#063255] text-white">
          <LoaderCircle className="h-8 w-8 animate-spin" aria-hidden="true" />
          <span className="text-sm">Terminbuchung wird geladen …</span>
        </div>
      )}
      <iframe
        src={DRFLEX_EMBED_URL}
        title="DR.FLEX Online-Terminbuchung"
        className="h-full w-full border-0 bg-white"
        sandbox="allow-forms allow-popups allow-popups-to-escape-sandbox allow-same-origin allow-scripts allow-top-navigation-by-user-activation"
        referrerPolicy="strict-origin-when-cross-origin"
        onLoad={() => setLoading(false)}
      />
      <button
        ref={closeRef}
        type="button"
        onClick={() => setOpen(false)}
        className="absolute right-3 top-3 z-[3] flex h-11 w-11 items-center justify-center rounded-full border border-[#d7e5ed] bg-white text-[#063255] shadow-lg transition-colors hover:bg-[#edf7ff]"
        aria-label="Terminbuchung schließen"
      >
        <X className="h-5 w-5" />
      </button>
    </div>
  );
}
