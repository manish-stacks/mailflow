'use client';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Plus, Trash2, Workflow } from 'lucide-react';
import { api } from '@/lib/api';
import { canEdit, useAuth } from '@/store/auth';
import type { Automation } from '@/types';
import { PageHeader } from '@/components/layout/page-header';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ConfirmDialog, EmptyState, TableSkeleton, toast } from '@/components/ui/feedback';

export default function AutomationsPage() {
  const router = useRouter();
  const qc = useQueryClient();
  const wsId = useAuth((s) => s.activeWorkspace?.id);
  const role = useAuth((s) => s.activeWorkspace?.role);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const list = useQuery({ queryKey: ['automations', wsId], queryFn: () => api.get<Automation[]>('/automations'), enabled: !!wsId, staleTime: 0, refetchOnMount: 'always' });
  const refresh = () => qc.invalidateQueries({ queryKey: ['automations'] });

  const create = useMutation({
    mutationFn: () => api.post<Automation>('/automations', {}),
    onSuccess: (a) => router.push(`/automations/${a.id}`),
    onError: (e: any) => toast.error('Could not create automation', e.message),
  });
  const toggle = useMutation({
    mutationFn: (a: Automation) => api.post(`/automations/${a.id}/${a.status === 'active' ? 'pause' : 'activate'}`),
    onSuccess: refresh,
    onError: (e: any) => toast.error('Could not change status', e.message),
  });
  const remove = useMutation({
    mutationFn: (id: string) => api.delete(`/automations/${id}`),
    onSuccess: () => { toast.success('Automation deleted'); setDeleteId(null); refresh(); },
  });

  const rows = list.data ?? [];
  const tone = (s: string) => (s === 'active' ? 'success' : s === 'paused' ? 'warning' : 'secondary');

  return (
    <div className="space-y-6">
      <PageHeader
        title="Automations"
        description="Drip sequences that send automatically — welcome series, onboarding, follow-ups."
        actions={canEdit(role) && <Button loading={create.isPending} onClick={() => create.mutate()}><Plus className="h-4 w-4" /> New automation</Button>}
      />
      {list.isLoading ? <Card><TableSkeleton cols={4} /></Card>
        : !rows.length ? (
          <Card><EmptyState icon={Workflow} title="No automations yet" description="Create a sequence once and it runs for every new subscriber."
            action={canEdit(role) && <Button onClick={() => create.mutate()}>Create automation</Button>} /></Card>
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {rows.map((a) => (
              <Card key={a.id}>
                <CardContent className="space-y-4 p-5">
                  <div className="flex items-start justify-between gap-3">
                    <Link href={`/automations/${a.id}`} className="min-w-0">
                      <p className="truncate font-medium hover:text-primary">{a.name}</p>
                      <p className="text-sm text-muted-foreground">
                        {a.triggerType === 'list_join' ? 'When a contact joins a list' : 'When a contact is created'} · {a.stepCount ?? 0} email{a.stepCount === 1 ? '' : 's'}
                      </p>
                    </Link>
                    <Badge variant={tone(a.status) as any} className="capitalize">{a.status}</Badge>
                  </div>
                  <div className="grid grid-cols-3 gap-2 text-sm">
                    <div><p className="text-muted-foreground">Enrolled</p><p className="font-semibold">{a.stats?.enrolled ?? 0}</p></div>
                    <div><p className="text-muted-foreground">Completed</p><p className="font-semibold">{a.stats?.completed ?? 0}</p></div>
                    <div><p className="text-muted-foreground">Emails sent</p><p className="font-semibold">{a.stats?.sent ?? 0}</p></div>
                  </div>
                  {canEdit(role) && (
                    <div className="flex items-center justify-between">
                      <Button size="sm" variant="outline" loading={toggle.isPending && toggle.variables?.id === a.id} onClick={() => toggle.mutate(a)}>
                        {a.status === 'active' ? 'Pause' : 'Activate'}
                      </Button>
                      <Button size="icon" variant="ghost" onClick={() => setDeleteId(a.id)}><Trash2 className="h-4 w-4" /></Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      <ConfirmDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)} title="Delete this automation?"
        description="It stops immediately. Emails already sent are not affected." destructive confirmLabel="Delete"
        loading={remove.isPending} onConfirm={() => remove.mutate(deleteId!)} />
    </div>
  );
}
