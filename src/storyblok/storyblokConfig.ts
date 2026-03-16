// =============================================================================
// Storyblok Konfiguration fuer KFO Moosburg
// =============================================================================
// In Vercel: Setze die Environment Variable VITE_STORYBLOK_TOKEN
// (Settings > Environment Variables > VITE_STORYBLOK_TOKEN = dein-preview-token)
//
// Lokal: Erstelle eine .env Datei im Root mit:
// VITE_STORYBLOK_TOKEN=dein-preview-token
// =============================================================================

import { storyblokInit, apiPlugin } from "@storyblok/react";

export const STORYBLOK_TOKEN = import.meta.env.VITE_STORYBLOK_TOKEN || "";

// Storyblok nur initialisieren wenn ein Token gesetzt ist
const isConfigured = STORYBLOK_TOKEN.length > 10;

if (isConfigured) {
  storyblokInit({
    accessToken: STORYBLOK_TOKEN,
    use: [apiPlugin],
    apiOptions: {
      region: "eu",
    },
  });
}

export const STORYBLOK_CONFIGURED = isConfigured;
