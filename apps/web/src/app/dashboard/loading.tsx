import { LoadingState } from '@/components/feedback/loading-state';

export default function DashboardLoading(): React.JSX.Element {
  return (
    <div className="space-y-8">
      <div className="skeleton-shimmer h-10 w-1/3 rounded-lg" />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="skeleton-shimmer h-28 rounded-xl" />
        ))}
      </div>
      <LoadingState rows={8} />
    </div>
  );
}
