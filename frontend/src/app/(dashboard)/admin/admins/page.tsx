'use client';
import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { MoreHorizontal, Plus, ShieldCheck, Trash2 } from 'lucide-react';
import { api } from '@/lib/api';
import { formatDate } from '@/lib/utils';
import type { AdminOperator, AdminPermission } from '@/types';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Field, Input } from '@/components/ui/input';
import { Table, TBody, TD, TH, THead, TR } from '@/components/ui/table';
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
  Dropdown, DropdownContent, DropdownItem, DropdownTrigger, Switch,
} from '@/components/ui/primitives';
import { EmptyState, TableSkeleton, toast } from '@/components/ui/feedback';

const PERMISSION_LABELS: Record<AdminPermission, string> = {
  'workspaces.view': 'View clients',
  'workspaces.manage': 'Manage clients (packages, suspend, provision)',
  'plans.manage': 'Manage packages',
  'payments.view': 'View payment history',
  impersonate: 'Log in as a client',
};

export default function AdminOperatorsPage() {
  const qc = useQueryClient();
  const [newOpen, setNewOpen] = useState(false);
  const [permsFor, setPermsFor] = useState<AdminOperator | null>(null);
  const [form, setForm] = useState<{ email: string; full: boolean; permissions: AdminPermission[] }>({
    email: '', full: false, permissions: [],
  });
  const [draftPerms, setDraftPerms] = useState<AdminPermission[]>([]);

  const admins = useQuery({ queryKey: ['admin-operators'], queryFn: () => api.get<AdminOperator[]>('/admin/admins') });
  const permissions = useQuery({ queryKey: ['admin-permission-list'], queryFn: () => api.get<AdminPermission[]>('/admin/permissions') });

  const grant = useMutation({
    mutationFn: () => api.post('/admin/admins', form),
    onSuccess: () => { toast.success('Access granted'); setNewOpen(false); setForm({ email: '', full: false, permissions: [] }); qc.invalidateQueries({ queryKey: ['admin-operators'] }); },
    onError: (e: any) => toast.error('Could not grant access', e.message),
  });

  const updatePerms = useMutation({
    mutationFn: () => api.patch(`/admin/admins/${permsFor!.id}/permissions`, { permissions: draftPerms }),
    onSuccess: () => { toast.success('Permissions updated'); setPermsFor(null); qc.invalidateQueries({ queryKey: ['admin-operators'] }); },
    onError: (e: any) => toast.error('Could not update permissions', e.message),
  });

  const revoke = useMutation({
    mutationFn: (id: string) => api.delete(`/admin/admins/${id}`),
    onSuccess: () => { toast.success('Access revoked'); qc.invalidateQueries({ queryKey: ['admin-operators'] }); },
    onError: (e: any) => toast.error('Could not revoke access', e.message),
  });

  const rows = admins.data ?? [];
  const allPerms = permissions.data ?? (Object.keys(PERMISSION_LABELS) as AdminPermission[]);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">Full admins get everything automatically; staff accounts only get what you tick below.</p>
        <Button onClick={() => setNewOpen(true)}><Plus className="h-4 w-4" /> Grant access</Button>
      </div>

      <Card>
        {admins.isLoading ? <TableSkeleton cols={4} />
          : !rows.length ? <EmptyState title="No platform admins yet" description="Grant access to a teammate to get started." />
          : (
            <Table>
              <THead>
                <TR><TH>Person</TH><TH>Access</TH><TH className="hidden md:table-cell">Last login</TH><TH className="w-10" /></TR>
              </THead>
              <TBody>
                {rows.map((a) => (
                  <TR key={a.id}>
                    <TD>
                      <p className="font-medium">{[a.firstName, a.lastName].filter(Boolean).join(' ') || a.email}</p>
                      <p className="text-sm text-muted-foreground">{a.email}</p>
                    </TD>
                    <TD>
                      {a.isSuperAdmin ? (
                        <Badge className="gap-1"><ShieldCheck className="h-3 w-3" /> Full admin</Badge>
                      ) : (
                        <div className="flex flex-wrap gap-1">
                          {(a.adminPermissions ?? []).length
                            ? a.adminPermissions!.map((p) => <Badge key={p} variant="secondary">{PERMISSION_LABELS[p] ?? p}</Badge>)
                            : <span className="text-sm text-muted-foreground">No permissions</span>}
                        </div>
                      )}
                    </TD>
                    <TD className="hidden text-sm text-muted-foreground md:table-cell">{a.lastLoginAt ? formatDate(a.lastLoginAt) : '—'}</TD>
                    <TD>
                      <Dropdown>
                        <DropdownTrigger asChild><Button variant="ghost" size="icon"><MoreHorizontal className="h-4 w-4" /></Button></DropdownTrigger>
                        <DropdownContent align="end">
                          {!a.isSuperAdmin && (
                            <DropdownItem onSelect={() => { setPermsFor(a); setDraftPerms(a.adminPermissions ?? []); }}>
                              Edit permissions
                            </DropdownItem>
                          )}
                          <DropdownItem destructive onSelect={() => revoke.mutate(a.id)}>
                            <Trash2 className="h-4 w-4" /> Revoke access
                          </DropdownItem>
                        </DropdownContent>
                      </Dropdown>
                    </TD>
                  </TR>
                ))}
              </TBody>
            </Table>
          )}
      </Card>

      <Dialog open={newOpen} onOpenChange={setNewOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="text-lg font-semibold">Grant platform access</DialogTitle>
            <DialogDescription>The person must already have an account on the platform.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <Field label="Email">
              <Input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="teammate@company.com" />
            </Field>
            <div className="flex items-center justify-between rounded-lg border border-border p-3">
              <div>
                <p className="text-sm font-medium">Full admin</p>
                <p className="text-xs text-muted-foreground">Everything, including managing other admins.</p>
              </div>
              <Switch checked={form.full} onCheckedChange={(v: boolean) => setForm({ ...form, full: v })} />
            </div>
            {!form.full && (
              <div className="space-y-2">
                <p className="text-sm font-medium">Permissions</p>
                {allPerms.map((p) => (
                  <label key={p} className="flex items-center justify-between rounded-lg border border-border p-3 text-sm">
                    {PERMISSION_LABELS[p] ?? p}
                    <Switch
                      checked={form.permissions.includes(p)}
                      onCheckedChange={(v: boolean) => setForm({
                        ...form,
                        permissions: v ? [...form.permissions, p] : form.permissions.filter((x) => x !== p),
                      })}
                    />
                  </label>
                ))}
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setNewOpen(false)}>Cancel</Button>
            <Button disabled={!form.email} loading={grant.isPending} onClick={() => grant.mutate()}>Grant access</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!permsFor} onOpenChange={() => setPermsFor(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle className="text-lg font-semibold">Permissions for {permsFor?.email}</DialogTitle></DialogHeader>
          <div className="space-y-2">
            {allPerms.map((p) => (
              <label key={p} className="flex items-center justify-between rounded-lg border border-border p-3 text-sm">
                {PERMISSION_LABELS[p] ?? p}
                <Switch
                  checked={draftPerms.includes(p)}
                  onCheckedChange={(v: boolean) => setDraftPerms(v ? [...draftPerms, p] : draftPerms.filter((x) => x !== p))}
                />
              </label>
            ))}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setPermsFor(null)}>Cancel</Button>
            <Button loading={updatePerms.isPending} onClick={() => updatePerms.mutate()}>Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
