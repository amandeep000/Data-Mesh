import type { Metadata } from 'next';
import { PageHeader } from '@/components/layout/page-header';
import { StatCard } from '@/components/layout/stat-card';
import { StatusBadge } from '@/components/layout/badges';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ingestionService } from '@/services';
import { formatCompact, formatDate, formatRelative } from '@/lib/utils';
import { Activity, AlertCircle, CheckCircle2, Database } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Ingestion',
  description: 'Monitor ETL pipeline status and ingestion runs.',
};

export default async function IngestionPage(): Promise<React.JSX.Element> {
  const [summary, runs] = await Promise.all([
    ingestionService.getIngestionSummary(),
    ingestionService.listIngestionRuns({ limit: 20 }),
  ]);

  return (
    <div className="space-y-8">
      <PageHeader
        title="Ingestion"
        description="Monitor ETL pipelines that pull, normalize, and load data from upstream sources."
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Running"
          value={summary.running}
          icon={Activity}
          hint="Pipelines in progress"
        />
        <StatCard
          label="Succeeded"
          value={summary.succeeded}
          icon={CheckCircle2}
          hint="Last 24 hours"
        />
        <StatCard
          label="Failed"
          value={summary.failed}
          icon={AlertCircle}
          hint="Requires attention"
        />
        <StatCard
          label="Rows Written"
          value={formatCompact(summary.totalRowsWritten)}
          icon={Database}
          hint="Across all runs"
        />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Ingestion Runs</CardTitle>
          <p className="mt-1 text-sm text-muted-foreground">Historical ETL execution records</p>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Status</TableHead>
                <TableHead>Dataset</TableHead>
                <TableHead>Rows Written</TableHead>
                <TableHead>Started</TableHead>
                <TableHead>Finished</TableHead>
                <TableHead>Error</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {runs.data.map((run) => (
                <TableRow key={run.id}>
                  <TableCell>
                    <StatusBadge status={run.status} />
                  </TableCell>
                  <TableCell className="font-mono text-sm">{run.datasetSlug}</TableCell>
                  <TableCell className="font-mono">{formatCompact(run.rowsWritten)}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {formatRelative(run.startedAt)}
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {run.finishedAt ? formatDate(run.finishedAt, true) : '—'}
                  </TableCell>
                  <TableCell className="max-w-xs truncate text-sm text-destructive">
                    {run.errorMsg ?? '—'}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {runs.data.filter((r) => r.status === 'FAILED').length > 0 ? (
        <Card className="border-destructive/30">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-destructive">
              <AlertCircle className="h-5 w-5" />
              Failed Jobs
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {runs.data
              .filter((r) => r.status === 'FAILED')
              .map((run) => (
                <div key={run.id} className="rounded-lg border border-destructive/20 bg-destructive/5 p-4">
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-sm font-medium">{run.datasetSlug}</span>
                    <span className="text-xs text-muted-foreground">{formatRelative(run.startedAt)}</span>
                  </div>
                  <p className="mt-2 text-sm text-destructive">{run.errorMsg}</p>
                </div>
              ))}
          </CardContent>
        </Card>
      ) : null}
    </div>
  );
}
