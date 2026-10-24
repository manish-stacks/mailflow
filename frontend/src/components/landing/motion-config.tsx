'use client';
import { MotionConfig } from 'framer-motion';
/** Respect the visitor's reduced-motion setting across all landing animations. */
export function Motion({ children }: { children: React.ReactNode }) {
  return <MotionConfig reducedMotion="user">{children}</MotionConfig>;
}
