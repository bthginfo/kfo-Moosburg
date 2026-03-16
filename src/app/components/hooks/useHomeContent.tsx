// =============================================================================
// Home Content Context – Laedt "home" Story einmal und teilt sie mit allen Sektionen
// =============================================================================

import { createContext, useContext, useMemo } from "react";
import { useStoryblokContent, assetUrl } from "../../../storyblok/useStoryblokContent";
import { DEFAULTS } from "../../../storyblok/contentDefaults";

type ContentMap = Record<string, any>;

const HomeContentContext = createContext<ContentMap>(DEFAULTS as unknown as ContentMap);

/**
 * Provider: Laedt die "home" Story von Storyblok und merged mit Defaults.
 * Storyblok-Werte ueberschreiben Defaults nur wenn sie nicht leer sind.
 */
export function HomeContentProvider({ children }: { children: React.ReactNode }) {
  const { story, isConnected } = useStoryblokContent("home");

  const content = useMemo(() => {
    if (!isConnected || !story) return DEFAULTS as unknown as ContentMap;

    const sb = story.content as ContentMap;
    const merged: ContentMap = { ...DEFAULTS };

    // Storyblok-Werte ueberschreiben nur wenn sie non-empty sind
    for (const key of Object.keys(DEFAULTS)) {
      const val = sb[key];
      if (val === undefined || val === null || val === "") continue;
      // Asset-Objekte: nur ueberschreiben wenn filename vorhanden
      if (typeof val === "object" && "filename" in val) {
        if (val.filename && val.filename.length > 0) {
          merged[key] = val.filename; // flatten to URL string
        }
        continue;
      }
      merged[key] = val;
    }

    return merged;
  }, [story, isConnected]);

  return (
    <HomeContentContext.Provider value={content}>
      {children}
    </HomeContentContext.Provider>
  );
}

/**
 * Hook: Gibt den gemergten Content zurueck (Storyblok + Defaults).
 * Kann in jeder Home-Sektion verwendet werden.
 */
export function useHomeContent(): ContentMap {
  return useContext(HomeContentContext);
}

/** Re-export fuer Bild-Assets */
export { assetUrl };
