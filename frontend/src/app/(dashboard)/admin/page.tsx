'use client';
import { useQuery } from '@tanstack/react-query';
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { api } from '@/lib/api';
import { formatMoney, formatNumber } from '@/lib/utils';
import type { AdminStats } from '@/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/feedback';

export default function AdminOverviewPage() {
  const stats = useQuery({ queryKey: ['admin-stats'], queryFn: () => api.get<AdminStats>('/admin/stats') });
  const d = stats.data;

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        {stats.isLoading ? Array.from({ length: 5 }).map((_, i) => (
          <Card key={i}><CardContent className="p-5"><Skeleton className="h-12" /></CardContent></Card>
        )) : ([
          ['Client workspaces', formatNumber(d?.workspaces)],
          ['Users', formatNumber(d?.users)],
          ['Contacts stored', formatNumber(d?.contacts)],
          ['Emails sent', formatNumber(d?.emailsSent)],
          ['Monthly recurring', formatMoney(d?.mrr)],
        ] as const).map(([label, value]) => (
          <Card key={label}><CardContent className="p-5">
            <p className="text-sm text-muted-foreground">{label}</p>
            <p className="mt-2 text-2xl font-semibold tracking-tight">{value}</p>
          </CardContent></Card>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Clients per package</CardTitle>
          <CardDescription>Where your accounts sit today.</CardDescription>
        </CardHeader>
        <CardContent className="h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={d?.byPlan ?? []}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(220 13% 91%)" />
              <XAxis dataKey="name" fontSize={12} tickLine={false} axisLine={false} />
              <YAxis fontSize={11} tickLine={false} axisLine={false} width={36} allowDecimals={false} />
              <Tooltip contentStyle={{ borderRadius: 12, fontSize: 12 }} />
              <Bar dataKey="workspaces" name="Workspaces" fill="hsl(243 75% 59%)" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );
}
