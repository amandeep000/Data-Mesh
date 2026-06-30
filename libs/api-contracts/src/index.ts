/**
 * @data-mesh/api-contracts
 *
 * Zod schemas that serve as the single source of truth for
 * request/response shapes — shared between NestJS (validation pipes)
 * and Next.js (fetch response parsing).
 *
 * Every schema MUST be accompanied by its inferred TypeScript type.
 * Do NOT use `any` or `z.unknown()` as escape hatches.
 */
import { z } from 'zod';

// ─── Re-exports ───────────────────────────────────────────────
export * from './lib/schemas/dataset.schema';
export * from './lib/schemas/auth.schema';
export * from './lib/schemas/api-key.schema';
export * from './lib/schemas/ingestion.schema';
export * from './lib/dtos/pagination.dto';
