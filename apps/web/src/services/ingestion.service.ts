import {
  IngestionRunSchema,
  IngestionRunQuerySchema,
  type IngestionRun,
  type IngestionRunQuery,
  type IngestionStatus,
  paginatedResponseSchema,
  type PaginatedResponse,
} from '@data-mesh/api-contracts';
import { httpClient } from './http-client';
import { isMockMode } from '@/lib/env';
import { mockDb } from './mock-data';
import { sleep } from '@/lib/utils';
import { paginate } from './paginate';

export interface IngestionFilters {
  readonly status?: IngestionStatus;
  readonly datasetSlug?: string;
  readonly page?: number;
  readonly limit?: number;
}

async function listIngestionRuns(
  filters: IngestionFilters = {},
): Promise<PaginatedResponse<IngestionRun>> {
  if (isMockMode) {
    await sleep(250);
    let items = [...mockDb.ingestionRuns];
    if (filters.status) items = items.filter((r) => r.status === filters.status);
    if (filters.datasetSlug) items = items.filter((r) => r.datasetSlug === filters.datasetSlug);
    return paginate(items, filters.page ?? 1, filters.limit ?? 15);
  }

  const query = IngestionRunQuerySchema.parse({
    status: filters.status,
    datasetSlug: filters.datasetSlug,
    page: filters.page ?? 1,
    limit: filters.limit ?? 15,
  });
  return httpClient.get<PaginatedResponse<IngestionRun>>(
    '/ingestion/runs',
    paginatedResponseSchema(IngestionRunSchema),
    { query },
  );
}

export interface IngestionSummary {
  readonly running: number;
  readonly succeeded: number;
  readonly failed: number;
  readonly totalRowsWritten: number;
}

async function getIngestionSummary(): Promise<IngestionSummary> {
  if (isMockMode) {
    await sleep(200);
    const runs = mockDb.ingestionRuns;
    return {
      running: runs.filter((r) => r.status === 'RUNNING').length,
      succeeded: runs.filter((r) => r.status === 'SUCCESS').length,
      failed: runs.filter((r) => r.status === 'FAILED').length,
      totalRowsWritten: runs.reduce((sum, r) => sum + r.rowsWritten, 0),
    };
  }
  const query: IngestionRunQuery = IngestionRunQuerySchema.parse({ limit: 100 });
  const res = await httpClient.get<PaginatedResponse<IngestionRun>>(
    '/ingestion/runs',
    paginatedResponseSchema(IngestionRunSchema),
    { query },
  );
  return {
    running: res.data.filter((r) => r.status === 'RUNNING').length,
    succeeded: res.data.filter((r) => r.status === 'SUCCESS').length,
    failed: res.data.filter((r) => r.status === 'FAILED').length,
    totalRowsWritten: res.data.reduce((sum, r) => sum + r.rowsWritten, 0),
  };
}

export const ingestionService = { listIngestionRuns, getIngestionSummary };
