import { z } from 'zod';

// ─── API Key Schemas ──────────────────────────────────────────
export const CreateApiKeySchema = z.object({
  name: z.string().min(2).max(100),
  rateLimit: z.number().int().positive().max(10_000).default(100),
  expiresAt: z.string().datetime().optional(),
});

export const ApiKeySchema = z.object({
  id: z.string().cuid(),
  name: z.string(),
  rateLimit: z.number().int(),
  isActive: z.boolean(),
  lastUsed: z.string().datetime().nullable(),
  expiresAt: z.string().datetime().nullable(),
  createdAt: z.string().datetime(),
});

export const ApiKeyWithSecretSchema = ApiKeySchema.extend({
  /** Returned only once at creation time — never stored in plain text */
  secret: z.string(),
});

// ─── Inferred Types ───────────────────────────────────────────
export type CreateApiKeyDto = z.infer<typeof CreateApiKeySchema>;
export type ApiKey = z.infer<typeof ApiKeySchema>;
export type ApiKeyWithSecret = z.infer<typeof ApiKeyWithSecretSchema>;
