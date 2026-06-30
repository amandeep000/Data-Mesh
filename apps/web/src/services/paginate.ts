import type { PaginatedResponse } from '@data-mesh/api-contracts';

export function paginate<T>(
  items: readonly T[],
  page: number,
  limit: number,
): PaginatedResponse<T> {
  const total = items.length;
  const totalPages = Math.max(1, Math.ceil(total / limit));
  const safePage = Math.min(Math.max(1, page), totalPages);
  const start = (safePage - 1) * limit;
  const data = items.slice(start, start + limit);
  return {
    data,
    meta: { total, page: safePage, limit, totalPages },
  };
}
