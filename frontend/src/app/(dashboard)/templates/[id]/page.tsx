'use client';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { ArrowLeft, Save, Send } from 'lucide-react';
import { api } from '@/lib/api';
import { canEdit, useAuth } from '@/store/auth';
import type { EmailTemplate } from '@/types';
import { AiAssistantDialog } from '@/components/AiAssistant';
import { EmailEditor, MergeTagHelp } from '@/components/EmailEditor';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Field, Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/primitives';
import { PageLoader, toast } from '@/components/ui/feedback';

export default function TemplateEditorPage() {
  const { id } = useParams<{ id: string }>();
  const role = useAuth((s) => s.activeWorkspace?.role);
  const editable = canEdit(role);

  const [form, setForm] = useState({ name: '', category: 'general', subject: '', previewText: '', htmlContent: '' });
  const [aiOpen, setAiOpen] = useState(false);
  const [testOpen, setTestOpen] = useState(false);
  const [testEmail, setTestEmail] = useState('');

  const template = useQuery({ queryKey: ['template', id], queryFn: () => api.get<EmailTemplate>(`/templates/${id}`) });

  useEffect(() => {
    if (template.data) {
      const t = template.data;
      setForm({
        name: t.name, category: t.category, subject: t.subject || '',
        previewText: t.previewText || '', htmlContent: t.htmlContent || '',
      });
    }
  }, [template.data]);

  const save = useMutation({
    mutationFn: () => api.patch(`/templates/${id}`, form),
    onSuccess: () => toast.success('Template saved'),
    onError: (e: any) => toast.error('Save failed', e.message),
  });

  const sendTest = useMutation({
    mutationFn: () => api.post(`/templates/${id}/test`, { to: testEmail }),
    onSuccess: () => { toast.success('Test email sent', testEmail); setTestOpen(false); },
    onError: (e: any) => toast.error('Test email failed', e.message),
  });

  if (template.isLoading) return <PageLoader />;

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <Button asChild variant="ghost" size="icon"><Link href="/templates"><ArrowLeft className="h-4 w-4" /></Link></Button>
          <Input
            value={form.name}
            disabled={!editable}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            className="h-9 w-64 border-transparent bg-transparent px-1 text-lg font-semibold shadow-none focus-visible:border-input"
          />
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setTestOpen(true)}><Send className="h-4 w-4" /> Send test</Button>
          {editable && <Button loading={save.isPending} onClick={() => save.mutate()}><Save className="h-4 w-4" /> Save</Button>}
        </div>
      </div>

      <div className="grid gap-5 lg:grid-cols-[1fr_320px]">
        <EmailEditor
          value={form.htmlContent}
          onChange={(html) => setForm({ ...form, htmlContent: html })}
          onAiClick={editable ? () => setAiOpen(true) : undefined}
        />

        <div className="space-y-4">
          <Card>
            <CardHeader><CardTitle>Details</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <Field label="Subject line">
                <Input value={form.subject} disabled={!editable} onChange={(e) => setForm({ ...form, subject: e.target.value })} placeholder="Your monthly update" />
              </Field>
              <Field label="Preview text" hint="Shown after the subject in most inboxes.">
                <Input value={form.previewText} disabled={!editable} onChange={(e) => setForm({ ...form, previewText: e.target.value })} />
              </Field>
              <Field label="Category">
                <Input value={form.category} disabled={!editable} onChange={(e) => setForm({ ...form, category: e.target.value })} placeholder="newsletter" />
              </Field>
            </CardContent>
          </Card>

          <MergeTagHelp onInsert={(tag) => setForm({ ...form, htmlContent: form.htmlContent + tag })} />
        </div>
      </div>

      <AiAssistantDialog
        open={aiOpen}
        onOpenChange={setAiOpen}
        onApply={(res) => setForm({ ...form, subject: res.subject || form.subject, previewText: res.previewText || form.previewText, htmlContent: res.body || form.htmlContent })}
      />

      <Dialog open={testOpen} onOpenChange={setTestOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle className="text-lg font-semibold">Send a test email</DialogTitle></DialogHeader>
          <Field label="Send to" hint="Merge tags are filled with sample data.">
            <Input type="email" value={testEmail} onChange={(e) => setTestEmail(e.target.value)} placeholder="you@company.com" />
          </Field>
          <DialogFooter>
            <Button variant="outline" onClick={() => setTestOpen(false)}>Cancel</Button>
            <Button loading={sendTest.isPending} disabled={!testEmail} onClick={() => sendTest.mutate()}>Send test</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
