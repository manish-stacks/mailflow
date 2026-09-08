'use client';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Bar, BarChart, CartesianGrid, Cell, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { ArrowLeft, Copy, ExternalLink, Pause, Play, XCircle } from 'lucide-react';
import { api } from '@/lib/api';
import { formatDateTime, formatNumber, formatPercent } from '@/lib/utils';
import { canEdit, useAuth } from '@/store/auth';
import type { Campaign, CampaignEvent, CampaignRecipient, CampaignReport, TrackedLink } from '@/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { StatusBadge } from '@/components/ui/badge';
import { Table, TBody, TD, TH, THead, TR } from '@/components/ui/table';
import { Select, Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/primitives';
import { EmptyState, PageLoader, Pagination, TableSkeleton, toast } from '@/components/ui/feedback';

const PIE_COLORS = ['hsl(243 75% 59%)', 'hsl(152 60% 40%)', 'hsl(38 92% 50%)', 'hsl(0 72% 51%)'];

function Metric({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <Card><CardContent className="p-5">
      <p className="text-sm text-muted-foreground">{label}</p>
      <p className="mt-2 text-2xl font-semibold tracking-tight">{value}</p>
      {sub && <p className="mt-1 text-xs text-muted-foreground">{sub}</p>}
    </CardContent></Card>
  );
}

export default function CampaignDetailPage() {
  const { id } = useParams<{ id: string }>();
  const qc = useQueryClient();
  const role = useAuth((s) => s.activeWorkspace?.role);

  const [recipientPage, setRecipientPage] = useState(1);
  const [recipientStatus, setRecipientStatus] = useState('');

  const campaign = useQuery({
    queryKey: ['campaign', id],
    queryFn: () => api.get<Campaign>(`/campaigns/${id}`),
    refetchInterval: (q) => (['sending', 'preparing'].includes((q.state.data as Campaign)?.status) ? 5000 : false),
  });

  const report = useQuery({
    queryKey: ['campaign-report', id],
    queryFn: () => api.get<CampaignReport>(`/campaigns/${id}/analytics`),
    refetchInterval: (q) => (campaign.data?.status === 'sending' ? 8000 : false),
  });

  const links = useQuery({ queryKey: ['campaign-links', id], queryFn: () => api.get<TrackedLink[]>(`/campaigns/${id}/links`) });
  const activity = useQuery({ queryKey: ['campaign-activity', id], queryFn: () => api.get<CampaignEvent[]>(`/campaigns/${id}/activity`, { limit: 100 }) });

  const recipients = useQuery({
    queryKey: ['campaign-recipients', id, recipientPage, recipientStatus],
    queryFn: () => api.list<CampaignRecipient>(`/campaigns/${id}/recipients`, { page: recipientPage, limit: 25, status: recipientStatus }),
  });

  const action = useMutation({
    mutationFn: (verb: string) => api.post(`/campaigns/${id}/${verb}`),
    onSuccess: () => { toast.success('Campaign updated'); qc.invalidateQueries({ queryKey: ['campaign', id] }); },
    onError: (e: any) => toast.error('Action failed', e.message),
  });

  if (campaign.isLoading) return <PageLoader />;
  const c = campaign.data;
  if (!c) return <EmptyState title="Campaign not found" />;

  const t = report.data?.totals;
  const r = report.data?.rates;

  const funnel = [
    { name: 'Sent', value: t?.sent ?? 0 }, { name: 'Delivered', value: t?.delivered ?? 0 },
    { name: 'Opened', value: t?.uniqueOpens ?? 0 }, { name: 'Clicked', value: t?.uniqueClicks ?? 0 },
  ];
  const breakdown = [
    { name: 'Delivered', value: t?.delivered ?? 0 }, { name: 'Opened', value: t?.uniqueOpens ?? 0 },
    { name: 'Bounced', value: t?.bounced ?? 0 }, { name: 'Unsubscribed', value: t?.unsubscribes ?? 0 },
  ].filter((d) => d.value > 0);

  return (
    <div className="space-y-6">
      <Button asChild variant="ghost" size="sm" className="-ml-2"><Link href="/campaigns"><ArrowLeft className="h-4 w-4" /> Back to campaigns</Link></Button>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-semibold tracking-tight">{c.name}</h1>
            <StatusBadge status={c.status} />
          </div>
          <p className="mt-1 text-sm text-muted-foreground">{c.subject}</p>
          <p className="mt-1 text-xs text-muted-foreground">
            {c.completedAt ? `Completed ${formatDateTime(c.completedAt)}`
              : c.startedAt ? `Started ${formatDateTime(c.startedAt)}`
              : c.scheduledAt ? `Scheduled for ${formatDateTime(c.scheduledAt)}`
              : `Created ${formatDateTime(c.createdAt)}`}
          </p>
        </div>
        {canEdit(role) && (
          <div className="flex flex-wrap gap-2">
            {c.status === 'draft' && <Button asChild><Link href={`/campaigns/new?id=${c.id}`}>Continue editing</Link></Button>}
            {c.status === 'sending' && <Button variant="outline" onClick={() => action.mutate('pause')}><Pause className="h-4 w-4" /> Pause</Button>}
            {c.status === 'paused' && <Button onClick={() => action.mutate('resume')}><Play className="h-4 w-4" /> Resume</Button>}
            {['scheduled', 'paused'].includes(c.status) && <Button variant="outline" onClick={() => action.mutate('cancel')}><XCircle className="h-4 w-4" /> Cancel</Button>}
            <Button variant="outline" onClick={() => action.mutate('duplicate')}><Copy className="h-4 w-4" /> Duplicate</Button>
          </div>
        )}
      </div>

      {['sending', 'preparing'].includes(c.status) && (
        <Card><CardContent className="p-5">
          <div className="mb-2 flex justify-between text-sm">
            <span className="font-medium">Sending in progress</span>
            <span className="text-muted-foreground">{formatNumber(c.sentCount)} of {formatNumber(c.totalRecipients)}</span>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-muted">
            <div className="h-full rounded-full bg-primary transition-all" style={{ width: `${Math.min(100, (c.sentCount / Math.max(1, c.totalRecipients)) * 100)}%` }} />
          </div>
        </CardContent></Card>
      )}

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Metric label="Delivered" value={formatNumber(t?.delivered)} sub={`${formatNumber(t?.sent)} sent`} />
        <Metric label="Open rate" value={formatPercent(r?.openRate)} sub={`${formatNumber(t?.uniqueOpens)} unique opens`} />
        <Metric label="Click rate" value={formatPercent(r?.clickRate)} sub={`${formatNumber(t?.uniqueClicks)} unique clicks`} />
        <Metric label="Click-to-open" value={formatPercent(r?.clickToOpenRate)} sub="clicks among openers" />
        <Metric label="Bounced" value={formatNumber(t?.bounced)} sub={formatPercent(r?.bounceRate)} />
        <Metric label="Complaints" value={formatNumber(t?.complaints)} />
        <Metric label="Unsubscribed" value={formatNumber(t?.unsubscribes)} sub={formatPercent(r?.unsubscribeRate)} />
        <Metric label="Total recipients" value={formatNumber(t?.recipients ?? c.totalRecipients)} />
      </div>

      <Tabs defaultValue="overview">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="recipients">Recipients</TabsTrigger>
          <TabsTrigger value="activity">Activity</TabsTrigger>
          <TabsTrigger value="links">Links</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="mt-4 grid gap-4 lg:grid-cols-2">
          <Card>
            <CardHeader><CardTitle>Engagement funnel</CardTitle></CardHeader>
            <CardContent className="h-[280px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={funnel} layout="vertical" margin={{ left: 16 }}>
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="hsl(220 13% 91%)" />
                  <XAxis type="number" fontSize={11} tickLine={false} axisLine={false} />
                  <YAxis type="category" dataKey="name" fontSize={11} width={70} tickLine={false} axisLine={false} />
                  <Tooltip contentStyle={{ borderRadius: 12, fontSize: 12 }} />
                  <Bar dataKey="value" fill="hsl(243 75% 59%)" radius={[0, 6, 6, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle>Outcome breakdown</CardTitle></CardHeader>
            <CardContent className="h-[280px]">
              {breakdown.length ? (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={breakdown} dataKey="value" nameKey="name" innerRadius={60} outerRadius={100} paddingAngle={2}>
                      {breakdown.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
                    </Pie>
                    <Tooltip contentStyle={{ borderRadius: 12, fontSize: 12 }} />
                  </PieChart>
                </ResponsiveContainer>
              ) : <EmptyState title="No results yet" description="Data appears once the campaign starts sending." />}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="recipients" className="mt-4">
          <Card>
            <div className="border-b border-border p-4">
              <Select className="sm:w-52" value={recipientStatus} onChange={(e) => { setRecipientStatus(e.target.value); setRecipientPage(1); }}>
                <option value="">All recipients</option>
                {['pending', 'queued', 'sent', 'delivered', 'bounced', 'failed', 'skipped'].map((v) => (
                  <option key={v} value={v} className="capitalize">{v}</option>
                ))}
              </Select>
            </div>
            {recipients.isLoading ? <TableSkeleton cols={5} />
              : !recipients.data?.data?.length ? <EmptyState title="No recipients to show" />
              : (
                <>
                  <Table>
                    <THead><TR><TH>Email</TH><TH>Status</TH><TH className="hidden md:table-cell">Opens</TH><TH className="hidden md:table-cell">Clicks</TH><TH className="hidden lg:table-cell">Sent at</TH></TR></THead>
                    <TBody>
                      {recipients.data.data.map((rec) => (
                        <TR key={rec.id}>
                          <TD>
                            <p className="font-medium">{rec.email}</p>
                            {rec.errorMessage && <p className="truncate text-xs text-destructive">{rec.errorMessage}</p>}
                          </TD>
                          <TD><StatusBadge status={rec.status} /></TD>
                          <TD className="hidden md:table-cell">{formatNumber(rec.openCount)}</TD>
                          <TD className="hidden md:table-cell">{formatNumber(rec.clickCount)}</TD>
                          <TD className="hidden text-sm text-muted-foreground lg:table-cell">{rec.sentAt ? formatDateTime(rec.sentAt) : '—'}</TD>
                        </TR>
                      ))}
                    </TBody>
                  </Table>
                  <Pagination page={recipients.data.meta.page} totalPages={recipients.data.meta.totalPages} total={recipients.data.meta.total} onChange={setRecipientPage} />
                </>
              )}
          </Card>
        </TabsContent>

        <TabsContent value="activity" className="mt-4">
          <Card>
            {!activity.data?.length ? <EmptyState title="No activity yet" description="Opens, clicks and bounces will stream in here." />
              : (
                <ol className="divide-y divide-border">
                  {activity.data.map((e) => (
                    <li key={e.id} className="flex items-center gap-4 px-5 py-3">
                      <span className="w-24 shrink-0 text-sm font-medium capitalize">{e.event_type}</span>
                      <span className="min-w-0 flex-1 truncate text-sm text-muted-foreground">
                        {e.email}{e.metadata?.url ? ` · ${e.metadata.url}` : ''}
                      </span>
                      <span className="shrink-0 text-xs text-muted-foreground">{formatDateTime(e.created_at)}</span>
                    </li>
                  ))}
                </ol>
              )}
          </Card>
        </TabsContent>

        <TabsContent value="links" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Link performance</CardTitle>
              <CardDescription>Only tracked links appear here. Click tracking must be enabled for the campaign.</CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              {!links.data?.length ? <EmptyState title="No tracked links" description="Add links to your content and enable click tracking." />
                : (
                  <Table>
                    <THead><TR><TH>URL</TH><TH>Total clicks</TH><TH>Unique clicks</TH></TR></THead>
                    <TBody>
                      {links.data.map((l) => (
                        <TR key={l.id}>
                          <TD>
                            <a href={l.url} target="_blank" rel="noreferrer" className="flex items-center gap-1.5 text-primary hover:underline">
                              <span className="max-w-md truncate">{l.label || l.url}</span><ExternalLink className="h-3 w-3 shrink-0" />
                            </a>
                          </TD>
                          <TD className="font-medium">{formatNumber(l.totalClicks)}</TD>
                          <TD>{formatNumber(l.uniqueClicks)}</TD>
                        </TR>
                      ))}
                    </TBody>
                  </Table>
                )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
