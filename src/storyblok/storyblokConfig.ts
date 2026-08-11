// =============================================================================
// Storyblok Konfiguration fuer KFO Moosburg
// =============================================================================
// In Vercel: Setze die Environment Variable VITE_STORYBLOK_TOKEN
// In Production ausschließlich einen Public/Published Delivery Token verwenden.
// Preview- oder Management-Tokens dürfen niemals als VITE_-Variable gesetzt werden,
// weil Vite diese Werte in das öffentlich ausgelieferte Browser-Bundle einbettet.
//
// Lokal: Erstelle eine .env Datei im Root mit:
// VITE_STORYBLOK_TOKEN=dein-public-delivery-token
// =============================================================================

export const STORYBLOK_TOKEN = import.meta.env.VITE_STORYBLOK_TOKEN || "";

// Die Website liest ausschließlich veröffentlichte Inhalte direkt aus der CDN-API.
// Der visuelle Storyblok-Editor und dessen Bridge werden im Live-Bundle bewusst nicht geladen.
const isConfigured = STORYBLOK_TOKEN.length > 10;

export const STORYBLOK_CONFIGURED = isConfigured;
