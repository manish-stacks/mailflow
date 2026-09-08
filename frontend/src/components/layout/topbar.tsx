'use client';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { LogOut, Settings, User as UserIcon } from 'lucide-react';
import { useAuth } from '@/store/auth';
import { initials } from '@/lib/utils';
import { Dropdown, DropdownContent, DropdownItem, DropdownLabel, DropdownSeparator, DropdownTrigger } from '@/components/ui/primitives';
import { Sidebar } from './sidebar';

export function Topbar() {
  const { user, logout } = useAuth();
  const router = useRouter();

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center justify-between gap-4 border-b border-border bg-background/80 px-4 backdrop-blur lg:px-6">
      <div className="flex items-center gap-2 lg:hidden"><Sidebar /></div>

      <div className="ml-auto flex items-center gap-3">
        <Dropdown>
          <DropdownTrigger asChild>
            <button className="flex h-9 w-9 items-center justify-center rounded-full bg-accent text-sm font-semibold text-accent-foreground">
              {initials(user?.firstName, user?.lastName)}
            </button>
          </DropdownTrigger>
          <DropdownContent align="end" className="w-56">
            <DropdownLabel>
              <span className="block text-sm font-medium text-foreground">{user?.firstName} {user?.lastName}</span>
              <span className="block truncate text-xs">{user?.email}</span>
            </DropdownLabel>
            <DropdownSeparator />
            <DropdownItem asChild><Link href="/settings/workspace"><Settings className="h-4 w-4" /> Settings</Link></DropdownItem>
            <DropdownItem asChild><Link href="/settings/team"><UserIcon className="h-4 w-4" /> Team</Link></DropdownItem>
            <DropdownSeparator />
            <DropdownItem destructive onSelect={async () => { await logout(); router.push('/login'); }}>
              <LogOut className="h-4 w-4" /> Sign out
            </DropdownItem>
          </DropdownContent>
        </Dropdown>
      </div>
    </header>
  );
}
