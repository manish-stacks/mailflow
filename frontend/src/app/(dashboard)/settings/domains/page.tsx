'use client';
import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Check, Copy, Globe, Plus, RefreshCw, Trash2 } from 'lucide-react';
import { api } from '@/lib/api';
import { canAdmin, useAuth } from '@/store/auth';
import type { SenderDomain } from '@/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Field, Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/primitives';
import { Table, TBody, TD, TH, THead, TR } from '@/components/ui/table';
import { ConfirmDialog, EmptyState, TableSkeleton, toast } from '@/components/ui/feedback';

export default function DomainsPage() {
  const qc = useQueryClient();
  const wsId = useAuth((s) => s.activeWorkspace?.id);
  const editable = canAdmin(useAuth((s) => s.activeWorkspace?.role));

  const [open, setOpen] = useState(false);
  const [domain, setDomain] = useState('');
  const [expanded, setExpanded] = useState<string | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const domains = useQuery({ queryKey: ['domains', wsId], queryFn: () => api.get<SenderDomain[]>('/domains'), enabled: !!wsId });

  const add = useMutation({
    mutationFn: () => api.post<SenderDomain>('/domains', { domain }),
    onSuccess: (d) => {
      toast.success('Domain added', 'Add the DNS records shown, then verify.');
      setOpen(false); setDomain(''); setExpanded(d.id);
      qc.invalidateQueries({ queryKey: ['domains'] });
    },
    onError: (e: any) => toast.error('Could not add domain', e.message),
  });

  const verify = useMutation({
    mutationFn: (id: string) => api.post<SenderDomain>(`/domains/${id}/verify`),
    onSuccess: (d) => {
      toast[d.verificationStatus === 'verified' ? 'success' : 'info'](
        d.verificationStatus === 'verified' ? 'Domain verified' : 'Records not found yet',
        d.verificationStatus === 'verified' ? undefined : 'DNS changes can take up to 48 hours to propagate.',
      );
      qc.invalidateQueries({ queryKey: ['domains'] });
    },
    onError: (e: any) => toast.error('Verification failed', e.message),
  });

  const remove = useMutation({
    mutationFn: (id: string) => api.delete(`/domains/${id}`),
    onSuccess: () => { toast.success('Domain removed'); setDeleteId(null); qc.invalidateQueries({ queryKey: ['domains'] }); },
  });

  const copy = (value: string) => { navigator.clipboard.writeText(value); toast.success('Copied to clipboard'); };

  return (
    <>
      <Card>
        <CardHeader className="flex-row items-center justify-between">
          <div>
            <CardTitle>Sending domains</CardTitle>
            <CardDescription>Authenticating your domain with SPF and DKIM keeps campaigns out of spam folders.</CardDescription>
          </div>
          {editable && <Button onClick={() => setOpen(true)}><Plus className="h-4 w-4" /> Add domain</Button>}
        </CardHeader>
        <CardContent className="p-0">
          {domains.isLoading ? <TableSkeleton cols={3} />
            : !domains.data?.length ? (
              <EmptyState icon={Globe} title="No domains yet"
                description="Add your sending domain and publish the DNS records we generate."
                action={editable && <Button onClick={() => setOpen(true)}>Add domain</Button>} />
            ) : (
              <div className="divide-y divide-border">
                {domains.data.map((d) => (
                  <div key={d.id}>
                    <div className="flex flex-wrap items-center gap-3 px-5 py-4">
                      <button className="min-w-0 flex-1 text-left" onClick={() => setExpanded(expanded === d.id ? null : d.id)}>
                        <p className="font-medium">{d.domain}</p>
                        <p className="text-sm text-muted-foreground">
                          {expanded === d.id ? 'Hide DNS records' : 'Show DNS records'}
                        </p>
                      </button>
                      <Badge variant={d.verificationStatus === 'verified' ? 'success' : d.verificationStatus === 'failed' ? 'destructive' : 'warning'} className="capitalize">
                        {d.verificationStatus}
                      </Badge>
                      {editable && (
                        <div className="flex gap-2">
                          <Button size="sm" variant="outline" loading={verify.isPending} onClick={() => verify.mutate(d.id)}>
                            <RefreshCw className="h-3.5 w-3.5" /> Verify
                          </Button>
                          <Button size="icon" variant="ghost" onClick={() => setDeleteId(d.id)}><Trash2 className="h-4 w-4" /></Button>
                        </div>
                      )}
                    </div>

                    {expanded === d.id && (
                      <div className="border-t border-border bg-muted/30 px-5 py-4">
                        <p className="mb-3 text-sm text-muted-foreground">
                          Add these records at your DNS provider. Propagation usually takes minutes but can take up to 48 hours.
                        </p>
                        <Table>
                          <THead><TR><TH>Type</TH><TH>Host</TH><TH>Value</TH><TH className="w-10" /></TR></THead>
                          <TBody>
                            {(d.verificationRecords ?? []).map((r: any, i: number) => (
                              <TR key={i}>
                                <TD><Badge variant="secondary">{r.type}</Badge></TD>
                                <TD className="font-mono text-xs">{r.host}</TD>
                                <TD className="max-w-xs truncate font-mono text-xs">{r.value}</TD>
                                <TD>
                                  <Button size="icon" variant="ghost" onClick={() => copy(r.value)}><Copy className="h-3.5 w-3.5" /></Button>
                                </TD>
                              </TR>
                            ))}
                          </TBody>
                        </Table>
                        {d.verificationStatus === 'verified' && (
                          <p className="mt-3 flex items-center gap-2 text-sm text-emerald-600">
                            <Check className="h-4 w-4" /> All records verified.
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
        </CardContent>
      </Card>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle className="text-lg font-semibold">Add sending domain</DialogTitle></DialogHeader>
          <Field label="Domain" hint="Use the root domain, for example hovermedia.in">
            <Input value={domain} onChange={(e) => setDomain(e.target.value)} placeholder="yourdomain.com" />
          </Field>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
            <Button disabled={!domain} loading={add.isPending} onClick={() => add.mutate()}>Add domain</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={!!deleteId} onOpenChange={() => setDeleteId(null)}
        title="Remove this domain?" description="Senders on this domain lose their authentication status."
        destructive confirmLabel="Remove" loading={remove.isPending}
        onConfirm={() => remove.mutate(deleteId!)}
      />
    </>
  );
}
