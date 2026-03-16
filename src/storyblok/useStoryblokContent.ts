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

const storyCache: Record<string, StoryblokStory> = {};

export function useStoryblokContent(slug: string): UseStoryblokResult {
  const [story, setStory] = useState<StoryblokStory | null>(storyCache[slug] || null);
  const [loading, setLoading] = useState(!storyCache[slug] && STORYBLOK_CONFIGURED);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!STORYBLOK_CONFIGURED) return;
    if (storyCache[slug]) {
      setStory(storyCache[slug]);
      setLoading(false);
      return;
    }

    const fetchStory = async () => {
      try {
        const params = new URLSearchParams({
          version: "draft",
          token: STORYBLOK_TOKEN,
        });
        const res = await fetch(
          `https://api.storyblok.com/v2/cdn/stories/${slug}?${params}`
        );
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();
        storyCache[slug] = data.story;
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
