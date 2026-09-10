'use client';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Loader2, LogOut } from 'lucide-react';
import { Sidebar } from '@/components/layout/sidebar';
import { Topbar } from '@/components/layout/topbar';
import { useAuth } from '@/store/auth';
import { tokens } from '@/lib/api';
import { Button } from '@/components/ui/button';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [impersonating, setImpersonating] = useState<string | null>(null);

  useEffect(() => {
    if (!loading && !user) router.replace('/login');
  }, [loading, user, router]);

  // Read once on mount — this is a this-tab-only sessionStorage flag, not app state.
  useEffect(() => { setImpersonating(tokens.impersonationLabel); }, []);

  if (loading || !user) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar />
      <div className="flex min-w-0 flex-1 flex-col">
        {impersonating && (
          <div className="flex items-center justify-between gap-3 bg-amber-500/90 px-4 py-2 text-sm font-medium text-amber-950">
            <span>Viewing as {impersonating} — actions here affect their account.</span>
            <Button
              size="sm" variant="outline" className="h-7 border-amber-950/30 bg-transparent text-amber-950 hover:bg-amber-950/10"
              onClick={() => { tokens.endImpersonation(); window.close(); router.replace('/dashboard'); }}
            >
              <LogOut className="h-3.5 w-3.5" /> Exit
            </Button>
          </div>
        )}
        <Topbar />
        <main className="flex-1 px-4 py-6 lg:px-8">{children}</main>
      </div>
    </div>
  );
}
