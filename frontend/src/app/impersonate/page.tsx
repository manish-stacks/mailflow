'use client';
import { Suspense, useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Loader2, ShieldAlert } from 'lucide-react';
import { tokens } from '@/lib/api';
import { useAuth } from '@/store/auth';

/**
 * Landing page for an impersonation link opened in a fresh tab. Stores the
 * token in sessionStorage only (never localStorage), so the admin's own
 * logged-in tab is completely untouched.
 */
function ImpersonateInner() {
  const router = useRouter();
  const params = useSearchParams();
  const bootstrap = useAuth((s) => s.bootstrap);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const token = params.get('token');
    const workspaceId = params.get('workspace');
    const label = params.get('label') || 'client account';
    if (!token || !workspaceId) { setError('This impersonation link is missing information.'); return; }

    tokens.startImpersonation(token, workspaceId, decodeURIComponent(label));
    bootstrap().then(() => router.replace('/dashboard'));
  }, [params, router, bootstrap]);

  if (error) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-muted/40 px-4">
        <div className="w-full max-w-md rounded-2xl border border-border bg-card p-8 text-center shadow-sm">
          <div className="mx-auto mb-5 flex h-12 w-12 items-center justify-center rounded-xl bg-accent">
            <ShieldAlert className="h-6 w-6 text-accent-foreground" />
          </div>
          <h1 className="text-xl font-semibold">Could not start this session</h1>
          <p className="mt-2 text-sm text-muted-foreground">{error} Go back to the admin panel and try again.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/40 px-4">
      <div className="flex flex-col items-center gap-3 text-muted-foreground">
        <Loader2 className="h-6 w-6 animate-spin" />
        <p className="text-sm">Signing you into the client account…</p>
      </div>
    </div>
  );
}

export default function ImpersonatePage() {
  return (
    <Suspense fallback={null}>
      <ImpersonateInner />
    </Suspense>
  );
}
