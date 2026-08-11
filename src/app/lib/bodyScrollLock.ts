const activeLocks = new Set<symbol>();
let originalOverflow: string | null = null;

/**
 * Sperrt das Scrollen referenzgezählt. So kann z. B. ein Popup erscheinen,
 * während das mobile Menü offen ist, ohne dass eine Cleanup-Reihenfolge den
 * Body anschließend versehentlich dauerhaft gesperrt lässt.
 */
export function lockBodyScroll() {
  const lockId = Symbol("body-scroll-lock");

  if (activeLocks.size === 0) {
    originalOverflow = document.body.style.overflow;
  }

  activeLocks.add(lockId);
  document.body.style.overflow = "hidden";

  let released = false;
  return () => {
    if (released) return;
    released = true;
    activeLocks.delete(lockId);

    if (activeLocks.size === 0) {
      document.body.style.overflow = originalOverflow ?? "";
      originalOverflow = null;
    }
  };
}
