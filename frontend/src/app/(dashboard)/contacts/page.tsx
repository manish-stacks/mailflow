'use client';
import Link from 'next/link';
import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { MoreHorizontal, Plus, Search, Trash2, UserMinus, Users } from 'lucide-react';
import { api } from '@/lib/api';
import { formatDate } from '@/lib/utils';
import { canEdit, useAuth } from '@/store/auth';
import type { Contact, ContactList } from '@/types';
import { PageHeader } from '@/components/layout/page-header';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { StatusBadge } from '@/components/ui/badge';
import { Field, Input } from '@/components/ui/input';
import { Table, TBody, TD, TH, THead, TR } from '@/components/ui/table';
import {
  Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, Dropdown, DropdownContent,
  DropdownItem, DropdownTrigger, Select,
} from '@/components/ui/primitives';
import { ConfirmDialog, EmptyState, ErrorState, Pagination, TableSkeleton, toast } from '@/components/ui/feedback';

export default function ContactsPage() {
  const qc = useQueryClient();
  const role = useAuth((s) => s.activeWorkspace?.role);
  const wsId = useAuth((s) => s.activeWorkspace?.id);

  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [listId, setListId] = useState('');
  const [selected, setSelected] = useState<string[]>([]);
  const [createOpen, setCreateOpen] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [form, setForm] = useState({ email: '', firstName: '', lastName: '', phone: '' });

  const contacts = useQuery({
    queryKey: ['contacts', wsId, page, search, status, listId],
    queryFn: () => api.list<Contact>('/contacts', { page, limit: 20, search, status, listId }),
    enabled: !!wsId,
  });

  const lists = useQuery({ queryKey: ['lists', wsId], queryFn: () => api.get<ContactList[]>('/lists'), enabled: !!wsId });

  const create = useMutation({
    mutationFn: () => api.post('/contacts', form),
    onSuccess: () => {
      toast.success('Contact added');
      setCreateOpen(false);
      setForm({ email: '', firstName: '', lastName: '', phone: '' });
      qc.invalidateQueries({ queryKey: ['contacts'] });
    },
    onError: (e: any) => toast.error('Could not add contact', e.message),
  });

  const bulk = useMutation({
    mutationFn: (payload: any) => api.post('/contacts/bulk', payload),
    onSuccess: () => {
      toast.success('Contacts updated');
      setSelected([]);
      setConfirmDelete(false);
      qc.invalidateQueries({ queryKey: ['contacts'] });
    },
    onError: (e: any) => toast.error('Bulk action failed', e.message),
  });

  const rows = contacts.data?.data ?? [];
  const allSelected = rows.length > 0 && selected.length === rows.length;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Contacts"
        description="Everyone who can receive your campaigns, and everyone who opted out."
        actions={canEdit(role) && (
          <>
            <Button asChild variant="outline"><Link href="/contacts/import">Import CSV</Link></Button>
            <Button onClick={() => setCreateOpen(true)}><Plus className="h-4 w-4" /> Add Contact</Button>
          </>
        )}
      />

      <Card>
        <div className="flex flex-col gap-3 border-b border-border p-4 sm:flex-row sm:items-center">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search by email or name"
              className="pl-9"
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            />
          </div>
          <Select value={status} onChange={(e) => { setStatus(e.target.value); setPage(1); }} className="sm:w-44">
            <option value="">All statuses</option>
            <option value="active">Active</option>
            <option value="unsubscribed">Unsubscribed</option>
            <option value="bounced">Bounced</option>
            <option value="complained">Complained</option>
            <option value="suppressed">Suppressed</option>
          </Select>
          <Select value={listId} onChange={(e) => { setListId(e.target.value); setPage(1); }} className="sm:w-48">
            <option value="">All lists</option>
            {lists.data?.map((l) => <option key={l.id} value={l.id}>{l.name}</option>)}
          </Select>
        </div>

        {selected.length > 0 && (
          <div className="flex flex-wrap items-center gap-2 border-b border-border bg-accent/50 px-4 py-2.5">
            <span className="text-sm font-medium">{selected.length} selected</span>
            <div className="ml-auto flex gap-2">
              <Select
                className="h-8 w-44 text-xs"
                defaultValue=""
                onChange={(e) => e.target.value && bulk.mutate({ contactIds: selected, action: 'add_to_list', listId: e.target.value })}
              >
                <option value="">Add to list…</option>
                {lists.data?.map((l) => <option key={l.id} value={l.id}>{l.name}</option>)}
              </Select>
              <Button size="sm" variant="outline" onClick={() => bulk.mutate({ contactIds: selected, action: 'unsubscribe' })}>
                <UserMinus className="h-3.5 w-3.5" /> Unsubscribe
              </Button>
              <Button size="sm" variant="destructive" onClick={() => setConfirmDelete(true)}>
                <Trash2 className="h-3.5 w-3.5" /> Delete
              </Button>
            </div>
          </div>
        )}

        {contacts.isLoading ? <TableSkeleton />
          : contacts.isError ? <ErrorState message={(contacts.error as any)?.message} onRetry={() => contacts.refetch()} />
          : !rows.length ? (
            <EmptyState
              icon={Users}
              title={search || status ? 'No contacts match those filters' : 'No contacts yet'}
              description={search || status ? 'Try a different search or clear the filters.' : 'Import a CSV or add your first contact to get started.'}
              action={canEdit(role) && <Button asChild><Link href="/contacts/import">Import contacts</Link></Button>}
            />
          ) : (
            <>
              <Table>
                <THead>
                  <TR>
                    <TH className="w-10">
                      <input
                        type="checkbox"
                        className="h-4 w-4 rounded border-border"
                        checked={allSelected}
                        onChange={(e) => setSelected(e.target.checked ? rows.map((r) => r.id) : [])}
                      />
                    </TH>
                    <TH>Contact</TH>
                    <TH>Status</TH>
                    <TH className="hidden md:table-cell">Phone</TH>
                    <TH className="hidden lg:table-cell">Added</TH>
                    <TH className="w-10" />
                  </TR>
                </THead>
                <TBody>
                  {rows.map((c) => (
                    <TR key={c.id}>
                      <TD>
                        <input
                          type="checkbox"
                          className="h-4 w-4 rounded border-border"
                          checked={selected.includes(c.id)}
                          onChange={(e) => setSelected(e.target.checked ? [...selected, c.id] : selected.filter((id) => id !== c.id))}
                        />
                      </TD>
                      <TD>
                        <Link href={`/contacts/${c.id}`} className="block">
                          <p className="font-medium hover:text-primary">{[c.firstName, c.lastName].filter(Boolean).join(' ') || '—'}</p>
                          <p className="text-sm text-muted-foreground">{c.email}</p>
                        </Link>
                      </TD>
                      <TD><StatusBadge status={c.status} /></TD>
                      <TD className="hidden text-sm text-muted-foreground md:table-cell">{c.phone || '—'}</TD>
                      <TD className="hidden text-sm text-muted-foreground lg:table-cell">{formatDate(c.createdAt)}</TD>
                      <TD>
                        <Dropdown>
                          <DropdownTrigger asChild>
                            <Button variant="ghost" size="icon"><MoreHorizontal className="h-4 w-4" /></Button>
                          </DropdownTrigger>
                          <DropdownContent align="end">
                            <DropdownItem asChild><Link href={`/contacts/${c.id}`}>View details</Link></DropdownItem>
                            {canEdit(role) && (
                              <>
                                <DropdownItem onSelect={() => bulk.mutate({ contactIds: [c.id], action: 'unsubscribe' })}>Unsubscribe</DropdownItem>
                                <DropdownItem destructive onSelect={() => bulk.mutate({ contactIds: [c.id], action: 'delete' })}>Delete</DropdownItem>
                              </>
                            )}
                          </DropdownContent>
                        </Dropdown>
                      </TD>
                    </TR>
                  ))}
                </TBody>
              </Table>
              <Pagination
                page={contacts.data.meta.page}
                totalPages={contacts.data.meta.totalPages}
                total={contacts.data.meta.total}
                onChange={setPage}
              />
            </>
          )}
      </Card>

      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle className="text-lg font-semibold">Add contact</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <Field label="Email">
              <Input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="person@company.com" />
            </Field>
            <div className="grid grid-cols-2 gap-3">
              <Field label="First name"><Input value={form.firstName} onChange={(e) => setForm({ ...form, firstName: e.target.value })} /></Field>
              <Field label="Last name"><Input value={form.lastName} onChange={(e) => setForm({ ...form, lastName: e.target.value })} /></Field>
            </div>
            <Field label="Phone"><Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} /></Field>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateOpen(false)}>Cancel</Button>
            <Button loading={create.isPending} onClick={() => create.mutate()}>Add contact</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={confirmDelete}
        onOpenChange={setConfirmDelete}
        title={`Delete ${selected.length} contacts?`}
        description="This permanently removes them and their activity history. It cannot be undone."
        confirmLabel="Delete"
        destructive
        loading={bulk.isPending}
        onConfirm={() => bulk.mutate({ contactIds: selected, action: 'delete' })}
      />
    </div>
  );
}
