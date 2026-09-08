import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const badgeVariants = cva(
  'inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium transition-colors',
  {
    variants: {
      variant: {
        default: 'border-transparent bg-primary/10 text-primary',
        secondary: 'border-transparent bg-secondary text-secondary-foreground',
        success: 'border-transparent bg-emerald-50 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-400',
        warning: 'border-transparent bg-amber-50 text-amber-700 dark:bg-amber-500/15 dark:text-amber-400',
        destructive: 'border-transparent bg-red-50 text-red-700 dark:bg-red-500/15 dark:text-red-400',
        outline: 'text-foreground',
      },
    },
    defaultVariants: { variant: 'default' },
  },
);

export interface BadgeProps extends React.HTMLAttributes<HTMLDivElement>, VariantProps<typeof badgeVariants> {}

export const Badge = ({ className, variant, ...props }: BadgeProps) => (
  <div className={cn(badgeVariants({ variant }), className)} {...props} />
);

const STATUS_VARIANT: Record<string, BadgeProps['variant']> = {
  draft: 'secondary', scheduled: 'warning', preparing: 'warning', sending: 'default',
  completed: 'success', paused: 'warning', cancelled: 'secondary', failed: 'destructive',
  active: 'success', unsubscribed: 'secondary', bounced: 'destructive', complained: 'destructive',
  suppressed: 'secondary', verified: 'success', pending: 'warning', verifying: 'warning',
  sent: 'default', delivered: 'success', queued: 'secondary', skipped: 'secondary', processing: 'warning',
};

export const StatusBadge = ({ status }: { status: string }) => (
  <Badge variant={STATUS_VARIANT[status] ?? 'secondary'} className="capitalize">{status?.replace('_', ' ')}</Badge>
);
