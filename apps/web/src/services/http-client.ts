import { z, type ZodTypeAny } from 'zod';
import { env } from '@/lib/env';
import { API_BASE_PATH } from '@/lib/constants';

export class ApiError extends Error {
  readonly status: number;
  readonly code: string;

  constructor(message: string, status: number, code = 'API_ERROR') {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.code = code;
  }
}

interface RequestOptions {
  readonly query?: Record<string, string | number | boolean | string[] | undefined>;
  readonly body?: unknown;
  readonly headers?: Record<string, string>;
  readonly token?: string;
}

function buildUrl(path: string, query?: RequestOptions['query']): string {
  const url = new URL(`${API_BASE_PATH}${path}`, env.NEXT_PUBLIC_API_URL);
  if (query) {
    for (const [key, value] of Object.entries(query)) {
      if (value === undefined) continue;
      if (Array.isArray(value)) {
        for (const item of value) url.searchParams.append(key, String(item));
      } else {
        url.searchParams.set(key, String(value));
      }
    }
  }
  return url.toString();
}

const DEFAULT_HEADERS: Record<string, string> = {
  'Content-Type': 'application/json',
  Accept: 'application/json',
};

async function request<T>(
  method: string,
  path: string,
  schema: ZodTypeAny,
  options?: RequestOptions,
): Promise<T> {
  const url = buildUrl(path, options?.query);
  const headers: Record<string, string> = { ...DEFAULT_HEADERS, ...options?.headers };
  if (options?.token) headers['Authorization'] = `Bearer ${options.token}`;

  let response: Response;
  try {
    response = await fetch(url, {
      method,
      headers,
      ...(options?.body ? { body: JSON.stringify(options.body) } : {}),
      cache: 'no-store',
    });
  } catch {
    throw new ApiError('Network error — unable to reach the API.', 0, 'NETWORK_ERROR');
  }

  if (!response.ok) {
    let message = `Request failed with status ${response.status}`;
    let code = 'API_ERROR';
    try {
      const body = (await response.json()) as { message?: string; code?: string };
      if (body.message) message = body.message;
      if (body.code) code = body.code;
    } catch {
      /* ignore non-JSON error bodies */
    }
    throw new ApiError(message, response.status, code);
  }

  const json = (await response.json()) as unknown;
  const parsed = schema.safeParse(json);
  if (!parsed.success) {
    throw new ApiError('Response did not match the expected schema.', 502, 'SCHEMA_ERROR');
  }
  return parsed.data as T;
}

export const httpClient = {
  get: <T>(path: string, schema: ZodTypeAny, options?: RequestOptions): Promise<T> =>
    request<T>('GET', path, schema, options),
  post: <T>(path: string, schema: ZodTypeAny, options?: RequestOptions): Promise<T> =>
    request<T>('POST', path, schema, options),
  patch: <T>(path: string, schema: ZodTypeAny, options?: RequestOptions): Promise<T> =>
    request<T>('PATCH', path, schema, options),
  delete: <T>(path: string, schema: ZodTypeAny, options?: RequestOptions): Promise<T> =>
    request<T>('DELETE', path, schema, options),
};

/** Zod helper for an empty success body. */
export const emptySchema = z.object({}).optional();
