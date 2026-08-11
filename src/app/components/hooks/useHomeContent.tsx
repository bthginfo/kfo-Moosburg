import { createContext, useContext } from "react";
import { DEFAULTS } from "../../../storyblok/contentDefaults";

type ContentMap = Record<string, any>;
const SNAPSHOT = DEFAULTS as unknown as ContentMap;
const HomeContentContext = createContext<ContentMap>(SNAPSHOT);

/** Statischer Snapshot der zuletzt veröffentlichten Website-Inhalte. */
export function HomeContentProvider({ children }: { children: React.ReactNode }) {
  return <HomeContentContext.Provider value={SNAPSHOT}>{children}</HomeContentContext.Provider>;
}

export function useHomeContent(): ContentMap {
  return useContext(HomeContentContext);
}

export function assetUrl(asset: unknown, fallback: string): string {
  return typeof asset === "string" && asset ? asset : fallback;
}
