import { type ReactNode } from "react";
import { motion } from "motion/react";

type Direction = "up" | "down" | "left" | "right";

interface ScrollRevealProps {
  children: ReactNode;
  delay?: number;
  className?: string;
  direction?: Direction;
  distance?: number;
  scale?: boolean;
}

const getInitial = (direction: Direction, distance: number, scale: boolean) => {
  const base: Record<string, number> = { opacity: 0 };
  if (scale) base.scale = 0.92;
  switch (direction) {
    case "up": base.y = distance; break;
    case "down": base.y = -distance; break;
    case "left": base.x = distance; break;
    case "right": base.x = -distance; break;
  }
  return base;
};

export function ScrollReveal({
  children,
  delay = 0,
  className = "",
  direction = "up",
  distance = 40,
  scale = false,
}: ScrollRevealProps) {
  return (
    <motion.div
      className={className}
      initial={getInitial(direction, distance, scale)}
      whileInView={{ opacity: 1, x: 0, y: 0, scale: 1 }}
      viewport={{ once: true, amount: 0.15 }}
      transition={{
        duration: 0.6,
        delay: delay / 1000,
        ease: [0.25, 0.46, 0.45, 0.94],
      }}
    >
      {children}
    </motion.div>
  );
}
