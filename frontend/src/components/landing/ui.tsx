import Link from 'next/link';
import { cn } from '@/lib/utils';
import { Reveal } from './motion';

export const cta = {
  primary:
    'inline-flex h-12 items-center justify-center gap-2 rounded-xl bg-hm-red px-6 text-[15px] font-semibold text-white shadow-sm transition hover:bg-hm-red-dark focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-hm-red focus-visible:ring-offset-2 active:scale-[0.98]',
  secondary:
    'inline-flex h-12 items-center justify-center gap-2 rounded-xl border border-hm-line bg-white px-6 text-[15px] font-semibold text-hm-ink transition hover:border-hm-ink/30 hover:bg-hm-bg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-hm-red focus-visible:ring-offset-2',
  link: 'inline-flex items-center gap-1.5 text-[15px] font-semibold text-hm-red transition hover:gap-2.5 hover:text-hm-red-dark focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-hm-red focus-visible:ring-offset-2 rounded',
};

export function Section({ id, className, children, tone = 'white' }: { id?: string; className?: string; children: React.ReactNode; tone?: 'white' | 'gray' | 'dark' }) {
  return (
    <section id={id} className={cn('scroll-mt-20 py-20 sm:py-24', tone === 'gray' && 'bg-hm-bg', tone === 'dark' && 'bg-hm-ink text-white', className)}>
      <div className="mx-auto w-full max-w-[1400px] px-5 sm:px-8">{children}</div>
    </section>
  );
}

export function Heading({ eyebrow, title, copy, center = true, dark = false }: { eyebrow?: string; title: string; copy?: string; center?: boolean; dark?: boolean }) {
  return (
    <Reveal className={cn('max-w-2xl', center && 'mx-auto text-center')}>
      {eyebrow && <p className="mb-3 text-xs font-semibold uppercase tracking-[0.14em] text-hm-red">{eyebrow}</p>}
      <h2 className={cn('text-balance text-3xl font-semibold tracking-tight sm:text-[40px] sm:leading-[1.12]', dark ? 'text-white' : 'text-hm-ink')}>{title}</h2>
      {copy && <p className={cn('mt-4 text-pretty text-base leading-relaxed sm:text-lg', dark ? 'text-white/70' : 'text-hm-gray')}>{copy}</p>}
    </Reveal>
  );
}

/** Fake-app window chrome used by every product mockup. */
export function Window({ title, children, className }: { title: string; children: React.ReactNode; className?: string }) {
  return (
    <div className={cn('overflow-hidden rounded-2xl border border-hm-line bg-white shadow-[0_1px_2px_rgba(16,24,40,.04),0_12px_32px_-12px_rgba(16,24,40,.14)]', className)} role="img" aria-label={`${title} — product illustration`}>
      <div className="flex items-center gap-2 border-b border-hm-line bg-hm-bg px-4 py-2.5" aria-hidden="true">
        <span className="h-2.5 w-2.5 rounded-full bg-hm-line" /><span className="h-2.5 w-2.5 rounded-full bg-hm-line" /><span className="h-2.5 w-2.5 rounded-full bg-hm-line" />
        <span className="ml-3 truncate text-xs font-medium text-hm-gray">{title}</span>
      </div>
      <div aria-hidden="true">{children}</div>
    </div>
  );
}

export function Illustrative({ children = 'Illustrative sample data' }: { children?: React.ReactNode }) {
  return <p className="mt-3 text-xs text-hm-gray">{children}</p>;
}

export function Tag({ children, tone = 'gray' }: { children: React.ReactNode; tone?: 'gray' | 'red' | 'green' | 'amber' }) {
  const t = { gray: 'bg-hm-bg text-hm-gray border-hm-line', red: 'bg-red-50 text-hm-red border-red-100', green: 'bg-emerald-50 text-emerald-700 border-emerald-100', amber: 'bg-amber-50 text-amber-700 border-amber-100' }[tone];
  return <span className={cn('inline-flex items-center rounded-full border px-2 py-0.5 text-[11px] font-medium', t)}>{children}</span>;
}

export const A = Link;
