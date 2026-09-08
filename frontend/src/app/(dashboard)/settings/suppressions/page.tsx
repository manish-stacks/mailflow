'use client';
import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Plus, Search, ShieldBan, Trash2 } from 'lucide-react';
import { api } from '@/lib/api';
import { formatDate } from '@/lib/utils';
import { canAdmin, useAuth } from '@/store/auth';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Field, Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, Select } from '@/components/ui/primitives';
import { Table, TBody, TD, TH, THead, TR } from '@/components/ui/table';
import { EmptyState, Pagination, TableSkeleton, toast } from '@/components/ui/feedback';

const REASONS = ['manual', 'hard_bounce', 'complaint', 'unsubscribe'];

export default function SuppressionsPage() {
  const qc = useQueryClient();
  const wsId = useAuth((s) => s.activeWorkspace?.id);
  const editable = canAdmin(useAuth((s) => s.activeWorkspace?.role));

  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [reason, setReason] = useState('');
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ email: '', reason: 'manual' });

  const suppressions = useQuery({
    queryKey: ['suppressions', wsId, page, search, reason],
    queryFn: () => api.list<any>('/suppressions', { page, limit: 25, search, reason }),
    enabled: !!wsId,
  });

  const add = useMutation({
    mutationFn: () => api.post('/suppressions', { emails: [form.email], reason: form.reason }),
    onSuccess: () => {
      toast.success('Address suppressed');
      setOpen(false); setForm({ email: '', reason: 'manual' });
      qc.invalidateQueries({ queryKey: ['suppressions'] });
    },
    onError: (e: any) => toast.error('Could not suppress', e.message),
  });

  const remove = useMutation({
    mutationFn: (id: string) => api.delete(`/suppressions/${id}`),
    onSuccess: () => { toast.success('Removed from suppression list'); qc.invalidateQueries({ queryKey: ['suppressions'] }); },
  });

  const rows = suppressions.data?.data ?? [];

  return (
    <>
      <Card>
        <CardHeader className="flex-row items-center justify-between">
          <div>
            <CardTitle>Suppression list</CardTitle>
            <CardDescription>These addresses are never emailed, regardless of which list or segment they appear in.</CardDescription>
          </div>
          {editable && <Button onClick={() => setOpen(true)}><Plus className="h-4 w-4" /> Add address</Button>}
        </CardHeader>

        <div className="flex flex-col gap-3 border-y border-border p-4 sm:flex-row">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input placeholder="Search addresses" className="pl-9" value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} />
          </div>
          <Select className="sm:w-48" value={reason} onChange={(e) => { setReason(e.target.value); setPage(1); }}>
            <option value="">All reasons</option>
            {REASONS.map((r) => <option key={r} value={r}>{r.replace('_', ' ')}</option>)}
          </Select>
        </div>

        <CardContent className="p-0">
          {suppressions.isLoading ? <TableSkeleton cols={4} />
            : !rows.length ? (
              <EmptyState icon={ShieldBan} title="Nothing suppressed"
                description="Hard bounces, complaints and unsubscribes land here automatically." />
            ) : (
              <>
                <Table>
                  <THead><TR><TH>Email</TH><TH>Reason</TH><TH className="hidden md:table-cell">Added</TH><TH className="w-10" /></TR></THead>
                  <TBody>
                    {rows.map((s: any) => (
                      <TR key={s.id}>
                        <TD className="font-medium">{s.email}</TD>
                        <TD><Badge variant="secondary">{String(s.reason).replace('_', ' ')}</Badge></TD>
                        <TD className="hidden text-sm text-muted-foreground md:table-cell">{formatDate(s.createdAt)}</TD>
                        <TD>
                          {editable && <Button size="icon" variant="ghost" onClick={() => remove.mutate(s.id)}><Trash2 className="h-4 w-4" /></Button>}
                        </TD>
                      </TR>
                    ))}
                  </TBody>
                </Table>
                <Pagination page={suppressions.data.meta.page} totalPages={suppressions.data.meta.totalPages} total={suppressions.data.meta.total} onChange={setPage} />
              </>
            )}
        </CardContent>
      </Card>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle className="text-lg font-semibold">Suppress an address</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <Field label="Email address">
              <Input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="person@company.com" />
            </Field>
            <Field label="Reason">
              <Select value={form.reason} onChange={(e) => setForm({ ...form, reason: e.target.value })}>
                {REASONS.map((r) => <option key={r} value={r}>{r.replace('_', ' ')}</option>)}
              </Select>
            </Field>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
            <Button disabled={!form.email} loading={add.isPending} onClick={() => add.mutate()}>Suppress</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
