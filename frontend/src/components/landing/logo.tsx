import Image from 'next/image';
import Link from 'next/link';
import { cn } from '@/lib/utils';

/** Official HoverMail mark (H + envelope), from /public/brand. `dark` = white-H variant for dark backgrounds. */
export function LogoMark({ className, dark = false }: { className?: string; dark?: boolean }) {
  return <Image src={dark ? '/brand/hovermail-mark-light.png' : '/brand/hovermail-mark.png'} alt="" width={833} height={314} priority className={cn('h-8 w-auto', className)} />;
}

export function Logo({ dark = false, className }: { dark?: boolean; className?: string }) {
  return (
    <Link href="/" aria-label="HoverMail home" className={cn('inline-flex items-center gap-2.5 rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-hm-red focus-visible:ring-offset-2', className)}>
      <LogoMark dark={dark} />
      <span className={cn('text-xl font-extrabold tracking-tight', dark ? 'text-white' : 'text-hm-ink')}>Hover<span className="text-hm-red">Mail</span></span>
    </Link>
  );
}

/** Full stacked logo (mark + wordmark). */
export function LogoFull({ dark = false, className }: { dark?: boolean; className?: string }) {
  return <Image src={dark ? '/brand/hovermail-logo-light.png' : '/brand/hovermail-logo.png'} alt="HoverMail" width={1174} height={506} className={cn('h-auto w-40', className)} />;
}
