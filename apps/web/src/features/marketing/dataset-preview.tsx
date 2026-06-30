'use client';

import * as React from 'react';
import type { Dataset, DataSource } from '@data-mesh/api-contracts';
import { datasetsService } from '@/services';
import { SearchInput } from '@/components/filters/search-input';
import { FilterChips, type FilterChipOption } from '@/components/filters/filter-chips';
import { SourceBadge } from '@/components/layout/badges';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { EmptyState } from '@/components/feedback/empty-state';
import { useDebounce } from '@/hooks/use-debounce';
import { DATA_SOURCES, COUNTRIES } from '@/lib/constants';
import { formatNumber } from '@/lib/utils';
import { Search } from 'lucide-react';

const sourceOptions: FilterChipOption[] = DATA_SOURCES.map((s) => ({ label: s, value: s }));

export function DatasetPreview(): React.JSX.Element {
  const [search, setSearch] = React.useState('');
  const [sources, setSources] = React.useState<readonly string[]>([]);
  const [datasets, setDatasets] = React.useState<Dataset[]>([]);
  const [loading, setLoading] = React.useState(true);
  const debounced = useDebounce(search, 300);

  React.useEffect(() => {
    let cancelled = false;
    setLoading(true);
    datasetsService
      .listDatasets({
        search: debounced || undefined,
        source: (sources[0] as DataSource) ?? undefined,
        limit: 50,
      })
      .then((res) => {
        if (!cancelled) setDatasets(res.data);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [debounced, sources]);

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <SearchInput
          value={search}
          onChange={setSearch}
          placeholder="Search datasets…"
          className="sm:max-w-xs"
        />
        <FilterChips
          options={sourceOptions}
          selected={sources}
          onToggle={(v) =>
            setSources((prev) =>
              prev.includes(v) ? prev.filter((s) => s !== v) : [...prev, v],
            )
          }
        />
      </div>

      <div className="rounded-xl border border-border/60">
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              <TableHead>Dataset</TableHead>
              <TableHead>Source</TableHead>
              <TableHead className="hidden sm:table-cell">Tags</TableHead>
              <TableHead className="hidden sm:table-cell">Measurements</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              Array.from({ length: 4 }).map((_, i) => (
                <TableRow key={i} className="hover:bg-transparent">
                  <TableCell colSpan={4}>
                    <div className="skeleton-shimmer h-6 w-full rounded" />
                  </TableCell>
                </TableRow>
              ))
            ) : datasets.length === 0 ? (
              <TableRow className="hover:bg-transparent">
                <TableCell colSpan={4} className="p-0">
                  <EmptyState icon={Search} title="No matches" description="Try another search term." />
                </TableCell>
              </TableRow>
            ) : (
              datasets.slice(0, 6).map((d) => (
                <TableRow key={d.id}>
                  <TableCell>
                    <div className="space-y-0.5">
                      <p className="font-medium">{d.name}</p>
                      <p className="font-mono text-xs text-muted-foreground">{d.slug}</p>
                    </div>
                  </TableCell>
                  <TableCell>
                    <SourceBadge source={d.source as DataSource} />
                  </TableCell>
                  <TableCell className="hidden sm:table-cell">
                    <div className="flex flex-wrap gap-1">
                      {d.tags.slice(0, 2).map((t) => (
                        <span key={t} className="rounded bg-muted px-1.5 py-0.5 text-xs text-muted-foreground">
                          {t}
                        </span>
                      ))}
                    </div>
                  </TableCell>
                  <TableCell className="hidden font-mono text-sm sm:table-cell">
                    {formatNumber(8000 + d.id.length * 142)}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
