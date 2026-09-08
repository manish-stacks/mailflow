'use client';
import Link from 'next/link';
import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Copy, MoreHorizontal, Pause, Play, Plus, Search, Send, Trash2, XCircle } from 'lucide-react';
import { api } from '@/lib/api';
import { formatDateTime, formatNumber, formatPercent, rate } from '@/lib/utils';
import { canEdit, useAuth } from '@/store/auth';
import type { Campaign } from '@/types';
import { PageHeader } from '@/components/layout/page-header';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { StatusBadge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Table, TBody, TD, TH, THead, TR } from '@/components/ui/table';
import { Dropdown, DropdownContent, DropdownItem, DropdownTrigger, Select } from '@/components/ui/primitives';
import { ConfirmDialog, EmptyState, ErrorState, Pagination, TableSkeleton, toast } from '@/components/ui/feedback';

export default function CampaignsPage() {
  const qc = useQueryClient();
  const wsId = useAuth((s) => s.activeWorkspace?.id);
  const role = useAuth((s) => s.activeWorkspace?.role);

  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const campaigns = useQuery({
    queryKey: ['campaigns', wsId, page, search, status],
    queryFn: () => api.list<Campaign>('/campaigns', { page, limit: 20, search, status }),
    enabled: !!wsId,
    refetchInterval: (q) => ((q.state.data as any)?.data?.some((c: Campaign) => c.status === 'sending') ? 5000 : false),
  });

  const action = useMutation({
    mutationFn: ({ id, verb }: { id: string; verb: string }) => api.post(`/campaigns/${id}/${verb}`),
    onSuccess: () => { toast.success('Campaign updated'); qc.invalidateQueries({ queryKey: ['campaigns'] }); },
    onError: (e: any) => toast.error('Action failed', e.message),
  });

  const duplicate = useMutation({
    mutationFn: (id: string) => api.post(`/campaigns/${id}/duplicate`),
    onSuccess: () => { toast.success('Campaign duplicated'); qc.invalidateQueries({ queryKey: ['campaigns'] }); },
  });

  const remove = useMutation({
    mutationFn: (id: string) => api.delete(`/campaigns/${id}`),
    onSuccess: () => { toast.success('Campaign deleted'); setDeleteId(null); qc.invalidateQueries({ queryKey: ['campaigns'] }); },
  });

  const rows = campaigns.data?.data ?? [];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Campaigns"
        description="Every broadcast you have drafted, scheduled or sent."
        actions={canEdit(role) && <Button asChild><Link href="/campaigns/new"><Plus className="h-4 w-4" /> Create Campaign</Link></Button>}
      />

      <Card>
        <div className="flex flex-col gap-3 border-b border-border p-4 sm:flex-row">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input placeholder="Search campaigns" className="pl-9" value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} />
          </div>
          <Select value={status} onChange={(e) => { setStatus(e.target.value); setPage(1); }} className="sm:w-44">
            <option value="">All statuses</option>
            {['draft', 'scheduled', 'sending', 'paused', 'sent', 'cancelled', 'failed'].map((s) => (
              <option key={s} value={s} className="capitalize">{s}</option>
            ))}
          </Select>
        </div>

        {campaigns.isLoading ? <TableSkeleton cols={6} />
          : campaigns.isError ? <ErrorState message={(campaigns.error as any)?.message} onRetry={() => campaigns.refetch()} />
          : !rows.length ? (
            <EmptyState
              icon={Send}
              title={search || status ? 'No campaigns match those filters' : 'No campaigns yet'}
              description={search || status ? 'Try clearing the filters.' : 'Create your first campaign — it takes about five minutes.'}
              action={canEdit(role) && <Button asChild><Link href="/campaigns/new">Create campaign</Link></Button>}
            />
          ) : (
            <>
              <Table>
                <THead>
                  <TR>
                    <TH>Campaign</TH>
                    <TH>Status</TH>
                    <TH className="hidden md:table-cell">Recipients</TH>
                    <TH className="hidden lg:table-cell">Opens</TH>
                    <TH className="hidden lg:table-cell">Clicks</TH>
                    <TH className="hidden xl:table-cell">Sent</TH>
                    <TH className="w-10" />
                  </TR>
                </THead>
                <TBody>
                  {rows.map((c) => (
                    <TR key={c.id}>
                      <TD>
                        <Link href={`/campaigns/${c.id}`} className="block">
                          <p className="font-medium hover:text-primary">{c.name}</p>
                          <p className="truncate text-sm text-muted-foreground">{c.subject || 'No subject yet'}</p>
                        </Link>
                      </TD>
                      <TD><StatusBadge status={c.status} /></TD>
                      <TD className="hidden md:table-cell">{formatNumber(c.totalRecipients)}</TD>
                      <TD className="hidden lg:table-cell">{formatPercent(rate(c.uniqueOpens, c.deliveredCount || c.sentCount))}</TD>
                      <TD className="hidden lg:table-cell">{formatPercent(rate(c.uniqueClicks, c.deliveredCount || c.sentCount))}</TD>
                      <TD className="hidden text-sm text-muted-foreground xl:table-cell">
                        {c.completedAt ? formatDateTime(c.completedAt)
                          : c.startedAt ? formatDateTime(c.startedAt)
                          : c.scheduledAt ? `Scheduled ${formatDateTime(c.scheduledAt)}` : '—'}
                      </TD>
                      <TD>
                        <Dropdown>
                          <DropdownTrigger asChild><Button variant="ghost" size="icon"><MoreHorizontal className="h-4 w-4" /></Button></DropdownTrigger>
                          <DropdownContent align="end">
                            <DropdownItem asChild><Link href={`/campaigns/${c.id}`}>View report</Link></DropdownItem>
                            {canEdit(role) && (
                              <>
                                {c.status === 'draft' && <DropdownItem asChild><Link href={`/campaigns/new?id=${c.id}`}>Continue editing</Link></DropdownItem>}
                                {c.status === 'sending' && <DropdownItem onSelect={() => action.mutate({ id: c.id, verb: 'pause' })}><Pause className="h-4 w-4" /> Pause</DropdownItem>}
                                {c.status === 'paused' && <DropdownItem onSelect={() => action.mutate({ id: c.id, verb: 'resume' })}><Play className="h-4 w-4" /> Resume</DropdownItem>}
                                {['scheduled', 'paused'].includes(c.status) && <DropdownItem onSelect={() => action.mutate({ id: c.id, verb: 'cancel' })}><XCircle className="h-4 w-4" /> Cancel</DropdownItem>}
                                <DropdownItem onSelect={() => duplicate.mutate(c.id)}><Copy className="h-4 w-4" /> Duplicate</DropdownItem>
                                {['draft', 'cancelled', 'failed'].includes(c.status) && (
                                  <DropdownItem destructive onSelect={() => setDeleteId(c.id)}><Trash2 className="h-4 w-4" /> Delete</DropdownItem>
                                )}
                              </>
                            )}
                          </DropdownContent>
                        </Dropdown>
                      </TD>
                    </TR>
                  ))}
                </TBody>
              </Table>
              <Pagination page={campaigns.data.meta.page} totalPages={campaigns.data.meta.totalPages} total={campaigns.data.meta.total} onChange={setPage} />
            </>
          )}
      </Card>

      <ConfirmDialog
        open={!!deleteId} onOpenChange={() => setDeleteId(null)}
        title="Delete this campaign?" description="Draft content and any recorded stats are removed permanently."
        destructive confirmLabel="Delete" loading={remove.isPending}
        onConfirm={() => remove.mutate(deleteId!)}
      />
    </div>
  );
}
