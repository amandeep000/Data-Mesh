/**
 * @data-mesh/shared-types
 *
 * Shared TypeScript types and interfaces used across
 * the NestJS API, Next.js web app, and any future service.
 *
 * Rules:
 *  - NO runtime code — types/interfaces only
 *  - NO external dependencies (pure TypeScript)
 *  - NO `any` or `unknown` without explicit narrowing
 */

// ─── Pagination ───────────────────────────────────────────────
export interface PaginatedResponse<T> {
  data: T[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

// ─── API Error ────────────────────────────────────────────────
export interface ApiErrorResponse {
  statusCode: number;
  message: string;
  error: string;
  timestamp: string;
  path: string;
}

// ─── Dataset Types ────────────────────────────────────────────
export type DataSource = 'EEA' | 'EUROSTAT' | 'COPERNICUS';

export interface Dataset {
  id: string;
  slug: string;
  name: string;
  source: DataSource;
  description: string | null;
  unit: string | null;
  tags: string[];
  createdAt: string;
  updatedAt: string;
}

export interface Measurement {
  id: string;
  datasetId: string;
  country: string;
  region: string | null;
  recordedAt: string;
  value: number;
}

// ─── Auth Types ───────────────────────────────────────────────
export type UserRole = 'ADMIN' | 'DEVELOPER';

export interface UserProfile {
  id: string;
  email: string;
  name: string | null;
  role: UserRole;
  createdAt: string;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

// ─── API Key Types ────────────────────────────────────────────
export interface ApiKey {
  id: string;
  name: string;
  rateLimit: number;
  isActive: boolean;
  lastUsed: string | null;
  expiresAt: string | null;
  createdAt: string;
}

export interface ApiKeyWithSecret extends ApiKey {
  /** Only returned once at creation — never stored in plain text */
  secret: string;
}
