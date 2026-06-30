'use client';

import * as React from 'react';
import type { Measurement } from '@data-mesh/api-contracts';
import { measurementsService } from '@/services';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { SearchInput } from '@/components/filters/search-input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { EmptyState } from '@/components/feedback/empty-state';
import { LoadingState } from '@/components/feedback/loading-state';
import { COUNTRIES } from '@/lib/constants';
import { formatDate } from '@/lib/utils';
import { ListChecks } from 'lucide-react';

const PAGE_SIZE = 25;
const countryOptions = Object.entries(COUNTRIES).map(([code, name]) => ({ code, name }));

export function MeasurementsBrowser(): React.JSX.Element {
  const [country, setCountry] = React.useState<string>('all');
  const [source, setSource] = React.useState<string>('all');
  const [search, setSearch] = React.useState('');
  const [items, setItems] = React.useState<Measurement[]>([]);
  const [page, setPage] = React.useState(1);
  const [total, setTotal] = React.useState(0);
  const [loading, setLoading] = React.useState(true);
  const [loadingMore, setLoadingMore] = React.useState(false);
  const [hasMore, setHasMore] = React.useState(false);
  const sentinelRef = React.useRef<HTMLDivElement | null>(null);

  const load = React.useCallback(
    async (resetPage = true): Promise<void> => {
      const targetPage = resetPage ? 1 : page + 1;
      if (resetPage) setLoading(true);
      else setLoadingMore(true);
      try {
        const res = await measurementsService.listMeasurements({
          country: country !== 'all' ? country : undefined,
          page: targetPage,
          limit: PAGE_SIZE,
        });
        setItems((prev) => (resetPage ? res.data : [...prev, ...res.data]));
        setPage(targetPage);
        setTotal(res.meta.total);
        setHasMore(targetPage < res.meta.totalPages);
      } finally {
        setLoading(false);
        setLoadingMore(false);
      }
    },
    [country, source, page],
  );

  React.useEffect(() => {
    void load(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [country, source]);

  React.useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting && hasMore && !loadingMore) {
          void load(false);
        }
      },
      { rootMargin: '200px' },
    );
    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [hasMore, loadingMore, load]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <SearchInput
          value={search}
          onChange={setSearch}
          placeholder="Search by region…"
          className="sm:max-w-xs"
        />
        <div className="flex gap-3">
          <Select value={country} onValueChange={setCountry}>
            <SelectTrigger className="w-[160px]">
              <SelectValue placeholder="Country" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All countries</SelectItem>
              {countryOptions.map((c) => (
                <SelectItem key={c.code} value={c.code}>
                  {c.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={source} onValueChange={setSource}>
            <SelectTrigger className="w-[140px]">
              <SelectValue placeholder="Source" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All sources</SelectItem>
              <SelectItem value="EEA">EEA</SelectItem>
              <SelectItem value="EUROSTAT">Eurostat</SelectItem>
              <SelectItem value="COPERNICUS">Copernicus</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="rounded-xl border border-border/60">
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              <TableHead>Country</TableHead>
              <TableHead>Region</TableHead>
              <TableHead>Recorded</TableHead>
              <TableHead className="text-right">Value</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow className="hover:bg-transparent">
                <TableCell colSpan={4} className="p-0">
                  <LoadingState rows={8} className="p-4" />
                </TableCell>
              </TableRow>
            ) : items.length === 0 ? (
              <TableRow className="hover:bg-transparent">
                <TableCell colSpan={4} className="p-0">
                  <EmptyState
                    icon={ListChecks}
                    title="No measurements"
                    description="Adjust your filters to see results."
                  />
                </TableCell>
              </TableRow>
            ) : (
              items
                .filter((m) =>
                  search ? (m.region ?? '').toLowerCase().includes(search.toLowerCase()) : true,
                )
                .map((m) => (
                  <TableRow key={m.id}>
                    <TableCell className="font-medium">
                      {COUNTRIES[m.country] ?? m.country}
                    </TableCell>
                    <TableCell className="text-muted-foreground">{m.region ?? '—'}</TableCell>
                    <TableCell className="text-muted-foreground">
                      {formatDate(m.recordedAt)}
                    </TableCell>
                    <TableCell className="text-right font-mono">{m.value}</TableCell>
                  </TableRow>
                ))
            )}
          </TableBody>
        </Table>
      </div>

      <div ref={sentinelRef} className="h-1" />
      {loadingMore ? (
        <p className="text-center text-sm text-muted-foreground">Loading more…</p>
      ) : null}
      {!loading && items.length > 0 ? (
        <p className="text-sm text-muted-foreground">
          Showing {items.length} of {total} measurements
        </p>
      ) : null}
    </div>
  );
}
