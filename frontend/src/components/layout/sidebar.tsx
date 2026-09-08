'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  BarChart3, ChevronDown, FileText, Filter, LayoutDashboard, ListChecks, Mail, Menu, Plus,
  Send, Settings, ShieldCheck, Upload, Users, X,
} from 'lucide-react';
import { useState } from 'react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/store/auth';
import { Button } from '@/components/ui/button';
import { Dropdown, DropdownContent, DropdownItem, DropdownLabel, DropdownSeparator, DropdownTrigger } from '@/components/ui/primitives';

const NAV = [
  { label: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  {
    label: 'Campaigns', icon: Send, children: [
      { label: 'All Campaigns', href: '/campaigns' },
      { label: 'Create Campaign', href: '/campaigns/new' },
      { label: 'Email Templates', href: '/templates' },
    ],
  },
  {
    label: 'Contacts', icon: Users, children: [
      { label: 'All Contacts', href: '/contacts' },
      { label: 'Lists', href: '/lists' },
      { label: 'Segments', href: '/segments' },
      { label: 'Import Contacts', href: '/contacts/import' },
    ],
  },
  { label: 'Analytics', href: '/analytics', icon: BarChart3 },
  {
    label: 'Settings', icon: Settings, children: [
      { label: 'Workspace', href: '/settings/workspace' },
      { label: 'Team Members', href: '/settings/team' },
      { label: 'Sender Identities', href: '/settings/senders' },
      { label: 'Mail Server', href: '/settings/mail' },
      { label: 'Domains', href: '/settings/domains' },
      { label: 'API Keys', href: '/settings/api-keys' },
      { label: 'Suppressions', href: '/settings/suppressions' },
      { label: 'Plan & Usage', href: '/settings/billing' },
      { label: 'Payments', href: '/settings/payments' },
    ],
  },
];

/** Only rendered for platform operators — the API is still the real gate. */
const ADMIN_NAV = {
  label: 'Platform Admin', icon: ShieldCheck, children: [
    { label: 'Overview', href: '/admin' },
    { label: 'Clients', href: '/admin/workspaces' },
    { label: 'Packages', href: '/admin/plans' },
  ],
};

function NavSection({ item, pathname }: { item: any; pathname: string }) {
  const active = item.children?.some((c: any) => pathname.startsWith(c.href));
  const [open, setOpen] = useState(active);
  const Icon = item.icon;

  if (!item.children) {
    const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
    return (
      <Link
        href={item.href}
        className={cn(
          'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
          isActive ? 'bg-accent text-accent-foreground' : 'text-muted-foreground hover:bg-secondary hover:text-foreground',
        )}
      >
        <Icon className="h-4 w-4" />
        {item.label}
      </Link>
    );
  }

  return (
    <div>
      <button
        onClick={() => setOpen(!open)}
        className={cn(
          'flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
          active ? 'text-foreground' : 'text-muted-foreground hover:bg-secondary hover:text-foreground',
        )}
      >
        <Icon className="h-4 w-4" />
        <span className="flex-1 text-left">{item.label}</span>
        <ChevronDown className={cn('h-4 w-4 transition-transform', open && 'rotate-180')} />
      </button>
      {open && (
        <div className="ml-4 mt-1 space-y-0.5 border-l border-border pl-3">
          {item.children.map((c: any) => (
            <Link
              key={c.href}
              href={c.href}
              className={cn(
                'block rounded-md px-3 py-1.5 text-sm transition-colors',
                pathname === c.href ? 'bg-accent font-medium text-accent-foreground' : 'text-muted-foreground hover:text-foreground',
              )}
            >
              {c.label}
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

export function WorkspaceSwitcher() {
  const { workspaces, activeWorkspace, switchWorkspace } = useAuth();
  return (
    <Dropdown>
      <DropdownTrigger asChild>
        <button className="flex w-full items-center gap-2.5 rounded-lg border border-border bg-card px-3 py-2 text-left transition hover:bg-secondary">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-primary text-sm font-semibold text-primary-foreground">
            {activeWorkspace?.name?.[0]?.toUpperCase() ?? 'W'}
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium">{activeWorkspace?.name ?? 'Select workspace'}</p>
            <p className="text-xs capitalize text-muted-foreground">{activeWorkspace?.role}</p>
          </div>
          <ChevronDown className="h-4 w-4 text-muted-foreground" />
        </button>
      </DropdownTrigger>
      <DropdownContent align="start" className="w-64">
        <DropdownLabel>Workspaces</DropdownLabel>
        {workspaces.map((w) => (
          <DropdownItem key={w.id} onSelect={() => switchWorkspace(w.id)}>
            <span className="flex-1 truncate">{w.name}</span>
            {w.id === activeWorkspace?.id && <span className="text-xs text-primary">Active</span>}
          </DropdownItem>
        ))}
        <DropdownSeparator />
        <DropdownItem asChild>
          <Link href="/settings/workspace?new=1"><Plus className="h-4 w-4" /> New workspace</Link>
        </DropdownItem>
      </DropdownContent>
    </Dropdown>
  );
}

export function Sidebar() {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);
  const isSuperAdmin = useAuth((s) => s.user?.isSuperAdmin);

  const content = (
    <div className="flex h-full flex-col gap-4 p-4">
      <Link href="/dashboard" className="flex items-center gap-2 px-2 py-1">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
          <Mail className="h-4 w-4 text-primary-foreground" />
        </div>
        <span className="text-lg font-semibold tracking-tight">MailFlow</span>
      </Link>

      <WorkspaceSwitcher />

      <nav className="flex-1 space-y-1 overflow-y-auto">
        {NAV.map((item) => <NavSection key={item.label} item={item} pathname={pathname} />)}
        {isSuperAdmin && (
          <div className="mt-2 border-t border-border pt-2">
            <NavSection item={ADMIN_NAV} pathname={pathname} />
          </div>
        )}
      </nav>

      <Button asChild className="w-full">
        <Link href="/campaigns/new"><Plus className="h-4 w-4" /> New Campaign</Link>
      </Button>
    </div>
  );

  return (
    <>
      <aside className="hidden w-64 shrink-0 border-r border-border bg-card lg:block">
        <div className="sticky top-0 h-screen">{content}</div>
      </aside>

      <div className="lg:hidden">
        <Button variant="ghost" size="icon" onClick={() => setMobileOpen(true)} aria-label="Open navigation">
          <Menu className="h-5 w-5" />
        </Button>
        {mobileOpen && (
          <div className="fixed inset-0 z-50 flex">
            <div className="absolute inset-0 bg-black/50" onClick={() => setMobileOpen(false)} />
            <div className="relative h-full w-72 bg-card shadow-xl">
              <button className="absolute right-3 top-3 p-1" onClick={() => setMobileOpen(false)}>
                <X className="h-5 w-5" />
              </button>
              <div onClick={() => setMobileOpen(false)}>{content}</div>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
