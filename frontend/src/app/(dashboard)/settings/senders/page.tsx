'use client';
import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { MailCheck, Plus, Trash2 } from 'lucide-react';
import { api } from '@/lib/api';
import { canAdmin, useAuth } from '@/store/auth';
import type { SenderIdentity } from '@/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Field, Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/primitives';
import { ConfirmDialog, EmptyState, TableSkeleton, toast } from '@/components/ui/feedback';

export default function SendersPage() {
  const qc = useQueryClient();
  const wsId = useAuth((s) => s.activeWorkspace?.id);
  const editable = canAdmin(useAuth((s) => s.activeWorkspace?.role));

  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ fromName: '', fromEmail: '', replyToEmail: '' });
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const senders = useQuery({ queryKey: ['senders', wsId], queryFn: () => api.get<SenderIdentity[]>('/senders'), enabled: !!wsId });

  const create = useMutation({
    mutationFn: () => api.post('/senders', form),
    onSuccess: () => {
      toast.success('Sender added', 'Check the inbox for a verification email.');
      setOpen(false); setForm({ fromName: '', fromEmail: '', replyToEmail: '' });
      qc.invalidateQueries({ queryKey: ['senders'] });
    },
    onError: (e: any) => toast.error('Could not add sender', e.message),
  });

  const resend = useMutation({
    mutationFn: (id: string) => api.post(`/senders/${id}/resend`),
    onSuccess: () => toast.success('Verification email sent'),
    onError: (e: any) => toast.error('Could not send', e.message),
  });

  const remove = useMutation({
    mutationFn: (id: string) => api.delete(`/senders/${id}`),
    onSuccess: () => { toast.success('Sender removed'); setDeleteId(null); qc.invalidateQueries({ queryKey: ['senders'] }); },
  });

  return (
    <>
      <Card>
        <CardHeader className="flex-row items-center justify-between">
          <div>
            <CardTitle>Sender identities</CardTitle>
            <CardDescription>The from-addresses your campaigns can use. Each one must be verified by email.</CardDescription>
          </div>
          {editable && <Button onClick={() => setOpen(true)}><Plus className="h-4 w-4" /> Add sender</Button>}
        </CardHeader>
        <CardContent className="p-0">
          {senders.isLoading ? <TableSkeleton cols={3} />
            : !senders.data?.length ? (
              <EmptyState icon={MailCheck} title="No sender identities"
                description="Add the address your campaigns should come from, then confirm it via the verification email."
                action={editable && <Button onClick={() => setOpen(true)}>Add sender</Button>} />
            ) : (
              <div className="divide-y divide-border">
                {senders.data.map((s) => (
                  <div key={s.id} className="flex flex-wrap items-center gap-3 px-5 py-4">
                    <div className="min-w-0 flex-1">
                      <p className="font-medium">{s.fromName}</p>
                      <p className="truncate text-sm text-muted-foreground">
                        {s.fromEmail}{s.replyToEmail ? ` · replies to ${s.replyToEmail}` : ''}
                      </p>
                    </div>
                    <Badge variant={s.status === 'verified' ? 'success' : s.status === 'failed' ? 'destructive' : 'warning'} className="capitalize">
                      {s.status === 'verified' ? 'Verified' : s.status === 'failed' ? 'Verification failed' : 'Pending verification'}
                    </Badge>
                    {editable && (
                      <div className="flex gap-2">
                        {s.status !== 'verified' && (
                          <Button size="sm" variant="outline" loading={resend.isPending} onClick={() => resend.mutate(s.id)}>Resend email</Button>
                        )}
                        <Button size="icon" variant="ghost" onClick={() => setDeleteId(s.id)}><Trash2 className="h-4 w-4" /></Button>
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
          <DialogHeader><DialogTitle className="text-lg font-semibold">Add sender identity</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <Field label="From name" hint="What recipients see in their inbox.">
              <Input value={form.fromName} onChange={(e) => setForm({ ...form, fromName: e.target.value })} placeholder="Hover Media" />
            </Field>
            <Field label="From email">
              <Input type="email" value={form.fromEmail} onChange={(e) => setForm({ ...form, fromEmail: e.target.value })} placeholder="hello@yourdomain.com" />
            </Field>
            <Field label="Reply-to (optional)">
              <Input type="email" value={form.replyToEmail} onChange={(e) => setForm({ ...form, replyToEmail: e.target.value })} placeholder="support@yourdomain.com" />
            </Field>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
            <Button disabled={!form.fromEmail || !form.fromName} loading={create.isPending} onClick={() => create.mutate()}>Add sender</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={!!deleteId} onOpenChange={() => setDeleteId(null)}
        title="Remove this sender?" description="Campaigns still using it will need a different from-address."
        destructive confirmLabel="Remove" loading={remove.isPending}
        onConfirm={() => remove.mutate(deleteId!)}
      />
    </>
  );
}
