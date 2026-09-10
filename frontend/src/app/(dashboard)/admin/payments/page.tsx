'use client';
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Receipt, Search } from 'lucide-react';
import { api } from '@/lib/api';
import { formatDateTime, formatMoney } from '@/lib/utils';
import type { AdminPaymentRecord } from '@/types';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Field, Input } from '@/components/ui/input';
import { Table, TBody, TD, TH, THead, TR } from '@/components/ui/table';
import { Select } from '@/components/ui/primitives';
import { EmptyState, Pagination, TableSkeleton } from '@/components/ui/feedback';

const STATUS_VARIANT: Record<string, any> = {
  paid: 'success', created: 'secondary', pending: 'warning', failed: 'destructive', refunded: 'outline',
};

export default function AdminPaymentsPage() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');

  const payments = useQuery({
    queryKey: ['admin-payments', page, search, status, from, to],
    queryFn: () => api.list<AdminPaymentRecord>('/admin/payments', { page, limit: 20, search, status, from, to }),
  });

  const rows = payments.data?.data ?? [];

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:flex-wrap">
        <div className="relative flex-1 sm:min-w-[220px]">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input placeholder="Client, email, invoice or payment ID" className="pl-9" value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} />
        </div>
        <Select className="sm:w-44" value={status} onChange={(e) => { setStatus(e.target.value); setPage(1); }}>
          <option value="">All statuses</option>
          {['paid', 'created', 'pending', 'failed', 'refunded'].map((s) => <option key={s} value={s} className="capitalize">{s}</option>)}
        </Select>
        <div className="sm:w-40">
          <Field label="From">
            <Input type="date" value={from} onChange={(e) => { setFrom(e.target.value); setPage(1); }} />
          </Field>
        </div>
        <div className="sm:w-40">
          <Field label="To">
            <Input type="date" value={to} onChange={(e) => { setTo(e.target.value); setPage(1); }} />
          </Field>
        </div>
      </div>

      <Card>
        {payments.isLoading ? <TableSkeleton cols={6} />
          : !rows.length ? <EmptyState icon={Receipt} title="No payments found" description="Try widening your filters." />
          : (
            <>
              <Table>
                <THead>
                  <TR>
                    <TH>Date</TH><TH>Client</TH><TH>Plan</TH><TH>Amount</TH><TH>Status</TH>
                    <TH className="hidden md:table-cell">Reference</TH>
                  </TR>
                </THead>
                <TBody>
                  {rows.map((p) => (
                    <TR key={p.id}>
                      <TD className="text-sm">{formatDateTime(p.paidAt || p.createdAt)}</TD>
                      <TD>
                        <p className="font-medium">{p.workspace?.name ?? '—'}</p>
                        <p className="text-sm text-muted-foreground">{p.ownerEmail}</p>
                      </TD>
                      <TD>
                        <p>{p.notes?.planName ?? '—'}</p>
                        <p className="text-xs capitalize text-muted-foreground">{p.billingCycle}</p>
                      </TD>
                      <TD className="font-medium">{formatMoney(p.amount / 100, p.currency)}</TD>
                      <TD>
                        <Badge variant={STATUS_VARIANT[p.status] ?? 'secondary'} className="capitalize">{p.status}</Badge>
                        {p.failureReason && <p className="mt-1 max-w-xs truncate text-xs text-destructive">{p.failureReason}</p>}
                      </TD>
                      <TD className="hidden font-mono text-xs text-muted-foreground md:table-cell">
                        {p.invoiceNumber || p.paymentId || p.orderId}
                      </TD>
                    </TR>
                  ))}
                </TBody>
              </Table>
              <Pagination page={payments.data!.meta.page} totalPages={payments.data!.meta.totalPages} total={payments.data!.meta.total} onChange={setPage} />
            </>
          )}
      </Card>
    </div>
  );
}
