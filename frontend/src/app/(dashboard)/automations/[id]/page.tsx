'use client';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ArrowDown, ArrowLeft, ArrowUp, ChevronDown, ChevronRight, Plus, Save, Trash2 } from 'lucide-react';
import { api } from '@/lib/api';
import { canEdit, useAuth } from '@/store/auth';
import type { Automation, ContactList, EmailTemplate, SenderIdentity } from '@/types';
import { EmailEditor, MergeTagHelp } from '@/components/EmailEditor';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Field, Input } from '@/components/ui/input';
import { Select } from '@/components/ui/primitives';
import { PageLoader, toast } from '@/components/ui/feedback';

interface StepForm { uid: string; ver: number; delayValue: number; unit: 'minutes' | 'hours' | 'days'; subject: string; previewText: string; htmlContent: string }
const MULT = { minutes: 1, hours: 60, days: 1440 } as const;
const toForm = (m: number): Pick<StepForm, 'delayValue' | 'unit'> =>
  m > 0 && m % 1440 === 0 ? { delayValue: m / 1440, unit: 'days' } : m > 0 && m % 60 === 0 ? { delayValue: m / 60, unit: 'hours' } : { delayValue: m, unit: 'minutes' };
const newUid = () => Math.random().toString(36).slice(2, 10);
const blank = (): StepForm => ({ uid: newUid(), ver: 0, delayValue: 1, unit: 'days', subject: '', previewText: '', htmlContent: '' });

export default function AutomationEditor() {
  const { id } = useParams<{ id: string }>();
  const qc = useQueryClient();
  const wsId = useAuth((s) => s.activeWorkspace?.id);
  const role = useAuth((s) => s.activeWorkspace?.role);
  const editable = canEdit(role);

  const auto = useQuery({ queryKey: ['automation', id], queryFn: () => api.get<Automation>(`/automations/${id}`), staleTime: 0 });
  const lists = useQuery({ queryKey: ['lists', wsId], queryFn: () => api.get<ContactList[]>('/lists'), enabled: !!wsId });
  const senders = useQuery({ queryKey: ['senders', wsId], queryFn: () => api.get<SenderIdentity[]>('/senders'), enabled: !!wsId });
  const templates = useQuery({ queryKey: ['templates', wsId, 'picker'], queryFn: () => api.list<EmailTemplate>('/templates', { limit: 100 }), enabled: !!wsId });
  const stats = useQuery({ queryKey: ['automation-stats', id], queryFn: () => api.get<Record<string, number>>(`/automations/${id}/stats`), refetchInterval: 30_000 });

  const [name, setName] = useState('');
  const [trigger, setTrigger] = useState<'list_join' | 'contact_created'>('list_join');
  const [listId, setListId] = useState('');
  const [senderId, setSenderId] = useState('');
  const [steps, setSteps] = useState<StepForm[]>([blank()]);
  const [open, setOpen] = useState(0);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    const a = auto.data;
    if (!a || loaded) return;
    setName(a.name); setTrigger(a.triggerType); setListId(a.listId || ''); setSenderId(a.senderIdentityId || '');
    setSteps(a.steps?.length ? a.steps.map((s) => ({ uid: newUid(), ver: 0, ...toForm(s.delayMinutes), subject: s.subject, previewText: s.previewText || '', htmlContent: s.htmlContent || '' })) : [blank()]);
    setLoaded(true);
  }, [auto.data, loaded]);

  useEffect(() => {
    if (!senderId && senders.data?.length && loaded && !auto.data?.senderIdentityId) setSenderId((senders.data.find((s) => s.status === 'verified') ?? senders.data[0]).id);
  }, [senders.data, loaded, senderId, auto.data]);

  const patchStep = (i: number, p: Partial<StepForm>) => setSteps((s) => s.map((x, j) => (j === i ? { ...x, ...p } : x)));
  const swap = (i: number, d: number) => setSteps((s) => { const n = [...s]; const j = i + d; if (j < 0 || j >= n.length) return s; [n[i], n[j]] = [n[j], n[i]]; return n; });

  const payload = () => ({
    name: name.trim() || 'Untitled automation',
    triggerType: trigger,
    listId: trigger === 'list_join' && listId ? listId : null,
    senderIdentityId: senderId || null,
    steps: steps.map((s) => ({
      delayMinutes: Math.max(0, Math.round(s.delayValue || 0)) * MULT[s.unit],
      subject: s.subject.trim() || 'Untitled email',
      previewText: s.previewText.trim() || undefined,
      htmlContent: s.htmlContent,
    })),
  });

  const save = useMutation({
    mutationFn: () => api.patch<Automation>(`/automations/${id}`, payload()),
    onSuccess: () => { toast.success('Automation saved'); qc.invalidateQueries({ queryKey: ['automations'] }); qc.invalidateQueries({ queryKey: ['automation', id] }); },
    onError: (e: any) => toast.error('Save failed', e.message),
  });
  const toggle = useMutation({
    mutationFn: async () => {
      await api.patch(`/automations/${id}`, payload());
      return api.post<Automation>(`/automations/${id}/${auto.data?.status === 'active' ? 'pause' : 'activate'}`);
    },
    onSuccess: (a) => { toast.success(a.status === 'active' ? 'Automation is live' : 'Automation paused'); qc.invalidateQueries({ queryKey: ['automations'] }); qc.invalidateQueries({ queryKey: ['automation', id] }); },
    onError: (e: any) => toast.error('Could not update automation', e.message),
  });

  if (auto.isLoading || !loaded) return <PageLoader />;
  const status = auto.data?.status ?? 'draft';

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <Button asChild variant="ghost" size="icon"><Link href="/automations"><ArrowLeft className="h-4 w-4" /></Link></Button>
          <Input className="w-72 text-lg font-semibold" value={name} onChange={(e) => setName(e.target.value)} disabled={!editable} />
          <Badge variant={(status === 'active' ? 'success' : status === 'paused' ? 'warning' : 'secondary') as any} className="capitalize">{status}</Badge>
        </div>
        {editable && (
          <div className="flex gap-2">
            <Button variant="outline" loading={save.isPending} onClick={() => save.mutate()}><Save className="h-4 w-4" /> Save</Button>
            <Button loading={toggle.isPending} onClick={() => toggle.mutate()}>{status === 'active' ? 'Pause' : 'Save & activate'}</Button>
          </div>
        )}
      </div>

      {stats.data && (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
          {([['Enrolled', 'enrolled'], ['Active', 'active'], ['Completed', 'completed'], ['Stopped', 'cancelled'], ['Emails sent', 'sent']] as const).map(([l, k]) => (
            <Card key={k}><CardContent className="p-4"><p className="text-xs text-muted-foreground">{l}</p><p className="text-xl font-semibold">{stats.data![k] ?? 0}</p></CardContent></Card>
          ))}
        </div>
      )}

      <Card>
        <CardHeader><CardTitle>Trigger & sender</CardTitle><CardDescription>Only contacts who join <b>after</b> you activate are enrolled, so existing lists are never mass-mailed by accident.</CardDescription></CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          <Field label="Start when…">
            <Select value={trigger} onChange={(e) => setTrigger(e.target.value as any)} disabled={!editable}>
              <option value="list_join">A contact joins a list</option>
              <option value="contact_created">A new contact is created</option>
            </Select>
          </Field>
          {trigger === 'list_join' && (
            <Field label="List">
              <Select value={listId} onChange={(e) => setListId(e.target.value)} disabled={!editable}>
                <option value="">Select a list…</option>
                {lists.data?.map((l) => <option key={l.id} value={l.id}>{l.name}</option>)}
              </Select>
            </Field>
          )}
          <Field label="Send from">
            <Select value={senderId} onChange={(e) => setSenderId(e.target.value)} disabled={!editable}>
              <option value="">Select sender…</option>
              {senders.data?.map((s) => <option key={s.id} value={s.id}>{s.fromName} &lt;{s.fromEmail}&gt; {s.status !== 'verified' ? '(unverified)' : ''}</option>)}
            </Select>
          </Field>
        </CardContent>
      </Card>

      <div className="space-y-3">
        {steps.map((s, i) => (
          <Card key={s.uid}>
            <button type="button" onClick={() => setOpen(open === i ? -1 : i)} className="flex w-full items-center gap-3 p-4 text-left">
              {open === i ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary">{i + 1}</span>
              <span className="flex-1 truncate font-medium">{s.subject || 'Untitled email'}</span>
              <span className="text-xs text-muted-foreground">{i === 0 ? 'Wait' : 'Then wait'} {s.delayValue} {s.unit}</span>
            </button>
            {open === i && (
              <CardContent className="space-y-4 border-t border-border pt-4">
                <div className="grid gap-4 sm:grid-cols-[120px_140px_1fr]">
                  <Field label={i === 0 ? 'Wait before first email' : 'Wait after previous'}>
                    <Input type="number" min={0} value={s.delayValue} onChange={(e) => patchStep(i, { delayValue: Math.max(0, +e.target.value || 0) })} disabled={!editable} />
                  </Field>
                  <Field label="Unit">
                    <Select value={s.unit} onChange={(e) => patchStep(i, { unit: e.target.value as any })} disabled={!editable}>
                      <option value="minutes">Minutes</option><option value="hours">Hours</option><option value="days">Days</option>
                    </Select>
                  </Field>
                  <Field label="Subject"><Input value={s.subject} onChange={(e) => patchStep(i, { subject: e.target.value })} placeholder="Welcome, {{first_name | default: 'friend'}}!" disabled={!editable} /></Field>
                </div>
                <Field label="Preview text (optional)"><Input value={s.previewText} onChange={(e) => patchStep(i, { previewText: e.target.value })} disabled={!editable} /></Field>
                <Field label="Start from a template">
                  <Select value="" disabled={!editable} onChange={(e) => {
                    const t = templates.data?.data?.find((x) => x.id === e.target.value);
                    if (t && (!s.htmlContent.trim() || window.confirm('Replace this email’s content with the template?'))) {
                      patchStep(i, { ver: s.ver + 1, htmlContent: t.htmlContent || '', subject: s.subject || t.subject || '', previewText: s.previewText || t.previewText || '' });
                    }
                  }}>
                    <option value="">Choose a template…</option>
                    {templates.data?.data?.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
                  </Select>
                </Field>
                <EmailEditor key={`${s.uid}-${s.ver}`} value={s.htmlContent} onChange={(html) => patchStep(i, { htmlContent: html })} />
                <MergeTagHelp onInsert={(tag) => patchStep(i, { htmlContent: s.htmlContent + tag })} />
                {editable && (
                  <div className="flex items-center justify-between">
                    <div className="flex gap-1">
                      <Button size="icon" variant="ghost" disabled={i === 0} onClick={() => { swap(i, -1); setOpen(i - 1); }}><ArrowUp className="h-4 w-4" /></Button>
                      <Button size="icon" variant="ghost" disabled={i === steps.length - 1} onClick={() => { swap(i, 1); setOpen(i + 1); }}><ArrowDown className="h-4 w-4" /></Button>
                    </div>
                    <Button size="sm" variant="ghost" className="text-destructive" disabled={steps.length === 1} onClick={() => { setSteps((x) => x.filter((_, j) => j !== i)); setOpen(Math.max(0, i - 1)); }}>
                      <Trash2 className="h-4 w-4" /> Remove step
                    </Button>
                  </div>
                )}
              </CardContent>
            )}
          </Card>
        ))}
        {editable && steps.length < 20 && (
          <Button variant="outline" className="w-full" onClick={() => { setSteps((s) => [...s, blank()]); setOpen(steps.length); }}><Plus className="h-4 w-4" /> Add email step</Button>
        )}
      </div>
    </div>
  );
}
