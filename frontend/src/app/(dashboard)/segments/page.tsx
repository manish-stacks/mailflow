'use client';
import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Filter, Plus, Trash2, Users } from 'lucide-react';
import { api } from '@/lib/api';
import { formatNumber } from '@/lib/utils';
import { canEdit, useAuth } from '@/store/auth';
import type { ContactList, Segment, SegmentRule } from '@/types';
import { PageHeader } from '@/components/layout/page-header';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Field, Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, Select } from '@/components/ui/primitives';
import { ConfirmDialog, EmptyState, TableSkeleton, toast } from '@/components/ui/feedback';

const OPERATOR_LABELS: Record<string, string> = {
  equals: 'equals', not_equals: 'does not equal', contains: 'contains', not_contains: 'does not contain',
  starts_with: 'starts with', is_set: 'is set', is_not_set: 'is not set', before: 'is before', after: 'is after',
  in_list: 'is in list', not_in_list: 'is not in list',
  opened_campaign: 'opened campaign', clicked_campaign: 'clicked campaign', not_opened_campaign: 'did not open campaign',
};

const NO_VALUE = ['is_set', 'is_not_set'];

export default function SegmentsPage() {
  const qc = useQueryClient();
  const wsId = useAuth((s) => s.activeWorkspace?.id);
  const role = useAuth((s) => s.activeWorkspace?.role);

  const [open, setOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [name, setName] = useState('');
  const [matchType, setMatchType] = useState<'all' | 'any'>('all');
  const [rules, setRules] = useState<SegmentRule[]>([{ field: 'subscribed', operator: 'equals', value: 'true' }]);
  const [preview, setPreview] = useState<{ total: number } | null>(null);

  const segments = useQuery({ queryKey: ['segments', wsId], queryFn: () => api.get<Segment[]>('/segments'), enabled: !!wsId });
  const schema = useQuery({ queryKey: ['segment-schema'], queryFn: () => api.get<any>('/segments/schema'), enabled: !!wsId });
  const lists = useQuery({ queryKey: ['lists', wsId], queryFn: () => api.get<ContactList[]>('/lists'), enabled: !!wsId });
  const campaigns = useQuery({ queryKey: ['campaign-options', wsId], queryFn: () => api.list<any>('/campaigns', { limit: 50 }), enabled: !!wsId });

  const fieldMeta = (field: string) => schema.data?.fields?.find((f: any) => f.key === field);

  const runPreview = useMutation({
    mutationFn: () => api.post('/segments/preview', { matchType, rules }),
    onSuccess: (res: any) => setPreview({ total: res.total }),
    onError: (e: any) => toast.error('Preview failed', e.message),
  });

  const save = useMutation({
    mutationFn: () => api.post('/segments', { name, matchType, rules }),
    onSuccess: () => {
      toast.success('Segment created');
      setOpen(false); setName(''); setPreview(null);
      setRules([{ field: 'subscribed', operator: 'equals', value: 'true' }]);
      qc.invalidateQueries({ queryKey: ['segments'] });
    },
    onError: (e: any) => toast.error('Could not save segment', e.message),
  });

  const remove = useMutation({
    mutationFn: (id: string) => api.delete(`/segments/${id}`),
    onSuccess: () => { toast.success('Segment deleted'); setDeleteId(null); qc.invalidateQueries({ queryKey: ['segments'] }); },
  });

  const updateRule = (i: number, patch: Partial<SegmentRule>) =>
    setRules(rules.map((r, idx) => (idx === i ? { ...r, ...patch } : r)));

  const valueInput = (rule: SegmentRule, i: number) => {
    if (NO_VALUE.includes(rule.operator)) return null;
    if (rule.field === 'list') {
      return (
        <Select value={rule.value ?? ''} onChange={(e) => updateRule(i, { value: e.target.value })}>
          <option value="">Select a list</option>
          {lists.data?.map((l) => <option key={l.id} value={l.id}>{l.name}</option>)}
        </Select>
      );
    }
    if (rule.field === 'campaign') {
      return (
        <Select value={rule.value ?? ''} onChange={(e) => updateRule(i, { value: e.target.value })}>
          <option value="">Select a campaign</option>
          {campaigns.data?.data?.map((c: any) => <option key={c.id} value={c.id}>{c.name}</option>)}
        </Select>
      );
    }
    if (rule.field === 'subscribed') {
      return (
        <Select value={String(rule.value ?? 'true')} onChange={(e) => updateRule(i, { value: e.target.value })}>
          <option value="true">Yes</option><option value="false">No</option>
        </Select>
      );
    }
    if (['before', 'after'].includes(rule.operator)) {
      return <Input type="date" value={rule.value ?? ''} onChange={(e) => updateRule(i, { value: e.target.value })} />;
    }
    return <Input placeholder="Value" value={rule.value ?? ''} onChange={(e) => updateRule(i, { value: e.target.value })} />;
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Segments"
        description="Dynamic audiences that recalculate every time you send."
        actions={canEdit(role) && <Button onClick={() => setOpen(true)}><Plus className="h-4 w-4" /> New Segment</Button>}
      />

      {segments.isLoading ? <Card><TableSkeleton cols={3} /></Card>
        : !segments.data?.length ? (
          <Card><EmptyState icon={Filter} title="No segments yet"
            description="Build a rule-based audience, for example subscribed contacts in Delhi who opened your last campaign."
            action={canEdit(role) && <Button onClick={() => setOpen(true)}>Create segment</Button>} /></Card>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {segments.data.map((s) => (
              <Card key={s.id}>
                <CardContent className="p-5">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="truncate font-medium">{s.name}</p>
                      <p className="mt-1 text-xs uppercase tracking-wide text-muted-foreground">Match {s.matchType}</p>
                    </div>
                    {canEdit(role) && (
                      <Button variant="ghost" size="icon" onClick={() => setDeleteId(s.id)}><Trash2 className="h-4 w-4" /></Button>
                    )}
                  </div>
                  <div className="mt-3 flex flex-wrap gap-1.5">
                    {s.rules?.slice(0, 3).map((r, i) => (
                      <Badge key={i} variant="secondary" className="font-normal">
                        {r.field} {OPERATOR_LABELS[r.operator] ?? r.operator} {NO_VALUE.includes(r.operator) ? '' : String(r.value ?? '')}
                      </Badge>
                    ))}
                    {s.rules?.length > 3 && <Badge variant="outline">+{s.rules.length - 3}</Badge>}
                  </div>
                  <div className="mt-4 flex items-center gap-2 text-sm text-muted-foreground">
                    <Users className="h-4 w-4" />
                    {s.cachedCount != null ? `${formatNumber(s.cachedCount)} contacts` : 'Recalculated at send time'}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader><DialogTitle className="text-lg font-semibold">New segment</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <Field label="Segment name"><Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Engaged Delhi customers" /></Field>

            <div className="flex items-center gap-2 text-sm">
              <span className="text-muted-foreground">Contacts must match</span>
              <Select className="h-8 w-28" value={matchType} onChange={(e) => setMatchType(e.target.value as any)}>
                <option value="all">all rules</option>
                <option value="any">any rule</option>
              </Select>
            </div>

            <div className="space-y-2">
              {rules.map((rule, i) => {
                const meta = fieldMeta(rule.field);
                return (
                  <div key={i} className="grid gap-2 rounded-lg border border-border p-3 sm:grid-cols-[1fr_1fr_1fr_auto]">
                    <Select
                      value={rule.field}
                      onChange={(e) => {
                        const f = fieldMeta(e.target.value);
                        updateRule(i, { field: e.target.value, operator: f?.operators?.[0] ?? 'equals', value: '' });
                      }}
                    >
                      {schema.data?.fields?.map((f: any) => <option key={f.key} value={f.key}>{f.key.replace(/_/g, ' ')}</option>)}
                    </Select>
                    <Select value={rule.operator} onChange={(e) => updateRule(i, { operator: e.target.value })}>
                      {(meta?.operators ?? ['equals']).map((op: string) => (
                        <option key={op} value={op}>{OPERATOR_LABELS[op] ?? op}</option>
                      ))}
                    </Select>
                    {valueInput(rule, i) ?? <div />}
                    <Button variant="ghost" size="icon" onClick={() => setRules(rules.filter((_, idx) => idx !== i))}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                );
              })}
              <Button variant="outline" size="sm" onClick={() => setRules([...rules, { field: 'email', operator: 'contains', value: '' }])}>
                <Plus className="h-3.5 w-3.5" /> Add rule
              </Button>
            </div>

            {preview && (
              <p className="rounded-lg bg-accent px-3 py-2 text-sm text-accent-foreground">
                This segment currently matches <b>{formatNumber(preview.total)}</b> contacts.
              </p>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" loading={runPreview.isPending} onClick={() => runPreview.mutate()}>Preview count</Button>
            <Button loading={save.isPending} disabled={!name} onClick={() => save.mutate()}>Create segment</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={!!deleteId} onOpenChange={() => setDeleteId(null)}
        title="Delete this segment?" description="Campaigns already sent keep their history."
        destructive confirmLabel="Delete" loading={remove.isPending}
        onConfirm={() => remove.mutate(deleteId!)}
      />
    </div>
  );
}
