'use client';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import {
  Area, AreaChart, CartesianGrid, Legend, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis,
} from 'recharts';
import { FileText, MousePointerClick, Plus, Send, TrendingUp, Upload, UserMinus, Users } from 'lucide-react';
import { api } from '@/lib/api';
import { formatNumber, formatPercent } from '@/lib/utils';
import { useAuth } from '@/store/auth';
import type { DashboardOverview } from '@/types';
import { PageHeader } from '@/components/layout/page-header';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { StatusBadge } from '@/components/ui/badge';
import { EmptyState, Skeleton } from '@/components/ui/feedback';

function StatCard({ label, value, sub, icon: Icon, tone = 'default' }: any) {
  return (
    <Card>
      <CardContent className="p-5">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-sm text-muted-foreground">{label}</p>
            <p className="mt-2 text-2xl font-semibold tracking-tight">{value}</p>
            {sub && <p className="mt-1 text-xs text-muted-foreground">{sub}</p>}
          </div>
          <div className={`rounded-lg p-2 ${tone === 'warn' ? 'bg-amber-50 text-amber-600 dark:bg-amber-500/10' : 'bg-accent text-accent-foreground'}`}>
            <Icon className="h-4 w-4" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default function DashboardPage() {
  const { activeWorkspace, user } = useAuth();
  const wsId = activeWorkspace?.id;

  const overview = useQuery({
    queryKey: ['overview', wsId],
    queryFn: () => api.get<DashboardOverview>('/analytics/overview', { days: 30 }),
    enabled: !!wsId,
  });

  const series = useQuery({
    queryKey: ['timeseries', wsId],
    queryFn: () => api.get<any[]>('/analytics/timeseries', { days: 30 }),
    enabled: !!wsId,
  });

  const recent = useQuery({
    queryKey: ['recent-campaigns', wsId],
    queryFn: () => api.get<any[]>('/analytics/recent-campaigns', { limit: 5 }),
    enabled: !!wsId,
  });

  const d = overview.data;

  return (
    <div className="space-y-6">
      <PageHeader
        title={`Hello, ${user?.firstName ?? 'there'}`}
        description="Here is how your email programme is performing over the last 30 days."
        actions={
          <>
            <Button asChild variant="outline"><Link href="/contacts/import"><Upload className="h-4 w-4" /> Import Contacts</Link></Button>
            <Button asChild variant="outline"><Link href="/templates"><FileText className="h-4 w-4" /> New Template</Link></Button>
            <Button asChild><Link href="/campaigns/new"><Plus className="h-4 w-4" /> Create Campaign</Link></Button>
          </>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {overview.isLoading ? (
          Array.from({ length: 8 }).map((_, i) => <Card key={i}><CardContent className="p-5"><Skeleton className="h-16" /></CardContent></Card>)
        ) : (
          <>
            <StatCard label="Total Contacts" value={formatNumber(d?.totalContacts)} sub={`${formatNumber(d?.activeSubscribers)} active subscribers`} icon={Users} />
            <StatCard label="Emails Sent" value={formatNumber(d?.emailsSent)} sub={`${formatNumber(d?.delivered)} delivered`} icon={Send} />
            <StatCard label="Open Rate" value={formatPercent(d?.openRate)} sub="unique opens ÷ delivered" icon={TrendingUp} />
            <StatCard label="Click Rate" value={formatPercent(d?.clickRate)} sub="unique clicks ÷ delivered" icon={MousePointerClick} />
            <StatCard label="Delivered" value={formatNumber(d?.delivered)} icon={Send} />
            <StatCard label="Bounce Rate" value={formatPercent(d?.bounceRate)} tone="warn" icon={TrendingUp} />
            <StatCard label="Unsubscribes" value={formatNumber(d?.unsubscribes)} tone="warn" icon={UserMinus} />
            <StatCard label="Campaigns" value={formatNumber(d?.campaigns)} sub="created in this period" icon={FileText} />
          </>
        )}
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Email performance</CardTitle>
            <CardDescription>Sends, opens and clicks per day. Open tracking depends on image loading, so treat it as directional.</CardDescription>
          </CardHeader>
          <CardContent className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={series.data ?? []}>
                <defs>
                  <linearGradient id="sent" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="hsl(243 75% 59%)" stopOpacity={0.3} />
                    <stop offset="100%" stopColor="hsl(243 75% 59%)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(220 13% 91%)" vertical={false} />
                <XAxis dataKey="date" tickFormatter={(v) => v.slice(5)} fontSize={11} tickLine={false} axisLine={false} />
                <YAxis fontSize={11} tickLine={false} axisLine={false} width={36} />
                <Tooltip contentStyle={{ borderRadius: 12, border: '1px solid hsl(220 13% 91%)', fontSize: 12 }} />
                <Legend iconType="circle" wrapperStyle={{ fontSize: 12 }} />
                <Area type="monotone" dataKey="sent" stroke="hsl(243 75% 59%)" fill="url(#sent)" strokeWidth={2} />
                <Area type="monotone" dataKey="opened" stroke="hsl(152 60% 40%)" fill="transparent" strokeWidth={2} />
                <Area type="monotone" dataKey="clicked" stroke="hsl(38 92% 50%)" fill="transparent" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Engagement trend</CardTitle>
            <CardDescription>Opens vs clicks</CardDescription>
          </CardHeader>
          <CardContent className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={series.data ?? []}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(220 13% 91%)" vertical={false} />
                <XAxis dataKey="date" tickFormatter={(v) => v.slice(5)} fontSize={11} tickLine={false} axisLine={false} />
                <YAxis fontSize={11} tickLine={false} axisLine={false} width={30} />
                <Tooltip contentStyle={{ borderRadius: 12, fontSize: 12 }} />
                <Line type="monotone" dataKey="opened" stroke="hsl(152 60% 40%)" strokeWidth={2} dot={false} />
                <Line type="monotone" dataKey="clicked" stroke="hsl(38 92% 50%)" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="flex-row items-center justify-between">
          <div>
            <CardTitle>Recent campaigns</CardTitle>
            <CardDescription>Your five most recent sends.</CardDescription>
          </div>
          <Button asChild variant="ghost" size="sm"><Link href="/campaigns">View all</Link></Button>
        </CardHeader>
        <CardContent className="p-0">
          {recent.isLoading ? (
            <div className="space-y-2 p-5">{Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-10" />)}</div>
          ) : !recent.data?.length ? (
            <EmptyState
              title="No campaigns yet"
              description="Create your first campaign and it will show up here with live performance."
              action={<Button asChild><Link href="/campaigns/new">Create campaign</Link></Button>}
            />
          ) : (
            <div className="divide-y divide-border">
              {recent.data.map((c) => (
                <Link key={c.id} href={`/campaigns/${c.id}`} className="flex items-center justify-between gap-4 px-5 py-4 transition hover:bg-muted/40">
                  <div className="min-w-0">
                    <p className="truncate font-medium">{c.name}</p>
                    <p className="truncate text-sm text-muted-foreground">{c.subject || 'No subject yet'}</p>
                  </div>
                  <div className="hidden items-center gap-8 text-sm sm:flex">
                    <div className="text-right"><p className="font-medium">{formatNumber(c.sent)}</p><p className="text-xs text-muted-foreground">sent</p></div>
                    <div className="text-right"><p className="font-medium">{formatPercent(c.openRate)}</p><p className="text-xs text-muted-foreground">opens</p></div>
                    <div className="text-right"><p className="font-medium">{formatPercent(c.clickRate)}</p><p className="text-xs text-muted-foreground">clicks</p></div>
                  </div>
                  <StatusBadge status={c.status} />
                </Link>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
