'use client';
import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Copy, KeyRound, Plus, Trash2 } from 'lucide-react';
import { api } from '@/lib/api';
import { formatDate } from '@/lib/utils';
import { canAdmin, useAuth } from '@/store/auth';
import type { ApiKey } from '@/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Field, Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/primitives';
import { ConfirmDialog, EmptyState, TableSkeleton, toast } from '@/components/ui/feedback';

const SCOPES = [
  ['contacts:read', 'Read contacts'], ['contacts:write', 'Create and update contacts'],
  ['campaigns:read', 'Read campaigns'], ['campaigns:write', 'Create and send campaigns'],
  ['analytics:read', 'Read analytics'],
];

export default function ApiKeysPage() {
  const qc = useQueryClient();
  const wsId = useAuth((s) => s.activeWorkspace?.id);
  const editable = canAdmin(useAuth((s) => s.activeWorkspace?.role));

  const [open, setOpen] = useState(false);
  const [name, setName] = useState('');
  const [scopes, setScopes] = useState<string[]>(['contacts:read', 'campaigns:read']);
  const [created, setCreated] = useState<string | null>(null);
  const [revokeId, setRevokeId] = useState<string | null>(null);

  const keys = useQuery({ queryKey: ['api-keys', wsId], queryFn: () => api.get<ApiKey[]>('/api-keys'), enabled: !!wsId });

  const create = useMutation({
    mutationFn: () => api.post<{ key: string }>('/api-keys', { name, scopes }),
    onSuccess: (res) => {
      setCreated(res.key); setOpen(false); setName('');
      qc.invalidateQueries({ queryKey: ['api-keys'] });
    },
    onError: (e: any) => toast.error('Could not create key', e.message),
  });

  const revoke = useMutation({
    mutationFn: (id: string) => api.delete(`/api-keys/${id}`),
    onSuccess: () => { toast.success('Key revoked'); setRevokeId(null); qc.invalidateQueries({ queryKey: ['api-keys'] }); },
  });

  return (
    <>
      <Card>
        <CardHeader className="flex-row items-center justify-between">
          <div>
            <CardTitle>API keys</CardTitle>
            <CardDescription>Use these to call the MailFlow API from your own systems. Keys are shown once.</CardDescription>
          </div>
          {editable && <Button onClick={() => setOpen(true)}><Plus className="h-4 w-4" /> Create key</Button>}
        </CardHeader>
        <CardContent className="p-0">
          {keys.isLoading ? <TableSkeleton cols={3} />
            : !keys.data?.length ? (
              <EmptyState icon={KeyRound} title="No API keys"
                description="Create a key to sync contacts or trigger campaigns programmatically."
                action={editable && <Button onClick={() => setOpen(true)}>Create key</Button>} />
            ) : (
              <div className="divide-y divide-border">
                {keys.data.map((k) => (
                  <div key={k.id} className="flex flex-wrap items-center gap-3 px-5 py-4">
                    <div className="min-w-0 flex-1">
                      <p className="font-medium">{k.name}</p>
                      <p className="font-mono text-sm text-muted-foreground">{k.keyPrefix}.••••••••••••••••</p>
                      <div className="mt-2 flex flex-wrap gap-1.5">
                        {k.scopes?.map((s) => <Badge key={s} variant="secondary" className="font-mono text-[10px]">{s}</Badge>)}
                      </div>
                    </div>
                    <div className="text-right text-sm text-muted-foreground">
                      <p>Created {formatDate(k.createdAt)}</p>
                      <p>{k.lastUsedAt ? `Last used ${formatDate(k.lastUsedAt)}` : 'Never used'}</p>
                    </div>
                    {editable && <Button size="icon" variant="ghost" onClick={() => setRevokeId(k.id)}><Trash2 className="h-4 w-4" /></Button>}
                  </div>
                ))}
              </div>
            )}
        </CardContent>
      </Card>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle className="text-lg font-semibold">Create API key</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <Field label="Key name" hint="Something you will recognise later, like 'Website signup form'.">
              <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Website signup form" />
            </Field>
            <div>
              <p className="mb-2 text-sm font-medium">Scopes</p>
              <div className="space-y-2">
                {SCOPES.map(([value, label]) => (
                  <label key={value} className="flex cursor-pointer items-center gap-3 rounded-lg border border-border p-2.5">
                    <input
                      type="checkbox"
                      className="h-4 w-4 rounded border-border"
                      checked={scopes.includes(value)}
                      onChange={(e) => setScopes(e.target.checked ? [...scopes, value] : scopes.filter((s) => s !== value))}
                    />
                    <span className="flex-1 text-sm">{label}</span>
                    <code className="text-xs text-muted-foreground">{value}</code>
                  </label>
                ))}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
            <Button disabled={!name || !scopes.length} loading={create.isPending} onClick={() => create.mutate()}>Create key</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!created} onOpenChange={() => setCreated(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="text-lg font-semibold">Copy your API key now</DialogTitle>
            <DialogDescription>This is the only time the full key is shown. Store it somewhere safe.</DialogDescription>
          </DialogHeader>
          <div className="flex items-center gap-2 rounded-lg border border-border bg-muted p-3">
            <code className="min-w-0 flex-1 break-all font-mono text-xs">{created}</code>
            <Button size="icon" variant="ghost" onClick={() => { navigator.clipboard.writeText(created!); toast.success('Copied'); }}>
              <Copy className="h-4 w-4" />
            </Button>
          </div>
          <DialogFooter><Button onClick={() => setCreated(null)}>Done</Button></DialogFooter>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={!!revokeId} onOpenChange={() => setRevokeId(null)}
        title="Revoke this key?" description="Any integration using it stops working immediately."
        destructive confirmLabel="Revoke" loading={revoke.isPending}
        onConfirm={() => revoke.mutate(revokeId!)}
      />
    </>
  );
}
