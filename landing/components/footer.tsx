import Link from "next/link";
import { Container } from "./container";
import { nav, site } from "@/lib/site";

export function Footer() {
  return (
    <footer className="border-t border-line bg-paperDim">
      <Container className="grid gap-10 py-14 sm:grid-cols-2 md:grid-cols-4">
        <div className="sm:col-span-2 md:col-span-1">
          <div className="flex items-center gap-2.5 font-display text-lg font-medium text-ink">
            <span className="seal flex h-7 w-7 items-center justify-center text-[11px] font-medium text-paper">MF</span>
            {site.name}
          </div>
          <p className="mt-3 max-w-[26ch] text-sm text-mist">{site.tagline}</p>
        </div>

        <div>
          <p className="text-sm font-medium text-ink">Product</p>
          <ul className="mt-3 space-y-2 text-sm">
            {nav.map((item) => (
              <li key={item.href}>
                <Link href={item.href} className="text-ink/70 hover:text-ink">
                  {item.label}
                </Link>
              </li>
            ))}
            <li>
              <Link href={`${site.appUrl}/login`} className="text-ink/70 hover:text-ink">
                Sign in
              </Link>
            </li>
          </ul>
        </div>

        <div>
          <p className="text-sm font-medium text-ink">Company</p>
          <ul className="mt-3 space-y-2 text-sm">
            <li>
              <Link href="/contact" className="text-ink/70 hover:text-ink">
                Contact
              </Link>
            </li>
            <li>
              <a href="mailto:hello@mailflow.example.com" className="text-ink/70 hover:text-ink">
                hello@mailflow.example.com
              </a>
            </li>
          </ul>
        </div>

        <div>
          <p className="text-sm font-medium text-ink">Legal</p>
          <ul className="mt-3 space-y-2 text-sm">
            <li>
              <Link href="/privacy" className="text-ink/70 hover:text-ink">
                Privacy policy
              </Link>
            </li>
            <li>
              <Link href="/terms" className="text-ink/70 hover:text-ink">
                Terms of service
              </Link>
            </li>
          </ul>
        </div>
      </Container>
      <div className="route-line text-line" />
      <Container className="flex flex-col gap-2 py-6 text-xs text-mist sm:flex-row sm:items-center sm:justify-between">
        <p>© {new Date().getFullYear()} {site.name}. All rights reserved.</p>
        <p>Made for teams who still believe in email.</p>
      </Container>
    </footer>
  );
}
