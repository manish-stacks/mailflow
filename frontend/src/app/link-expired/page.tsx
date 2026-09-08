import { LinkIcon } from 'lucide-react';

export default function LinkExpiredPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/40 px-4">
      <div className="w-full max-w-md rounded-2xl border border-border bg-card p-8 text-center shadow-sm">
        <div className="mx-auto mb-5 flex h-12 w-12 items-center justify-center rounded-xl bg-accent">
          <LinkIcon className="h-6 w-6 text-accent-foreground" />
        </div>
        <h1 className="text-xl font-semibold">This link is no longer available</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          The tracked link has expired or the campaign it belonged to was removed. Try opening the original email again.
        </p>
      </div>
    </div>
  );
}
