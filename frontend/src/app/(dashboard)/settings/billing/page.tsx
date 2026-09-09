'use client';
import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Check, CreditCard, Sparkles, X } from 'lucide-react';
import { api } from '@/lib/api';
import { formatDate, formatLimit, formatMoney, formatNumber } from '@/lib/utils';
import { useAuth } from '@/store/auth';
import { payWithRazorpay } from '@/lib/razorpay';
import type { BillingSummary, PaymentConfig, Plan } from '@/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ConfirmDialog, PageLoader, toast } from '@/components/ui/feedback';

function Meter({ label, used, limit, percent }: { label: string; used: number; limit: number; percent: number }) {
  const unlimited = limit === -1;
  const tone = percent >= 90 ? 'bg-destructive' : percent >= 70 ? 'bg-amber-500' : 'bg-primary';
  return (
    <div>
      <div className="mb-1.5 flex items-baseline justify-between text-sm">
        <span className="text-muted-foreground">{label}</span>
        <span className="font-medium">{formatNumber(used)} / {formatLimit(limit)}</span>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-muted">
        <div className={`h-full rounded-full transition-all ${unlimited ? 'bg-emerald-500' : tone}`} style={{ width: `${unlimited ? 8 : Math.max(2, percent)}%` }} />
      </div>
      {percent >= 90 && !unlimited && <p className="mt-1 text-xs text-destructive">Almost at your limit — upgrade to keep going.</p>}
    </div>
  );
}

const FEATURES: { key: keyof Plan; label: string }[] = [
  { key: 'allowCustomSmtp', label: 'Connect your own mail server' },
  { key: 'allowApiAccess', label: 'API access' },
  { key: 'allowAi', label: 'AI writing assistant' },
  { key: 'allowSegments', label: 'Dynamic segments' },
  { key: 'removeBranding', label: 'No MailFlow branding' },
];

export default function BillingPage() {
  const qc = useQueryClient();
  const wsId = useAuth((s) => s.activeWorkspace?.id);
  const isOwner = useAuth((s) => s.activeWorkspace?.role) === 'owner';
  const [cycle, setCycle] = useState<'monthly' | 'yearly'>('monthly');
  const [confirmPlan, setConfirmPlan] = useState<Plan | null>(null);
  const [cancelOpen, setCancelOpen] = useState(false);
  const [paying, setPaying] = useState(false);

  const summary = useQuery({
    queryKey: ['billing-summary', wsId],
    queryFn: () => api.get<BillingSummary>('/billing/summary'),
    enabled: !!wsId,
  });
  const plans = useQuery({ queryKey: ['plans'], queryFn: () => api.get<Plan[]>('/plans') });
  const payments = useQuery({ queryKey: ['payment-config'], queryFn: () => api.get<PaymentConfig>('/payments/config') });

  /** Free plans switch instantly; paid ones must clear a payment first. */
  const switchFree = useMutation({
    mutationFn: (plan: Plan) => api.post('/billing/subscribe', { plan: plan.slug }),
    onSuccess: () => {
      toast.success('Plan updated');
      setConfirmPlan(null);
      qc.invalidateQueries({ queryKey: ['billing-summary'] });
    },
    onError: (e: any) => toast.error('Could not change plan', e.message),
  });

  const startCheckout = async (plan: Plan) => {
    setPaying(true);
    try {
      const session = await api.post<any>('/payments/checkout', { plan: plan.slug, billingCycle: cycle });
      const result = await payWithRazorpay(session);

      if (result.status === 'paid') {
        toast.success('Payment received', `You are on the ${plan.name} plan.`);
        setConfirmPlan(null);
        qc.invalidateQueries({ queryKey: ['billing-summary'] });
        qc.invalidateQueries({ queryKey: ['payments'] });
      } else if (result.status === 'failed') {
        toast.error('Payment not completed', result.message);
        qc.invalidateQueries({ queryKey: ['payments'] });
      }
      // A dismissed checkout is silent — nothing was charged, nothing changed.
    } catch (e: any) {
      toast.error('Could not start checkout', e.message);
    } finally {
      setPaying(false);
    }
  };

  const isPaid = (p?: Plan | null) => !!p && (p.priceMonthly > 0 || p.priceYearly > 0);

  const cancel = useMutation({
    mutationFn: () => api.post('/billing/cancel'),
    onSuccess: () => { toast.success('Subscription cancelled'); setCancelOpen(false); qc.invalidateQueries({ queryKey: ['billing-summary'] }); },
    onError: (e: any) => toast.error('Could not cancel', e.message),
  });

  if (summary.isLoading) return <PageLoader />;
  const s = summary.data;

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="flex-row items-start justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              {s?.plan.name} plan
              <Badge variant={s?.subscription.status === 'active' ? 'success' : s?.subscription.status === 'suspended' ? 'destructive' : 'warning'} className="capitalize">
                {s?.subscription.status}
              </Badge>
            </CardTitle>
            <CardDescription>
              {s?.subscription.billingCycle === 'free'
                ? 'No payment required.'
                : `Billed ${s?.subscription.billingCycle}${s?.subscription.currentPeriodEnd ? ` · renews ${formatDate(s.subscription.currentPeriodEnd)}` : ''}`}
              {s?.subscription.trialEndsAt && ` · trial ends ${formatDate(s.subscription.trialEndsAt)}`}
            </CardDescription>
          </div>
          {isOwner && s?.subscription.billingCycle !== 'free' && s?.subscription.status !== 'cancelled' && (
            <Button variant="outline" size="sm" onClick={() => setCancelOpen(true)}>Cancel plan</Button>
          )}
        </CardHeader>
        <CardContent className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {s?.meters.map((m, i) => <Meter key={i} {...m} />)}
        </CardContent>
      </Card>

      <div>
        <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-lg font-semibold">Plans</h2>
            <p className="text-sm text-muted-foreground">Change any time. Limits apply immediately.</p>
          </div>
          <div className="inline-flex rounded-lg border border-border p-1">
            {(['monthly', 'yearly'] as const).map((c) => (
              <button
                key={c}
                onClick={() => setCycle(c)}
                className={`rounded-md px-3 py-1.5 text-sm font-medium capitalize transition ${cycle === c ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground'}`}
              >
                {c}{c === 'yearly' && <span className="ml-1 text-xs opacity-80">save ~2 months</span>}
              </button>
            ))}
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {plans.data?.map((p) => {
            const current = p.slug === s?.plan.slug;
            const price = cycle === 'yearly' ? p.priceYearly : p.priceMonthly;
            return (
              <Card key={p.id} className={current ? 'border-primary ring-1 ring-primary' : ''}>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    {p.name}
                    {current && <Badge>Current</Badge>}
                  </CardTitle>
                  <CardDescription>{p.description}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <span className="text-3xl font-semibold tracking-tight">{price ? formatMoney(price, p.currency) : 'Free'}</span>
                    {!!price && <span className="text-sm text-muted-foreground">/{cycle === 'yearly' ? 'year' : 'month'}</span>}
                  </div>

                  <ul className="space-y-1.5 text-sm">
                    <li className="flex justify-between"><span className="text-muted-foreground">Contacts</span><span className="font-medium">{formatLimit(p.maxContacts)}</span></li>
                    <li className="flex justify-between"><span className="text-muted-foreground">Emails / month</span><span className="font-medium">{formatLimit(p.maxEmailsPerMonth)}</span></li>
                    <li className="flex justify-between"><span className="text-muted-foreground">Team members</span><span className="font-medium">{formatLimit(p.maxTeamMembers)}</span></li>
                    <li className="flex justify-between"><span className="text-muted-foreground">AI credits / day</span><span className="font-medium">{formatLimit(p.aiCreditsPerDay)}</span></li>
                  </ul>

                  <ul className="space-y-1.5 border-t border-border pt-3 text-sm">
                    {FEATURES.map((f) => (
                      <li key={f.key} className={`flex items-center gap-2 ${p[f.key] ? '' : 'text-muted-foreground'}`}>
                        {p[f.key] ? <Check className="h-4 w-4 text-emerald-600" /> : <X className="h-4 w-4 opacity-50" />}
                        {f.label}
                      </li>
                    ))}
                  </ul>

                  <Button
                    className="w-full"
                    variant={current ? 'outline' : 'default'}
                    disabled={current || !isOwner || (!!price && !payments.data?.enabled)}
                    loading={paying && confirmPlan?.id === p.id}
                    onClick={() => setConfirmPlan(p)}
                  >
                    {!!price && <CreditCard className="h-4 w-4" />}
                    {current ? 'Current plan' : price > (s?.plan.priceMonthly ?? 0) ? 'Upgrade' : 'Switch to this plan'}
                  </Button>
                  {!isOwner && !current && <p className="text-center text-xs text-muted-foreground">Only the workspace owner can change the plan.</p>}
                  {isOwner && !!price && !payments.data?.enabled && (
                    <p className="text-center text-xs text-muted-foreground">Online payments are not configured yet — contact support to activate this plan.</p>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>

      {s?.limits.allowAi && (
        <Card>
          <CardContent className="flex items-center gap-3 p-5 text-sm">
            <Sparkles className="h-4 w-4 text-primary" />
            <span>
              AI usage today: <b>{formatNumber(s.usage.aiCalls)}</b> of {formatLimit(s.limits.aiCreditsPerDay)} credits.
            </span>
          </CardContent>
        </Card>
      )}

      <ConfirmDialog
        open={!!confirmPlan}
        onOpenChange={() => setConfirmPlan(null)}
        title={`Switch to ${confirmPlan?.name}?`}
        description={
          confirmPlan && (confirmPlan.maxContacts !== -1 && (s?.usage.contacts ?? 0) > confirmPlan.maxContacts)
            ? `You currently have ${formatNumber(s?.usage.contacts)} contacts, which is over this plan's limit of ${formatNumber(confirmPlan.maxContacts)}. Existing contacts are kept, but you will not be able to add more until you are under the limit.`
            : isPaid(confirmPlan)
              ? `You will be charged for one ${cycle === 'yearly' ? 'year' : 'month'} and the new limits apply as soon as the payment clears. Renewal is not automatic — we will remind you before the period ends.`
              : 'Your new limits apply straight away.'
        }
        confirmLabel={isPaid(confirmPlan) ? `Pay ${formatMoney(cycle === 'yearly' ? confirmPlan!.priceYearly : confirmPlan!.priceMonthly, confirmPlan!.currency)}` : 'Confirm'}
        loading={switchFree.isPending || paying}
        onConfirm={() => {
          if (!confirmPlan) return;
          if (isPaid(confirmPlan)) startCheckout(confirmPlan);
          else switchFree.mutate(confirmPlan);
        }}
      />

      <ConfirmDialog
        open={cancelOpen}
        onOpenChange={setCancelOpen}
        title="Cancel this subscription?"
        description="You keep access until the end of the current period, then the workspace drops to the free plan limits."
        destructive
        confirmLabel="Cancel plan"
        loading={cancel.isPending}
        onConfirm={() => cancel.mutate()}
      />
    </div>
  );
}
