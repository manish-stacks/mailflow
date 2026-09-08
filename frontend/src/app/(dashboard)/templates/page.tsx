'use client';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Copy, FileText, MoreHorizontal, Plus, Search, Trash2 } from 'lucide-react';
import { api } from '@/lib/api';
import { formatDate } from '@/lib/utils';
import { canEdit, useAuth } from '@/store/auth';
import type { EmailTemplate } from '@/types';
import { PageHeader } from '@/components/layout/page-header';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Dropdown, DropdownContent, DropdownItem, DropdownTrigger } from '@/components/ui/primitives';
import { ConfirmDialog, EmptyState, TableSkeleton, toast } from '@/components/ui/feedback';

const STARTER_HTML = `<div style="font-family:Arial,Helvetica,sans-serif;max-width:600px;margin:0 auto;padding:32px 24px;color:#1f2937">
  <h1 style="font-size:24px;margin:0 0 16px">Hello {{first_name | default: "there"}}</h1>
  <p style="font-size:15px;line-height:1.6;margin:0 0 20px">Write your message here.</p>
  <a href="https://example.com" style="display:inline-block;background:#4f46e5;color:#fff;padding:12px 22px;border-radius:8px;text-decoration:none;font-weight:600">Call to action</a>
</div>`;

export default function TemplatesPage() {
  const qc = useQueryClient();
  const router = useRouter();
  const wsId = useAuth((s) => s.activeWorkspace?.id);
  const role = useAuth((s) => s.activeWorkspace?.role);
  const [search, setSearch] = useState('');
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const templates = useQuery({
    queryKey: ['templates', wsId, search],
    queryFn: () => api.list<EmailTemplate>('/templates', { search, limit: 50 }),
    enabled: !!wsId,
  });

  const create = useMutation({
    mutationFn: () => api.post<EmailTemplate>('/templates', {
      name: 'Untitled template', category: 'general', subject: '', htmlContent: STARTER_HTML,
    }),
    onSuccess: (t) => router.push(`/templates/${t.id}`),
    onError: (e: any) => toast.error('Could not create template', e.message),
  });

  const duplicate = useMutation({
    mutationFn: (id: string) => api.post(`/templates/${id}/duplicate`),
    onSuccess: () => { toast.success('Template duplicated'); qc.invalidateQueries({ queryKey: ['templates'] }); },
  });

  const remove = useMutation({
    mutationFn: (id: string) => api.delete(`/templates/${id}`),
    onSuccess: () => { toast.success('Template deleted'); setDeleteId(null); qc.invalidateQueries({ queryKey: ['templates'] }); },
  });

  const rows = templates.data?.data ?? [];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Email templates"
        description="Reusable designs you can drop into any campaign."
        actions={canEdit(role) && <Button loading={create.isPending} onClick={() => create.mutate()}><Plus className="h-4 w-4" /> New Template</Button>}
      />

      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input placeholder="Search templates" className="pl-9" value={search} onChange={(e) => setSearch(e.target.value)} />
      </div>

      {templates.isLoading ? <Card><TableSkeleton cols={3} /></Card>
        : !rows.length ? (
          <Card><EmptyState icon={FileText} title="No templates yet"
            description="Create a template once and reuse it across campaigns."
            action={canEdit(role) && <Button onClick={() => create.mutate()}>Create template</Button>} /></Card>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {rows.map((t) => (
              <Card key={t.id} className="overflow-hidden transition hover:shadow-md">
                <div className="h-40 border-b border-border bg-muted/40">
                  <iframe title={t.name} srcDoc={t.htmlContent || ''} sandbox="" className="pointer-events-none h-[400px] w-[700px] origin-top-left scale-[0.4] bg-white" />
                </div>
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-2">
                    <Link href={`/templates/${t.id}`} className="min-w-0 flex-1">
                      <p className="truncate font-medium hover:text-primary">{t.name}</p>
                      <p className="truncate text-sm text-muted-foreground">{t.subject || 'No subject'}</p>
                    </Link>
                    {canEdit(role) && (
                      <Dropdown>
                        <DropdownTrigger asChild><Button variant="ghost" size="icon"><MoreHorizontal className="h-4 w-4" /></Button></DropdownTrigger>
                        <DropdownContent align="end">
                          <DropdownItem asChild><Link href={`/templates/${t.id}`}>Edit</Link></DropdownItem>
                          <DropdownItem onSelect={() => duplicate.mutate(t.id)}><Copy className="h-4 w-4" /> Duplicate</DropdownItem>
                          <DropdownItem destructive onSelect={() => setDeleteId(t.id)}><Trash2 className="h-4 w-4" /> Delete</DropdownItem>
                        </DropdownContent>
                      </Dropdown>
                    )}
                  </div>
                  <div className="mt-3 flex items-center justify-between">
                    <Badge variant="secondary">{t.category}</Badge>
                    <span className="text-xs text-muted-foreground">{formatDate(t.updatedAt)}</span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

      <ConfirmDialog
        open={!!deleteId} onOpenChange={() => setDeleteId(null)}
        title="Delete this template?" description="Campaigns that already used it keep their own copy of the content."
        destructive confirmLabel="Delete" loading={remove.isPending}
        onConfirm={() => remove.mutate(deleteId!)}
      />
    </div>
  );
}
