import { z } from 'zod';
import {
  ApiKeySchema,
  ApiKeyWithSecretSchema,
  CreateApiKeySchema,
  type ApiKey,
  type ApiKeyWithSecret,
  type CreateApiKeyDto,
  paginatedResponseSchema,
  type PaginatedResponse,
} from '@data-mesh/api-contracts';
import { httpClient } from './http-client';
import { isMockMode } from '@/lib/env';
import { mockDb } from './mock-data';
import { sleep } from '@/lib/utils';
import { paginate } from './paginate';

const ApiKeyUsageSchema = z.object({
  keyId: z.string(),
  requestsToday: z.number().int().nonnegative(),
  rateLimit: z.number().int().positive(),
  remaining: z.number().int().nonnegative(),
});

export type ApiKeyUsage = z.infer<typeof ApiKeyUsageSchema>;

async function listApiKeys(): Promise<PaginatedResponse<ApiKey>> {
  if (isMockMode) {
    await sleep(200);
    return paginate(mockDb.apiKeys, 1, 50);
  }
  return httpClient.get<PaginatedResponse<ApiKey>>(
    '/api-keys',
    paginatedResponseSchema(ApiKeySchema),
  );
}

async function createApiKey(dto: CreateApiKeyDto): Promise<ApiKeyWithSecret> {
  const parsed = CreateApiKeySchema.parse(dto);
  if (isMockMode) {
    await sleep(300);
    return {
      id: `ck-key-${Math.random().toString(36).slice(2, 10)}`,
      name: parsed.name,
      rateLimit: parsed.rateLimit,
      isActive: true,
      lastUsed: null,
      expiresAt: parsed.expiresAt ?? null,
      createdAt: new Date().toISOString(),
      secret: `dm_live_${Math.random().toString(36).slice(2)}${Math.random()
        .toString(36)
        .slice(2)}`,
    };
  }
  return httpClient.post<ApiKeyWithSecret>('/api-keys', ApiKeyWithSecretSchema, {
    body: parsed,
  });
}

async function rotateApiKey(id: string): Promise<ApiKeyWithSecret> {
  if (isMockMode) {
    await sleep(300);
    const existing = mockDb.apiKeys.find((k) => k.id === id);
    if (!existing) throw new Error('API key not found.');
    return {
      ...existing,
      secret: `dm_live_${Math.random().toString(36).slice(2)}${Math.random()
        .toString(36)
        .slice(2)}`,
    };
  }
  return httpClient.post<ApiKeyWithSecret>(`/api-keys/${id}/rotate`, ApiKeyWithSecretSchema);
}

async function deleteApiKey(id: string): Promise<void> {
  if (isMockMode) {
    await sleep(200);
    return;
  }
  await httpClient.delete(`/api-keys/${id}`, ApiKeySchema);
}

async function toggleApiKey(id: string, isActive: boolean): Promise<ApiKey> {
  if (isMockMode) {
    await sleep(150);
    const existing = mockDb.apiKeys.find((k) => k.id === id);
    if (!existing) throw new Error('API key not found.');
    return { ...existing, isActive };
  }
  return httpClient.patch<ApiKey>(`/api-keys/${id}`, ApiKeySchema, { body: { isActive } });
}

async function getApiKeyUsage(id: string): Promise<ApiKeyUsage> {
  if (isMockMode) {
    await sleep(150);
    const key = mockDb.apiKeys.find((k) => k.id === id);
    const limit = key?.rateLimit ?? 100;
    const requestsToday = Math.floor(limit * 0.42);
    return { keyId: id, requestsToday, rateLimit: limit, remaining: limit - requestsToday };
  }
  return httpClient.get<ApiKeyUsage>(`/api-keys/${id}/usage`, ApiKeyUsageSchema);
}

export const apiKeysService = {
  listApiKeys,
  createApiKey,
  rotateApiKey,
  deleteApiKey,
  toggleApiKey,
  getApiKeyUsage,
};
