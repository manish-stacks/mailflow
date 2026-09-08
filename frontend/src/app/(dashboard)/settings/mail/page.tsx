'use client';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { AlertTriangle, Check, Lock, Server, Trash2 } from 'lucide-react';
import { api } from '@/lib/api';
import { formatDateTime } from '@/lib/utils';
import { canAdmin, useAuth } from '@/store/auth';
import type { MailConnection, MailPreset, PlanLimits } from '@/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Field, Input } from '@/components/ui/input';
import { Select, Switch } from '@/components/ui/primitives';
import { ConfirmDialog, PageLoader, toast } from '@/components/ui/feedback';

const LABELS: Record<string, string> = {
  smtp: 'Custom SMTP', gmail: 'Gmail / Google Workspace', outlook: 'Outlook / Microsoft 365',
  ses: 'Amazon SES', brevo: 'Brevo', sendgrid: 'SendGrid', mailgun: 'Mailgun',
};

export default function MailConnectionPage() {
  const qc = useQueryClient();
  const wsId = useAuth((s) => s.activeWorkspace?.id);
  const editable = canAdmin(useAuth((s) => s.activeWorkspace?.role));

  const [form, setForm] = useState({
    provider: 'smtp', host: '', port: 587, secure: false, username: '', password: '',
    fromName: '', fromEmail: '', ratePerMinute: 0, isActive: true,
  });
  const [testEmail, setTestEmail] = useState('');
  const [removeOpen, setRemoveOpen] = useState(false);

  const limits = useQuery({ queryKey: ['plan-limits', wsId], queryFn: () => api.get<PlanLimits>('/billing/limits'), enabled: !!wsId });
  const presets = useQuery({ queryKey: ['mail-presets'], queryFn: () => api.get<MailPreset[]>('/mail-connection/presets') });
  const conn = useQuery({ queryKey: ['mail-connection', wsId], queryFn: () => api.get<MailConnection | null>('/mail-connection'), enabled: !!wsId });

  useEffect(() => {
    if (conn.data) {
      const c = conn.data;
      setForm((f) => ({
        ...f, provider: c.provider, host: c.host, port: c.port, secure: c.secure,
        username: c.username || '', password: '', fromName: c.fromName || '',
        fromEmail: c.fromEmail || '', ratePerMinute: c.ratePerMinute, isActive: c.isActive,
      }));
    }
  }, [conn.data]);

  const preset = presets.data?.find((p) => p.provider === form.provider);

  const save = useMutation({
    mutationFn: () => api.put('/mail-connection', { ...form, password: form.password || undefined }),
    onSuccess: () => {
      toast.success('Connection saved', 'Run a test before your next campaign.');
      setForm((f) => ({ ...f, password: '' }));
      qc.invalidateQueries({ queryKey: ['mail-connection'] });
    },
    onError: (e: any) => toast.error('Could not save', e.message),
  });

  const test = useMutation({
    mutationFn: () => api.post<{ ok: boolean; message: string; hint?: string }>('/mail-connection/test', { sendTo: testEmail || undefined }),
    onSuccess: (res) => {
      if (res.ok) toast.success('Connection works', res.message);
      else toast.error('Connection failed', res.hint || res.message);
      qc.invalidateQueries({ queryKey: ['mail-connection'] });
    },
    onError: (e: any) => toast.error('Test failed', e.message),
  });

  const remove = useMutation({
    mutationFn: () => api.delete('/mail-connection'),
    onSuccess: () => { toast.success('Connection removed'); setRemoveOpen(false); qc.invalidateQueries({ queryKey: ['mail-connection'] }); },
  });

  if (limits.isLoading) return <PageLoader />;

  if (!limits.data?.allowCustomSmtp) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center px-6 py-14 text-center">
          <div className="mb-4 rounded-full bg-accent p-4"><Lock className="h-6 w-6 text-accent-foreground" /></div>
          <h3 className="text-base font-semibold">Connect your own mail server</h3>
          <p className="mt-1 max-w-md text-sm text-muted-foreground">
            Sending through your own SMTP means deliverability and reputation stay with your domain,
            not ours. Your {limits.data?.planName} plan does not include this yet.
          </p>
          <Button asChild className="mt-5"><Link href="/settings/billing">See plans</Link></Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="grid gap-4 lg:grid-cols-[1fr_340px]">
      <Card>
        <CardHeader>
          <CardTitle>Mail connection</CardTitle>
          <CardDescription>
            Campaigns from this workspace are sent through this server. Without one, sending falls
            back to the platform mail server.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Field label="Provider" hint={preset?.help}>
            <Select
              value={form.provider}
              disabled={!editable}
              onChange={(e) => {
                const p = presets.data?.find((x) => x.provider === e.target.value);
                setForm({ ...form, provider: e.target.value, host: p?.host || '', port: p?.port ?? 587, secure: p?.secure ?? false });
              }}
            >
              {presets.data?.map((p) => <option key={p.provider} value={p.provider}>{LABELS[p.provider] ?? p.provider}</option>)}
            </Select>
          </Field>

          <div className="grid gap-3 sm:grid-cols-[1fr_120px]">
            <Field label="SMTP host">
              <Input value={form.host} disabled={!editable} onChange={(e) => setForm({ ...form, host: e.target.value })} placeholder="smtp.yourdomain.com" />
            </Field>
            <Field label="Port">
              <Input type="number" value={form.port} disabled={!editable} onChange={(e) => setForm({ ...form, port: Number(e.target.value) })} />
            </Field>
          </div>

          <div className="flex items-center justify-between rounded-lg border border-border p-3">
            <div>
              <p className="text-sm font-medium">Implicit TLS (SSL)</p>
              <p className="text-xs text-muted-foreground">On for port 465. Port 587 uses STARTTLS and should stay off.</p>
            </div>
            <Switch checked={form.secure} onCheckedChange={(v) => setForm({ ...form, secure: v })} />
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="Username">
              <Input value={form.username} disabled={!editable} onChange={(e) => setForm({ ...form, username: e.target.value })} placeholder="hello@yourdomain.com" />
            </Field>
            <Field label="Password" hint={conn.data?.hasPassword ? 'Saved. Leave blank to keep it.' : 'Stored encrypted; never shown again.'}>
              <Input type="password" value={form.password} disabled={!editable} onChange={(e) => setForm({ ...form, password: e.target.value })} placeholder={conn.data?.hasPassword ? '••••••••' : 'App password or SMTP key'} />
            </Field>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="Default from name">
              <Input value={form.fromName} disabled={!editable} onChange={(e) => setForm({ ...form, fromName: e.target.value })} placeholder="Your Brand" />
            </Field>
            <Field label="Default from email">
              <Input type="email" value={form.fromEmail} disabled={!editable} onChange={(e) => setForm({ ...form, fromEmail: e.target.value })} placeholder="hello@yourdomain.com" />
            </Field>
          </div>

          <Field label="Send rate per minute" hint="0 uses the platform default. Match whatever your provider allows.">
            <Input type="number" value={form.ratePerMinute} disabled={!editable} onChange={(e) => setForm({ ...form, ratePerMinute: Number(e.target.value) })} />
          </Field>

          {editable && (
            <div className="flex flex-wrap gap-2">
              <Button loading={save.isPending} onClick={() => save.mutate()}>Save connection</Button>
              {conn.data && <Button variant="outline" onClick={() => setRemoveOpen(true)}><Trash2 className="h-4 w-4" /> Remove</Button>}
            </div>
          )}
        </CardContent>
      </Card>

      <div className="space-y-4">
        <Card>
          <CardHeader><CardTitle>Status</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            {!conn.data ? (
              <p className="text-sm text-muted-foreground">Nothing connected yet — sending uses the platform mail server.</p>
            ) : (
              <>
                <div className="flex items-center gap-2">
                  <Badge variant={conn.data.status === 'verified' ? 'success' : conn.data.status === 'failed' ? 'destructive' : 'warning'} className="capitalize">
                    {conn.data.status === 'verified' ? 'Verified' : conn.data.status === 'failed' ? 'Failing' : 'Not tested'}
                  </Badge>
                  {conn.data.lastTestedAt && <span className="text-xs text-muted-foreground">{formatDateTime(conn.data.lastTestedAt)}</span>}
                </div>
                {conn.data.status === 'failed' && (
                  <p className="flex items-start gap-2 rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">
                    <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
                    <span>{conn.data.lastError}<br /><b>Campaigns fall back to the platform server while this is failing.</b></span>
                  </p>
                )}
                {conn.data.status === 'verified' && (
                  <p className="flex items-center gap-2 text-sm text-emerald-600">
                    <Check className="h-4 w-4" /> Campaigns send through {conn.data.host}
                  </p>
                )}
              </>
            )}

            <div className="space-y-2 border-t border-border pt-4">
              <Field label="Test the connection" hint="Leave blank to only check login, or add an address to receive a probe email.">
                <Input type="email" value={testEmail} onChange={(e) => setTestEmail(e.target.value)} placeholder="you@company.com" />
              </Field>
              <Button variant="outline" className="w-full" disabled={!conn.data} loading={test.isPending} onClick={() => test.mutate()}>
                <Server className="h-4 w-4" /> Run test
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Before you connect</CardTitle></CardHeader>
          <CardContent className="space-y-2 text-sm text-muted-foreground">
            <p>Gmail and Outlook reject normal account passwords over SMTP — create an app password instead.</p>
            <p>Publish SPF and DKIM for your domain under <Link href="/settings/domains" className="text-primary hover:underline">Domains</Link>, or your mail lands in spam regardless of which server sends it.</p>
            <p>Shared mailboxes usually cap daily sends. Set a rate that fits, or large campaigns will trip the provider's limit mid-send.</p>
          </CardContent>
        </Card>
      </div>

      <ConfirmDialog
        open={removeOpen} onOpenChange={setRemoveOpen}
        title="Remove this mail connection?"
        description="Campaigns go back to the platform mail server. Your stored password is deleted."
        destructive confirmLabel="Remove" loading={remove.isPending}
        onConfirm={() => remove.mutate()}
      />
    </div>
  );
}
