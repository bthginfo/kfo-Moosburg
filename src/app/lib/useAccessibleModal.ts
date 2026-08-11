import { type RefObject, useEffect } from "react";
import { lockBodyScroll } from "./bodyScrollLock";

const FOCUSABLE_SELECTOR = [
  'a[href]',
  'button:not([disabled]):not([tabindex="-1"])',
  'input:not([disabled]):not([type="hidden"]):not([tabindex="-1"])',
  'select:not([disabled]):not([tabindex="-1"])',
  'textarea:not([disabled]):not([tabindex="-1"])',
  '[contenteditable="true"]',
  '[tabindex]:not([tabindex="-1"])',
].join(",");

function focusableElements(container: HTMLElement) {
  return Array.from(container.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR))
    .filter((element) => !element.hidden && element.getAttribute("aria-hidden") !== "true");
}

type AccessibleModalOptions = {
  open: boolean;
  containerRef: RefObject<HTMLElement>;
  initialFocusRef?: RefObject<HTMLElement>;
  returnFocusRef?: RefObject<HTMLElement>;
  onClose: () => void;
};

/**
 * Ergänzt selbst gerenderte mobile Dialoge um Fokusfalle, Escape, Scroll-Lock
 * und inert gesetzte Hintergrundinhalte. Radix-Dialoge bringen dies bereits mit.
 */
export function useAccessibleModal({
  open,
  containerRef,
  initialFocusRef,
  returnFocusRef,
  onClose,
}: AccessibleModalOptions) {
  useEffect(() => {
    if (!open || !containerRef.current) return;

    const container = containerRef.current;
    const previouslyFocused = returnFocusRef?.current
      ?? (document.activeElement instanceof HTMLElement ? document.activeElement : null);
    const releaseScrollLock = lockBodyScroll();
    const siblings = Array.from(container.parentElement?.children ?? [])
      .filter((element): element is HTMLElement => element instanceof HTMLElement && element !== container)
      .map((element) => ({
        element,
        hadInert: element.hasAttribute("inert"),
        ariaHidden: element.getAttribute("aria-hidden"),
      }));

    for (const { element } of siblings) {
      element.setAttribute("inert", "");
      element.setAttribute("aria-hidden", "true");
    }

    const focusInitial = () => {
      const target = initialFocusRef?.current ?? focusableElements(container)[0] ?? container;
      target.focus();
    };
    const focusFrame = window.requestAnimationFrame(focusInitial);

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        onClose();
        return;
      }
      if (event.key !== "Tab") return;

      const focusable = focusableElements(container);
      if (!focusable.length) {
        event.preventDefault();
        container.focus();
        return;
      }

      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      const active = document.activeElement;
      if (!container.contains(active)) {
        event.preventDefault();
        (event.shiftKey ? last : first).focus();
      } else if (event.shiftKey && active === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && active === last) {
        event.preventDefault();
        first.focus();
      }
    };

    const handleFocusIn = (event: FocusEvent) => {
      if (!container.contains(event.target as Node)) focusInitial();
    };

    document.addEventListener("keydown", handleKeyDown, true);
    document.addEventListener("focusin", handleFocusIn, true);

    return () => {
      window.cancelAnimationFrame(focusFrame);
      document.removeEventListener("keydown", handleKeyDown, true);
      document.removeEventListener("focusin", handleFocusIn, true);
      releaseScrollLock();
      for (const { element, hadInert, ariaHidden } of siblings) {
        if (!hadInert) element.removeAttribute("inert");
        if (ariaHidden === null) element.removeAttribute("aria-hidden");
        else element.setAttribute("aria-hidden", ariaHidden);
      }
      previouslyFocused?.focus();
    };
  }, [containerRef, initialFocusRef, onClose, open, returnFocusRef]);
}
