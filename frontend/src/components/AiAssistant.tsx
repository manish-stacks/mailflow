'use client';
import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { Sparkles } from 'lucide-react';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Field, Input, Textarea } from '@/components/ui/input';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, Select } from '@/components/ui/primitives';
import { toast } from '@/components/ui/feedback';

export interface AiEmailResult { subject: string; previewText: string; body: string; ctaText: string }

const TONES = ['Professional and friendly', 'Casual', 'Urgent', 'Playful', 'Formal', 'Empathetic'];

/** All Hugging Face calls go through the backend — no keys ever reach this component. */
export function AiAssistantDialog({
  open, onOpenChange, onApply,
}: { open: boolean; onOpenChange: (v: boolean) => void; onApply: (result: AiEmailResult) => void }) {
  const [form, setForm] = useState({
    product: '', audience: '', goal: '', tone: TONES[0], keyPoints: '', offer: '', cta: '', brandName: '',
  });
  const [result, setResult] = useState<AiEmailResult | null>(null);

  const generate = useMutation({
    mutationFn: () => api.post<AiEmailResult>('/ai/generate-email', form),
    onSuccess: setResult,
    onError: (e: any) => toast.error('Generation failed', e.message),
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-lg font-semibold">
            <Sparkles className="h-4 w-4 text-primary" /> AI email assistant
          </DialogTitle>
          <DialogDescription>Describe the email and we will draft the subject, preview text and body.</DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="Product or service"><Input value={form.product} onChange={(e) => setForm({ ...form, product: e.target.value })} placeholder="Email marketing software" /></Field>
            <Field label="Target audience"><Input value={form.audience} onChange={(e) => setForm({ ...form, audience: e.target.value })} placeholder="Small business owners" /></Field>
            <Field label="Goal"><Input value={form.goal} onChange={(e) => setForm({ ...form, goal: e.target.value })} placeholder="Free trial signups" /></Field>
            <Field label="Tone">
              <Select value={form.tone} onChange={(e) => setForm({ ...form, tone: e.target.value })}>
                {TONES.map((t) => <option key={t} value={t}>{t}</option>)}
              </Select>
            </Field>
            <Field label="Offer (optional)"><Input value={form.offer} onChange={(e) => setForm({ ...form, offer: e.target.value })} placeholder="20% off the first year" /></Field>
            <Field label="Call to action"><Input value={form.cta} onChange={(e) => setForm({ ...form, cta: e.target.value })} placeholder="Start free trial" /></Field>
          </div>
          <Field label="Key points" hint="One per line. The model will not invent claims beyond these.">
            <Textarea value={form.keyPoints} onChange={(e) => setForm({ ...form, keyPoints: e.target.value })} placeholder="Set up in 5 minutes&#10;No credit card required" />
          </Field>

          {result && (
            <div className="space-y-3 rounded-lg border border-border bg-muted/40 p-4">
              <div>
                <p className="text-xs font-medium text-muted-foreground">Subject</p>
                <p className="text-sm font-medium">{result.subject}</p>
              </div>
              <div>
                <p className="text-xs font-medium text-muted-foreground">Preview text</p>
                <p className="text-sm">{result.previewText}</p>
              </div>
              <div>
                <p className="mb-1 text-xs font-medium text-muted-foreground">Body preview</p>
                <iframe title="AI preview" srcDoc={result.body} sandbox="" className="h-56 w-full rounded-md border border-border bg-white" />
              </div>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" loading={generate.isPending} onClick={() => generate.mutate()}>
            {result ? 'Regenerate' : 'Generate'}
          </Button>
          <Button
            disabled={!result}
            onClick={() => { onApply(result!); onOpenChange(false); setResult(null); }}
          >
            Use this email
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

/** Inline rewrite actions used next to subject and body fields. */
export function AiRewriteMenu({ content, onResult }: { content: string; onResult: (text: string) => void }) {
  const rewrite = useMutation({
    mutationFn: (action: string) => api.post<{ content?: string }>('/ai/rewrite', { action, content }),
    onSuccess: (res) => { if (res.content) { onResult(res.content); toast.success('Content updated'); } },
    onError: (e: any) => toast.error('Rewrite failed', e.message),
  });

  const actions = [
    ['shorter', 'Make shorter'], ['professional', 'More professional'],
    ['friendly', 'More friendly'], ['grammar', 'Fix grammar'], ['persuasive', 'More persuasive'],
  ];

  return (
    <div className="flex flex-wrap gap-1.5">
      {actions.map(([key, label]) => (
        <Button key={key} size="sm" variant="outline" disabled={!content || rewrite.isPending} onClick={() => rewrite.mutate(key)}>
          {label}
        </Button>
      ))}
    </div>
  );
}
