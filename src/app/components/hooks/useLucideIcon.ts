import { icons } from "lucide-react";
import type { LucideIcon } from "lucide-react";

/**
 * Resolves a Lucide icon by name string.
 * Supports PascalCase ("HeartPulse"), kebab-case ("heart-pulse"), etc.
 * Returns fallback icon if not found.
 */
export function getLucideIcon(name: string, fallback: LucideIcon = icons.Heart): LucideIcon {
  if (!name) return fallback;

  // Direct match (PascalCase) – most common from Storyblok
  if (name in icons) return icons[name as keyof typeof icons];

  // Try converting kebab-case or snake_case to PascalCase
  const pascalName = name
    .replace(/[-_](.)/g, (_, c) => c.toUpperCase())
    .replace(/^(.)/, (_, c) => c.toUpperCase());

  if (pascalName in icons) return icons[pascalName as keyof typeof icons];

  return fallback;
}
