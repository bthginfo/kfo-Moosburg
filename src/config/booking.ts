// DR.FLEX wird erst nach einem ausdrücklichen Klick geladen. So bleibt die
// öffentliche Seite bis dahin frei von Drittanbieter-Requests und das
// Buchungsfenster öffnet sich trotzdem direkt auf der Website.
export const DRFLEX_EMBED_URL = "https://dr-flex.de/embed?medicalPracticeId=46546";
export const BOOKING_OPEN_EVENT = "kfo:open-booking";

/** Öffnet das eingebettete DR.FLEX-Buchungsfenster. */
export function openBooking(): void {
  window.dispatchEvent(new Event(BOOKING_OPEN_EVENT));
}
