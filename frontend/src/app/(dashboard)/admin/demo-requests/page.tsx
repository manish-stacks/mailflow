'use client';
import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { CalendarCheck, Eye, Mail, MoreHorizontal, Search, Trash2 } from 'lucide-react';
import { api } from '@/lib/api';
import { formatDateTime, truncate } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Field, Input, Textarea } from '@/components/ui/input';
import { Table, TBody, TD, TH, THead, TR } from '@/components/ui/table';
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
  Dropdown, DropdownContent, DropdownItem, DropdownSeparator, DropdownTrigger, Select,
} from '@/components/ui/primitives';
import { ConfirmDialog, EmptyState, Pagination, TableSkeleton, toast } from '@/components/ui/feedback';

type DemoStatus = 'new' | 'contacted' | 'scheduled' | 'completed' | 'spam';

interface DemoRequest {
  id: string;
  name: string;
  email: string;
  company: string | null;
  teamSize: string | null;
  interests: string[] | null;
  message: string | null;
  source: string;
  status: DemoStatus;
  notes: string | null;
  ip: string | null;
  contactedAt: string | null;
  createdAt: string;
}

const STATUSES: DemoStatus[] = ['new', 'contacted', 'scheduled', 'completed', 'spam'];

const STATUS_VARIANT: Record<DemoStatus, any> = {
  new: 'default', contacted: 'warning', scheduled: 'secondary', completed: 'success', spam: 'destructive',
};

export default function AdminDemoRequestsPage() {
  const qc = useQueryClient();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [view, setView] = useState<DemoRequest | null>(null);
  const [draft, setDraft] = useState<{ status: DemoStatus; notes: string }>({ status: 'new', notes: '' });
  const [toDelete, setToDelete] = useState<DemoRequest | null>(null);

  const list = useQuery({
    queryKey: ['admin-demo-requests', page, search, status],
    queryFn: () => api.list<DemoRequest>('/admin/demo-requests', { page, limit: 20, search, status }),
  });
  const summary = useQuery({
    queryKey: ['admin-demo-summary'],
    queryFn: () => api.get<Record<string, number>>('/admin/demo-requests/summary'),
  });

  const refresh = () => {
    qc.invalidateQueries({ queryKey: ['admin-demo-requests'] });
    qc.invalidateQueries({ queryKey: ['admin-demo-summary'] });
  };

  const update = useMutation({
    mutationFn: ({ id, ...body }: { id: string; status?: DemoStatus; notes?: string }) =>
      api.patch(`/admin/demo-requests/${id}`, body),
    onSuccess: () => { toast.success('Updated'); refresh(); },
    onError: (e: any) => toast.error('Could not update', e.message),
  });

  const remove = useMutation({
    mutationFn: (id: string) => api.delete(`/admin/demo-requests/${id}`),
    onSuccess: () => { toast.success('Deleted'); setToDelete(null); setView(null); refresh(); },
    onError: (e: any) => toast.error('Could not delete', e.message),
  });

  const open = (r: DemoRequest) => { setView(r); setDraft({ status: r.status, notes: r.notes ?? '' }); };
  const rows = list.data?.data ?? [];
  const counts = summary.data;

  return (
    <div className="space-y-4">
      {/* status chips */}
      <div className="flex flex-wrap gap-2">
        {[{ key: '', label: 'All', n: counts?.total }, ...STATUSES.map((s) => ({ key: s, label: s, n: counts?.[s] }))].map((c) => (
          <button
            key={c.key || 'all'}
            type="button"
            onClick={() => { setStatus(c.key); setPage(1); }}
            className={`inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-sm capitalize transition-colors ${
              status === c.key ? 'border-primary bg-primary/10 font-medium text-primary' : 'border-border text-muted-foreground hover:text-foreground'
            }`}
          >
            {c.label}
            <span className="rounded-full bg-muted px-1.5 text-xs">{c.n ?? 0}</span>
          </button>
        ))}
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Search by name, email or company"
          className="pl-9"
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(1); }}
        />
      </div>

      <Card>
        {list.isLoading ? <TableSkeleton cols={6} />
          : !rows.length ? <EmptyState icon={CalendarCheck} title="No demo requests yet" description="Requests from the landing page form will show up here." />
          : (
            <>
              <Table>
                <THead>
                  <TR>
                    <TH>Received</TH>
                    <TH>Contact</TH>
                    <TH className="hidden md:table-cell">Team</TH>
                    <TH className="hidden lg:table-cell">Interested in</TH>
                    <TH>Status</TH>
                    <TH className="w-10" />
                  </TR>
                </THead>
                <TBody>
                  {rows.map((r) => (
                    <TR key={r.id} className="cursor-pointer" onClick={() => open(r)}>
                      <TD className="whitespace-nowrap text-sm text-muted-foreground">{formatDateTime(r.createdAt)}</TD>
                      <TD>
                        <p className="font-medium">{r.name}</p>
                        <p className="text-sm text-muted-foreground">{r.email}</p>
                        {r.company && <p className="text-xs text-muted-foreground">{r.company}</p>}
                      </TD>
                      <TD className="hidden text-sm md:table-cell">{r.teamSize || '—'}</TD>
                      <TD className="hidden lg:table-cell">
                        <div className="flex max-w-xs flex-wrap gap-1">
                          {r.interests?.length
                            ? r.interests.slice(0, 3).map((i) => <Badge key={i} variant="secondary">{i}</Badge>)
                            : <span className="text-sm text-muted-foreground">—</span>}
                          {(r.interests?.length ?? 0) > 3 && <Badge variant="outline">+{r.interests!.length - 3}</Badge>}
                        </div>
                      </TD>
                      <TD><Badge variant={STATUS_VARIANT[r.status]} className="capitalize">{r.status}</Badge></TD>
                      <TD onClick={(e) => e.stopPropagation()}>
                        <Dropdown>
                          <DropdownTrigger asChild><Button variant="ghost" size="icon"><MoreHorizontal className="h-4 w-4" /></Button></DropdownTrigger>
                          <DropdownContent align="end">
                            <DropdownItem onSelect={() => open(r)}><Eye className="h-4 w-4" /> View details</DropdownItem>
                            <DropdownItem onSelect={() => { window.location.href = `mailto:${r.email}`; }}><Mail className="h-4 w-4" /> Email</DropdownItem>
                            <DropdownSeparator />
                            {STATUSES.filter((s) => s !== r.status).map((s) => (
                              <DropdownItem key={s} onSelect={() => update.mutate({ id: r.id, status: s })}>
                                <span className="capitalize">Mark as {s}</span>
                              </DropdownItem>
                            ))}
                            <DropdownSeparator />
                            <DropdownItem destructive onSelect={() => setToDelete(r)}><Trash2 className="h-4 w-4" /> Delete</DropdownItem>
                          </DropdownContent>
                        </Dropdown>
                      </TD>
                    </TR>
                  ))}
                </TBody>
              </Table>
              <Pagination page={list.data!.meta.page} totalPages={list.data!.meta.totalPages} total={list.data!.meta.total} onChange={setPage} />
            </>
          )}
      </Card>

      {/* details */}
      <Dialog open={!!view} onOpenChange={(o) => !o && setView(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="text-lg font-semibold">{view?.name}</DialogTitle>
            <DialogDescription>Requested {view && formatDateTime(view.createdAt)}</DialogDescription>
          </DialogHeader>

          {view && (
            <div className="space-y-4">
              <div className="space-y-2 rounded-lg border border-border bg-muted/40 p-3 text-sm">
                <Row k="Email"><a className="text-primary hover:underline" href={`mailto:${view.email}`}>{view.email}</a></Row>
                <Row k="Company">{view.company || '—'}</Row>
                <Row k="Team size">{view.teamSize || '—'}</Row>
                <Row k="Source">{view.source}</Row>
                {view.contactedAt && <Row k="First contacted">{formatDateTime(view.contactedAt)}</Row>}
              </div>

              <div>
                <p className="mb-1.5 text-sm font-medium">Interested in</p>
                <div className="flex flex-wrap gap-1.5">
                  {view.interests?.length
                    ? view.interests.map((i) => <Badge key={i} variant="secondary">{i}</Badge>)
                    : <span className="text-sm text-muted-foreground">Nothing selected</span>}
                </div>
              </div>

              <div>
                <p className="mb-1.5 text-sm font-medium">Message</p>
                <p className="whitespace-pre-wrap rounded-lg border border-border p-3 text-sm text-muted-foreground">
                  {view.message ? truncate(view.message, 600) : 'No message.'}
                </p>
              </div>

              <Field label="Status">
                <Select value={draft.status} onChange={(e) => setDraft({ ...draft, status: e.target.value as DemoStatus })}>
                  {STATUSES.map((s) => <option key={s} value={s} className="capitalize">{s}</option>)}
                </Select>
              </Field>
              <Field label="Internal notes" hint="Only visible to platform staff.">
                <Textarea value={draft.notes} onChange={(e) => setDraft({ ...draft, notes: e.target.value })} placeholder="Call booked for Friday 4pm…" maxLength={2000} />
              </Field>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setView(null)}>Close</Button>
            <Button
              loading={update.isPending}
              onClick={() => view && update.mutate({ id: view.id, status: draft.status, notes: draft.notes }, { onSuccess: () => setView(null) })}
            >
              Save changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={!!toDelete}
        onOpenChange={(o) => !o && setToDelete(null)}
        title="Delete this demo request?"
        description={toDelete ? `${toDelete.name} (${toDelete.email}) will be removed permanently.` : undefined}
        confirmLabel="Delete"
        destructive
        loading={remove.isPending}
        onConfirm={() => toDelete && remove.mutate(toDelete.id)}
      />
    </div>
  );
}

function Row({ k, children }: { k: string; children: React.ReactNode }) {
  return (
    <div className="flex justify-between gap-4">
      <span className="text-muted-foreground">{k}</span>
      <span className="text-right font-medium">{children}</span>
    </div>
  );
}
