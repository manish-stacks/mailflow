'use client';
import { motion, useScroll, useTransform, useReducedMotion, type Variants } from 'framer-motion';
import { useRef } from 'react';

const EASE = [0.22, 1, 0.36, 1] as const;

/** Fade + rise when scrolled into view (once). Honors prefers-reduced-motion via <MotionConfig>. */
export function Reveal({ children, delay = 0, y = 24, className }: { children: React.ReactNode; delay?: number; y?: number; className?: string }) {
  return (
    <motion.div className={className} initial={{ opacity: 0, y }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: '-80px' }} transition={{ duration: 0.6, delay, ease: EASE }}>
      {children}
    </motion.div>
  );
}

const stagger: Variants = { hidden: {}, show: { transition: { staggerChildren: 0.07 } } };
const item: Variants = { hidden: { opacity: 0, y: 22 }, show: { opacity: 1, y: 0, transition: { duration: 0.55, ease: EASE } } };

export function Stagger({ children, className, as = 'div' }: { children: React.ReactNode; className?: string; as?: 'div' | 'ul' | 'ol' }) {
  const C: any = motion[as];
  return <C className={className} variants={stagger} initial="hidden" whileInView="show" viewport={{ once: true, margin: '-60px' }}>{children}</C>;
}

export function Item({ children, className, as = 'div' }: { children: React.ReactNode; className?: string; as?: 'div' | 'li' }) {
  const C: any = motion[as];
  return <C className={className} variants={item}>{children}</C>;
}

/** Gentle infinite bob for floating UI chips. */
export function Float({ children, className, delay = 0, amount = 8 }: { children: React.ReactNode; className?: string; delay?: number; amount?: number }) {
  const reduce = useReducedMotion();
  return (
    <motion.div className={className} animate={reduce ? undefined : { y: [0, -amount, 0] }} transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut', delay }}>
      {children}
    </motion.div>
  );
}

/** Hero preview: rises and settles as the page scrolls (subtle 3D tilt → flat). */
export function ScrollPreview({ children }: { children: React.ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start 95%', 'start 35%'] });
  const rotateX = useTransform(scrollYProgress, [0, 1], [10, 0]);
  const scale = useTransform(scrollYProgress, [0, 1], [0.94, 1]);
  return (
    <div ref={ref} style={{ perspective: 1400 }}>
      <motion.div style={{ rotateX, scale, transformOrigin: 'top center' }}>{children}</motion.div>
    </div>
  );
}

export function HeroIn({ children, delay = 0, className }: { children: React.ReactNode; delay?: number; className?: string }) {
  return <motion.div className={className} initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7, delay, ease: EASE }}>{children}</motion.div>;
}

export { motion };
