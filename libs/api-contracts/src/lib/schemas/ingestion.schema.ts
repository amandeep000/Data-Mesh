import { z } from 'zod';

// ─── Ingestion Schemas ────────────────────────────────────────
export const IngestionStatusSchema = z.enum(['RUNNING', 'SUCCESS', 'FAILED']);

export const IngestionRunSchema = z.object({
  id: z.string().cuid(),
  datasetSlug: z.string(),
  status: IngestionStatusSchema,
  rowsWritten: z.number().int().nonnegative(),
  errorMsg: z.string().nullable(),
  startedAt: z.string().datetime(),
  finishedAt: z.string().datetime().nullable(),
  createdAt: z.string().datetime(),
});

export const IngestionRunQuerySchema = z.object({
  status: IngestionStatusSchema.optional(),
  datasetSlug: z.string().optional(),
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
});

// ─── Inferred Types ───────────────────────────────────────────
export type IngestionStatus = z.infer<typeof IngestionStatusSchema>;
export type IngestionRun = z.infer<typeof IngestionRunSchema>;
export type IngestionRunQuery = z.infer<typeof IngestionRunQuerySchema>;
