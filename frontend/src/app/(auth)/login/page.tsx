'use client';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useState } from 'react';
import { Mail, Lock, Eye, EyeOff, ArrowRight } from 'lucide-react';
import { toast } from '@/components/ui/feedback';
import { useAuth } from '@/store/auth';

const schema = z.object({
  email: z.string().email('Enter a valid email'),
  password: z.string().min(1, 'Password is required'),
});
type Form = z.infer<typeof schema>;

const RED = '#E11D26';


export default function LoginPage() {
  const router = useRouter();
  const login = useAuth((s) => s.login);
  const [loading, setLoading] = useState(false);
  const [show, setShow] = useState(false);
  const { register, handleSubmit, formState: { errors } } = useForm<Form>({ resolver: zodResolver(schema) });

  const onSubmit = async (values: Form) => {
    setLoading(true);
    try {
      await login(values.email, values.password);
      router.push('/dashboard');
    } catch (e: any) {
      toast.error('Could not sign in', e.message);
    } finally {
      setLoading(false);
    }
  };

  const onGoogle = () => {
    // TODO: wire to your Google OAuth endpoint, e.g. window.location.href = `${API_URL}/auth/google`
    toast.error('Google sign-in', 'Not configured yet');
  };

  const inputCls =
    'h-12 w-full rounded-xl border border-neutral-200 bg-white px-4 text-sm text-neutral-900 outline-none transition placeholder:text-neutral-400 focus:border-[#E11D26] focus:ring-4 focus:ring-red-100';

  return (
    <>
      <h1 className="text-3xl font-bold tracking-tight text-neutral-900">Welcome Back 👋</h1>
      <p className="mt-2 text-[15px] leading-relaxed text-neutral-500">
        Sign in to your HoverMail workspace and continue managing your campaigns, templates and more.
      </p>

      <div className="mt-8 rounded-2xl bg-white p-6 shadow-[0_10px_40px_-12px_rgba(0,0,0,0.12)] ring-1 ring-neutral-100">
        <form onSubmit={handleSubmit(onSubmit as any)} className="space-y-5" noValidate>
          <div className="flex gap-3">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-red-50" style={{ color: RED }}>
              <Mail size={18} />
            </div>
            <div className="flex-1">
              <label className="mb-1.5 block text-sm font-semibold text-neutral-800">Email Address</label>
              <input type="email" placeholder="you@company.com" autoComplete="email" className={inputCls} {...register('email')} />
              {errors.email && <p className="mt-1 text-xs text-red-600">{errors.email.message}</p>}
            </div>
          </div>

          <div className="flex gap-3">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-red-50" style={{ color: RED }}>
              <Lock size={18} />
            </div>
            <div className="flex-1">
              <label className="mb-1.5 block text-sm font-semibold text-neutral-800">Password</label>
              <div className="relative">
                <input
                  type={show ? 'text' : 'password'}
                  placeholder="••••••••"
                  autoComplete="current-password"
                  className={`${inputCls} pr-11`}
                  {...register('password')}
                />
                <button
                  type="button"
                  onClick={() => setShow((s) => !s)}
                  aria-label={show ? 'Hide password' : 'Show password'}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-700"
                >
                  {show ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
              {errors.password && <p className="mt-1 text-xs text-red-600">{errors.password.message}</p>}
              <div className="mt-2 flex justify-end">
                <Link href="/forgot-password" className="text-sm font-medium hover:underline" style={{ color: RED }}>
                  Forgot password?
                </Link>
              </div>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#E11D26] to-[#FF2A33] text-[15px] font-semibold text-white shadow-lg shadow-red-500/30 transition hover:brightness-110 disabled:opacity-70"
          >
            {loading ? (
              <span className="h-5 w-5 animate-spin rounded-full border-2 border-white/40 border-t-white" />
            ) : (
              <>Sign in <ArrowRight size={18} /></>
            )}
          </button>

          <div className="flex items-center gap-3 text-xs text-neutral-400">
            <span className="h-px flex-1 bg-neutral-200" /> OR <span className="h-px flex-1 bg-neutral-200" />
          </div>



          <p className="text-sm text-neutral-500">
            New to HoverMail?{' '}
            <Link href="/register" className="inline-flex items-center gap-1 font-semibold hover:underline" style={{ color: RED }}>
              Create an account <ArrowRight size={14} />
            </Link>
          </p>
        </form>
      </div>
    </>
  );
}