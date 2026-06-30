'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import type { Dataset, DataSource } from '@data-mesh/api-contracts';
import { datasetsService } from '@/services';
import { DataTable, type Column, type SortDirection } from '@/components/data/data-table';
import { Pagination } from '@/components/data/pagination';
import { SearchInput } from '@/components/filters/search-input';
import { FilterChips, type FilterChipOption } from '@/components/filters/filter-chips';
import { SourceBadge } from '@/components/layout/badges';
import { EmptyState } from '@/components/feedback/empty-state';
import { useDebounce } from '@/hooks/use-debounce';
import { DATA_SOURCES, DEFAULT_PAGE_SIZE } from '@/lib/constants';
import { Database } from 'lucide-react';

const sourceOptions: FilterChipOption[] = DATA_SOURCES.map((s) => ({
  label: s,
  value: s,
}));

const columns: Column<Dataset>[] = [
  {
    key: 'name',
    header: 'Dataset',
    sortable: true,
    sortAccessor: (d) => d.name,
    cell: (d) => (
      <div className="space-y-0.5">
        <p className="font-medium">{d.name}</p>
        <p className="font-mono text-xs text-muted-foreground">{d.slug}</p>
      </div>
    ),
  },
  {
    key: 'source',
    header: 'Source',
    sortable: true,
    sortAccessor: (d) => d.source,
    cell: (d) => <SourceBadge source={d.source as DataSource} />,
  },
  {
    key: 'tags',
    header: 'Tags',
    cell: (d) => (
      <div className="flex flex-wrap gap-1">
        {d.tags.slice(0, 3).map((tag) => (
          <span key={tag} className="rounded-md bg-muted px-2 py-0.5 text-xs text-muted-foreground">
            {tag}
          </span>
        ))}
      </div>
    ),
  },
  {
    key: 'unit',
    header: 'Unit',
    cell: (d) => (d.unit ? <span className="text-sm text-muted-foreground">{d.unit}</span> : '—'),
  },
];

export function DatasetsExplorer(): React.JSX.Element {
  const router = useRouter();
  const [search, setSearch] = React.useState('');
  const [sources, setSources] = React.useState<readonly string[]>([]);
  const [page, setPage] = React.useState(1);
  const [sort, setSort] = React.useState<{ key: string; direction: SortDirection } | null>(null);
  const [data, setData] = React.useState<Dataset[]>([]);
  const [total, setTotal] = React.useState(0);
  const [totalPages, setTotalPages] = React.useState(1);
  const [loading, setLoading] = React.useState(true);

  const debouncedSearch = useDebounce(search, 300);

  const toggleSource = (value: string): void => {
    setSources((prev) =>
      prev.includes(value) ? prev.filter((s) => s !== value) : [...prev, value],
    );
    setPage(1);
  };

  React.useEffect(() => {
    let cancelled = false;
    setLoading(true);
    datasetsService
      .listDatasets({
        search: debouncedSearch || undefined,
        source: (sources[0] as DataSource) ?? undefined,
        tags: [],
        page,
        limit: DEFAULT_PAGE_SIZE,
      })
      .then((res) => {
        if (cancelled) return;
        let items = res.data;
        if (sort) {
          const col = columns.find((c) => c.key === sort.key);
          if (col?.sortAccessor) {
            items = [...items].sort((a, b) => {
              const av = col.sortAccessor!(a);
              const bv = col.sortAccessor!(b);
              const cmp = av < bv ? -1 : av > bv ? 1 : 0;
              return sort.direction === 'asc' ? cmp : -cmp;
            });
          }
        }
        setData(items);
        setTotal(res.meta.total);
        setTotalPages(res.meta.totalPages);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [debouncedSearch, sources, page, sort]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <SearchInput
          value={search}
          onChange={(v) => {
            setSearch(v);
            setPage(1);
          }}
          placeholder="Search datasets…"
          className="sm:max-w-xs"
        />
        <FilterChips options={sourceOptions} selected={sources} onToggle={toggleSource} />
      </div>

      <DataTable
        columns={columns}
        data={data}
        rowKey={(d) => d.id}
        sort={sort}
        onSortChange={setSort}
        loading={loading}
        onRowClick={(d) => router.push(`/dashboard/datasets/${d.slug}`)}
        emptyState={
          <EmptyState
            icon={Database}
            title="No datasets found"
            description="Try adjusting your search or filters."
          />
        }
      />

      <Pagination
        meta={{ total, page, limit: DEFAULT_PAGE_SIZE, totalPages }}
        onPageChange={setPage}
      />
    </div>
  );
}
