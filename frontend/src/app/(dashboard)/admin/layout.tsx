'use client';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { ShieldAlert } from 'lucide-react';
import { api } from '@/lib/api';
import { cn } from '@/lib/utils';
import { PageHeader } from '@/components/layout/page-header';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { PageLoader } from '@/components/ui/feedback';

const TABS = [
  { href: '/admin', label: 'Overview' },
  { href: '/admin/workspaces', label: 'Clients' },
  { href: '/admin/plans', label: 'Packages' },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  /** The API is the authority — this call is the access check, not a UI flag. */
  const access = useQuery({ queryKey: ['admin-stats'], queryFn: () => api.get('/admin/stats'), retry: false });

  if (access.isLoading) return <PageLoader />;

  if (access.isError) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center px-6 py-16 text-center">
          <div className="mb-4 rounded-full bg-accent p-4"><ShieldAlert className="h-6 w-6 text-accent-foreground" /></div>
          <h3 className="text-base font-semibold">Platform administrators only</h3>
          <p className="mt-1 max-w-sm text-sm text-muted-foreground">
            This area manages every client account on the platform, so it sits outside your workspace roles.
          </p>
          <Button asChild variant="outline" className="mt-5"><Link href="/dashboard">Back to dashboard</Link></Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader title="Platform admin" description="Clients, packages and platform-wide usage." />
      <div className="flex gap-1 overflow-x-auto border-b border-border">
        {TABS.map((t) => (
          <Link
            key={t.href}
            href={t.href}
            className={cn(
              'shrink-0 border-b-2 px-4 py-2.5 text-sm font-medium transition-colors',
              pathname === t.href ? 'border-primary text-foreground' : 'border-transparent text-muted-foreground hover:text-foreground',
            )}
          >
            {t.label}
          </Link>
        ))}
      </div>
      {children}
    </div>
  );
}
