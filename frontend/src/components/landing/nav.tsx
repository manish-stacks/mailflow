'use client';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { Menu, X } from 'lucide-react';
import { useAuth } from '@/store/auth';
import { ROUTES } from '@/config/landing';
import { cn } from '@/lib/utils';
import { Logo } from './logo';
import { useDemo } from './demo';

const LINKS = [
  { label: 'Features', href: '#features' },
  { label: 'AI Tools', href: '#ai' },
  { label: 'Templates', href: '#templates' },
  { label: 'Pricing', href: '#pricing' },
  { label: 'API & Developers', href: '#developers' },
];

export function Nav() {
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const user = useAuth((s) => s.user);
  const { open: openDemo } = useDemo();

  useEffect(() => {
    const on = () => setScrolled(window.scrollY > 8);
    on();
    window.addEventListener('scroll', on, { passive: true });
    return () => window.removeEventListener('scroll', on);
  }, []);

  useEffect(() => {
    if (!open) return;
    const esc = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false);
    document.addEventListener('keydown', esc);
    return () => document.removeEventListener('keydown', esc);
  }, [open]);

  const linkCls = 'rounded-md px-3 py-2 text-sm font-medium text-hm-gray transition-colors hover:text-hm-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-hm-red';

  return (
    <header className={cn('sticky top-0 z-50 border-b bg-white/90 backdrop-blur transition-shadow', scrolled ? 'border-hm-line shadow-sm' : 'border-transparent')}>
      <a href="#main" className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:rounded-md focus:bg-hm-ink focus:px-3 focus:py-2 focus:text-white">Skip to content</a>
      <div className="mx-auto flex h-16 w-full max-w-[1200px] items-center justify-between px-5 sm:px-8">
        <Logo />
        <nav aria-label="Primary" className="hidden items-center gap-1 lg:flex">
          {LINKS.map((l) => <a key={l.href} href={l.href} className={linkCls}>{l.label}</a>)}
        </nav>
        <div className="hidden items-center gap-2 lg:flex">
          {user ? (
            <Link href={ROUTES.dashboard} className="inline-flex h-10 items-center rounded-lg bg-hm-red px-4 text-sm font-semibold text-white transition hover:bg-hm-red-dark focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-hm-red focus-visible:ring-offset-2">Open Dashboard</Link>
          ) : (
            <>
              <Link href={ROUTES.signIn} className={cn(linkCls, 'text-hm-ink')}>Sign In</Link>
              <button type="button" onClick={() => openDemo()} className="inline-flex h-10 items-center rounded-lg border border-hm-line px-4 text-sm font-semibold text-hm-ink transition hover:border-hm-ink/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-hm-red">Get Demo</button>
              <Link href={ROUTES.signUp} className="inline-flex h-10 items-center rounded-lg bg-hm-red px-4 text-sm font-semibold text-white transition hover:bg-hm-red-dark focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-hm-red focus-visible:ring-offset-2">Get Started</Link>
            </>
          )}
        </div>
        <button
          type="button" className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-hm-line text-hm-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-hm-red lg:hidden"
          aria-expanded={open} aria-controls="mobile-menu" aria-label={open ? 'Close menu' : 'Open menu'} onClick={() => setOpen(!open)}
        >
          {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>
      {open && (
        <div id="mobile-menu" className="border-t border-hm-line bg-white px-5 pb-5 pt-3 lg:hidden">
          <nav aria-label="Mobile" className="flex flex-col">
            {LINKS.map((l) => (
              <a key={l.href} href={l.href} onClick={() => setOpen(false)} className="rounded-md px-2 py-3 text-base font-medium text-hm-ink hover:bg-hm-bg">{l.label}</a>
            ))}
          </nav>
          <div className="mt-3 grid grid-cols-2 gap-3">
            <button type="button" onClick={() => { setOpen(false); openDemo(); }} className="col-span-2 inline-flex h-11 items-center justify-center rounded-lg border border-hm-ink text-sm font-semibold text-hm-ink">Get a Free Demo</button>
            {user ? (
              <Link href={ROUTES.dashboard} className="col-span-2 inline-flex h-11 items-center justify-center rounded-lg bg-hm-red text-sm font-semibold text-white">Open Dashboard</Link>
            ) : (
              <>
                <Link href={ROUTES.signIn} className="inline-flex h-11 items-center justify-center rounded-lg border border-hm-line text-sm font-semibold text-hm-ink">Sign In</Link>
                <Link href={ROUTES.signUp} className="inline-flex h-11 items-center justify-center rounded-lg bg-hm-red text-sm font-semibold text-white">Get Started</Link>
              </>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
