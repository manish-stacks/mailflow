'use client';
import Link from 'next/link';
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Area, AreaChart, Bar, BarChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { api } from '@/lib/api';
import { formatNumber, formatPercent } from '@/lib/utils';
import { useAuth } from '@/store/auth';
import type { DashboardOverview } from '@/types';
import { PageHeader } from '@/components/layout/page-header';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { StatusBadge } from '@/components/ui/badge';
import { Select } from '@/components/ui/primitives';
import { Table, TBody, TD, TH, THead, TR } from '@/components/ui/table';
import { EmptyState, Skeleton } from '@/components/ui/feedback';

export default function AnalyticsPage() {
  const wsId = useAuth((s) => s.activeWorkspace?.id);
  const [days, setDays] = useState(30);

  const overview = useQuery({
    queryKey: ['analytics-overview', wsId, days],
    queryFn: () => api.get<DashboardOverview>('/analytics/overview', { days }),
    enabled: !!wsId,
  });
  const series = useQuery({
    queryKey: ['analytics-series', wsId, days],
    queryFn: () => api.get<any[]>('/analytics/timeseries', { days }),
    enabled: !!wsId,
  });
  const campaigns = useQuery({
    queryKey: ['analytics-campaigns', wsId, days],
    queryFn: () => api.get<any[]>('/analytics/recent-campaigns', { limit: 20 }),
    enabled: !!wsId,
  });

  const d = overview.data;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Analytics"
        description="How your sends are performing across the workspace."
        actions={
          <Select className="w-40" value={days} onChange={(e) => setDays(Number(e.target.value))}>
            <option value={7}>Last 7 days</option>
            <option value={30}>Last 30 days</option>
            <option value={90}>Last 90 days</option>
          </Select>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {overview.isLoading ? Array.from({ length: 4 }).map((_, i) => (
          <Card key={i}><CardContent className="p-5"><Skeleton className="h-14" /></CardContent></Card>
        )) : ([
          ['Emails sent', formatNumber(d?.emailsSent)],
          ['Delivered', formatNumber(d?.delivered)],
          ['Open rate', formatPercent(d?.openRate)], ['Click rate', formatPercent(d?.clickRate)],
        ] as const).map(([label, value]) => (
          <Card key={label}><CardContent className="p-5">
            <p className="text-sm text-muted-foreground">{label}</p>
            <p className="mt-2 text-2xl font-semibold tracking-tight">{value}</p>
          </CardContent></Card>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Volume and engagement</CardTitle>
          <CardDescription>Daily totals across every campaign in this workspace.</CardDescription>
        </CardHeader>
        <CardContent className="h-[320px]">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={series.data ?? []}>
              <defs>
                <linearGradient id="a-sent" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="hsl(243 75% 59%)" stopOpacity={0.28} />
                  <stop offset="100%" stopColor="hsl(243 75% 59%)" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(220 13% 91%)" />
              <XAxis dataKey="date" tickFormatter={(v) => v.slice(5)} fontSize={11} tickLine={false} axisLine={false} />
              <YAxis fontSize={11} tickLine={false} axisLine={false} width={40} />
              <Tooltip contentStyle={{ borderRadius: 12, fontSize: 12 }} />
              <Legend iconType="circle" wrapperStyle={{ fontSize: 12 }} />
              <Area type="monotone" dataKey="sent" stroke="hsl(243 75% 59%)" fill="url(#a-sent)" strokeWidth={2} />
              <Area type="monotone" dataKey="opened" stroke="hsl(152 60% 40%)" fill="transparent" strokeWidth={2} />
              <Area type="monotone" dataKey="clicked" stroke="hsl(38 92% 50%)" fill="transparent" strokeWidth={2} />
              <Area type="monotone" dataKey="bounced" stroke="hsl(0 72% 51%)" fill="transparent" strokeWidth={2} />
            </AreaChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Campaign comparison</CardTitle>
          <CardDescription>Open and click rates side by side.</CardDescription>
        </CardHeader>
        <CardContent className="h-[300px]">
          {campaigns.data?.length ? (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={campaigns.data.slice(0, 10)}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(220 13% 91%)" />
                <XAxis dataKey="name" fontSize={10} tickLine={false} axisLine={false} interval={0} angle={-15} textAnchor="end" height={60} />
                <YAxis fontSize={11} tickLine={false} axisLine={false} width={40} unit="%" />
                <Tooltip contentStyle={{ borderRadius: 12, fontSize: 12 }} />
                <Legend iconType="circle" wrapperStyle={{ fontSize: 12 }} />
                <Bar dataKey="openRate" name="Open rate" fill="hsl(243 75% 59%)" radius={[6, 6, 0, 0]} />
                <Bar dataKey="clickRate" name="Click rate" fill="hsl(152 60% 40%)" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : <EmptyState title="Nothing to compare yet" description="Send a couple of campaigns and this fills in." />}
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>All campaigns</CardTitle></CardHeader>
        <CardContent className="p-0">
          {!campaigns.data?.length ? <EmptyState title="No campaigns yet" /> : (
            <Table>
              <THead><TR><TH>Campaign</TH><TH>Status</TH><TH>Sent</TH><TH>Opens</TH><TH>Clicks</TH><TH className="hidden md:table-cell">Bounces</TH></TR></THead>
              <TBody>
                {campaigns.data.map((c: any) => (
                  <TR key={c.id}>
                    <TD><Link href={`/campaigns/${c.id}`} className="font-medium hover:text-primary">{c.name}</Link></TD>
                    <TD><StatusBadge status={c.status} /></TD>
                    <TD>{formatNumber(c.sent)}</TD>
                    <TD>{formatPercent(c.openRate)}</TD>
                    <TD>{formatPercent(c.clickRate)}</TD>
                    <TD className="hidden md:table-cell">{formatNumber(c.bounced)}</TD>
                  </TR>
                ))}
              </TBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
