'use client';
import { useEffect, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Download, Receipt } from 'lucide-react';
import { api } from '@/lib/api';
import { formatDateTime, formatMoney } from '@/lib/utils';
import { canAdmin, useAuth } from '@/store/auth';
import type { PaymentRecord, Workspace } from '@/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Field, Input } from '@/components/ui/input';
import { Table, TBody, TD, TH, THead, TR } from '@/components/ui/table';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/primitives';
import { EmptyState, Pagination, TableSkeleton, toast } from '@/components/ui/feedback';

const STATUS_VARIANT: Record<string, any> = {
  paid: 'success', created: 'secondary', pending: 'warning', failed: 'destructive', refunded: 'outline',
};

export default function PaymentsPage() {
  const qc = useQueryClient();
  const wsId = useAuth((s) => s.activeWorkspace?.id);
  const editable = canAdmin(useAuth((s) => s.activeWorkspace?.role));

  const [page, setPage] = useState(1);
  const [invoice, setInvoice] = useState<any>(null);
  const [details, setDetails] = useState({ billingName: '', billingEmail: '', billingAddress: '', billingGstin: '' });

  const workspace = useQuery({
    queryKey: ['workspace', wsId],
    queryFn: () => api.get<Workspace & typeof details>('/workspaces/current'),
    enabled: !!wsId,
  });

  const payments = useQuery({
    queryKey: ['payments', wsId, page],
    queryFn: () => api.list<PaymentRecord>('/payments', { page, limit: 20 }),
    enabled: !!wsId,
  });

  useEffect(() => {
    if (workspace.data) {
      const w = workspace.data as any;
      setDetails({
        billingName: w.billingName || '', billingEmail: w.billingEmail || '',
        billingAddress: w.billingAddress || '', billingGstin: w.billingGstin || '',
      });
    }
  }, [workspace.data]);

  const saveDetails = useMutation({
    mutationFn: () => api.patch('/billing/details', details),
    onSuccess: () => { toast.success('Billing details saved'); qc.invalidateQueries({ queryKey: ['workspace'] }); },
    onError: (e: any) => toast.error('Could not save', e.message),
  });

  const openInvoice = useMutation({
    mutationFn: (id: string) => api.get<any>(`/payments/${id}/invoice`),
    onSuccess: setInvoice,
    onError: (e: any) => toast.error('Invoice unavailable', e.message),
  });

  const rows = payments.data?.data ?? [];

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Billing details</CardTitle>
          <CardDescription>Printed on invoices and used for payment receipts.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="Billed to">
              <Input value={details.billingName} disabled={!editable} onChange={(e) => setDetails({ ...details, billingName: e.target.value })} placeholder="Company legal name" />
            </Field>
            <Field label="Billing email" hint="Receipts go here.">
              <Input type="email" value={details.billingEmail} disabled={!editable} onChange={(e) => setDetails({ ...details, billingEmail: e.target.value })} />
            </Field>
          </div>
          <Field label="Address">
            <Input value={details.billingAddress} disabled={!editable} onChange={(e) => setDetails({ ...details, billingAddress: e.target.value })} />
          </Field>
          <Field label="GSTIN" hint="Optional. Shown on the invoice when set.">
            <Input value={details.billingGstin} disabled={!editable} onChange={(e) => setDetails({ ...details, billingGstin: e.target.value.toUpperCase() })} maxLength={15} />
          </Field>
          {editable && <Button loading={saveDetails.isPending} onClick={() => saveDetails.mutate()}>Save details</Button>}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Payment history</CardTitle>
          <CardDescription>Every checkout attempt, including ones that did not go through.</CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          {payments.isLoading ? <TableSkeleton cols={5} />
            : !rows.length ? <EmptyState icon={Receipt} title="No payments yet" description="Charges appear here once you move to a paid plan." />
            : (
              <>
                <Table>
                  <THead>
                    <TR>
                      <TH>Date</TH><TH>Plan</TH><TH>Amount</TH><TH>Status</TH>
                      <TH className="hidden md:table-cell">Reference</TH><TH className="w-10" />
                    </TR>
                  </THead>
                  <TBody>
                    {rows.map((p) => (
                      <TR key={p.id}>
                        <TD className="text-sm">{formatDateTime(p.paidAt || p.createdAt)}</TD>
                        <TD>
                          <p className="font-medium">{p.notes?.planName ?? '—'}</p>
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
                        <TD>
                          {p.status === 'paid' && (
                            <Button variant="ghost" size="icon" title="View invoice" onClick={() => openInvoice.mutate(p.id)}>
                              <Download className="h-4 w-4" />
                            </Button>
                          )}
                        </TD>
                      </TR>
                    ))}
                  </TBody>
                </Table>
                <Pagination page={payments.data.meta.page} totalPages={payments.data.meta.totalPages} total={payments.data.meta.total} onChange={setPage} />
              </>
            )}
        </CardContent>
      </Card>

      <Dialog open={!!invoice} onOpenChange={() => setInvoice(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle className="text-lg font-semibold">Invoice {invoice?.invoiceNumber}</DialogTitle></DialogHeader>
          <div className="space-y-4 text-sm">
            <div className="flex justify-between gap-4">
              <span className="text-muted-foreground">Issued</span>
              <span className="font-medium">{formatDateTime(invoice?.issuedAt)}</span>
            </div>
            <div>
              <p className="mb-1 text-muted-foreground">Billed to</p>
              <p className="font-medium">{invoice?.billedTo?.name}</p>
              {invoice?.billedTo?.address && <p className="text-muted-foreground">{invoice.billedTo.address}</p>}
              {invoice?.billedTo?.gstin && <p className="text-muted-foreground">GSTIN {invoice.billedTo.gstin}</p>}
            </div>
            <div className="rounded-lg border border-border">
              <div className="flex justify-between gap-4 border-b border-border px-4 py-3">
                <span>{invoice?.item?.description}</span>
                <span className="font-medium">{formatMoney(invoice?.item?.amount, invoice?.currency)}</span>
              </div>
              <div className="flex justify-between gap-4 px-4 py-3 font-semibold">
                <span>Total</span>
                <span>{formatMoney(invoice?.total, invoice?.currency)}</span>
              </div>
            </div>
            <div className="flex justify-between gap-4">
              <span className="text-muted-foreground">Paid via</span>
              <span className="font-medium capitalize">{invoice?.method || 'Razorpay'} · {invoice?.paymentId}</span>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => window.print()}>Print</Button>
            <Button onClick={() => setInvoice(null)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
