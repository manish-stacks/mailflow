'use client';
import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { useAuth } from '@/store/auth';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Field, Input } from '@/components/ui/input';
import { toast } from '@/components/ui/feedback';

export default function AccountSettingsPage() {
  const { user } = useAuth();
  const [form, setForm] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });

  const changePassword = useMutation({
    mutationFn: () => api.post('/auth/change-password', {
      currentPassword: form.currentPassword,
      newPassword: form.newPassword,
    }),
    onSuccess: () => {
      toast.success('Password updated');
      setForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
    },
    onError: (e: any) => toast.error('Could not update password', e.message),
  });

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (form.newPassword.length < 8) return toast.error('Password too short', 'Use at least 8 characters');
    if (form.newPassword !== form.confirmPassword) return toast.error('Passwords do not match');
    changePassword.mutate();
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Change password</CardTitle>
        <CardDescription>{user?.email ? `Signed in as ${user.email}. ` : ''}You'll be signed out of other devices after this.</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={submit} className="max-w-sm space-y-4">
          <Field label="Current password">
            <Input
              type="password"
              autoComplete="current-password"
              value={form.currentPassword}
              onChange={(e) => setForm((f) => ({ ...f, currentPassword: e.target.value }))}
              required
            />
          </Field>
          <Field label="New password">
            <Input
              type="password"
              autoComplete="new-password"
              minLength={8}
              value={form.newPassword}
              onChange={(e) => setForm((f) => ({ ...f, newPassword: e.target.value }))}
              required
            />
          </Field>
          <Field label="Confirm new password">
            <Input
              type="password"
              autoComplete="new-password"
              value={form.confirmPassword}
              onChange={(e) => setForm((f) => ({ ...f, confirmPassword: e.target.value }))}
              required
            />
          </Field>
          <Button type="submit" disabled={changePassword.isPending}>
            {changePassword.isPending ? 'Updating…' : 'Update password'}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
