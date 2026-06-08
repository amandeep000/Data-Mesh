import { z } from 'zod';

// ─── Dataset Schema ───────────────────────────────────────────
export const DataSourceSchema = z.enum(['EEA', 'EUROSTAT', 'COPERNICUS']);

export const DatasetSchema = z.object({
  id: z.string().cuid(),
  slug: z.string().min(1).max(100).regex(/^[a-z0-9-]+$/),
  name: z.string().min(1).max(255),
  source: DataSourceSchema,
  description: z.string().nullable(),
  unit: z.string().nullable(),
  tags: z.array(z.string()),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});

export const MeasurementSchema = z.object({
  id: z.string().cuid(),
  datasetId: z.string().cuid(),
  country: z.string().length(2).toUpperCase(),
  region: z.string().nullable(),
  recordedAt: z.string().datetime(),
  value: z.number().finite(),
});

// ─── Query Params ─────────────────────────────────────────────
export const DatasetQuerySchema = z.object({
  source: DataSourceSchema.optional(),
  tags: z.array(z.string()).optional(),
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
});

export const MeasurementQuerySchema = z.object({
  country: z.string().length(2).optional(),
  from: z.string().datetime().optional(),
  to: z.string().datetime().optional(),
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
});

// ─── Inferred Types ───────────────────────────────────────────
export type DataSource = z.infer<typeof DataSourceSchema>;
export type Dataset = z.infer<typeof DatasetSchema>;
export type Measurement = z.infer<typeof MeasurementSchema>;
export type DatasetQuery = z.infer<typeof DatasetQuerySchema>;
export type MeasurementQuery = z.infer<typeof MeasurementQuerySchema>;
