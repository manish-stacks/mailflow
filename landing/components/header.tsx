import Link from "next/link";
import { Container } from "./container";
import { nav, site } from "@/lib/site";

export function Header() {
  return (
    <header className="sticky top-0 z-40 border-b border-line/70 bg-paper/90 backdrop-blur">
      <Container className="flex h-16 items-center justify-between">
        <Link href="/" className="flex items-center gap-2.5 font-display text-lg font-medium tracking-tight text-ink">
          <span className="seal flex h-7 w-7 items-center justify-center text-[11px] font-medium text-paper">MF</span>
          {site.name}
        </Link>
        <nav className="hidden items-center gap-8 md:flex">
          {nav.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="text-sm text-ink/80 transition-colors hover:text-ink"
            >
              {item.label}
            </Link>
          ))}
        </nav>
        <div className="flex items-center gap-4">
          <Link
            href={`${site.appUrl}/login`}
            className="hidden text-sm text-ink/80 transition-colors hover:text-ink sm:inline"
          >
            Sign in
          </Link>
          <Link
            href={`${site.appUrl}/signup`}
            className="rounded-md bg-ink px-4 py-2 text-sm font-medium text-paper transition-colors hover:bg-indigo"
          >
            Start free
          </Link>
        </div>
      </Container>
    </header>
  );
}
