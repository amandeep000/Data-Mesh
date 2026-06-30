import Link from 'next/link';
import { Github, Twitter } from 'lucide-react';
import { Container } from '@/components/layout/container';
import { SITE } from '@/lib/config';
import { ROUTES } from '@/lib/constants';

const footerLinks = [
  {
    title: 'Product',
    links: [
      { label: 'Datasets', href: '/#categories' },
      { label: 'Architecture', href: '/#architecture' },
      { label: 'Pricing', href: '/pricing' },
      { label: 'Dashboard', href: ROUTES.dashboard },
    ],
  },
  {
    title: 'Data Sources',
    links: [
      { label: 'EEA', href: '/#sources' },
      { label: 'Eurostat', href: '/#sources' },
      { label: 'Copernicus', href: '/#sources' },
    ],
  },
  {
    title: 'Resources',
    links: [
      { label: 'API Docs', href: '#' },
      { label: 'Swagger', href: '#' },
      { label: 'Status', href: '#' },
      { label: 'Changelog', href: '#' },
    ],
  },
] as const;

export function MarketingFooter(): React.JSX.Element {
  return (
    <footer className="border-t border-border/60">
      <Container>
        <div className="grid gap-8 py-12 sm:grid-cols-2 lg:grid-cols-4">
          <div className="space-y-4">
            <Link href={ROUTES.home} className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-primary to-accent">
                <span className="text-sm font-bold text-primary-foreground">D</span>
              </div>
              <span className="text-base font-semibold">{SITE.name}</span>
            </Link>
            <p className="max-w-xs text-sm text-muted-foreground">{SITE.description}</p>
            <div className="flex gap-3">
              <Link
                href="#"
                aria-label="GitHub"
                className="text-muted-foreground transition-colors hover:text-foreground"
              >
                <Github className="h-5 w-5" />
              </Link>
              <Link
                href="#"
                aria-label="Twitter"
                className="text-muted-foreground transition-colors hover:text-foreground"
              >
                <Twitter className="h-5 w-5" />
              </Link>
            </div>
          </div>

          {footerLinks.map((section) => (
            <div key={section.title}>
              <h4 className="text-sm font-semibold">{section.title}</h4>
              <ul className="mt-4 space-y-2">
                {section.links.map((link) => (
                  <li key={link.label}>
                    <Link
                      href={link.href}
                      className="text-sm text-muted-foreground transition-colors hover:text-foreground"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <div className="flex flex-col items-center justify-between gap-2 border-t border-border/60 py-6 sm:flex-row">
          <p className="text-xs text-muted-foreground">
            © {new Date().getFullYear()} {SITE.name}. All rights reserved.
          </p>
          <p className="text-xs text-muted-foreground">
            Built for the European environmental data community.
          </p>
        </div>
      </Container>
    </footer>
  );
}
