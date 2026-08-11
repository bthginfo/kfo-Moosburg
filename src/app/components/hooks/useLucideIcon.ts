import {
  Award,
  Clock,
  EyeOff,
  Handshake,
  Heart,
  Shield,
  Stethoscope,
  Users,
  type LucideIcon,
} from "lucide-react";

const ICONS: Readonly<Record<string, LucideIcon>> = {
  award: Award,
  clock: Clock,
  eyeoff: EyeOff,
  handshake: Handshake,
  heart: Heart,
  shield: Shield,
  stethoscope: Stethoscope,
  users: Users,
};

/**
 * Löst ausschließlich die in Storyblok vorgesehenen Praxis-Icons auf.
 * Groß-/Kleinschreibung und Trennzeichen sind dabei unerheblich.
 */
export function getLucideIcon(name: string, fallback: LucideIcon = Heart): LucideIcon {
  const normalizedName = String(name || "").toLowerCase().replace(/[^a-z0-9]/g, "");
  return Object.hasOwn(ICONS, normalizedName) ? ICONS[normalizedName] : fallback;
}
