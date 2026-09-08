'use client';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Plus } from 'lucide-react';
import { api } from '@/lib/api';
import { canAdmin, useAuth } from '@/store/auth';
import type { Workspace } from '@/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Field, Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, Select } from '@/components/ui/primitives';
import { ConfirmDialog, toast } from '@/components/ui/feedback';

const TIMEZONES = ['Asia/Kolkata', 'UTC', 'America/New_York', 'America/Los_Angeles', 'Europe/London', 'Europe/Berlin', 'Asia/Singapore', 'Australia/Sydney'];

export default function WorkspaceSettingsPage() {
  const qc = useQueryClient();
  const router = useRouter();
  const { activeWorkspace, addWorkspace } = useAuth();
  const role = activeWorkspace?.role;

  const [form, setForm] = useState({ name: '', timezone: 'Asia/Kolkata' });
  const [newOpen, setNewOpen] = useState(false);
  const [newName, setNewName] = useState('');
  const [deleteOpen, setDeleteOpen] = useState(false);

  const workspace = useQuery({
    queryKey: ['workspace', activeWorkspace?.id],
    queryFn: () => api.get<Workspace>('/workspaces/current'),
    enabled: !!activeWorkspace?.id,
  });

  useEffect(() => {
    if (workspace.data) {
      const w = workspace.data;
      setForm({ name: w.name, timezone: w.timezone || 'Asia/Kolkata' });
    }
  }, [workspace.data]);

  const save = useMutation({
    mutationFn: () => api.patch('/workspaces/current', form),
    onSuccess: () => { toast.success('Workspace updated'); qc.invalidateQueries({ queryKey: ['workspace'] }); },
    onError: (e: any) => toast.error('Save failed', e.message),
  });

  const create = useMutation({
    mutationFn: () => api.post<Workspace>('/workspaces', { name: newName }),
    onSuccess: (w) => { addWorkspace(w); setNewOpen(false); setNewName(''); toast.success('Workspace created'); },
    onError: (e: any) => toast.error('Could not create workspace', e.message),
  });

  const remove = useMutation({
    mutationFn: () => api.delete('/workspaces/current'),
    onSuccess: () => { toast.success('Workspace deleted'); router.push('/dashboard'); location.reload(); },
    onError: (e: any) => toast.error('Delete failed', e.message),
  });

  const editable = canAdmin(role);

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle>Workspace details</CardTitle>
          <CardDescription>Used across campaigns, scheduling and reporting.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Field label="Workspace name">
            <Input value={form.name} disabled={!editable} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          </Field>
          <Field label="Timezone" hint="Scheduled sends use this timezone.">
            <Select value={form.timezone} disabled={!editable} onChange={(e) => setForm({ ...form, timezone: e.target.value })}>
              {TIMEZONES.map((tz) => <option key={tz} value={tz}>{tz}</option>)}
            </Select>
          </Field>
          <p className="rounded-lg bg-muted/50 px-3 py-2 text-sm text-muted-foreground">
            From-addresses live under <b>Senders</b> — each one is verified separately before it can be used.
          </p>
          {editable && <Button loading={save.isPending} onClick={() => save.mutate()}>Save changes</Button>}
        </CardContent>
      </Card>

      <div className="space-y-4">
        <Card>
          <CardHeader>
            <CardTitle>Workspaces</CardTitle>
            <CardDescription>Keep separate clients or brands fully isolated from each other.</CardDescription>
          </CardHeader>
          <CardContent>
            <Button variant="outline" onClick={() => setNewOpen(true)}><Plus className="h-4 w-4" /> Create workspace</Button>
          </CardContent>
        </Card>

        {role === 'owner' && (
          <Card className="border-destructive/40">
            <CardHeader>
              <CardTitle className="text-destructive">Danger zone</CardTitle>
              <CardDescription>Deleting a workspace removes its contacts, campaigns and reporting permanently.</CardDescription>
            </CardHeader>
            <CardContent>
              <Button variant="destructive" onClick={() => setDeleteOpen(true)}>Delete this workspace</Button>
            </CardContent>
          </Card>
        )}
      </div>

      <Dialog open={newOpen} onOpenChange={setNewOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle className="text-lg font-semibold">Create workspace</DialogTitle></DialogHeader>
          <Field label="Workspace name"><Input value={newName} onChange={(e) => setNewName(e.target.value)} placeholder="Client name" /></Field>
          <DialogFooter>
            <Button variant="outline" onClick={() => setNewOpen(false)}>Cancel</Button>
            <Button disabled={!newName} loading={create.isPending} onClick={() => create.mutate()}>Create</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={deleteOpen} onOpenChange={setDeleteOpen}
        title={`Delete ${activeWorkspace?.name}?`}
        description="Every contact, campaign and report in this workspace is erased. This cannot be undone."
        destructive confirmLabel="Delete workspace" loading={remove.isPending}
        onConfirm={() => remove.mutate()}
      />
    </div>
  );
}
