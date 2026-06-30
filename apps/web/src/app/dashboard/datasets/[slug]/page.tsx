import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Database, Download, FileJson, Tag } from 'lucide-react';
import type { DataSource } from '@data-mesh/api-contracts';
import { datasetsService, measurementsService } from '@/services';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { SourceBadge } from '@/components/layout/badges';
import { CodeBlock } from '@/components/code/code-block';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { SOURCE_META, API_BASE_PATH } from '@/lib/constants';
import { formatDate, formatNumber } from '@/lib/utils';
import { COUNTRIES } from '@/lib/constants';

interface PageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  try {
    const dataset = await datasetsService.getDataset(slug);
    return { title: dataset.name };
  } catch {
    return { title: 'Dataset' };
  }
}

export default async function DatasetDetailPage({ params }: PageProps): Promise<React.JSX.Element> {
  const { slug } = await params;
  let dataset;
  try {
    dataset = await datasetsService.getDataset(slug);
  } catch {
    notFound();
  }
  const measurements = await measurementsService.listMeasurements({
    datasetId: dataset.id,
    limit: 8,
  });
  const sourceMeta = SOURCE_META[dataset.source as DataSource];

  const endpoint = `${API_BASE_PATH}/datasets/${dataset.slug}/measurements`;
  const curlExample = `curl -X GET "${endpoint}?limit=10" \\
  -H "Authorization: Bearer dm_live_YOUR_API_KEY" \\
  -H "Accept: application/json"`;
  const tsExample = `import { DataMesh } from '@data-mesh/sdk';

const client = new DataMesh({ apiKey: process.env.DATA_MESH_KEY });

const measurements = await client.datasets
  .measurements('${dataset.slug}', { limit: 10 });

console.log(measurements.data);`;
  const pyExample = `from data_mesh import DataMesh

client = DataMesh(api_key=os.environ["DATA_MESH_KEY"])

measurements = client.datasets.measurements(
    "${dataset.slug}",
    limit=10,
)

for m in measurements.data:
    print(m.value, m.country, m.recorded_at)`;

  return (
    <div className="space-y-8">
      <div>
        <Button variant="ghost" size="sm" asChild className="mb-4 -ml-2 text-muted-foreground">
          <Link href="/dashboard/datasets">
            <ArrowLeft className="h-4 w-4" />
            All datasets
          </Link>
        </Button>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="space-y-3">
            <div className="flex flex-wrap items-center gap-2">
              <SourceBadge source={dataset.source as DataSource} />
              {dataset.unit ? (
                <span className="rounded-md bg-muted px-2 py-0.5 text-xs text-muted-foreground">
                  Unit: {dataset.unit}
                </span>
              ) : null}
            </div>
            <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">{dataset.name}</h1>
            {dataset.description ? (
              <p className="max-w-2xl text-sm text-muted-foreground sm:text-base">
                {dataset.description}
              </p>
            ) : null}
          </div>
          <Button variant="outline">
            <Download className="h-4 w-4" />
            Export
          </Button>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { label: 'Source', value: sourceMeta.fullName, icon: Database },
          { label: 'Measurements', value: formatNumber(8420), icon: FileJson },
          { label: 'Updated', value: formatDate(dataset.updatedAt), icon: Tag },
          { label: 'Created', value: formatDate(dataset.createdAt), icon: Tag },
        ].map((stat) => (
          <Card key={stat.label} className="p-5">
            <p className="text-sm font-medium text-muted-foreground">{stat.label}</p>
            <p className="mt-2 text-sm font-semibold">{stat.value}</p>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Tags</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-2">
          {dataset.tags.map((tag) => (
            <span
              key={tag}
              className="rounded-md border border-border bg-muted/50 px-2.5 py-1 text-xs font-medium text-muted-foreground"
            >
              {tag}
            </span>
          ))}
        </CardContent>
      </Card>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Sample Measurements</CardTitle>
            <p className="mt-1 text-sm text-muted-foreground">Most recent recorded values</p>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Country</TableHead>
                  <TableHead>Region</TableHead>
                  <TableHead>Recorded</TableHead>
                  <TableHead className="text-right">Value</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {measurements.data.map((m) => (
                  <TableRow key={m.id}>
                    <TableCell className="font-medium">
                      {COUNTRIES[m.country] ?? m.country}
                    </TableCell>
                    <TableCell className="text-muted-foreground">{m.region ?? '—'}</TableCell>
                    <TableCell className="text-muted-foreground">
                      {formatDate(m.recordedAt)}
                    </TableCell>
                    <TableCell className="text-right font-mono">
                      {m.value} {dataset.unit ?? ''}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            <Separator className="my-4" />
            <Button variant="outline" size="sm" asChild>
              <Link href={`/dashboard/measurements?dataset=${dataset.slug}`}>
                View all measurements
              </Link>
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>API Endpoint</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <code className="block rounded-lg bg-muted px-3 py-2 font-mono text-xs text-foreground">
              GET {endpoint}
            </code>
            <p className="text-xs text-muted-foreground">
              Returns paginated measurements for this dataset. Requires a valid API key.
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="space-y-4">
        <h2 className="text-lg font-semibold">Example Requests</h2>
        <div className="grid gap-4 lg:grid-cols-3">
          <CodeBlock code={curlExample} language="bash" filename="cURL" />
          <CodeBlock code={tsExample} language="typescript" filename="TypeScript" />
          <CodeBlock code={pyExample} language="python" filename="Python" />
        </div>
      </div>
    </div>
  );
}
