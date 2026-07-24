// =============================================================================
// Online-Terminbuchung – zentrale Konfiguration
// =============================================================================
// Umstellung der Terminbuchung von DR.Flex auf iie-systems mit zeitgesteuertem
// Go-Live.
//
// Bis zum Go-Live-Zeitpunkt wird weiterhin die bestehende DR.Flex-Buchung
// verwendet (Overlay). Ab dem Go-Live öffnet jeder Termin-Button den
// Online-Kalender von iie-systems in einem neuen Browser-Tab, und die
// DR.Flex-Integration wird nicht mehr geladen (kein Kontakt mehr zu dr-flex.de).
//
// Der Wechsel passiert automatisch – es ist kein weiterer Deploy nötig.
// =============================================================================

/** Online-Kalender von iie-systems (öffnet in neuem Tab). */
export const IIE_BOOKING_URL = "https://iie-systems.de/online-termin-kfo-mossburg";

/**
 * Master-Schalter für die Terminbuchung.
 *
 * false = DR.Flex bleibt aktiv (aktueller Stand – die Praxis ist sich beim
 *         Wechsel noch nicht sicher). Der iie-Code bleibt vollständig erhalten,
 *         ist aber deaktiviert.
 * true  = Umstellung auf iie-systems; zusätzlich muss der Go-Live-Zeitpunkt
 *         unten erreicht sein.
 *
 * Zum Reaktivieren von iie genügt es, diesen Wert auf true zu setzen.
 */
export const IIE_BOOKING_ENABLED = false;

/**
 * Go-Live-Zeitpunkt der iie-Terminbuchung (nur relevant, wenn
 * IIE_BOOKING_ENABLED = true).
 * Der Vergleich erfolgt gegen Date.now() (UTC-basiert) und ist damit unabhängig
 * von der Zeitzone des Besuchers.
 */
export const BOOKING_GO_LIVE_AT = Date.UTC(2026, 6, 24, 8, 0, 0);

/** Externes DR.Flex-Embed-Script (aktiv, solange iie nicht live ist). */
const DRFLEX_EMBED_SRC = "https://dr-flex.de/embed.js?medicalPracticeId=46546";

/** True, wenn die iie-Terminbuchung aktiviert und ihr Go-Live erreicht ist. */
export function isIieBookingLive(now: number = Date.now()): boolean {
  return IIE_BOOKING_ENABLED && now >= BOOKING_GO_LIVE_AT;
}

/**
 * Initialisiert die Terminbuchung beim App-Start.
 * Lädt das DR.Flex-Embed-Script nur, solange die iie-Buchung noch nicht live
 * ist. Nach dem Go-Live wird dr-flex.de nicht mehr kontaktiert.
 */
export function initBooking(): void {
  if (typeof document === "undefined") return;
  if (isIieBookingLive()) return;
  if (document.querySelector(`script[src="${DRFLEX_EMBED_SRC}"]`)) return;
  const script = document.createElement("script");
  script.src = DRFLEX_EMBED_SRC;
  script.type = "text/javascript";
  document.head.appendChild(script);
}

/**
 * Öffnet die Online-Terminbuchung.
 * - Ab Go-Live: iie-Kalender in neuem Tab.
 * - Bis Go-Live: bestehendes DR.Flex-Overlay.
 */
export function openBooking(): void {
  if (isIieBookingLive()) {
    window.open(IIE_BOOKING_URL, "_blank", "noopener,noreferrer");
    return;
  }
  const toggle = (window as any).toggleDrFlexAppointments;
  if (typeof toggle === "function") toggle();
}
