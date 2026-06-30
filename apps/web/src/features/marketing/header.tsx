'use client';

import * as React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Menu, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ThemeToggle } from '@/components/layout/theme-toggle';
import { Container } from '@/components/layout/container';
import { MARKETING_NAV, SITE } from '@/lib/config';
import { ROUTES } from '@/lib/constants';
import { cn } from '@/lib/utils';

export function MarketingHeader(): React.JSX.Element {
  const [scrolled, setScrolled] = React.useState(false);
  const [mobileOpen, setMobileOpen] = React.useState(false);
  const pathname = usePathname();

  React.useEffect(() => {
    const onScroll = (): void => setScrolled(window.scrollY > 8);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <header
      className={cn(
        'sticky top-0 z-50 w-full transition-colors',
        scrolled ? 'glass border-b border-border/60' : 'bg-transparent',
      )}
    >
      <Container>
        <div className="flex h-16 items-center justify-between">
          <Link href={ROUTES.home} className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-primary to-accent">
              <span className="text-sm font-bold text-primary-foreground">D</span>
            </div>
            <span className="text-base font-semibold tracking-tight">{SITE.name}</span>
          </Link>

          <nav className="hidden items-center gap-8 md:flex">
            {MARKETING_NAV.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
              >
                {item.label}
              </Link>
            ))}
          </nav>

          <div className="hidden items-center gap-2 md:flex">
            <ThemeToggle />
            <Button variant="ghost" asChild>
              <Link href={ROUTES.login}>Sign in</Link>
            </Button>
            <Button asChild>
              <Link href={ROUTES.register}>Get started</Link>
            </Button>
          </div>

          <div className="flex items-center gap-2 md:hidden">
            <ThemeToggle />
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setMobileOpen((v) => !v)}
              aria-label="Toggle menu"
            >
              {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </Button>
          </div>
        </div>

        {mobileOpen ? (
          <nav className="flex flex-col gap-1 border-t border-border/60 py-4 md:hidden">
            {MARKETING_NAV.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setMobileOpen(false)}
                className="rounded-md px-3 py-2 text-sm font-medium text-muted-foreground hover:bg-muted hover:text-foreground"
              >
                {item.label}
              </Link>
            ))}
            <div className="mt-2 flex flex-col gap-2 px-3">
              <Button variant="outline" asChild>
                <Link href={ROUTES.login}>Sign in</Link>
              </Button>
              <Button asChild>
                <Link href={ROUTES.register}>Get started</Link>
              </Button>
            </div>
          </nav>
        ) : null}
      </Container>
    </header>
  );
}
