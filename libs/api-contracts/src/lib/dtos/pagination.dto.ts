import { z } from 'zod';

// ─── Pagination DTO ───────────────────────────────────────────
export const PaginationMetaSchema = z.object({
  total: z.number().int().nonnegative(),
  page: z.number().int().positive(),
  limit: z.number().int().positive(),
  totalPages: z.number().int().nonnegative(),
});

export const paginatedResponseSchema = <T extends z.ZodTypeAny>(itemSchema: T) =>
  z.object({
    data: z.array(itemSchema),
    meta: PaginationMetaSchema,
  });

// ─── Inferred Types ───────────────────────────────────────────
export type PaginationMeta = z.infer<typeof PaginationMetaSchema>;

export interface PaginatedResponse<T> {
  data: T[];
  meta: PaginationMeta;
}
