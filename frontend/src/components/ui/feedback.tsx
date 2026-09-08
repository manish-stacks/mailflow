'use client';
import * as React from 'react';
import { create } from 'zustand';
import { AlertCircle, CheckCircle2, Info, Inbox, Loader2, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from './button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from './primitives';

/* ---------- Toasts ---------- */
type ToastVariant = 'success' | 'error' | 'info';
interface Toast { id: number; title: string; description?: string; variant: ToastVariant }

interface ToastStore {
  toasts: Toast[];
  push: (t: Omit<Toast, 'id'>) => void;
  dismiss: (id: number) => void;
}

const useToastStore = create<ToastStore>((set) => ({
  toasts: [],
  push: (t) => {
    const id = Date.now() + Math.random();
    set((s) => ({ toasts: [...s.toasts, { ...t, id }] }));
    setTimeout(() => set((s) => ({ toasts: s.toasts.filter((x) => x.id !== id) })), 5000);
  },
  dismiss: (id) => set((s) => ({ toasts: s.toasts.filter((x) => x.id !== id) })),
}));

export const toast = {
  success: (title: string, description?: string) => useToastStore.getState().push({ title, description, variant: 'success' }),
  error: (title: string, description?: string) => useToastStore.getState().push({ title, description, variant: 'error' }),
  info: (title: string, description?: string) => useToastStore.getState().push({ title, description, variant: 'info' }),
};

const ICONS = { success: CheckCircle2, error: AlertCircle, info: Info };

export function Toaster() {
  const { toasts, dismiss } = useToastStore();
  return (
    <div className="pointer-events-none fixed bottom-4 right-4 z-[100] flex w-full max-w-sm flex-col gap-2">
      {toasts.map((t) => {
        const Icon = ICONS[t.variant];
        return (
          <div
            key={t.id}
            className={cn(
              'pointer-events-auto flex items-start gap-3 rounded-xl border bg-card p-4 shadow-lg',
              t.variant === 'success' && 'border-emerald-200 dark:border-emerald-900',
              t.variant === 'error' && 'border-red-200 dark:border-red-900',
            )}
          >
            <Icon className={cn('mt-0.5 h-5 w-5 shrink-0',
              t.variant === 'success' && 'text-emerald-600',
              t.variant === 'error' && 'text-destructive',
              t.variant === 'info' && 'text-primary')} />
            <div className="flex-1">
              <p className="text-sm font-medium">{t.title}</p>
              {t.description && <p className="mt-0.5 text-xs text-muted-foreground">{t.description}</p>}
            </div>
            <button onClick={() => dismiss(t.id)} className="text-muted-foreground hover:text-foreground">
              <X className="h-4 w-4" />
            </button>
          </div>
        );
      })}
    </div>
  );
}

/* ---------- Skeletons / states ---------- */
export const Skeleton = ({ className }: { className?: string }) => <div className={cn('skeleton h-4 w-full', className)} />;

export const TableSkeleton = ({ rows = 6, cols = 5 }: { rows?: number; cols?: number }) => (
  <div className="divide-y divide-border">
    {Array.from({ length: rows }).map((_, r) => (
      <div key={r} className="flex items-center gap-4 px-4 py-3.5">
        {Array.from({ length: cols }).map((_, c) => (
          <Skeleton key={c} className={c === 0 ? 'w-1/3' : 'w-1/6'} />
        ))}
      </div>
    ))}
  </div>
);

export const PageLoader = () => (
  <div className="flex h-64 items-center justify-center">
    <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
  </div>
);

export const EmptyState = ({
  icon: Icon = Inbox, title, description, action,
}: { icon?: any; title: string; description?: string; action?: React.ReactNode }) => (
  <div className="flex flex-col items-center justify-center px-6 py-16 text-center">
    <div className="mb-4 rounded-full bg-accent p-4">
      <Icon className="h-7 w-7 text-accent-foreground" />
    </div>
    <h3 className="text-base font-semibold">{title}</h3>
    {description && <p className="mt-1 max-w-sm text-sm text-muted-foreground">{description}</p>}
    {action && <div className="mt-5">{action}</div>}
  </div>
);

export const ErrorState = ({ message, onRetry }: { message?: string; onRetry?: () => void }) => (
  <EmptyState
    icon={AlertCircle}
    title="Something went wrong"
    description={message || 'We could not load this data.'}
    action={onRetry ? <Button variant="outline" onClick={onRetry}>Try again</Button> : null}
  />
);

/* ---------- Confirm dialog ---------- */
export function ConfirmDialog({
  open, onOpenChange, title, description, confirmLabel = 'Confirm', destructive, onConfirm, loading,
}: {
  open: boolean; onOpenChange: (v: boolean) => void; title: string; description?: string;
  confirmLabel?: string; destructive?: boolean; onConfirm: () => void; loading?: boolean;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="text-lg font-semibold">{title}</DialogTitle>
          {description && <DialogDescription>{description}</DialogDescription>}
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button variant={destructive ? 'destructive' : 'default'} onClick={onConfirm} loading={loading}>
            {confirmLabel}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

/* ---------- Pagination ---------- */
export function Pagination({ page, totalPages, total, onChange }: { page: number; totalPages: number; total: number; onChange: (p: number) => void }) {
  if (totalPages <= 1) return null;
  return (
    <div className="flex items-center justify-between border-t border-border px-4 py-3">
      <p className="text-xs text-muted-foreground">
        Page {page} of {totalPages} · {total} total
      </p>
      <div className="flex gap-2">
        <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => onChange(page - 1)}>Previous</Button>
        <Button variant="outline" size="sm" disabled={page >= totalPages} onClick={() => onChange(page + 1)}>Next</Button>
      </div>
    </div>
  );
}
