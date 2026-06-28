export interface Measurement {
  id: string;
  datasetId: string;
  country: string;
  region: string | null;
  recordedAt: Date;
  value: number;
  rawMetadata: Record<string, unknown> | null;
  createdAt: Date;
}

export interface AggregationResult {
  key: string;
  value: number;
}

export interface MeasurementQuery {
  country?: string;
  from?: Date;
  to?: Date;
  page: number;
  limit: number;
}