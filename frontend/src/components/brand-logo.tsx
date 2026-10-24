import Image from 'next/image';
import Link from 'next/link';
import { cn } from '@/lib/utils';

/** HoverMail logo (mark + wordmark) for the app shell and auth pages. */
export function BrandLogo({ href = '/dashboard', className, size = 'md' }: { href?: string; className?: string; size?: 'md' | 'lg' }) {
  return (
    <Link href={href} aria-label="HoverMail" className={cn('inline-flex items-center gap-2.5 rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring', className)}>
      <Image src="/brand/hovermail-mark.png" alt="" width={833} height={314} priority className={cn('w-auto', size === 'lg' ? 'h-9' : 'h-7')} />
      <span className={cn('font-extrabold tracking-tight', size === 'lg' ? 'text-2xl' : 'text-lg')}>Hover<span className="text-primary">Mail</span></span>
    </Link>
  );
}
