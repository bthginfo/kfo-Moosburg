import type { ReactNode } from "react";

export function BoldText({ text, className }: { text: string; className?: string }) {
  const parts: ReactNode[] = [];
  const value = String(text || "");
  const pattern = /\*\*(.+?)\*\*/g;
  let cursor = 0;
  let match: RegExpExecArray | null;
  while ((match = pattern.exec(value))) {
    if (match.index > cursor) parts.push(value.slice(cursor, match.index));
    parts.push(<strong key={`${match.index}-${match[1]}`} className="text-[#0d1317]">{match[1]}</strong>);
    cursor = match.index + match[0].length;
  }
  if (cursor < value.length) parts.push(value.slice(cursor));
  return <p className={className}>{parts}</p>;
}

function parsedUrl(value: unknown): URL | null {
  if (typeof value !== "string" || !value.trim()) return null;
  try {
    return new URL(value.trim(), "https://www.kfo-moosburg.de");
  } catch {
    return null;
  }
}

export function safeHref(value: unknown, fallback = "#"): string {
  if (typeof value === "string" && (/^\/(?!\/)/.test(value.trim()) || value.trim().startsWith("#"))) return value.trim();
  const url = parsedUrl(value);
  return url && url.protocol === "https:" ? url.href : fallback;
}

export function safeTelephoneHref(value: unknown): string {
  const raw = typeof value === "string" ? value.trim() : "";
  if (!/^[+\d\s()./-]{5,30}$/.test(raw)) return "";
  const normalized = raw.replace(/[^+\d]/g, "");
  if (!/^\+?\d{5,20}$/.test(normalized)) return "";
  return `tel:${normalized}`;
}

export function safeEmailAddress(value: unknown): string {
  const email = typeof value === "string" ? value.trim() : "";
  return email.length <= 254 && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) ? email : "";
}

export function safeGoogleMapsEmbed(value: unknown): string {
  const url = parsedUrl(value);
  if (!url || url.protocol !== "https:") return "";
  const hostAllowed = url.hostname === "google.com"
    || url.hostname === "google.de"
    || url.hostname.endsWith(".google.com")
    || url.hostname.endsWith(".google.de");
  return hostAllowed && url.pathname.startsWith("/maps/embed") ? url.href : "";
}
