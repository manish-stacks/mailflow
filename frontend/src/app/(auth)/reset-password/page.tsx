'use client';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Suspense, useState } from 'react';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Field, Input } from '@/components/ui/input';
import { toast } from '@/components/ui/feedback';

function ResetForm() {
  const params = useSearchParams();
  const router = useRouter();
  const token = params.get('token') || '';
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password.length < 8) return toast.error('Password too short', 'Use at least 8 characters.');
    setLoading(true);
    try {
      await api.post('/auth/reset-password', { token, password });
      toast.success('Password updated', 'You can sign in now.');
      router.push('/login');
    } catch (err: any) {
      toast.error('Could not reset password', err.message);
    } finally {
      setLoading(false);
    }
  };

  if (!token) {
    return (
      <>
        <h1 className="text-2xl font-semibold">Invalid link</h1>
        <p className="mt-2 text-sm text-muted-foreground">This reset link is missing its token.</p>
        <Button asChild variant="outline" className="mt-6 w-full"><Link href="/forgot-password">Request a new link</Link></Button>
      </>
    );
  }

  return (
    <>
      <h1 className="text-2xl font-semibold tracking-tight">Set a new password</h1>
      <form onSubmit={submit} className="mt-8 space-y-4">
        <Field label="New password" hint="At least 8 characters.">
          <Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" />
        </Field>
        <Button type="submit" className="w-full" loading={loading}>Update password</Button>
      </form>
    </>
  );
}

export default function ResetPasswordPage() {
  return <Suspense fallback={null}><ResetForm /></Suspense>;
}
