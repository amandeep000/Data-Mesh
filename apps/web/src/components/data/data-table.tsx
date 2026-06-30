'use client';

import * as React from 'react';
import { ArrowDown, ArrowUp, ChevronsUpDown } from 'lucide-react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { cn } from '@/lib/utils';
import { EmptyState } from '@/components/feedback/empty-state';
import { LoadingState } from '@/components/feedback/loading-state';

export type SortDirection = 'asc' | 'desc';

export interface Column<T> {
  key: string;
  header: string;
  cell: (row: T) => React.ReactNode;
  sortable?: boolean;
  sortAccessor?: (row: T) => string | number;
  className?: string;
  headerClassName?: string;
  align?: 'left' | 'right' | 'center';
}

interface DataTableProps<T> {
  columns: Column<T>[];
  data: T[];
  rowKey: (row: T) => string;
  onRowClick?: (row: T) => void;
  sort?: { key: string; direction: SortDirection } | null;
  onSortChange?: (sort: { key: string; direction: SortDirection } | null) => void;
  loading?: boolean;
  emptyState?: React.ReactNode;
  loadingRows?: number;
  className?: string;
}

const alignClass: Record<NonNullable<Column<never>['align']>, string> = {
  left: 'text-left',
  right: 'text-right',
  center: 'text-center',
};

export function DataTable<T>({
  columns,
  data,
  rowKey,
  onRowClick,
  sort,
  onSortChange,
  loading = false,
  emptyState,
  loadingRows = 6,
  className,
}: DataTableProps<T>): React.JSX.Element {
  const handleSort = (col: Column<T>): void => {
    if (!col.sortable || !onSortChange) return;
    if (sort?.key === col.key) {
      if (sort.direction === 'asc') {
        onSortChange({ key: col.key, direction: 'desc' });
      } else {
        onSortChange(null);
      }
    } else {
      onSortChange({ key: col.key, direction: 'asc' });
    }
  };

  return (
    <div className={cn('rounded-xl border border-border/60', className)}>
      <Table>
        <TableHeader>
          <TableRow className="hover:bg-transparent">
            {columns.map((col) => {
              const isSorted = sort?.key === col.key;
              return (
                <TableHead key={col.key} className={cn(col.headerClassName, col.align && alignClass[col.align])}>
                  {col.sortable ? (
                    <button
                      type="button"
                      onClick={() => handleSort(col)}
                      className="inline-flex items-center gap-1 transition-colors hover:text-foreground"
                    >
                      {col.header}
                      {isSorted ? (
                        sort?.direction === 'asc' ? (
                          <ArrowUp className="h-3 w-3" />
                        ) : (
                          <ArrowDown className="h-3 w-3" />
                        )
                      ) : (
                        <ChevronsUpDown className="h-3 w-3 opacity-40" />
                      )}
                    </button>
                  ) : (
                    col.header
                  )}
                </TableHead>
              );
            })}
          </TableRow>
        </TableHeader>
        <TableBody>
          {loading ? (
            <TableRow className="hover:bg-transparent">
              <TableCell colSpan={columns.length} className="p-0">
                <LoadingState rows={loadingRows} className="p-4" />
              </TableCell>
            </TableRow>
          ) : data.length === 0 ? (
            <TableRow className="hover:bg-transparent">
              <TableCell colSpan={columns.length} className="p-0">
                {emptyState ?? (
                  <EmptyState title="No results" description="No data matches your current filters." />
                )}
              </TableCell>
            </TableRow>
          ) : (
            data.map((row) => (
              <TableRow
                key={rowKey(row)}
                onClick={onRowClick ? () => onRowClick(row) : undefined}
                className={cn(onRowClick && 'cursor-pointer')}
              >
                {columns.map((col) => (
                  <TableCell key={col.key} className={cn(col.className, col.align && alignClass[col.align])}>
                    {col.cell(row)}
                  </TableCell>
                ))}
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );
}
