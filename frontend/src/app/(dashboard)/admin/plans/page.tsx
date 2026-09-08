'use client';
import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Archive, Pencil, Plus } from 'lucide-react';
import { api } from '@/lib/api';
import { formatLimit, formatMoney } from '@/lib/utils';
import type { Plan } from '@/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Field, Input, Textarea } from '@/components/ui/input';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, Switch } from '@/components/ui/primitives';
import { ConfirmDialog, TableSkeleton, toast } from '@/components/ui/feedback';

const LIMIT_FIELDS: { key: keyof Plan; label: string }[] = [
  { key: 'maxContacts', label: 'Contacts' },
  { key: 'maxEmailsPerMonth', label: 'Emails / month' },
  { key: 'maxCampaignsPerMonth', label: 'Campaigns / month' },
  { key: 'maxTeamMembers', label: 'Team members' },
  { key: 'maxSenderIdentities', label: 'Sender identities' },
  { key: 'maxDomains', label: 'Domains' },
  { key: 'aiCreditsPerDay', label: 'AI credits / day' },
];

const FEATURE_FIELDS: { key: keyof Plan; label: string; hint: string }[] = [
  { key: 'allowCustomSmtp', label: 'Own mail server', hint: 'Client can connect their own SMTP.' },
  { key: 'allowApiAccess', label: 'API access', hint: 'Client can create API keys.' },
  { key: 'allowAi', label: 'AI assistant', hint: 'Access to the writing assistant.' },
  { key: 'allowSegments', label: 'Segments', hint: 'Rule-based dynamic audiences.' },
  { key: 'removeBranding', label: 'No branding', hint: 'Hide MailFlow branding in emails.' },
];

const BLANK: Partial<Plan> = {
  name: '', slug: '', description: '', priceMonthly: 0, priceYearly: 0, currency: 'INR',
  maxContacts: 1000, maxEmailsPerMonth: 5000, maxCampaignsPerMonth: -1, maxTeamMembers: 2,
  maxSenderIdentities: 1, maxDomains: 1, aiCreditsPerDay: 20,
  allowCustomSmtp: false, allowApiAccess: false, allowAi: true, allowSegments: true,
  removeBranding: false, isPublic: true, isActive: true, sortOrder: 10,
};

export default function AdminPlansPage() {
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Plan | null>(null);
  const [form, setForm] = useState<Partial<Plan>>(BLANK);
  const [archiveId, setArchiveId] = useState<string | null>(null);

  const plans = useQuery({ queryKey: ['admin-plans'], queryFn: () => api.get<Plan[]>('/admin/plans') });

  const save = useMutation({
    mutationFn: () => (editing ? api.patch(`/admin/plans/${editing.id}`, form) : api.post('/admin/plans', form)),
    onSuccess: () => {
      toast.success(editing ? 'Package updated' : 'Package created');
      setOpen(false); setEditing(null); setForm(BLANK);
      qc.invalidateQueries({ queryKey: ['admin-plans'] });
      qc.invalidateQueries({ queryKey: ['plans'] });
    },
    onError: (e: any) => toast.error('Could not save the package', e.message),
  });

  const archive = useMutation({
    mutationFn: (id: string) => api.delete(`/admin/plans/${id}`),
    onSuccess: (res: any) => { toast.success(res?.message || 'Package archived'); setArchiveId(null); qc.invalidateQueries({ queryKey: ['admin-plans'] }); },
    onError: (e: any) => toast.error('Could not archive', e.message),
  });

  const startEdit = (p: Plan) => { setEditing(p); setForm({ ...p }); setOpen(true); };
  const startNew = () => { setEditing(null); setForm(BLANK); setOpen(true); };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">Use <b>-1</b> on any limit to mean unlimited.</p>
        <Button onClick={startNew}><Plus className="h-4 w-4" /> New package</Button>
      </div>

      {plans.isLoading ? <Card><TableSkeleton cols={4} /></Card> : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {plans.data?.map((p) => (
            <Card key={p.id} className={p.isActive ? '' : 'opacity-60'}>
              <CardContent className="p-5">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="font-medium">{p.name}</p>
                    <p className="font-mono text-xs text-muted-foreground">{p.slug}</p>
                  </div>
                  <div className="flex gap-1">
                    <Button variant="ghost" size="icon" onClick={() => startEdit(p)}><Pencil className="h-4 w-4" /></Button>
                    {p.isActive && <Button variant="ghost" size="icon" onClick={() => setArchiveId(p.id)}><Archive className="h-4 w-4" /></Button>}
                  </div>
                </div>

                <p className="mt-3 text-2xl font-semibold tracking-tight">
                  {p.priceMonthly ? formatMoney(p.priceMonthly, p.currency) : 'Free'}
                  {!!p.priceMonthly && <span className="text-sm font-normal text-muted-foreground">/mo</span>}
                </p>

                <div className="mt-3 flex flex-wrap gap-1.5">
                  {!p.isActive && <Badge variant="secondary">Archived</Badge>}
                  {!p.isPublic && p.isActive && <Badge variant="warning">Hidden</Badge>}
                  {FEATURE_FIELDS.filter((f) => p[f.key]).map((f) => (
                    <Badge key={f.key} variant="outline" className="font-normal">{f.label}</Badge>
                  ))}
                </div>

                <ul className="mt-4 space-y-1 text-sm">
                  {LIMIT_FIELDS.slice(0, 4).map((f) => (
                    <li key={f.key} className="flex justify-between">
                      <span className="text-muted-foreground">{f.label}</span>
                      <span className="font-medium">{formatLimit(p[f.key] as number)}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-h-[85vh] max-w-2xl overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-lg font-semibold">{editing ? `Edit ${editing.name}` : 'New package'}</DialogTitle>
            <DialogDescription>Changes apply to every client already on this package.</DialogDescription>
          </DialogHeader>

          <div className="space-y-5">
            <div className="grid gap-3 sm:grid-cols-2">
              <Field label="Name"><Input value={form.name ?? ''} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Growth" /></Field>
              <Field label="Slug" hint="Used in the API. Do not change once clients are on it.">
                <Input value={form.slug ?? ''} onChange={(e) => setForm({ ...form, slug: e.target.value })} placeholder="growth" />
              </Field>
            </div>

            <Field label="Description">
              <Textarea value={form.description ?? ''} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="Who is this package for?" />
            </Field>

            <div className="grid gap-3 sm:grid-cols-3">
              <Field label="Price / month"><Input type="number" value={form.priceMonthly ?? 0} onChange={(e) => setForm({ ...form, priceMonthly: Number(e.target.value) })} /></Field>
              <Field label="Price / year"><Input type="number" value={form.priceYearly ?? 0} onChange={(e) => setForm({ ...form, priceYearly: Number(e.target.value) })} /></Field>
              <Field label="Currency"><Input value={form.currency ?? 'INR'} onChange={(e) => setForm({ ...form, currency: e.target.value.toUpperCase() })} maxLength={3} /></Field>
            </div>

            <div>
              <p className="mb-2 text-sm font-medium">Limits</p>
              <div className="grid gap-3 sm:grid-cols-2">
                {LIMIT_FIELDS.map((f) => (
                  <Field key={f.key} label={f.label}>
                    <Input type="number" value={(form[f.key] as number) ?? 0} onChange={(e) => setForm({ ...form, [f.key]: Number(e.target.value) })} />
                  </Field>
                ))}
              </div>
            </div>

            <div>
              <p className="mb-2 text-sm font-medium">Features</p>
              <div className="space-y-1">
                {FEATURE_FIELDS.map((f) => (
                  <div key={f.key} className="flex items-center justify-between gap-4 border-b border-border py-3 last:border-0">
                    <div>
                      <p className="text-sm font-medium">{f.label}</p>
                      <p className="text-xs text-muted-foreground">{f.hint}</p>
                    </div>
                    <Switch checked={!!form[f.key]} onCheckedChange={(v) => setForm({ ...form, [f.key]: v })} />
                  </div>
                ))}
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-3">
              <div className="flex items-center justify-between rounded-lg border border-border p-3">
                <span className="text-sm font-medium">Public</span>
                <Switch checked={!!form.isPublic} onCheckedChange={(v) => setForm({ ...form, isPublic: v })} />
              </div>
              <div className="flex items-center justify-between rounded-lg border border-border p-3">
                <span className="text-sm font-medium">Active</span>
                <Switch checked={!!form.isActive} onCheckedChange={(v) => setForm({ ...form, isActive: v })} />
              </div>
              <Field label="Sort order">
                <Input type="number" value={form.sortOrder ?? 0} onChange={(e) => setForm({ ...form, sortOrder: Number(e.target.value) })} />
              </Field>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
            <Button disabled={!form.name || !form.slug} loading={save.isPending} onClick={() => save.mutate()}>
              {editing ? 'Save changes' : 'Create package'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={!!archiveId} onOpenChange={() => setArchiveId(null)}
        title="Archive this package?"
        description="It disappears from the pricing page. Clients already on it keep their limits until you move them."
        confirmLabel="Archive" loading={archive.isPending}
        onConfirm={() => archive.mutate(archiveId!)}
      />
    </div>
  );
}
