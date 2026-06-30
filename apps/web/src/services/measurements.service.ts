import {
  MeasurementSchema,
  MeasurementQuerySchema,
  type Measurement,
  type MeasurementQuery,
  paginatedResponseSchema,
  type PaginatedResponse,
} from '@data-mesh/api-contracts';
import { httpClient } from './http-client';
import { isMockMode } from '@/lib/env';
import { mockDb } from './mock-data';
import { sleep } from '@/lib/utils';
import { paginate } from './paginate';

export interface MeasurementFilters {
  readonly datasetId?: string;
  readonly country?: string;
  readonly region?: string;
  readonly from?: string;
  readonly to?: string;
  readonly page?: number;
  readonly limit?: number;
}

async function listMeasurements(
  filters: MeasurementFilters = {},
): Promise<PaginatedResponse<Measurement>> {
  if (isMockMode) {
    await sleep(250);
    let items = [...mockDb.measurements];
    if (filters.datasetId) items = items.filter((m) => m.datasetId === filters.datasetId);
    if (filters.country) items = items.filter((m) => m.country === filters.country);
    if (filters.region) items = items.filter((m) => m.region === filters.region);
    if (filters.from) items = items.filter((m) => m.recordedAt >= filters.from!);
    if (filters.to) items = items.filter((m) => m.recordedAt <= filters.to!);
    return paginate(items, filters.page ?? 1, filters.limit ?? 25);
  }

  const query = MeasurementQuerySchema.parse({
    country: filters.country,
    from: filters.from,
    to: filters.to,
    page: filters.page ?? 1,
    limit: filters.limit ?? 25,
  });
  return httpClient.get<PaginatedResponse<Measurement>>(
    '/measurements',
    paginatedResponseSchema(MeasurementSchema),
    { query: { ...query, datasetId: filters.datasetId } },
  );
}

export const measurementsService = { listMeasurements };
