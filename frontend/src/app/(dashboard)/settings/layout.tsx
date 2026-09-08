'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { PageHeader } from '@/components/layout/page-header';

const TABS = [
  { href: '/settings/workspace', label: 'Workspace' },
  { href: '/settings/team', label: 'Team' },
  { href: '/settings/senders', label: 'Senders' },
  { href: '/settings/mail', label: 'Mail Server' },
  { href: '/settings/domains', label: 'Domains' },
  { href: '/settings/api-keys', label: 'API Keys' },
  { href: '/settings/suppressions', label: 'Suppressions' },
  { href: '/settings/billing', label: 'Plan & Usage' },
  { href: '/settings/payments', label: 'Payments' },
];

export default function SettingsLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  return (
    <div className="space-y-6">
      <PageHeader title="Settings" description="Manage your workspace, team and sending configuration." />
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
