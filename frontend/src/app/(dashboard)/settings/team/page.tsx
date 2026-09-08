'use client';
import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Copy, KeyRound, UserPlus } from 'lucide-react';
import { api } from '@/lib/api';
import { formatDate, initials } from '@/lib/utils';
import { canAdmin, useAuth } from '@/store/auth';
import type { WorkspaceMember } from '@/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Field, Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, Select } from '@/components/ui/primitives';
import { Table, TBody, TD, TH, THead, TR } from '@/components/ui/table';
import { ConfirmDialog, TableSkeleton, toast } from '@/components/ui/feedback';

const ROLE_HELP: Record<string, string> = {
  owner: 'Full control including billing and deletion',
  admin: 'Manage team, settings and all content',
  editor: 'Create and send campaigns',
  viewer: 'Read-only access to reports',
};

export default function TeamPage() {
  const qc = useQueryClient();
  const { user, activeWorkspace } = useAuth();
  const editable = canAdmin(activeWorkspace?.role);

  const [inviteOpen, setInviteOpen] = useState(false);
  const [mode, setMode] = useState<'invite' | 'create'>('create');
  const [invite, setInvite] = useState({ email: '', role: 'editor' });
  const [newLogin, setNewLogin] = useState({ email: '', firstName: '', lastName: '', password: '', role: 'editor', sendCredentials: true });
  const [credentials, setCredentials] = useState<{ email: string; temporaryPassword: string | null } | null>(null);
  const [removeId, setRemoveId] = useState<string | null>(null);

  const members = useQuery({
    queryKey: ['members', activeWorkspace?.id],
    queryFn: () => api.get<WorkspaceMember[]>('/workspaces/members'),
    enabled: !!activeWorkspace?.id,
  });

  const send = useMutation({
    mutationFn: () => api.post('/workspaces/members', invite),
    onSuccess: () => {
      toast.success('Invitation sent', invite.email);
      setInviteOpen(false); setInvite({ email: '', role: 'editor' });
      qc.invalidateQueries({ queryKey: ['members'] });
    },
    onError: (e: any) => toast.error('Could not invite', e.message),
  });

  /** Creates the account outright — for handing credentials to a client directly. */
  const createLogin = useMutation({
    mutationFn: () => api.post<any>('/workspaces/members/create-login', {
      email: newLogin.email,
      firstName: newLogin.firstName,
      lastName: newLogin.lastName || undefined,
      password: newLogin.password || undefined,
      role: newLogin.role,
      sendCredentials: newLogin.sendCredentials,
    }),
    onSuccess: (res) => {
      setInviteOpen(false);
      setCredentials({ email: res.email, temporaryPassword: res.temporaryPassword });
      setNewLogin({ email: '', firstName: '', lastName: '', password: '', role: 'editor', sendCredentials: true });
      qc.invalidateQueries({ queryKey: ['members'] });
    },
    onError: (e: any) => toast.error('Could not create the login', e.message),
  });

  const resetPassword = useMutation({
    mutationFn: (id: string) => api.post<any>(`/workspaces/members/${id}/reset-password`),
    onSuccess: (res) => setCredentials({ email: res.email, temporaryPassword: res.temporaryPassword }),
    onError: (e: any) => toast.error('Could not reset the password', e.message),
  });

  const changeRole = useMutation({
    mutationFn: ({ id, role }: { id: string; role: string }) => api.patch(`/workspaces/members/${id}`, { role }),
    onSuccess: () => { toast.success('Role updated'); qc.invalidateQueries({ queryKey: ['members'] }); },
    onError: (e: any) => toast.error('Could not update role', e.message),
  });

  const remove = useMutation({
    mutationFn: (id: string) => api.delete(`/workspaces/members/${id}`),
    onSuccess: () => { toast.success('Member removed'); setRemoveId(null); qc.invalidateQueries({ queryKey: ['members'] }); },
  });

  return (
    <>
      <Card>
        <CardHeader className="flex-row items-center justify-between">
          <div>
            <CardTitle>Team members</CardTitle>
            <CardDescription>Everyone with access to {activeWorkspace?.name}.</CardDescription>
          </div>
          {editable && <Button onClick={() => setInviteOpen(true)}><UserPlus className="h-4 w-4" /> Add member</Button>}
        </CardHeader>
        <CardContent className="p-0">
          {members.isLoading ? <TableSkeleton cols={4} /> : (
            <Table>
              <THead><TR><TH>Member</TH><TH>Role</TH><TH className="hidden md:table-cell">Joined</TH><TH className="w-24" /></TR></THead>
              <TBody>
                {members.data?.map((m) => (
                  <TR key={m.id}>
                    <TD>
                      <div className="flex items-center gap-3">
                        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-accent text-xs font-semibold text-accent-foreground">
                          {initials(m.user?.firstName, m.user?.lastName)}
                        </div>
                        <div className="min-w-0">
                          <p className="truncate font-medium">
                            {m.user?.firstName} {m.user?.lastName}
                            {m.user?.id === user?.id && <span className="ml-1.5 text-xs text-muted-foreground">(you)</span>}
                          </p>
                          <p className="truncate text-sm text-muted-foreground">{m.user?.email ?? m.invitedEmail}</p>
                        </div>
                      </div>
                    </TD>
                    <TD>
                      {editable && m.role !== 'owner' && m.user?.id !== user?.id ? (
                        <Select className="h-8 w-32" value={m.role} onChange={(e) => changeRole.mutate({ id: m.id, role: e.target.value })}>
                          {['admin', 'editor', 'viewer'].map((r) => <option key={r} value={r} className="capitalize">{r}</option>)}
                        </Select>
                      ) : <Badge variant={m.role === 'owner' ? 'default' : 'secondary'} className="capitalize">{m.role}</Badge>}
                    </TD>
                    <TD className="hidden text-sm text-muted-foreground md:table-cell">
                      {m.status === 'invited' ? <Badge variant="warning">Invite pending</Badge> : formatDate(m.createdAt)}
                    </TD>
                    <TD>
                      {editable && m.role !== 'owner' && m.user?.id !== user?.id && (
                        <div className="flex justify-end gap-1">
                          <Button variant="ghost" size="icon" title="Reset password" onClick={() => resetPassword.mutate(m.id)}>
                            <KeyRound className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="sm" onClick={() => setRemoveId(m.id)}>Remove</Button>
                        </div>
                      )}
                    </TD>
                  </TR>
                ))}
              </TBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Dialog open={inviteOpen} onOpenChange={setInviteOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle className="text-lg font-semibold">Add a team member</DialogTitle></DialogHeader>

          <div className="mb-4 inline-flex rounded-lg border border-border p-1">
            {([['create', 'Create login'], ['invite', 'Send invite']] as const).map(([value, label]) => (
              <button
                key={value}
                onClick={() => setMode(value)}
                className={`rounded-md px-3 py-1.5 text-sm font-medium transition ${mode === value ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground'}`}
              >
                {label}
              </button>
            ))}
          </div>

          {mode === 'create' ? (
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Creates the account immediately and gives you the password to hand over. They will be
                asked to change it after signing in.
              </p>
              <div className="grid grid-cols-2 gap-3">
                <Field label="First name">
                  <Input value={newLogin.firstName} onChange={(e) => setNewLogin({ ...newLogin, firstName: e.target.value })} placeholder="Priya" />
                </Field>
                <Field label="Last name">
                  <Input value={newLogin.lastName} onChange={(e) => setNewLogin({ ...newLogin, lastName: e.target.value })} />
                </Field>
              </div>
              <Field label="Email">
                <Input type="email" value={newLogin.email} onChange={(e) => setNewLogin({ ...newLogin, email: e.target.value })} placeholder="priya@client.com" />
              </Field>
              <Field label="Password" hint="Leave blank and we will generate one.">
                <Input type="text" value={newLogin.password} onChange={(e) => setNewLogin({ ...newLogin, password: e.target.value })} placeholder="Auto-generated" />
              </Field>
              <Field label="Role" hint={ROLE_HELP[newLogin.role]}>
                <Select value={newLogin.role} onChange={(e) => setNewLogin({ ...newLogin, role: e.target.value })}>
                  {['admin', 'editor', 'viewer'].map((r) => <option key={r} value={r} className="capitalize">{r}</option>)}
                </Select>
              </Field>
              <label className="flex cursor-pointer items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  className="h-4 w-4 rounded border-border"
                  checked={newLogin.sendCredentials}
                  onChange={(e) => setNewLogin({ ...newLogin, sendCredentials: e.target.checked })}
                />
                Email the credentials to them
              </label>
              <DialogFooter>
                <Button variant="outline" onClick={() => setInviteOpen(false)}>Cancel</Button>
                <Button disabled={!newLogin.email || !newLogin.firstName} loading={createLogin.isPending} onClick={() => createLogin.mutate()}>
                  Create login
                </Button>
              </DialogFooter>
            </div>
          ) : (
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Sends an invitation link. They set their own password when they accept.
              </p>
              <Field label="Email address">
                <Input type="email" value={invite.email} onChange={(e) => setInvite({ ...invite, email: e.target.value })} placeholder="colleague@company.com" />
              </Field>
              <Field label="Role" hint={ROLE_HELP[invite.role]}>
                <Select value={invite.role} onChange={(e) => setInvite({ ...invite, role: e.target.value })}>
                  {['admin', 'editor', 'viewer'].map((r) => <option key={r} value={r} className="capitalize">{r}</option>)}
                </Select>
              </Field>
              <DialogFooter>
                <Button variant="outline" onClick={() => setInviteOpen(false)}>Cancel</Button>
                <Button disabled={!invite.email} loading={send.isPending} onClick={() => send.mutate()}>Send invite</Button>
              </DialogFooter>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={!!credentials} onOpenChange={() => setCredentials(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle className="text-lg font-semibold">Login details</DialogTitle></DialogHeader>
          <p className="text-sm text-muted-foreground">
            {credentials?.temporaryPassword
              ? 'This password is shown once. Copy it now if you are handing it over yourself.'
              : 'This person already had a MailFlow account, so their existing password still applies.'}
          </p>
          <div className="mt-3 space-y-2 rounded-lg border border-border bg-muted/40 p-3 text-sm">
            <div className="flex justify-between gap-4"><span className="text-muted-foreground">Email</span><span className="font-medium">{credentials?.email}</span></div>
            {credentials?.temporaryPassword && (
              <div className="flex items-center justify-between gap-4">
                <span className="text-muted-foreground">Password</span>
                <span className="flex items-center gap-2">
                  <code className="font-mono">{credentials.temporaryPassword}</code>
                  <Button size="icon" variant="ghost" onClick={() => { navigator.clipboard.writeText(credentials.temporaryPassword!); toast.success('Copied'); }}>
                    <Copy className="h-3.5 w-3.5" />
                  </Button>
                </span>
              </div>
            )}
          </div>
          <DialogFooter><Button onClick={() => setCredentials(null)}>Done</Button></DialogFooter>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={!!removeId} onOpenChange={() => setRemoveId(null)}
        title="Remove this member?" description="They immediately lose access to this workspace."
        destructive confirmLabel="Remove" loading={remove.isPending}
        onConfirm={() => remove.mutate(removeId!)}
      />
    </>
  );
}
