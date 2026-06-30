import Link from 'next/link';
import { Container } from '@/components/layout/container';
import { ROUTES } from '@/lib/constants';
import { SITE } from '@/lib/config';

export default function AuthLayout({
  children,
}: Readonly<{ children: React.ReactNode }>): React.JSX.Element {
  return (
    <div className="flex min-h-screen flex-col bg-gradient-hero">
      <Container className="flex h-16 items-center">
        <Link href={ROUTES.home} className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-primary to-accent">
            <span className="text-sm font-bold text-primary-foreground">D</span>
          </div>
          <span className="text-base font-semibold">{SITE.name}</span>
        </Link>
      </Container>
      <main className="flex flex-1 items-center justify-center px-4 py-12">{children}</main>
    </div>
  );
}
