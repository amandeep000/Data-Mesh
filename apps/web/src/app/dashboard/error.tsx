'use client';

import { ErrorState } from '@/components/feedback/error-state';
import { Button } from '@/components/ui/button';

export default function DashboardError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}): React.JSX.Element {
  return (
    <ErrorState
      title="Failed to load dashboard"
      message="We couldn't load this page. Please try again."
      onRetry={reset}
    />
  );
}
