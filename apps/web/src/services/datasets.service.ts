import {
  DatasetSchema,
  DatasetQuerySchema,
  type Dataset,
  type DatasetQuery,
  paginatedResponseSchema,
  type PaginatedResponse,
} from '@data-mesh/api-contracts';
import { httpClient } from './http-client';
import { isMockMode } from '@/lib/env';
import { mockDb } from './mock-data';
import { sleep } from '@/lib/utils';
import { paginate } from './paginate';

export interface DatasetFilters {
  readonly search?: string;
  readonly source?: DatasetQuery['source'];
  readonly tags?: readonly string[];
  readonly page?: number;
  readonly limit?: number;
}

async function listDatasets(filters: DatasetFilters = {}): Promise<PaginatedResponse<Dataset>> {
  if (isMockMode) {
    await sleep(250);
    let items = [...mockDb.datasets];
    if (filters.search) {
      const q = filters.search.toLowerCase();
      items = items.filter(
        (d) =>
          d.name.toLowerCase().includes(q) ||
          d.slug.toLowerCase().includes(q) ||
          (d.description ?? '').toLowerCase().includes(q),
      );
    }
    if (filters.source) items = items.filter((d) => d.source === filters.source);
    if (filters.tags && filters.tags.length > 0) {
      items = items.filter((d) => filters.tags!.some((t) => d.tags.includes(t)));
    }
    return paginate(items, filters.page ?? 1, filters.limit ?? 12);
  }

  const query = DatasetQuerySchema.parse({
    source: filters.source,
    tags: filters.tags,
    page: filters.page ?? 1,
    limit: filters.limit ?? 12,
  });
  return httpClient.get<PaginatedResponse<Dataset>>(
    '/datasets',
    paginatedResponseSchema(DatasetSchema),
    { query: { ...query, tags: query.tags } },
  );
}

async function getDataset(slug: string): Promise<Dataset> {
  if (isMockMode) {
    await sleep(200);
    const found = mockDb.datasets.find((d) => d.slug === slug);
    if (!found) throw new Error(`Dataset "${slug}" not found.`);
    return found;
  }
  return httpClient.get<Dataset>(`/datasets/${slug}`, DatasetSchema);
}

export const datasetsService = { listDatasets, getDataset };
