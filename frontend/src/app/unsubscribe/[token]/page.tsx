'use client';
import { useParams } from 'next/navigation';
import { useState } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { Check, Mail } from 'lucide-react';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { PageLoader } from '@/components/ui/feedback';

export default function UnsubscribePage() {
  const { token } = useParams<{ token: string }>();
  const [done, setDone] = useState<'unsubscribed' | 'resubscribed' | null>(null);

  const info = useQuery({
    queryKey: ['unsubscribe-info', token],
    queryFn: () => api.get<{ email: string; workspaceName: string; campaignName?: string }>(`/unsubscribe/${token}`),
    retry: false,
  });

  const unsubscribe = useMutation({
    mutationFn: () => api.post(`/unsubscribe/${token}`),
    onSuccess: () => setDone('unsubscribed'),
  });

  const resubscribe = useMutation({
    mutationFn: () => api.post(`/unsubscribe/${token}/resubscribe`),
    onSuccess: () => setDone('resubscribed'),
  });

  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/40 px-4">
      <div className="w-full max-w-md rounded-2xl border border-border bg-card p-8 text-center shadow-sm">
        <div className="mx-auto mb-5 flex h-12 w-12 items-center justify-center rounded-xl bg-primary">
          <Mail className="h-6 w-6 text-primary-foreground" />
        </div>

        {info.isLoading ? <PageLoader />
          : info.isError ? (
            <>
              <h1 className="text-xl font-semibold">This link is no longer valid</h1>
              <p className="mt-2 text-sm text-muted-foreground">
                It may have expired or already been used. If you keep receiving unwanted email, reply to the original message and ask to be removed.
              </p>
            </>
          ) : done === 'unsubscribed' ? (
            <>
              <div className="mx-auto mb-3 flex h-10 w-10 items-center justify-center rounded-full bg-emerald-100 dark:bg-emerald-500/15">
                <Check className="h-5 w-5 text-emerald-600" />
              </div>
              <h1 className="text-xl font-semibold">You have been unsubscribed</h1>
              <p className="mt-2 text-sm text-muted-foreground">
                {info.data.email} will no longer receive marketing email from {info.data.workspaceName}.
              </p>
              <Button variant="outline" className="mt-6 w-full" loading={resubscribe.isPending} onClick={() => resubscribe.mutate()}>
                Unsubscribed by mistake? Resubscribe
              </Button>
            </>
          ) : done === 'resubscribed' ? (
            <>
              <h1 className="text-xl font-semibold">You are subscribed again</h1>
              <p className="mt-2 text-sm text-muted-foreground">
                {info.data.email} will keep receiving email from {info.data.workspaceName}.
              </p>
            </>
          ) : (
            <>
              <h1 className="text-xl font-semibold">Unsubscribe</h1>
              <p className="mt-2 text-sm text-muted-foreground">
                Stop sending marketing email to <b>{info.data.email}</b> from {info.data.workspaceName}?
              </p>
              {info.data.campaignName && (
                <p className="mt-1 text-xs text-muted-foreground">You received: {info.data.campaignName}</p>
              )}
              <Button className="mt-6 w-full" loading={unsubscribe.isPending} onClick={() => unsubscribe.mutate()}>
                Confirm unsubscribe
              </Button>
              <p className="mt-4 text-xs text-muted-foreground">
                You can close this page if you would rather keep receiving these emails.
              </p>
            </>
          )}
      </div>
    </div>
  );
}
