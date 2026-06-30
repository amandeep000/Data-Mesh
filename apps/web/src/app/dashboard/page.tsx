import {
  Activity,
  ArrowUpRight,
  Database,
  KeyRound,
  TrendingUp,
} from 'lucide-react';
import { PageHeader } from '@/components/layout/page-header';
import { StatCard } from '@/components/layout/stat-card';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { StatusBadge } from '@/components/layout/badges';
import { ApiUsageChart } from '@/components/charts/api-usage-chart';
import { datasetsService, ingestionService } from '@/services';
import { formatCompact, formatRelative, formatNumber } from '@/lib/utils';
import { ROUTES } from '@/lib/constants';
import Link from 'next/link';

function buildUsageData(): Array<{ hour: string; requests: number }> {
  const hours = ['00', '04', '08', '12', '16', '20'];
  const values = [1200, 840, 3400, 5800, 4900, 2100];
  return hours.map((hour, i) => ({ hour: `${hour}:00`, requests: values[i] ?? 0 }));
}

export default async function OverviewPage(): Promise<React.JSX.Element> {
  const [{ data: datasets }, ingestionSummary] = await Promise.all([
    datasetsService.listDatasets({ limit: 100 }),
    ingestionService.getIngestionSummary(),
  ]);
  const recentRuns = await ingestionService.listIngestionRuns({ limit: 5 });

  return (
    <div className="space-y-8">
      <PageHeader
        title="Overview"
        description="Monitor your datasets, API usage, and ingestion pipelines at a glance."
        actions={
          <Button asChild>
            <Link href={ROUTES.playground}>
              Open Playground
              <ArrowUpRight className="h-4 w-4" />
            </Link>
          </Button>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Active Datasets"
          value={datasets.length}
          icon={Database}
          trend={{ value: '+2 this week', positive: true }}
        />
        <StatCard
          label="API Requests (24h)"
          value={formatCompact(18200)}
          icon={TrendingUp}
          trend={{ value: '+12.4%', positive: true }}
        />
        <StatCard
          label="Active API Keys"
          value={3}
          icon={KeyRound}
          hint="2 with rate limits"
        />
        <StatCard
          label="Rows Ingested"
          value={formatCompact(ingestionSummary.totalRowsWritten)}
          icon={Activity}
          trend={{ value: 'last 24h', positive: true }}
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>API Usage</CardTitle>
              <p className="mt-1 text-sm text-muted-foreground">Requests over the last 24 hours</p>
            </div>
            <span className="rounded-full bg-success/10 px-2.5 py-0.5 text-xs font-medium text-success">
              Healthy
            </span>
          </CardHeader>
          <CardContent>
            <ApiUsageChart data={buildUsageData()} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>System Health</CardTitle>
            <p className="mt-1 text-sm text-muted-foreground">Real-time service status</p>
          </CardHeader>
          <CardContent className="space-y-4">
            {[
              { name: 'REST API', status: 'Operational', uptime: '99.98%' },
              { name: 'Postgres', status: 'Operational', uptime: '100%' },
              { name: 'Redis Cache', status: 'Operational', uptime: '99.99%' },
              { name: 'ETL Pipeline', status: 'Degraded', uptime: '98.40%' },
            ].map((service) => (
              <div key={service.name} className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <span
                    className={
                      service.status === 'Operational'
                        ? 'h-2 w-2 rounded-full bg-success'
                        : 'h-2 w-2 rounded-full bg-warning'
                    }
                  />
                  <span className="text-sm font-medium">{service.name}</span>
                </div>
                <div className="text-right">
                  <p className="text-sm text-muted-foreground">{service.status}</p>
                  <p className="text-xs text-muted-foreground">{service.uptime}</p>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Recent ETL Runs</CardTitle>
            <p className="mt-1 text-sm text-muted-foreground">Latest ingestion pipeline activity</p>
          </div>
          <Button variant="outline" size="sm" asChild>
            <Link href={ROUTES.ingestion}>View all</Link>
          </Button>
        </CardHeader>
        <CardContent className="space-y-1">
          {recentRuns.data.map((run) => (
            <div
              key={run.id}
              className="flex items-center justify-between rounded-lg px-3 py-2.5 transition-colors hover:bg-muted/50"
            >
              <div className="flex items-center gap-3">
                <StatusBadge status={run.status} />
                <span className="font-mono text-sm">{run.datasetSlug}</span>
              </div>
              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                <span className="hidden sm:inline">{formatNumber(run.rowsWritten)} rows</span>
                <span>{formatRelative(run.startedAt)}</span>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
