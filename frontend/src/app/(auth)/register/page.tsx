'use client';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Field, Input } from '@/components/ui/input';
import { toast } from '@/components/ui/feedback';
import { useAuth } from '@/store/auth';

const schema = z.object({
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().optional(),
  email: z.string().email('Enter a valid email'),
  password: z.string().min(8, 'Use at least 8 characters'),
  workspaceName: z.string().optional(),
});
type Form = z.output<typeof schema>;

export default function RegisterPage() {
  const router = useRouter();
  const registerUser = useAuth((s) => s.register);
  const [loading, setLoading] = useState(false);
  const { register, handleSubmit, formState: { errors } } = useForm<Form>({
    resolver: zodResolver(schema),
    defaultValues: { firstName: '', lastName: '', email: '', password: '', workspaceName: '' },
  });

  const onSubmit = async (values: Form) => {
    setLoading(true);
    try {
      await registerUser({ ...values, email: values.email, password: values.password, firstName: values.firstName });
      toast.success('Account created', 'Your first workspace is ready.');
      router.push('/dashboard');
    } catch (e: any) {
      toast.error('Could not create account', e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <h1 className="text-2xl font-semibold tracking-tight">Create your account</h1>
      <p className="mt-1 text-sm text-muted-foreground">Start sending in a few minutes.</p>

      <form onSubmit={handleSubmit(onSubmit as any)} className="mt-8 space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <Field label="First name" error={errors.firstName?.message}>
            <Input placeholder="First name" {...register('firstName')} />
          </Field>
          <Field label="Last name">
            <Input placeholder="Last name" {...register('lastName')} />
          </Field>
        </div>
        <Field label="Work email" error={errors.email?.message}>
          <Input type="email" placeholder="you@company.com" {...register('email')} />
        </Field>
        <Field label="Password" error={errors.password?.message} hint="At least 8 characters.">
          <Input type="password" placeholder="••••••••" {...register('password')} />
        </Field>
        <Field label="Workspace name" hint="You can rename this later.">
          <Input placeholder="Workspace name" {...register('workspaceName')} />
        </Field>
        <Button type="submit" className="w-full" loading={loading}>Create account</Button>
      </form>

      <p className="mt-6 text-sm text-muted-foreground">
        Already have an account? <Link href="/login" className="font-medium text-primary hover:underline">Sign in</Link>
      </p>
    </>
  );
}
