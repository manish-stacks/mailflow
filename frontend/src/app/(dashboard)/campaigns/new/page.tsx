'use client';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Suspense, useEffect, useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { AlertTriangle, ArrowLeft, ArrowRight, BookmarkPlus, Check, Clock, Info, Search, Send, Sparkles, Users } from 'lucide-react';
import { api } from '@/lib/api';
import { formatNumber } from '@/lib/utils';
import { useAuth } from '@/store/auth';
import type { Campaign, ContactList, EmailTemplate, Segment, SenderIdentity } from '@/types';
import { AiAssistantDialog, AiRewriteMenu } from '@/components/AiAssistant';
import { EmailEditor, MergeTagHelp } from '@/components/EmailEditor';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Field, Input } from '@/components/ui/input';
import { Select, Switch } from '@/components/ui/primitives';
import { PageLoader, toast } from '@/components/ui/feedback';

const pad = (n: number) => String(n).padStart(2, '0');
const toLocalInput = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

/** Next time (at least 1 hour away) that falls on the given weekday/hour — UTC when `utc`, otherwise browser-local. */
function nextSlot(dow: number, hour: number, utc: boolean): Date {
  const now = new Date(Date.now() + 3600_000);
  const d = new Date(now);
  if (utc) { d.setUTCHours(hour, 0, 0, 0); d.setUTCDate(d.getUTCDate() + ((dow - d.getUTCDay() + 7) % 7)); }
  else { d.setHours(hour, 0, 0, 0); d.setDate(d.getDate() + ((dow - d.getDay() + 7) % 7)); }
  if (d < now) d.setDate(d.getDate() + 7);
  return d;
}

const STEPS = [
  'Campaign details', 'Audience', 'Sender', 'Content', 'Settings', 'Review', 'Send',
];

interface Draft {
  name: string; subject: string; subjectB: string; abAuto: boolean; abPercent: number; abHours: number; abMetric: 'opens' | 'clicks'; previewText: string;
  mode: 'all' | 'lists' | 'segments';
  listIds: string[]; segmentIds: string[];
  senderIdentityId: string; templateId: string; htmlContent: string;
  trackOpens: boolean; trackClicks: boolean; includeUnsubscribeLink: boolean; replyTo: string;
}

const EMPTY: Draft = {
  name: '', subject: '', subjectB: '', abAuto: false, abPercent: 20, abHours: 4, abMetric: 'opens', previewText: '', mode: 'all', listIds: [], segmentIds: [],
  senderIdentityId: '', templateId: '', htmlContent: '',
  trackOpens: true, trackClicks: true, includeUnsubscribeLink: true, replyTo: '',
};

function Wizard() {
  const router = useRouter();
  const params = useSearchParams();
  const existingId = params.get('id');
  const wsId = useAuth((s) => s.activeWorkspace?.id);

  const [step, setStep] = useState(0);
  const [draft, setDraft] = useState<Draft>(EMPTY);
  const [campaignId, setCampaignId] = useState<string | null>(existingId);
  const [aiOpen, setAiOpen] = useState(false);
  const [testEmail, setTestEmail] = useState('');
  const [scheduleMode, setScheduleMode] = useState<'now' | 'later'>('now');
  const [scheduledAt, setScheduledAt] = useState('');

  const set = (patch: Partial<Draft>) => setDraft((d) => ({ ...d, ...patch }));

  const lists = useQuery({ queryKey: ['lists', wsId], queryFn: () => api.get<ContactList[]>('/lists'), enabled: !!wsId });
  const segments = useQuery({ queryKey: ['segments', wsId], queryFn: () => api.get<Segment[]>('/segments'), enabled: !!wsId });
  const senders = useQuery({ queryKey: ['senders', wsId], queryFn: () => api.get<SenderIdentity[]>('/senders'), enabled: !!wsId });
  const qc = useQueryClient();
  const [tplSearch, setTplSearch] = useState('');
  const [editorVer, setEditorVer] = useState(0); // remount the editor when content is replaced from outside (template / AI)
  // BUG FIX: always refetch on mount so templates created/edited a moment ago show up here.
  const templates = useQuery({
    queryKey: ['templates', wsId, 'picker'],
    queryFn: () => api.list<EmailTemplate>('/templates', { limit: 100 }),
    enabled: !!wsId, staleTime: 0, refetchOnMount: 'always',
  });
  const filteredTemplates = useMemo(() => {
    const q = tplSearch.trim().toLowerCase();
    return (templates.data?.data ?? []).filter((t) => !q || t.name.toLowerCase().includes(q) || (t.subject || '').toLowerCase().includes(q));
  }, [templates.data, tplSearch]);

  const pickTemplate = (t?: EmailTemplate) => {
    if (t && draft.htmlContent.trim() && draft.templateId !== t.id
      && !window.confirm('Replace the current email content with this template?')) return;
    setEditorVer((v) => v + 1);
    set({
      templateId: t?.id ?? '',
      htmlContent: t ? (t.htmlContent ?? '') : draft.htmlContent,
      subject: draft.subject || t?.subject || '',
      previewText: draft.previewText || t?.previewText || '',
    });
  };

  const saveAsTemplate = useMutation({
    mutationFn: () => api.post<EmailTemplate>(`/campaigns/${campaignId}/save-as-template`, { name: draft.name }),
    onSuccess: () => { toast.success('Saved as template'); qc.invalidateQueries({ queryKey: ['templates'] }); },
    onError: (e: any) => toast.error('Could not save template', e.message),
  });

  const existing = useQuery({
    queryKey: ['campaign', existingId],
    queryFn: () => api.get<Campaign>(`/campaigns/${existingId}`),
    enabled: !!existingId,
  });

  useEffect(() => {
    if (!existing.data) return;
    const c = existing.data;
    setDraft({
      name: c.name, subject: c.subject || '', subjectB: c.settings?.subjectB || '', abAuto: !!c.settings?.abAutoWinner?.enabled, abPercent: c.settings?.abAutoWinner?.testPercent ?? 20, abHours: c.settings?.abAutoWinner?.waitHours ?? 4, abMetric: c.settings?.abAutoWinner?.metric ?? 'opens', previewText: c.previewText || '',
      mode: c.audience?.mode || 'all',
      listIds: c.audience?.listIds || [],
      segmentIds: c.audience?.segmentIds || [],
      senderIdentityId: c.senderIdentityId || '',
      templateId: c.templateId || '',
      htmlContent: c.htmlContent || '',
      trackOpens: c.settings?.trackOpens ?? true,
      trackClicks: c.settings?.trackClicks ?? true,
      includeUnsubscribeLink: c.settings?.includeUnsubscribeLink ?? true,
      replyTo: c.settings?.replyTo || '',
    });
  }, [existing.data]);

  useEffect(() => {
    if (!draft.senderIdentityId && senders.data?.length) {
      const pick = senders.data.find((s) => s.status === 'verified') ?? senders.data[0];
      set({ senderIdentityId: pick.id });
    }
  }, [senders.data]);

  const payload = () => ({
    name: draft.name || 'Untitled campaign',
    subject: draft.subject || undefined,
    previewText: draft.previewText || undefined,
    htmlContent: draft.htmlContent || undefined,
    templateId: draft.templateId || undefined,
    senderIdentityId: draft.senderIdentityId || undefined,
    audience: {
      mode: draft.mode,
      listIds: draft.mode === 'lists' ? draft.listIds : undefined,
      segmentIds: draft.mode === 'segments' ? draft.segmentIds : undefined,
    },
    settings: {
      trackOpens: draft.trackOpens,
      trackClicks: draft.trackClicks,
      includeUnsubscribeLink: draft.includeUnsubscribeLink,
      replyTo: draft.replyTo || undefined,
      subjectB: draft.subjectB.trim() || undefined,
      abAutoWinner: draft.subjectB.trim() && draft.abAuto ? { enabled: true, testPercent: draft.abPercent, waitHours: draft.abHours, metric: draft.abMetric } : undefined,
    },
  });

  const saveDraft = useMutation({
    mutationFn: async () => (campaignId
      ? api.patch<Campaign>(`/campaigns/${campaignId}`, payload())
      : api.post<Campaign>('/campaigns', payload())),
    onSuccess: (c) => setCampaignId(c.id),
    onError: (e: any) => toast.error('Could not save draft', e.message),
  });

  /* Audience estimate needs a saved campaign, so it refetches after each save. */
  const audience = useQuery({
    queryKey: ['campaign-audience', campaignId, draft.mode, draft.listIds.join(), draft.segmentIds.join()],
    queryFn: () => api.get<{ estimatedRecipients: number; suppressedInWorkspace: number }>(`/campaigns/${campaignId}/audience`),
    enabled: !!campaignId && step >= 1,
  });

  const validation = useQuery({
    queryKey: ['campaign-validate', campaignId, step],
    queryFn: () => api.get<{ valid: boolean; issues: string[]; warnings?: string[]; estimatedRecipients: number }>(`/campaigns/${campaignId}/validate`),
    enabled: !!campaignId && step === 5,
  });

  const bestTime = useQuery({
    queryKey: ['best-send-time', wsId],
    queryFn: () => api.get<{ basedOn: 'workspace' | 'default'; slots: { dow: number; hour: number }[] }>('/analytics/best-send-time'),
    enabled: !!wsId && step === 6, staleTime: 300_000,
  });
  const suggestions = (() => {
    const b = bestTime.data;
    if (!b) return [];
    const fromData = b.basedOn === 'workspace' && b.slots.length;
    const raw = fromData ? b.slots.map((s) => nextSlot(s.dow, s.hour, true)) : [2, 3, 4].map((dow) => nextSlot(dow, 10, false));
    return raw.map((date) => ({ date, label: `${DAYS[date.getDay()]} ${date.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}` }));
  })();

  const sendTest = useMutation({
    mutationFn: () => api.post(`/campaigns/${campaignId}/test`, { recipients: [testEmail] }),
    onSuccess: () => toast.success('Test email sent', testEmail),
    onError: (e: any) => toast.error('Test failed', e.message),
  });

  const send = useMutation({
    mutationFn: () => (scheduleMode === 'now'
      ? api.post(`/campaigns/${campaignId}/send`)
      : api.post(`/campaigns/${campaignId}/schedule`, { scheduledAt: new Date(scheduledAt).toISOString() })),
    onSuccess: () => {
      toast.success(scheduleMode === 'now' ? 'Campaign is sending' : 'Campaign scheduled');
      router.push(`/campaigns/${campaignId}`);
    },
    onError: (e: any) => toast.error('Could not send', e.message),
  });

  const next = async () => {
    try {
      await saveDraft.mutateAsync();
      setStep((s) => Math.min(s + 1, STEPS.length - 1));
    } catch { /* toast already shown by saveDraft.onError — stay on this step */ }
  };

  const canAdvance = () => {
    if (step === 0) return !!draft.name.trim() && !!draft.subject.trim();
    if (step === 1) return draft.mode === 'all'
      || (draft.mode === 'lists' && draft.listIds.length > 0)
      || (draft.mode === 'segments' && draft.segmentIds.length > 0);
    if (step === 2) return !!draft.senderIdentityId;
    if (step === 3) return !!draft.htmlContent.trim();
    return true;
  };

  if (existingId && existing.isLoading) return <PageLoader />;

  const selectedSender = senders.data?.find((s) => s.id === draft.senderIdentityId);
  const recipients = audience.data?.estimatedRecipients;

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <div className="flex items-center gap-3">
        <Button asChild variant="ghost" size="icon"><Link href="/campaigns"><ArrowLeft className="h-4 w-4" /></Link></Button>
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">{existingId ? 'Edit campaign' : 'Create campaign'}</h1>
          <p className="text-sm text-muted-foreground">Step {step + 1} of {STEPS.length} · {STEPS[step]}</p>
        </div>
      </div>

      <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
        {STEPS.map((label, i) => (
          <button
            key={label}
            onClick={() => i < step && setStep(i)}
            disabled={i > step}
            className={`flex shrink-0 items-center gap-2 rounded-full px-3 py-1.5 text-xs font-medium transition ${
              i < step ? 'bg-primary/10 text-primary hover:bg-primary/20'
                : i === step ? 'bg-primary text-primary-foreground'
                : 'bg-muted text-muted-foreground'}`}
          >
            {i < step ? <Check className="h-3 w-3" /> : <span>{i + 1}</span>}
            {label}
          </button>
        ))}
      </div>

      {/* 1 — details */}
      {step === 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Campaign details</CardTitle>
            <CardDescription>The name is internal. The subject and preview text are what recipients see.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Field label="Campaign name" hint="Only your team sees this.">
              <Input value={draft.name} onChange={(e) => set({ name: e.target.value })} placeholder="September newsletter" />
            </Field>
            <Field label="Subject line">
              <Input value={draft.subject} onChange={(e) => set({ subject: e.target.value })} placeholder="Your September update is here" />
            </Field>
            {draft.subject && (
              <div className="space-y-2">
                <AiRewriteMenu content={draft.subject} onResult={(text) => set({ subject: text })} />
                <p className="text-xs text-muted-foreground">{draft.subject.length} characters — most inboxes truncate past 60.</p>
              </div>
            )}
            <Field label="Subject line B (optional A/B test)" hint="Half of your audience gets subject A, half gets B. Compare open rates on the campaign page after sending.">
              <Input value={draft.subjectB} onChange={(e) => set({ subjectB: e.target.value })} placeholder="Try a different angle, e.g. a question or a number" />
            </Field>
            {draft.subjectB.trim() && (
              <div className="rounded-lg border border-border p-4">
                <label className="flex cursor-pointer items-center gap-2 text-sm font-medium">
                  <input type="checkbox" checked={draft.abAuto} onChange={(e) => set({ abAuto: e.target.checked })} className="h-4 w-4 accent-[hsl(var(--primary))]" />
                  Auto-send the winner to the rest of my audience
                </label>
                <p className="mt-1 text-xs text-muted-foreground">Only a small test group gets A/B first. After the wait time, the better subject is sent to everyone else automatically.</p>
                {draft.abAuto && (
                  <div className="mt-3 grid gap-3 sm:grid-cols-3">
                    <Field label="Test group">
                      <Select value={String(draft.abPercent)} onChange={(e) => set({ abPercent: +e.target.value })}>
                        {[10, 20, 30, 40, 50].map((n) => <option key={n} value={n}>{n}% of audience</option>)}
                      </Select>
                    </Field>
                    <Field label="Wait before picking">
                      <Select value={String(draft.abHours)} onChange={(e) => set({ abHours: +e.target.value })}>
                        {[1, 2, 4, 8, 12, 24, 48].map((n) => <option key={n} value={n}>{n} hour{n > 1 ? 's' : ''}</option>)}
                      </Select>
                    </Field>
                    <Field label="Winner decided by">
                      <Select value={draft.abMetric} onChange={(e) => set({ abMetric: e.target.value as any })}>
                        <option value="opens">Open rate</option><option value="clicks">Click rate</option>
                      </Select>
                    </Field>
                  </div>
                )}
              </div>
            )}
            <Field label="Preview text" hint="The snippet shown next to the subject in the inbox.">
              <Input value={draft.previewText} onChange={(e) => set({ previewText: e.target.value })} placeholder="Plus a new feature we think you will like" />
            </Field>
          </CardContent>
        </Card>
      )}

      {/* 2 — audience */}
      {step === 1 && (
        <Card>
          <CardHeader>
            <CardTitle>Who should receive this?</CardTitle>
            <CardDescription>Unsubscribed, bounced and suppressed contacts are always excluded automatically.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="grid gap-3 sm:grid-cols-3">
              {([
                ['all', 'All contacts', 'Everyone who can currently be emailed'],
                ['lists', 'Specific lists', 'Pick one or more static lists'],
                ['segments', 'Segments', 'Rule-based, recalculated at send time'],
              ] as const).map(([value, title, desc]) => (
                <button
                  key={value}
                  onClick={() => set({ mode: value })}
                  className={`rounded-xl border p-4 text-left transition ${
                    draft.mode === value ? 'border-primary bg-accent/50 ring-1 ring-primary' : 'border-border hover:bg-muted/40'}`}
                >
                  <p className="font-medium">{title}</p>
                  <p className="mt-1 text-xs text-muted-foreground">{desc}</p>
                </button>
              ))}
            </div>

            {draft.mode === 'lists' && (
              <div className="space-y-2">
                {!lists.data?.length && (
                  <p className="text-sm text-muted-foreground">No lists yet. <Link href="/lists" className="text-primary hover:underline">Create one</Link>.</p>
                )}
                {lists.data?.map((l) => (
                  <label key={l.id} className="flex cursor-pointer items-center gap-3 rounded-lg border border-border p-3 hover:bg-muted/40">
                    <input
                      type="checkbox"
                      className="h-4 w-4 rounded border-border"
                      checked={draft.listIds.includes(l.id)}
                      onChange={(e) => set({ listIds: e.target.checked ? [...draft.listIds, l.id] : draft.listIds.filter((id) => id !== l.id) })}
                    />
                    <span className="flex-1 font-medium">{l.name}</span>
                    <span className="text-sm text-muted-foreground">{formatNumber(l.contactCount)} contacts</span>
                  </label>
                ))}
              </div>
            )}

            {draft.mode === 'segments' && (
              <div className="space-y-2">
                {!segments.data?.length && (
                  <p className="text-sm text-muted-foreground">No segments yet. <Link href="/segments" className="text-primary hover:underline">Build one</Link>.</p>
                )}
                {segments.data?.map((s) => (
                  <label key={s.id} className="flex cursor-pointer items-center gap-3 rounded-lg border border-border p-3 hover:bg-muted/40">
                    <input
                      type="checkbox"
                      className="h-4 w-4 rounded border-border"
                      checked={draft.segmentIds.includes(s.id)}
                      onChange={(e) => set({ segmentIds: e.target.checked ? [...draft.segmentIds, s.id] : draft.segmentIds.filter((id) => id !== s.id) })}
                    />
                    <span className="flex-1 font-medium">{s.name}</span>
                    <span className="text-xs uppercase tracking-wide text-muted-foreground">match {s.matchType}</span>
                  </label>
                ))}
              </div>
            )}

            <div className="flex items-center gap-3 rounded-lg bg-accent px-4 py-3">
              <Users className="h-5 w-5 text-accent-foreground" />
              <div>
                <p className="font-medium">
                  {!campaignId ? 'Save the draft to estimate your audience'
                    : audience.isFetching ? 'Calculating…'
                    : `${formatNumber(recipients)} recipients`}
                </p>
                {!!audience.data?.suppressedInWorkspace && (
                  <p className="text-xs text-muted-foreground">
                    {formatNumber(audience.data.suppressedInWorkspace)} addresses on the workspace suppression list are excluded
                  </p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* 3 — sender */}
      {step === 2 && (
        <Card>
          <CardHeader>
            <CardTitle>Who is it from?</CardTitle>
            <CardDescription>Only verified sender identities can be used for a live send.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {!senders.data?.length ? (
              <div className="rounded-lg border border-dashed border-border p-8 text-center">
                <p className="font-medium">No sender identities yet</p>
                <p className="mt-1 text-sm text-muted-foreground">Add and verify a from-address before sending.</p>
                <Button asChild className="mt-4"><Link href="/settings/senders">Add sender identity</Link></Button>
              </div>
            ) : (
              <div className="space-y-2">
                {senders.data.map((s) => (
                  <button
                    key={s.id}
                    onClick={() => set({ senderIdentityId: s.id })}
                    className={`flex w-full items-center gap-3 rounded-lg border p-4 text-left transition ${
                      draft.senderIdentityId === s.id ? 'border-primary bg-accent/50 ring-1 ring-primary' : 'border-border hover:bg-muted/40'}`}
                  >
                    <div className="min-w-0 flex-1">
                      <p className="font-medium">{s.fromName}</p>
                      <p className="truncate text-sm text-muted-foreground">{s.fromEmail}</p>
                    </div>
                    <Badge variant={s.status === 'verified' ? 'success' : 'warning'} className="capitalize">{s.status}</Badge>
                  </button>
                ))}
              </div>
            )}

            <Field label="Reply-to address (optional)" hint="Leave blank to use the sender's own reply-to.">
              <Input type="email" value={draft.replyTo} onChange={(e) => set({ replyTo: e.target.value })} placeholder="support@company.com" />
            </Field>

            {selectedSender && selectedSender.status !== 'verified' && (
              <p className="flex items-start gap-2 rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-800 dark:bg-amber-500/10 dark:text-amber-300">
                <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
                This identity is not verified yet. Verify it in Settings before the campaign can go out.
              </p>
            )}
          </CardContent>
        </Card>
      )}

      {/* 4 — content */}
      {step === 3 && (
        <div className="space-y-4">
          <Card>
            <CardHeader className="flex-row items-center justify-between">
              <div>
                <CardTitle>Email content</CardTitle>
                <CardDescription>Start from a template, write HTML directly, or let AI draft it.</CardDescription>
              </div>
              <Button variant="outline" onClick={() => setAiOpen(true)}><Sparkles className="h-4 w-4" /> AI Assistant</Button>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input className="pl-9" value={tplSearch} onChange={(e) => setTplSearch(e.target.value)} placeholder="Search your templates…" />
                  </div>
                  <Button variant="outline" onClick={() => templates.refetch()} loading={templates.isFetching}>Refresh</Button>
                </div>
                <div className="grid max-h-[340px] gap-3 overflow-y-auto sm:grid-cols-2 lg:grid-cols-3">
                  <button onClick={() => pickTemplate(undefined)}
                    className={`rounded-xl border p-4 text-left text-sm transition ${!draft.templateId ? 'border-primary ring-1 ring-primary' : 'border-border hover:bg-muted/40'}`}>
                    <p className="font-medium">Write from scratch</p>
                    <p className="mt-1 text-xs text-muted-foreground">Start with a blank editor</p>
                  </button>
                  {filteredTemplates.map((t) => (
                    <button key={t.id} onClick={() => pickTemplate(t)}
                      className={`overflow-hidden rounded-xl border text-left transition ${draft.templateId === t.id ? 'border-primary ring-1 ring-primary' : 'border-border hover:bg-muted/40'}`}>
                      <div className="pointer-events-none h-28 overflow-hidden bg-white">
                        <iframe title={t.name} sandbox="" srcDoc={t.htmlContent || ''} tabIndex={-1}
                          className="h-[560px] w-[200%] origin-top-left scale-50 border-0" />
                      </div>
                      <div className="border-t border-border p-3">
                        <p className="truncate text-sm font-medium">{t.name}</p>
                        <p className="truncate text-xs text-muted-foreground">{t.subject || 'No subject'}</p>
                      </div>
                    </button>
                  ))}
                </div>
                {templates.isSuccess && !filteredTemplates.length && (
                  <p className="text-sm text-muted-foreground">No templates found. <Link href="/templates" className="text-primary hover:underline">Create one</Link>.</p>
                )}
              </div>
            </CardContent>
          </Card>

          <EmailEditor key={editorVer} value={draft.htmlContent} onChange={(html) => set({ htmlContent: html })} onAiClick={() => setAiOpen(true)} />
          <MergeTagHelp onInsert={(tag) => set({ htmlContent: draft.htmlContent + tag })} />
        </div>
      )}

      {/* 5 — settings */}
      {step === 4 && (
        <Card>
          <CardHeader>
            <CardTitle>Tracking and compliance</CardTitle>
            <CardDescription>Open tracking relies on a 1×1 pixel, so it under-reports when images are blocked.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-1">
            {([
              ['trackOpens', 'Track opens', 'Insert an invisible tracking pixel.'],
              ['trackClicks', 'Track clicks', 'Rewrite links so clicks are recorded, then redirect.'],
              ['includeUnsubscribeLink', 'Include unsubscribe link', 'Strongly recommended and required in most jurisdictions.'],
            ] as const).map(([key, title, desc]) => (
              <div key={key} className="flex items-center justify-between gap-4 border-b border-border py-4 last:border-0">
                <div>
                  <p className="font-medium">{title}</p>
                  <p className="text-sm text-muted-foreground">{desc}</p>
                </div>
                <Switch checked={draft[key] as boolean} onCheckedChange={(v) => set({ [key]: v } as any)} />
              </div>
            ))}
            {!draft.includeUnsubscribeLink && (
              <p className="flex items-start gap-2 rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-800 dark:bg-amber-500/10 dark:text-amber-300">
                <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
                Sending marketing email without an unsubscribe link risks spam complaints and legal exposure.
                A List-Unsubscribe header is still sent regardless.
              </p>
            )}
          </CardContent>
        </Card>
      )}

      {/* 6 — review */}
      {step === 5 && (
        <div className="grid gap-4 lg:grid-cols-[1fr_340px]">
          <Card>
            <CardHeader><CardTitle>Preview</CardTitle></CardHeader>
            <CardContent>
              <div className="mb-4 rounded-lg border border-border p-4">
                <p className="text-sm text-muted-foreground">From</p>
                <p className="font-medium">{selectedSender?.fromName} &lt;{selectedSender?.fromEmail}&gt;</p>
                <p className="mt-3 text-sm text-muted-foreground">Subject</p>
                <p className="font-medium">{draft.subject}</p>
                {draft.previewText && <p className="mt-1 text-sm text-muted-foreground">{draft.previewText}</p>}
              </div>
              <iframe title="Campaign preview" srcDoc={draft.htmlContent} sandbox="" className="h-[480px] w-full rounded-lg border border-border bg-white" />
            </CardContent>
          </Card>

          <div className="space-y-4">
            <Card>
              <CardHeader><CardTitle>Pre-flight checks</CardTitle></CardHeader>
              <CardContent className="space-y-2">
                {validation.isFetching && <p className="text-sm text-muted-foreground">Running checks…</p>}
                {validation.data?.issues?.length ? validation.data.issues.map((issue, i) => (
                  <p key={i} className="flex items-start gap-2 rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">
                    <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />{issue}
                  </p>
                )) : validation.data ? (
                  <p className="flex items-center gap-2 rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300">
                    <Check className="h-4 w-4" /> Everything looks ready to send.
                  </p>
                ) : null}
              </CardContent>
            </Card>

            {!!validation.data?.warnings?.length && (
              <Card>
                <CardHeader><CardTitle>Suggestions</CardTitle><CardDescription>Won't block sending, but improve results.</CardDescription></CardHeader>
                <CardContent className="space-y-2">
                  {validation.data.warnings.map((w, i) => (
                    <p key={i} className="flex items-start gap-2 rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-800 dark:bg-amber-500/10 dark:text-amber-300">
                      <Info className="mt-0.5 h-4 w-4 shrink-0" />{w}
                    </p>
                  ))}
                </CardContent>
              </Card>
            )}

            <Card>
              <CardHeader><CardTitle>Summary</CardTitle></CardHeader>
              <CardContent className="space-y-2 text-sm">
                {[
                  ['Recipients', formatNumber(validation.data?.estimatedRecipients ?? recipients)],
                  ['Audience', draft.mode],
                  ['Track opens', draft.trackOpens ? 'On' : 'Off'],
                  ['Track clicks', draft.trackClicks ? 'On' : 'Off'],
                  ['Unsubscribe link', draft.includeUnsubscribeLink ? 'Included' : 'Not included'],
                ].map(([k, v]) => (
                  <div key={k as string} className="flex justify-between gap-4">
                    <span className="text-muted-foreground">{k}</span><span className="font-medium capitalize">{v as string}</span>
                  </div>
                ))}
              </CardContent>
            </Card>

            <Card>
              <CardHeader><CardTitle>Send a test</CardTitle></CardHeader>
              <CardContent className="space-y-3">
                <Input type="email" value={testEmail} onChange={(e) => setTestEmail(e.target.value)} placeholder="you@company.com" />
                <Button variant="outline" className="w-full" disabled={!testEmail || !campaignId} loading={sendTest.isPending} onClick={() => sendTest.mutate()}>
                  Send test email
                </Button>
                <Button variant="ghost" className="w-full" disabled={!campaignId} loading={saveAsTemplate.isPending} onClick={() => saveAsTemplate.mutate()}>
                  <BookmarkPlus className="h-4 w-4" /> Save as template
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      {/* 7 — send */}
      {step === 6 && (
        <Card>
          <CardHeader>
            <CardTitle>Send this campaign</CardTitle>
            <CardDescription>Sending is queued and rate-limited, so large audiences go out gradually.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="grid gap-3 sm:grid-cols-2">
              <button
                onClick={() => setScheduleMode('now')}
                className={`rounded-xl border p-5 text-left transition ${scheduleMode === 'now' ? 'border-primary bg-accent/50 ring-1 ring-primary' : 'border-border hover:bg-muted/40'}`}
              >
                <Send className="mb-2 h-5 w-5" />
                <p className="font-medium">Send now</p>
                <p className="mt-1 text-xs text-muted-foreground">Queue starts immediately.</p>
              </button>
              <button
                onClick={() => setScheduleMode('later')}
                className={`rounded-xl border p-5 text-left transition ${scheduleMode === 'later' ? 'border-primary bg-accent/50 ring-1 ring-primary' : 'border-border hover:bg-muted/40'}`}
              >
                <Clock className="mb-2 h-5 w-5" />
                <p className="font-medium">Schedule</p>
                <p className="mt-1 text-xs text-muted-foreground">Pick a date and time.</p>
              </button>
            </div>

            {scheduleMode === 'later' && (
              <Field label="Send at" hint="Uses your browser's timezone.">
                <Input type="datetime-local" value={scheduledAt} onChange={(e) => setScheduledAt(e.target.value)} />
              </Field>
            )}

            {scheduleMode === 'later' && suggestions.length > 0 && (
              <div className="rounded-lg border border-border p-4">
                <p className="flex items-center gap-2 text-sm font-medium"><Sparkles className="h-4 w-4 text-primary" /> Suggested send times</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  {bestTime.data?.basedOn === 'workspace'
                    ? 'Based on when your own subscribers open and click (clicks count more).'
                    : 'Not enough engagement data yet — these are widely effective mid-week mornings. They will become personalised after a few campaigns.'}
                </p>
                <div className="mt-3 flex flex-wrap gap-2">
                  {suggestions.map((s, i) => (
                    <Button key={i} size="sm" variant={scheduledAt === toLocalInput(s.date) ? 'secondary' : 'outline'} onClick={() => setScheduledAt(toLocalInput(s.date))}>
                      {i === 0 && bestTime.data?.basedOn === 'workspace' ? 'Best: ' : ''}{s.label}
                    </Button>
                  ))}
                </div>
              </div>
            )}

            <div className="rounded-lg bg-accent px-4 py-3 text-sm">
              About to send <b>{draft.subject || 'this campaign'}</b> to <b>{formatNumber(recipients)}</b> recipients.
            </div>

            <Button
              className="w-full"
              size="lg"
              loading={send.isPending}
              disabled={scheduleMode === 'later' && !scheduledAt}
              onClick={() => send.mutate()}
            >
              {scheduleMode === 'now' ? 'Send campaign now' : 'Schedule campaign'}
            </Button>
          </CardContent>
        </Card>
      )}

      <div className="flex items-center justify-between gap-3 border-t border-border pt-4">
        <Button variant="outline" disabled={step === 0} onClick={() => setStep((s) => s - 1)}>
          <ArrowLeft className="h-4 w-4" /> Back
        </Button>
        <div className="flex gap-2">
          <Button variant="ghost" loading={saveDraft.isPending} onClick={() => saveDraft.mutate()}>Save draft</Button>
          {step < STEPS.length - 1 && (
            <Button disabled={!canAdvance()} loading={saveDraft.isPending} onClick={next}>
              Continue <ArrowRight className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>

      <AiAssistantDialog
        open={aiOpen}
        onOpenChange={setAiOpen}
        onApply={(res) => { setEditorVer((v) => v + 1); set({
          subject: draft.subject || res.subject,
          previewText: draft.previewText || res.previewText,
          htmlContent: res.body || draft.htmlContent,
        }); }}
      />
    </div>
  );
}

export default function NewCampaignPage() {
  return <Suspense fallback={<PageLoader />}><Wizard /></Suspense>;
}
