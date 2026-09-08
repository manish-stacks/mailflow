import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export const cn = (...inputs: ClassValue[]) => twMerge(clsx(inputs));

export const formatNumber = (n: number | undefined | null) =>
  new Intl.NumberFormat('en-IN').format(Number(n ?? 0));

export const formatPercent = (n: number | undefined | null) => `${Number(n ?? 0).toFixed(1)}%`;

export const formatDate = (d?: string | Date | null) =>
  d ? new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : '—';

export const formatDateTime = (d?: string | Date | null) =>
  d ? new Date(d).toLocaleString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }) : '—';

export const initials = (first?: string, last?: string) =>
  `${first?.[0] ?? ''}${last?.[0] ?? ''}`.toUpperCase() || '?';

/** Percentage of num over den, guarded against divide-by-zero. */
export const rate = (num?: number | null, den?: number | null) =>
  den ? +(((num ?? 0) / den) * 100).toFixed(2) : 0;

export const truncate = (s: string, max = 60) => (s.length > max ? `${s.slice(0, max)}…` : s);

/** -1 from the API means unlimited. */
export const formatLimit = (limit?: number | null) =>
  limit === -1 || limit === null || limit === undefined ? 'Unlimited' : formatNumber(limit);

export const formatMoney = (amount?: number | null, currency = 'INR') =>
  new Intl.NumberFormat('en-IN', { style: 'currency', currency, maximumFractionDigits: 0 }).format(Number(amount ?? 0));
