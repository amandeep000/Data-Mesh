import Link from 'next/link';

export const dynamic = 'force-dynamic';

export default function NotFound(): React.JSX.Element {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-6 bg-background px-4 text-center">
      <p className="text-7xl font-bold text-gradient">404</p>
      <div className="space-y-2">
        <h1 className="text-2xl font-bold">Page not found</h1>
        <p className="text-muted-foreground">
          The page you're looking for doesn't exist or has moved.
        </p>
      </div>
      <Link
        href="/"
        className="inline-flex h-11 items-center justify-center rounded-lg bg-primary px-8 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
      >
        Back home
      </Link>
    </div>
  );
}
