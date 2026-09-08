'use client';
import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Ban, Copy, MoreHorizontal, Play, Plus, Search } from 'lucide-react';
import { api } from '@/lib/api';
import { formatDate, formatNumber } from '@/lib/utils';
import type { AdminWorkspace, Plan } from '@/types';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Field, Input } from '@/components/ui/input';
import { Table, TBody, TD, TH, THead, TR } from '@/components/ui/table';
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
  Dropdown, DropdownContent, DropdownItem, DropdownTrigger, Select,
} from '@/components/ui/primitives';
import { EmptyState, Pagination, TableSkeleton, toast } from '@/components/ui/feedback';

export default function AdminWorkspacesPage() {
  const qc = useQueryClient();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [newOpen, setNewOpen] = useState(false);
  const [planFor, setPlanFor] = useState<AdminWorkspace | null>(null);
  const [planChoice, setPlanChoice] = useState({ plan: '', billingCycle: 'monthly', trialDays: 0 });
  const [created, setCreated] = useState<any>(null);
  const [form, setForm] = useState({
    workspaceName: '', email: '', firstName: '', lastName: '', password: '', plan: 'free', trialDays: 0,
  });

  const workspaces = useQuery({
    queryKey: ['admin-workspaces', page, search, status],
    queryFn: () => api.list<AdminWorkspace>('/admin/workspaces', { page, limit: 20, search, status }),
  });
  const plans = useQuery({ queryKey: ['admin-plans'], queryFn: () => api.get<Plan[]>('/admin/plans') });

  const provision = useMutation({
    mutationFn: () => api.post<any>('/admin/clients', { ...form, password: form.password || undefined, trialDays: form.trialDays || undefined }),
    onSuccess: (res) => {
      setCreated(res);
      setNewOpen(false);
      setForm({ workspaceName: '', email: '', firstName: '', lastName: '', password: '', plan: 'free', trialDays: 0 });
      qc.invalidateQueries({ queryKey: ['admin-workspaces'] });
    },
    onError: (e: any) => toast.error('Could not create the client', e.message),
  });

  const assignPlan = useMutation({
    mutationFn: () => api.post(`/admin/workspaces/${planFor!.id}/plan`, {
      plan: planChoice.plan,
      billingCycle: planChoice.billingCycle,
      trialDays: planChoice.trialDays || undefined,
    }),
    onSuccess: () => { toast.success('Package updated'); setPlanFor(null); qc.invalidateQueries({ queryKey: ['admin-workspaces'] }); },
    onError: (e: any) => toast.error('Could not change the package', e.message),
  });

  const setStatusM = useMutation({
    mutationFn: ({ id, status }: { id: string; status: 'active' | 'suspended' }) =>
      api.patch(`/admin/workspaces/${id}/status`, { status }),
    onSuccess: () => { toast.success('Workspace updated'); qc.invalidateQueries({ queryKey: ['admin-workspaces'] }); },
    onError: (e: any) => toast.error('Action failed', e.message),
  });

  const rows = workspaces.data?.data ?? [];

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input placeholder="Search by workspace or owner email" className="pl-9" value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} />
        </div>
        <Select className="sm:w-44" value={status} onChange={(e) => { setStatus(e.target.value); setPage(1); }}>
          <option value="">All statuses</option>
          <option value="active">Active</option>
          <option value="suspended">Suspended</option>
        </Select>
        <Button onClick={() => setNewOpen(true)}><Plus className="h-4 w-4" /> New client</Button>
      </div>

      <Card>
        {workspaces.isLoading ? <TableSkeleton cols={5} />
          : !rows.length ? <EmptyState title="No client workspaces" description="Create one to get started." />
          : (
            <>
              <Table>
                <THead>
                  <TR>
                    <TH>Workspace</TH><TH>Package</TH>
                    <TH className="hidden md:table-cell">Contacts</TH>
                    <TH className="hidden md:table-cell">Emails</TH>
                    <TH className="hidden lg:table-cell">Created</TH>
                    <TH className="w-10" />
                  </TR>
                </THead>
                <TBody>
                  {rows.map((w) => (
                    <TR key={w.id}>
                      <TD>
                        <p className="font-medium">{w.name}</p>
                        <p className="text-sm text-muted-foreground">{w.ownerEmail}</p>
                      </TD>
                      <TD>
                        <div className="flex flex-wrap items-center gap-1.5">
                          <Badge variant="secondary">{w.plan?.name ?? 'None'}</Badge>
                          {w.status === 'suspended'
                            ? <Badge variant="destructive">Suspended</Badge>
                            : w.subscriptionStatus && w.subscriptionStatus !== 'active'
                              ? <Badge variant="warning" className="capitalize">{w.subscriptionStatus}</Badge>
                              : null}
                        </div>
                      </TD>
                      <TD className="hidden md:table-cell">{formatNumber(w.contacts)}</TD>
                      <TD className="hidden md:table-cell">{formatNumber(w.emailsSent)}</TD>
                      <TD className="hidden text-sm text-muted-foreground lg:table-cell">{formatDate(w.createdAt)}</TD>
                      <TD>
                        <Dropdown>
                          <DropdownTrigger asChild><Button variant="ghost" size="icon"><MoreHorizontal className="h-4 w-4" /></Button></DropdownTrigger>
                          <DropdownContent align="end">
                            <DropdownItem onSelect={() => { setPlanFor(w); setPlanChoice({ plan: w.plan?.slug ?? 'free', billingCycle: 'monthly', trialDays: 0 }); }}>
                              Change package
                            </DropdownItem>
                            {w.status === 'active' ? (
                              <DropdownItem destructive onSelect={() => setStatusM.mutate({ id: w.id, status: 'suspended' })}>
                                <Ban className="h-4 w-4" /> Suspend
                              </DropdownItem>
                            ) : (
                              <DropdownItem onSelect={() => setStatusM.mutate({ id: w.id, status: 'active' })}>
                                <Play className="h-4 w-4" /> Reactivate
                              </DropdownItem>
                            )}
                          </DropdownContent>
                        </Dropdown>
                      </TD>
                    </TR>
                  ))}
                </TBody>
              </Table>
              <Pagination page={workspaces.data.meta.page} totalPages={workspaces.data.meta.totalPages} total={workspaces.data.meta.total} onChange={setPage} />
            </>
          )}
      </Card>

      {/* provision a client: user + workspace + package in one go */}
      <Dialog open={newOpen} onOpenChange={setNewOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="text-lg font-semibold">New client</DialogTitle>
            <DialogDescription>Creates the owner login, their workspace and a package in one step.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <Field label="Workspace / business name">
              <Input value={form.workspaceName} onChange={(e) => setForm({ ...form, workspaceName: e.target.value })} placeholder="Sharma Dental Clinic" />
            </Field>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Owner first name">
                <Input value={form.firstName} onChange={(e) => setForm({ ...form, firstName: e.target.value })} placeholder="Rahul" />
              </Field>
              <Field label="Owner last name">
                <Input value={form.lastName} onChange={(e) => setForm({ ...form, lastName: e.target.value })} />
              </Field>
            </div>
            <Field label="Owner email">
              <Input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="rahul@client.com" />
            </Field>
            <Field label="Password" hint="Leave blank to generate one.">
              <Input value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} placeholder="Auto-generated" />
            </Field>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Package">
                <Select value={form.plan} onChange={(e) => setForm({ ...form, plan: e.target.value })}>
                  {plans.data?.map((p) => <option key={p.id} value={p.slug}>{p.name}</option>)}
                </Select>
              </Field>
              <Field label="Trial days" hint="0 for none.">
                <Input type="number" value={form.trialDays} onChange={(e) => setForm({ ...form, trialDays: Number(e.target.value) })} />
              </Field>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setNewOpen(false)}>Cancel</Button>
            <Button disabled={!form.workspaceName || !form.email || !form.firstName} loading={provision.isPending} onClick={() => provision.mutate()}>
              Create client
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!created} onOpenChange={() => setCreated(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-lg font-semibold">Client created</DialogTitle>
            <DialogDescription>Hand these over now — the password is not shown again.</DialogDescription>
          </DialogHeader>
          <div className="space-y-2 rounded-lg border border-border bg-muted/40 p-3 text-sm">
            <div className="flex justify-between gap-4"><span className="text-muted-foreground">Workspace</span><span className="font-medium">{created?.workspace?.name}</span></div>
            <div className="flex justify-between gap-4"><span className="text-muted-foreground">Email</span><span className="font-medium">{created?.user?.email}</span></div>
            {created?.temporaryPassword && (
              <div className="flex items-center justify-between gap-4">
                <span className="text-muted-foreground">Password</span>
                <span className="flex items-center gap-2">
                  <code className="font-mono">{created.temporaryPassword}</code>
                  <Button size="icon" variant="ghost" onClick={() => { navigator.clipboard.writeText(created.temporaryPassword); toast.success('Copied'); }}>
                    <Copy className="h-3.5 w-3.5" />
                  </Button>
                </span>
              </div>
            )}
          </div>
          <DialogFooter><Button onClick={() => setCreated(null)}>Done</Button></DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!planFor} onOpenChange={() => setPlanFor(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle className="text-lg font-semibold">Change package for {planFor?.name}</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <Field label="Package">
              <Select value={planChoice.plan} onChange={(e) => setPlanChoice({ ...planChoice, plan: e.target.value })}>
                {plans.data?.map((p) => <option key={p.id} value={p.slug}>{p.name}</option>)}
              </Select>
            </Field>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Billing cycle">
                <Select value={planChoice.billingCycle} onChange={(e) => setPlanChoice({ ...planChoice, billingCycle: e.target.value })}>
                  {['monthly', 'yearly', 'lifetime', 'free'].map((c) => <option key={c} value={c} className="capitalize">{c}</option>)}
                </Select>
              </Field>
              <Field label="Trial days">
                <Input type="number" value={planChoice.trialDays} onChange={(e) => setPlanChoice({ ...planChoice, trialDays: Number(e.target.value) })} />
              </Field>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setPlanFor(null)}>Cancel</Button>
            <Button disabled={!planChoice.plan} loading={assignPlan.isPending} onClick={() => assignPlan.mutate()}>Apply package</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
