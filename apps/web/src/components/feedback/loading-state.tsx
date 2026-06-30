import { cn } from '@/lib/utils';

interface LoadingStateProps {
  rows?: number;
  className?: string;
}

export function LoadingState({ rows = 5, className }: LoadingStateProps): React.JSX.Element {
  return (
    <div className={cn('space-y-3', className)}>
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="skeleton-shimmer h-12 w-full rounded-lg" />
      ))}
    </div>
  );
}

export function CardSkeleton({ className }: { className?: string }): React.JSX.Element {
  return (
    <div className={cn('rounded-xl border border-border/60 p-6', className)}>
      <div className="skeleton-shimmer h-5 w-1/3 rounded-md" />
      <div className="mt-4 skeleton-shimmer h-8 w-1/2 rounded-md" />
      <div className="mt-3 skeleton-shimmer h-3 w-2/3 rounded-md" />
    </div>
  );
}
