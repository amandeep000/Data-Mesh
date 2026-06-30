import { Badge } from '@/components/ui/badge';
import { SOURCE_META, INGESTION_STATUS_META } from '@/lib/constants';
import type { DataSource, IngestionStatus } from '@data-mesh/api-contracts';
import { cn } from '@/lib/utils';

export function SourceBadge({ source }: { source: DataSource }): React.JSX.Element {
  const meta = SOURCE_META[source];
  return (
    <Badge variant="outline" className={cn('border', meta.badge)}>
      <span className={cn('h-1.5 w-1.5 rounded-full', meta.dot)} />
      {meta.name}
    </Badge>
  );
}

export function StatusBadge({ status }: { status: IngestionStatus }): React.JSX.Element {
  const meta = INGESTION_STATUS_META[status];
  return (
    <Badge variant="outline" className={cn('border', meta.badge)}>
      <span
        className={cn('h-1.5 w-1.5 rounded-full', meta.dot, status === 'RUNNING' && 'animate-pulse')}
      />
      {meta.label}
    </Badge>
  );
}
