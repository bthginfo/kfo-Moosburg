// The public website intentionally keeps DR.FLEX until the practice explicitly
// approves switching to the prepared in-house booking flow.
const DRFLEX_BOOKING_URL = "https://dr-flex.de/Kieferorthop%C3%A4die/Moosburg/85368/M%C3%BCnchener_Stra%C3%9Fe/Kieferorthop%C3%A4die_Moosburg/Route_finden";

/** Opens the external booking page without running third-party code in this origin. */
export function openBooking(): void {
  const opened = window.open(DRFLEX_BOOKING_URL, "_blank", "noopener,noreferrer");
  if (opened) opened.opener = null;
}
