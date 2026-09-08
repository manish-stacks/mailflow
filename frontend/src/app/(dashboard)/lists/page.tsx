'use client';
import Link from 'next/link';
import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ListChecks, MoreHorizontal, Plus } from 'lucide-react';
import { api } from '@/lib/api';
import { formatDate, formatNumber } from '@/lib/utils';
import { canEdit, useAuth } from '@/store/auth';
import type { ContactList } from '@/types';
import { PageHeader } from '@/components/layout/page-header';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Field, Input, Textarea } from '@/components/ui/input';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, Dropdown, DropdownContent, DropdownItem, DropdownTrigger } from '@/components/ui/primitives';
import { ConfirmDialog, EmptyState, TableSkeleton, toast } from '@/components/ui/feedback';

export default function ListsPage() {
  const qc = useQueryClient();
  const wsId = useAuth((s) => s.activeWorkspace?.id);
  const role = useAuth((s) => s.activeWorkspace?.role);

  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<ContactList | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [form, setForm] = useState({ name: '', description: '' });

  const lists = useQuery({ queryKey: ['lists', wsId], queryFn: () => api.get<ContactList[]>('/lists'), enabled: !!wsId });

  const save = useMutation({
    mutationFn: () => (editing ? api.patch(`/lists/${editing.id}`, form) : api.post('/lists', form)),
    onSuccess: () => {
      toast.success(editing ? 'List updated' : 'List created');
      setOpen(false); setEditing(null); setForm({ name: '', description: '' });
      qc.invalidateQueries({ queryKey: ['lists'] });
    },
    onError: (e: any) => toast.error('Could not save list', e.message),
  });

  const remove = useMutation({
    mutationFn: (id: string) => api.delete(`/lists/${id}`),
    onSuccess: () => { toast.success('List deleted'); setDeleteId(null); qc.invalidateQueries({ queryKey: ['lists'] }); },
  });

  return (
    <div className="space-y-6">
      <PageHeader
        title="Lists"
        description="Static groups of contacts you can target directly in a campaign."
        actions={canEdit(role) && <Button onClick={() => { setEditing(null); setForm({ name: '', description: '' }); setOpen(true); }}><Plus className="h-4 w-4" /> New List</Button>}
      />

      {lists.isLoading ? <Card><TableSkeleton cols={3} /></Card>
        : !lists.data?.length ? (
          <Card><EmptyState icon={ListChecks} title="No lists yet" description="Create a list to group contacts for a specific campaign or audience."
            action={canEdit(role) && <Button onClick={() => setOpen(true)}>Create list</Button>} /></Card>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {lists.data.map((l) => (
              <Card key={l.id} className="transition hover:shadow-md">
                <CardContent className="p-5">
                  <div className="flex items-start justify-between gap-2">
                    <Link href={`/contacts?listId=${l.id}`} className="min-w-0 flex-1">
                      <p className="truncate font-medium hover:text-primary">{l.name}</p>
                      <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">{l.description || 'No description'}</p>
                    </Link>
                    {canEdit(role) && (
                      <Dropdown>
                        <DropdownTrigger asChild><Button variant="ghost" size="icon"><MoreHorizontal className="h-4 w-4" /></Button></DropdownTrigger>
                        <DropdownContent align="end">
                          <DropdownItem onSelect={() => { setEditing(l); setForm({ name: l.name, description: l.description || '' }); setOpen(true); }}>Rename</DropdownItem>
                          <DropdownItem asChild><Link href={`/contacts?listId=${l.id}`}>View members</Link></DropdownItem>
                          <DropdownItem destructive onSelect={() => setDeleteId(l.id)}>Delete</DropdownItem>
                        </DropdownContent>
                      </Dropdown>
                    )}
                  </div>
                  <div className="mt-4 flex items-center justify-between text-sm">
                    <span className="font-medium">{formatNumber(l.contactCount)} contacts</span>
                    <span className="text-muted-foreground">{formatDate(l.createdAt)}</span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle className="text-lg font-semibold">{editing ? 'Rename list' : 'New list'}</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <Field label="Name"><Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Newsletter subscribers" /></Field>
            <Field label="Description"><Textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="Who is in this list?" /></Field>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
            <Button loading={save.isPending} onClick={() => save.mutate()}>{editing ? 'Save' : 'Create list'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={!!deleteId} onOpenChange={() => setDeleteId(null)}
        title="Delete this list?" description="Contacts stay in your workspace — only the grouping is removed."
        destructive confirmLabel="Delete" loading={remove.isPending}
        onConfirm={() => remove.mutate(deleteId!)}
      />
    </div>
  );
}
