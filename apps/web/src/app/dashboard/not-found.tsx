import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ROUTES } from '@/lib/constants';
import { Compass } from 'lucide-react';

export default function DashboardNotFound(): React.JSX.Element {
  return (
    <div className="flex flex-col items-center justify-center gap-4 py-24 text-center">
      <div className="flex h-14 w-14 items-center justify-center rounded-full bg-muted">
        <Compass className="h-7 w-7 text-muted-foreground" />
      </div>
      <div className="space-y-1">
        <h1 className="text-2xl font-bold">Page not found</h1>
        <p className="text-sm text-muted-foreground">
          The dashboard page you're looking for doesn't exist.
        </p>
      </div>
      <Button asChild>
        <Link href={ROUTES.dashboardOverview}>Back to overview</Link>
      </Button>
    </div>
  );
}
