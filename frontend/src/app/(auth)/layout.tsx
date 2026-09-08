import { Mail } from 'lucide-react';

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      <div className="flex flex-col justify-center px-6 py-12 sm:px-12">
        <div className="mx-auto w-full max-w-sm">
          <div className="mb-8 flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary">
              <Mail className="h-5 w-5 text-primary-foreground" />
            </div>
            <span className="text-xl font-semibold tracking-tight">MailFlow</span>
          </div>
          {children}
        </div>
      </div>

      <div className="relative hidden overflow-hidden bg-primary lg:block">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(255,255,255,0.18),transparent_45%),radial-gradient(circle_at_80%_70%,rgba(255,255,255,0.12),transparent_40%)]" />
        <div className="relative flex h-full flex-col justify-end p-12 text-primary-foreground">
          <blockquote className="max-w-md text-2xl font-medium leading-snug">
            Every campaign, every contact, every open — in one place built for teams that actually send.
          </blockquote>
          <div className="mt-8 grid max-w-md grid-cols-3 gap-6 border-t border-white/20 pt-8 text-sm">
            <div><p className="text-2xl font-semibold">Queued</p><p className="opacity-75">sending at scale</p></div>
            <div><p className="text-2xl font-semibold">AI</p><p className="opacity-75">content assistant</p></div>
            <div><p className="text-2xl font-semibold">Multi</p><p className="opacity-75">workspace ready</p></div>
          </div>
        </div>
      </div>
    </div>
  );
}
