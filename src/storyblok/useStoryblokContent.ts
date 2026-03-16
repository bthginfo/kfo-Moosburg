// =============================================================================
// Custom Hook: Storyblok Content laden (flat structure)
// =============================================================================

import { useState, useEffect } from "react";
import { STORYBLOK_CONFIGURED, STORYBLOK_TOKEN } from "./storyblokConfig";

interface StoryblokStory {
  content: Record<string, any>;
  [key: string]: any;
}

interface UseStoryblokResult {
  story: StoryblokStory | null;
  loading: boolean;
  error: string | null;
  isConnected: boolean;
}

const storyCache: Record<string, { story: StoryblokStory; timestamp: number }> = {};
const CACHE_TTL_MS = 60 * 1000; // 60 Sekunden Cache, dann neu laden

export function useStoryblokContent(slug: string): UseStoryblokResult {
  const cached = storyCache[slug];
  const isFresh = cached && (Date.now() - cached.timestamp < CACHE_TTL_MS);

  const [story, setStory] = useState<StoryblokStory | null>(isFresh ? cached.story : null);
  const [loading, setLoading] = useState(!isFresh && STORYBLOK_CONFIGURED);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!STORYBLOK_CONFIGURED) return;

    // Use fresh cache if available
    if (isFresh) {
      setStory(cached.story);
      setLoading(false);
      return;
    }

    const fetchStory = async () => {
      try {
        const params = new URLSearchParams({
          version: "published",
          token: STORYBLOK_TOKEN,
          cv: Date.now().toString(),
        });
        const res = await fetch(
          `https://api.storyblok.com/v2/cdn/stories/${slug}?${params}`
        );
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();
        storyCache[slug] = { story: data.story, timestamp: Date.now() };
        setStory(data.story);
      } catch (err: any) {
        console.warn(`[Storyblok] Story "${slug}" nicht geladen:`, err.message);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchStory();
  }, [slug]);

  return { story, loading, error, isConnected: STORYBLOK_CONFIGURED };
}

// Hilfsfunktion: Storyblok Asset URL -> Bild URL (oder Fallback)
export function assetUrl(asset: any, fallback: string): string {
  if (asset && typeof asset === "object" && asset.filename && asset.filename.length > 0) {
    return asset.filename;
  }
  if (typeof asset === "string" && asset.length > 0) return asset;
  return fallback;
}