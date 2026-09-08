'use client';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, Mail, MousePointerClick, Send, UserMinus } from 'lucide-react';
import { api } from '@/lib/api';
import { formatDateTime } from '@/lib/utils';
import { canEdit, useAuth } from '@/store/auth';
import type { Contact } from '@/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge, StatusBadge } from '@/components/ui/badge';
import { EmptyState, PageLoader, toast } from '@/components/ui/feedback';

const EVENT_ICON: Record<string, any> = { sent: Send, delivered: Mail, opened: Mail, clicked: MousePointerClick, unsubscribed: UserMinus };

export default function ContactDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const qc = useQueryClient();
  const role = useAuth((s) => s.activeWorkspace?.role);

  const contact = useQuery({ queryKey: ['contact', id], queryFn: () => api.get<Contact>(`/contacts/${id}`) });
  const activity = useQuery({ queryKey: ['contact-activity', id], queryFn: () => api.get<any[]>(`/contacts/${id}/activity`) });

  const unsubscribe = useMutation({
    mutationFn: () => api.patch(`/contacts/${id}`, { status: 'unsubscribed', subscribed: false }),
    onSuccess: () => { toast.success('Contact unsubscribed'); qc.invalidateQueries({ queryKey: ['contact', id] }); },
  });

  const remove = useMutation({
    mutationFn: () => api.delete(`/contacts/${id}`),
    onSuccess: () => { toast.success('Contact deleted'); router.push('/contacts'); },
  });

  if (contact.isLoading) return <PageLoader />;
  const c = contact.data;
  if (!c) return <EmptyState title="Contact not found" />;

  const attrs = Object.entries(c.customAttributes ?? {});

  return (
    <div className="space-y-6">
      <Button asChild variant="ghost" size="sm" className="-ml-2"><Link href="/contacts"><ArrowLeft className="h-4 w-4" /> Back to contacts</Link></Button>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">{[c.firstName, c.lastName].filter(Boolean).join(' ') || c.email}</h1>
          <p className="mt-1 text-sm text-muted-foreground">{c.email}</p>
        </div>
        <div className="flex items-center gap-2">
          <StatusBadge status={c.status} />
          {canEdit(role) && c.subscribed && (
            <Button variant="outline" size="sm" onClick={() => unsubscribe.mutate()} loading={unsubscribe.isPending}>Unsubscribe</Button>
          )}
          {canEdit(role) && (
            <Button variant="destructive" size="sm" onClick={() => remove.mutate()} loading={remove.isPending}>Delete</Button>
          )}
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card>
          <CardHeader><CardTitle>Details</CardTitle></CardHeader>
          <CardContent className="space-y-3 text-sm">
            {[['Email', c.email], ['Phone', c.phone || '—'], ['Subscribed', c.subscribed ? 'Yes' : 'No'], ['Added', formatDateTime(c.createdAt)]].map(([k, v]) => (
              <div key={k as string} className="flex justify-between gap-4">
                <span className="text-muted-foreground">{k}</span>
                <span className="text-right font-medium">{v as string}</span>
              </div>
            ))}
            {!!c.lists?.length && (
              <div>
                <p className="mb-2 text-muted-foreground">Lists</p>
                <div className="flex flex-wrap gap-1.5">
                  {c.lists.map((l) => <Badge key={l.id} variant="secondary">{l.name}</Badge>)}
                </div>
              </div>
            )}
            {!!attrs.length && (
              <div>
                <p className="mb-2 text-muted-foreground">Custom attributes</p>
                <div className="space-y-1.5">
                  {attrs.map(([k, v]) => (
                    <div key={k} className="flex justify-between gap-4">
                      <span className="text-muted-foreground">{k}</span>
                      <span className="text-right font-medium">{String(v)}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader><CardTitle>Activity</CardTitle></CardHeader>
          <CardContent className="p-0">
            {!activity.data?.length ? (
              <EmptyState title="No activity yet" description="Campaign events for this contact will appear here." />
            ) : (
              <ol className="divide-y divide-border">
                {activity.data.map((e) => {
                  const Icon = EVENT_ICON[e.eventType] ?? Mail;
                  return (
                    <li key={e.id} className="flex items-center gap-3 px-5 py-3">
                      <div className="rounded-full bg-accent p-2"><Icon className="h-3.5 w-3.5 text-accent-foreground" /></div>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium capitalize">{e.eventType}</p>
                        {e.metadata?.url && <p className="truncate text-xs text-muted-foreground">{e.metadata.url}</p>}
                      </div>
                      <span className="shrink-0 text-xs text-muted-foreground">{formatDateTime(e.createdAt)}</span>
                    </li>
                  );
                })}
              </ol>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
