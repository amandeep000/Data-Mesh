# Data-Mesh: TDD Muscle-Memory Development Guide

> **Stop vibe-coding. Start architecting.**  
> This guide forces you to write every line yourself — tests first — so the patterns sink into your fingers, not your clipboard.

---

## Table of Contents

1. [The Philosophy](#1-the-philosophy)
2. [Architecture Recap](#2-architecture-recap)
3. [Before You Start](#3-before-you-start)
4. [Phase 0: Hexagonal Architecture Warm-Up](#phase-0-hexagonal-architecture-warm-up)
5. [Phase 1: Shared Contracts (Zod + Types)](#phase-1-shared-contracts-zod--types)
6. [Phase 2: Prisma Module & Repository Port](#phase-2-prisma-module--repository-port)
7. [Phase 3: Auth Domain (TDD Deep Dive)](#phase-3-auth-domain-tdd-deep-dive)
8. [Phase 4: API Key Management](#phase-4-api-key-management)
9. [Phase 5: Dataset Module](#phase-5-dataset-module)
10. [Phase 6: Measurements + Redis Caching](#phase-6-measurements--redis-caching)
11. [Phase 7: Next.js Auth Pages](#phase-7-nextjs-auth-pages)
12. [Phase 8: Dashboard Shell](#phase-8-dashboard-shell)
13. [Phase 9: Python ETL — Extractors](#phase-9-python-etl--extractors)
14. [Phase 10: Python ETL — Transformers](#phase-10-python-etl--transformers)
15. [Phase 11: Python ETL — Loaders](#phase-11-python-etl--loaders)
16. [Phase 12: Integration & Docker Compose](#phase-12-integration--docker-compose)
17. [Appendix A: ESLint / TS Strictness Cheatsheet](#appendix-a-eslint--ts-strictness-cheatsheet)
18. [Appendix B: TDD Checklist (Print This)](#appendix-b-tdd-checklist-print-this)

---

## 1. The Philosophy

You are not "generating" an app. You are **sculpting** it — one failing test at a time.  
If you cannot feel the difference between a Port and an Adapter in your fingertips, you are vibe-coding. This guide fixes that.

### The Rule of Three

1. **Never write implementation before a failing test.**
2. **Never skip running the test after writing it.**
3. **Never refactor without green tests.**

> "The tests are the spec. The spec is the truth. The truth is green."

---

## 2. Architecture Recap

### NestJS Hexagonal Layers (per feature)

```
FeatureModule
├── domain/
│   ├── entities/          # Pure TS interfaces/classes (no Nest decorators)
│   ├── ports/
│   │   ├── inbound/       # "What the app can DO" (UseCase interfaces)
│   │   └── outbound/      # "What the app NEEDS" (Repository/Cache/Http interfaces)
│   └── services/          # Pure business logic (no framework)
├── application/
│   ├── dtos/              # Zod-validated input/output shapes
│   └── use-cases/         # Orchestration: validate → domain service → persist
└── infrastructure/
    ├── common/            # Global interceptors, exception filters, decorators
    ├── inbound/
    │   ├── controllers/   # HTTP adapters (Fastify/Nest)
    │   ├── guards/        # Auth/ApiKey guards
    │   └── pipes/         # Zod validation pipes
    └── outbound/
        ├── cache/         # Redis adapter
        ├── http/          # External HTTP clients
        └── persistence/   # Prisma adapter (implements outbound port)
```

### Dependency Rule

**Inbound** knows about **Application** and **Domain**.  
**Application** knows about **Domain** only.  
**Domain** knows about **nothing** (pure TypeScript).  
**Outbound** implements interfaces defined in **Domain**.

---

## 3. Before You Start

### 3.1 Verify Prerequisites

```bash
node --version    # >= 20
npm --version     # >= 10
python --version  # >= 3.12
docker --version  # latest
docker-compose --version  # latest
```

### 3.2 Install Root Dependencies

```bash
cd c:\Users\amant\Desktop\DataMesh
npm install
```

### 3.3 Configure Environment

```bash
cp .env.example .env
```

Edit `.env` and set these minimum values:

```env
# Database
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/datamesh_dev"

# Redis (local via Docker)
REDIS_URL="redis://localhost:6379"

# JWT
JWT_SECRET="local-dev-secret-min-32-chars-long!!!"
JWT_REFRESH_SECRET="local-refresh-secret-min-32-chars-long!!!"

# Rate Limiting
RATE_LIMIT_TTL=60
RATE_LIMIT_MAX=100
```

### 3.4 Start Infrastructure

```bash
npm run docker:up
```

Wait for `datamesh-postgres` and `datamesh-redis` to be healthy.

### 3.5 Initialize Database

```bash
npm run prisma:generate
npm run prisma:migrate:dev -- --name init
```

### 3.6 Verify Tests Run (should be mostly empty/pass)

```bash
# TypeScript
npm run test

# Python (from apps/ingestion)
cd apps/ingestion
pytest
```

---

## Phase 0: Hexagonal Architecture Warm-Up

**Goal:** Internalize the folder structure by tracing a request through all layers.

### Step 0.1: Read the existing scaffolding

Open these files in your editor and trace mentally how data flows:

1. `apps/api/src/app/app.module.ts` — see how modules are wired
2. `apps/api/src/app/domain/ports/inbound/README.ts`
3. `apps/api/src/app/domain/ports/outbound/README.ts`
4. `apps/api/src/app/domain/entities/README.ts`

### Step 0.2: Draw the flow

On paper (yes, paper), draw a box for each layer and draw arrows showing:

- HTTP Request → Controller → UseCase → Domain Service → Repository Port → Prisma Adapter → PostgreSQL

Keep this paper next to your monitor for the rest of the project.

### Step 0.3: Commit your understanding

Create a file `docs/architecture/hexagonal-flow.md` with your diagram in Mermaid:

```markdown
## Request Flow

```mermaid
graph TD
    A[HTTP Request] --> B[Controller - Inbound Adapter]
    B --> C[UseCase - Application Layer]
    C --> D[Domain Service]
    D --> E[Outbound Port - Interface]
    E --> F[Prisma Adapter - Outbound Adapter]
    F --> G[(PostgreSQL)]
```
```

> **STOP.** Do not proceed until you can recite the dependency rule from memory.

---

## Phase 1: Shared Contracts (Zod + Types)

**Goal:** Establish the contract layer that both NestJS and Next.js will consume.  
**TDD Note:** Zod schemas ARE the test for runtime data. Their inferred types ARE the compile-time contract.

### Step 1.1: Write the Zod Schema for `Dataset`

**File:** `libs/api-contracts/src/lib/schemas/dataset.schema.ts`

Requirements:
- `DatasetSchema` with: `id` (cuid), `slug` (kebab-case string), `name` (min 1), `source` (enum: EEA, EUROSTAT, COPERNICUS), `description` (optional), `unit` (optional), `tags` (string array), `createdAt`, `updatedAt`
- Export inferred type `Dataset`
- Export `CreateDatasetSchema` (omit id, timestamps)
- Export `UpdateDatasetSchema` (partial of CreateDatasetSchema, at least one field required)

### Step 1.2: Write the Zod Schema for `Measurement`

**File:** `libs/api-contracts/src/lib/schemas/measurement.schema.ts`

Requirements:
- `MeasurementSchema` with: `id` (cuid), `datasetId`, `country` (ISO-3166-1 alpha-2, exactly 2 uppercase chars), `region` (optional), `recordedAt` (ISO date), `value` (float), `rawMetadata` (optional JSON), `createdAt`
- Export `CreateMeasurementSchema`
- Export `QueryMeasurementSchema` (for filtering: datasetSlug, country, from, to, page, limit)

### Step 1.3: Write Pagination DTO

**File:** `libs/api-contracts/src/lib/dtos/pagination.dto.ts`

Requirements:
- `PaginationQuerySchema`: `page` (default 1), `limit` (default 20, max 100)
- `PaginatedResponseSchema<T>` generic helper
- Export inferred types

### Step 1.4: Update the barrel export

**File:** `libs/api-contracts/src/index.ts`

Add your new exports. Run the build:

```bash
npx nx build api-contracts
```

If it fails, fix the type errors. No `any`. No `unknown` without narrowing.

### Step 1.5: Create shared errors

**File:** `libs/shared/errors/src/lib/domain-errors.ts`

Define these typed error classes:

```typescript
export class DomainError extends Error {
  constructor(message: string, public readonly code: string) {
    super(message);
  }
}

export class NotFoundError extends DomainError { ... }
export class ValidationError extends DomainError { ... }
export class UnauthorizedError extends DomainError { ... }
export class RateLimitError extends DomainError { ... }
```

### Step 1.6: Create shared types

**File:** `libs/shared/types/src/lib/api-response.types.ts`

Define:

```typescript
export type ApiSuccess<T> = { success: true; data: T; meta?: PaginationMeta };
export type ApiError = { success: false; error: { code: string; message: string } };
export type ApiResponse<T> = ApiSuccess<T> | ApiError;
```

> **STOP.** Run `npx nx run-many --target=lint --projects=api-contracts,shared-types,shared-errors`. Fix all errors. Green before continuing.

---

## Phase 2: Prisma Module & Repository Port

**Goal:** Create the outbound adapter for persistence, driven by a Port interface.  
**TDD Focus:** Mock the Port in unit tests. Never touch real Prisma in unit tests.

### Step 2.1: Write the Outbound Port

**File:** `apps/api/src/app/domain/ports/outbound/user-repository.port.ts`

```typescript
export interface IUserRepository {
  findByEmail(email: string): Promise<User | null>;
  findById(id: string): Promise<User | null>;
  create(user: CreateUserInput): Promise<User>;
  // ... etc
}
```

Define `User` entity interface in `apps/api/src/app/domain/entities/user.entity.ts`.

Define `CreateUserInput` type there too.

### Step 2.2: Write the Prisma Adapter

**File:** `apps/api/src/app/infrastructure/outbound/persistence/prisma-user.repository.ts`

Implement `IUserRepository`. Inject `PrismaService`.

### Step 2.3: Write the test FIRST (RED)

**File:** `apps/api/src/app/infrastructure/outbound/persistence/prisma-user.repository.spec.ts`

```typescript
describe('PrismaUserRepository', () => {
  let repository: PrismaUserRepository;
  let prismaService: DeepMocked<PrismaService>;

  beforeEach(() => {
    prismaService = createMock<PrismaService>();
    repository = new PrismaUserRepository(prismaService);
  });

  it('should find user by email', async () => {
    // Arrange
    const mockUser = { id: '1', email: 'a@b.com', name: 'Test', role: 'DEVELOPER', createdAt: new Date(), updatedAt: new Date() };
    prismaService.user.findUnique.mockResolvedValue(mockUser);

    // Act
    const result = await repository.findByEmail('a@b.com');

    // Assert
    expect(result).toEqual(mockUser);
    expect(prismaService.user.findUnique).toHaveBeenCalledWith({ where: { email: 'a@b.com' } });
  });
});
```

**Run the test:**

```bash
npx nx test api --testPathPattern="prisma-user.repository"
```

It will fail because `PrismaUserRepository` does not exist yet. **Confirm it fails. Read the error.**

### Step 2.4: Implement minimum code (GREEN)

Write the `PrismaUserRepository` class. Run the test again. Confirm green.

### Step 2.5: Refactor

- Extract a `BasePrismaRepository` if you see duplication.
- Ensure all Prisma return values are mapped to Domain entities (no raw Prisma types leaking into domain).

### Step 2.6: Repeat for all entities

Create the same pattern for:
- `IApiKeyRepository` + `PrismaApiKeyRepository`
- `IDatasetRepository` + `PrismaDatasetRepository`
- `IMeasurementRepository` + `PrismaMeasurementRepository`
- `IIngestionRunRepository` + `PrismaIngestionRunRepository`

For each: **Port → Test → Adapter → Green → Refactor.**

> **STOP.** All repository tests must pass before Phase 3.

---

## Phase 3: Auth Domain (TDD Deep Dive)

**Goal:** Build register/login with JWT using strict hexagonal layers.  
**TDD Focus:** Test the UseCase by mocking ALL outbound ports. Test the Domain Service with pure logic.

### Step 3.1: Write the Inbound Port

**File:** `apps/api/src/app/domain/ports/inbound/auth.use-case.ts`

```typescript
export interface IAuthUseCase {
  register(dto: RegisterDto): Promise<{ user: User; accessToken: string; refreshToken: string }>;
  login(dto: LoginDto): Promise<{ user: User; accessToken: string; refreshToken: string }>;
  refreshToken(token: string): Promise<{ accessToken: string }>;
}
```

### Step 3.2: Write the Domain Service (pure logic)

**File:** `apps/api/src/app/domain/services/password.service.ts`

```typescript
export interface IPasswordService {
  hash(password: string): Promise<string>;
  compare(password: string, hash: string): Promise<boolean>;
}
```

**Test first:** `apps/api/src/app/domain/services/password.service.spec.ts`

Mock the `IPasswordService` in your test, then write a `BcryptPasswordService` implementation.

Wait — the Domain Service itself should be PURE. The hashing is an infrastructure concern.  
So the Domain layer just defines the interface. The Application layer orchestrates.

Revised:

**File:** `apps/api/src/app/domain/services/auth.domain-service.ts`

Pure logic: validate password strength rules, ensure email format (though Zod handles this at boundary).

Actually, keep it simple. The Domain Service for auth can just be the token generation logic interface.

**File:** `apps/api/src/app/application/use-cases/auth.use-case.ts`

This implements `IAuthUseCase`. It orchestrates:
1. Validate DTO (via Zod pipe in controller, but double-check in use-case)
2. Check if user exists (via `IUserRepository`)
3. Hash password (via `IPasswordService` outbound port)
4. Create user (via `IUserRepository`)
5. Generate tokens (via `ITokenService` outbound port)
6. Return result

### Step 3.3: RED — Write the UseCase test

**File:** `apps/api/src/app/application/use-cases/auth.use-case.spec.ts`

Mock these ports:
- `IUserRepository`
- `IPasswordService`
- `ITokenService`

Write a test for `register`:
- Given a valid RegisterDto
- When user does not exist
- Then create user, hash password, generate tokens, return them

Write a test for `register` when user already exists:
- Then throw `ConflictError`

Run:

```bash
npx nx test api --testPathPattern="auth.use-case"
```

**Confirm it fails.**

### Step 3.4: GREEN — Implement minimum UseCase

Write `AuthUseCase` class implementing `IAuthUseCase`. Run tests. Confirm green.

### Step 3.5: REFACTOR — Clean up

- Extract common error mapping
- Ensure DTOs are imported from `@data-mesh/api-contracts`, not redefined

### Step 3.6: RED — Write the Controller test

**File:** `apps/api/src/app/infrastructure/inbound/controllers/auth.controller.spec.ts`

Mock `IAuthUseCase` (the inbound port). Test:
- POST /auth/register → calls use-case → returns 201
- POST /auth/login → calls use-case → returns 200
- POST /auth/refresh → calls use-case → returns 200

Run and confirm failure.

### Step 3.7: GREEN — Implement the Controller

**File:** `apps/api/src/app/infrastructure/inbound/controllers/auth.controller.ts`

Use `@nestjs/swagger` decorators. Use `@Body()` with your Zod validation pipe.

Run and confirm green.

### Step 3.8: Wire the module

Update `apps/api/src/app/app.module.ts`:

```typescript
imports: [
  ThrottlerModule.forRoot([...]),
  PrismaModule, // you built this in Phase 2
  AuthModule,   // you just built this
]
```

> **STOP.** Run `npm run api:test`. All tests green? Good. Now hit the endpoint:

```bash
curl -X POST http://localhost:3000/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"SecurePass123!","name":"Test"}'
```

---

## Phase 4: API Key Management

**Goal:** Developers manage API keys via the dashboard. Keys are hashed before storage.  
**TDD Focus:** Test key generation (random string), hashing, and rate-limit metadata.

### Step 4.1: Domain — Define the entity

**File:** `apps/api/src/app/domain/entities/api-key.entity.ts`

```typescript
export interface ApiKey {
  id: string;
  name: string;
  keyHash: string;
  keyPrefix: string; // first 8 chars of raw key, for display
  userId: string;
  rateLimit: number;
  isActive: boolean;
  lastUsed: Date | null;
  expiresAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}
```

### Step 4.2: Port — Inbound

**File:** `apps/api/src/app/domain/ports/inbound/api-key.use-case.ts`

```typescript
export interface IApiKeyUseCase {
  createKey(userId: string, name: string, rateLimit?: number): Promise<{ apiKey: ApiKey; rawKey: string }>;
  listKeys(userId: string): Promise<ApiKey[]>;
  revokeKey(userId: string, keyId: string): Promise<void>;
  validateKey(rawKey: string): Promise<{ userId: string; rateLimit: number } | null>;
}
```

### Step 4.3: Port — Outbound

**File:** `apps/api/src/app/domain/ports/outbound/api-key-repository.port.ts`

Already partially there from Phase 2. Add `findByKeyHash(hash: string)`.

### Step 4.4: RED — Test the UseCase

**File:** `apps/api/src/app/application/use-cases/api-key.use-case.spec.ts`

Test cases:
1. `createKey` generates a random key, hashes it, stores prefix, returns raw key ONCE
2. `validateKey` returns user info when key matches
3. `validateKey` returns null when key does not match
4. `revokeKey` soft-deletes (sets isActive false)
5. `listKeys` returns only keys belonging to the user

Mock `IApiKeyRepository`, `IHashService` (for key hashing).

Run. Confirm red.

### Step 4.5: GREEN — Implement

Write `ApiKeyUseCase`. Run. Confirm green.

### Step 4.6: Controller + Guard

**File:** `apps/api/src/app/infrastructure/inbound/controllers/api-key.controller.ts`

Protected by JWT Guard. Endpoints:
- POST /api-keys
- GET /api-keys
- DELETE /api-keys/:id

**File:** `apps/api/src/app/infrastructure/inbound/guards/api-key-auth.guard.ts`

This guard checks `X-API-Key` header for public API routes (not the dashboard routes). It uses `IApiKeyUseCase.validateKey()`.

### Step 4.7: RED — Test the Guard

**File:** `apps/api/src/app/infrastructure/inbound/guards/api-key-auth.guard.spec.ts`

Mock the ExecutionContext and Reflector. Mock `IApiKeyUseCase`.

Test:
1. No header → throw Unauthorized
2. Invalid key → throw Unauthorized
3. Valid key → attach user to request, allow
4. Rate limit exceeded → throw RateLimitError

Run. Red. Implement. Green.

> **STOP.** Run the full API test suite. Green? Move on.

---

## Phase 5: Dataset Module

**Goal:** CRUD for datasets. Datasets are seeded initially, but admins can add custom ones.  
**TDD Focus:** Test pagination logic and slug uniqueness.

### Step 5.1: Domain

**File:** `apps/api/src/app/domain/entities/dataset.entity.ts`

Use the Zod inferred type from `@data-mesh/api-contracts`. Re-export or extend if needed.

### Step 5.2: Inbound Port

**File:** `apps/api/src/app/domain/ports/inbound/dataset.use-case.ts`

```typescript
export interface IDatasetUseCase {
  listDatasets(query: PaginationQuery): Promise<PaginatedResult<Dataset>>;
  getDatasetBySlug(slug: string): Promise<Dataset>;
  createDataset(dto: CreateDatasetDto): Promise<Dataset>;
  updateDataset(slug: string, dto: UpdateDatasetDto): Promise<Dataset>;
  deleteDataset(slug: string): Promise<void>;
}
```

### Step 5.3: RED — Test UseCase

**File:** `apps/api/src/app/application/use-cases/dataset.use-case.spec.ts`

Mock `IDatasetRepository`.

Tests:
1. `listDatasets` returns paginated result
2. `getDatasetBySlug` throws `NotFoundError` when missing
3. `createDataset` generates slug from name if not provided
4. `createDataset` throws `ConflictError` when slug exists
5. `updateDataset` merges partial fields

Run. Red.

### Step 5.4: GREEN — Implement

Write `DatasetUseCase`. Run. Green.

### Step 5.5: Controller

**File:** `apps/api/src/app/infrastructure/inbound/controllers/dataset.controller.ts`

- GET /datasets (public, paginated)
- GET /datasets/:slug (public)
- POST /datasets (admin only — add `@Roles('ADMIN')` guard)
- PATCH /datasets/:slug (admin only)
- DELETE /datasets/:slug (admin only)

> **STOP.** Test with curl. Seed some data via Prisma seed script if needed.

---

## Phase 6: Measurements + Redis Caching

**Goal:** Query measurements with filtering. Cache frequent queries in Redis.  
**TDD Focus:** Test cache hit/miss logic. Mock Redis client.

### Step 6.1: Outbound Port — Cache

**File:** `apps/api/src/app/domain/ports/outbound/cache.port.ts`

```typescript
export interface ICachePort {
  get<T>(key: string): Promise<T | null>;
  set<T>(key: string, value: T, ttlSeconds: number): Promise<void>;
  delete(key: string): Promise<void>;
  deletePattern(pattern: string): Promise<void>;
}
```

### Step 6.2: RED — Test the Cache Adapter

**File:** `apps/api/src/app/infrastructure/outbound/cache/redis-cache.adapter.spec.ts`

Mock `Redis` from `ioredis`.

Tests:
1. `get` parses JSON string from Redis
2. `get` returns null when key missing
3. `set` stringifies and calls `setex`
4. `deletePattern` uses `scanStream` to find and delete keys

Run. Red.

### Step 6.3: GREEN — Implement

**File:** `apps/api/src/app/infrastructure/outbound/cache/redis-cache.adapter.ts`

Implement `ICachePort` using `ioredis`.

### Step 6.4: Inbound Port — Measurements

**File:** `apps/api/src/app/domain/ports/inbound/measurement.use-case.ts`

```typescript
export interface IMeasurementUseCase {
  queryMeasurements(filter: QueryMeasurementDto): Promise<PaginatedResult<Measurement>>;
  getAggregatedData(slug: string, aggregation: 'avg' | 'max' | 'min' | 'sum', groupBy: 'country' | 'month'): Promise<AggregationResult[]>;
}
```

### Step 6.5: RED — Test UseCase with Cache

**File:** `apps/api/src/app/application/use-cases/measurement.use-case.spec.ts`

Mock `IMeasurementRepository` and `ICachePort`.

Tests:
1. Cache miss → query DB → set cache → return result
2. Cache hit → return cached result, never touch DB
3. Different query params → different cache keys
4. `getAggregatedData` computes aggregation correctly

Run. Red.

### Step 6.6: GREEN — Implement

Key insight: build deterministic cache keys from query params:

```typescript
const cacheKey = `measurements:${slug}:${country}:${from}:${to}:${page}:${limit}`;
```

### Step 6.7: REFACTOR — Cache invalidation

When ingestion writes new measurements, invalidate related cache keys.  
This is done by publishing an event or calling `ICachePort.deletePattern` in the loader.

> **STOP.** Run `npm run api:test`. Green? Run the API and query:

```bash
curl "http://localhost:3000/datasets/air-quality/measurements?country=DE&from=2024-01-01&to=2024-12-31"
```

Query twice. Second should be instant (check Redis `MONITOR`).

---

## Phase 7: Next.js Auth Pages

**Goal:** Login and register forms that talk to the NestJS API.  
**TDD Note:** For frontend, TDD = write a test for the hook/component behavior first. Use React Testing Library + MSW (Mock Service Worker) to mock API responses.

### Step 7.1: Install Web Test Dependencies

```bash
npm install -D @testing-library/react @testing-library/jest-dom @testing-library/user-event msw
```

### Step 7.2: Create API Client

**File:** `apps/web/src/lib/api/client.ts`

A typed fetch wrapper using Zod schemas for response validation:

```typescript
export async function apiFetch<T>(
  schema: z.ZodSchema<T>,
  path: string,
  options?: RequestInit
): Promise<T> {
  const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}${path}`, options);
  const json = await res.json();
  return schema.parse(json); // Zod validates at boundary
}
```

### Step 7.3: Create Auth Store

**File:** `apps/web/src/stores/auth-store.ts`

Use Zustand:

```typescript
interface AuthState {
  user: User | null;
  accessToken: string | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
}
```

### Step 7.4: RED — Test the Login Form

**File:** `apps/web/src/app/(auth)/login/page.test.tsx`

Use React Testing Library. Mock the auth store.

Test:
1. Renders email and password inputs
2. Submitting valid data calls `login`
3. Shows error message on failed login
4. Redirects to dashboard on success

Run:

```bash
npx nx test web --testPathPattern="login"
```

Confirm red.

### Step 7.5: GREEN — Implement Login Page

**File:** `apps/web/src/app/(auth)/login/page.tsx`

Use Shadcn UI `Input`, `Button`, `Label`, `Card` components.  
Use `react-hook-form` with Zod resolver for client-side validation (reuse the same schema from `api-contracts`).

### Step 7.6: Repeat for Register

**File:** `apps/web/src/app/(auth)/register/page.tsx`

Same pattern. Additional fields: name, confirm password.

### Step 7.7: Middleware for Route Protection

**File:** `apps/web/src/middleware.ts`

Protect `/dashboard/*` routes. Redirect to `/login` if no valid session cookie.

> **STOP.** Run `npm run web:build`. Any type errors? Fix them. No `any`.

---

## Phase 8: Dashboard Shell

**Goal:** A consistent layout with sidebar navigation for all dashboard pages.

### Step 8.1: Layout Component

**File:** `apps/web/src/app/dashboard/layout.tsx`

Requirements:
- Sidebar with links: Datasets, API Keys, Analytics, Settings
- Header with user avatar and logout
- Mobile-responsive (collapsible sidebar)

### Step 8.2: Global Error Boundary

**File:** `apps/web/src/app/error.tsx`

Catch API errors. Display friendly messages using error codes from `shared-errors`.

### Step 8.3: Loading States

**File:** `apps/web/src/app/dashboard/loading.tsx`

Use Shadcn `Skeleton` components.

> **STOP.** Visually inspect at `http://localhost:4200/dashboard`. Click all nav links.

---

## Phase 9: API Keys UI

**Goal:** Allow developers to create, view (prefix only), and revoke API keys.

### Step 9.1: RED — Test the API Keys List

**File:** `apps/web/src/app/dashboard/api-keys/page.test.tsx`

Mock the API client to return a list of keys.

Test:
1. Renders list of keys with names and prefixes
2. Shows "Create Key" button
3. Clicking revoke opens confirmation dialog
4. After revoke, list refreshes

### Step 9.2: GREEN — Implement

**File:** `apps/web/src/app/dashboard/api-keys/page.tsx`

Use React Query (`@tanstack/react-query`) for server state management:

```bash
npm install @tanstack/react-query
```

Wrap the app in `QueryClientProvider` at `apps/web/src/providers/query-provider.tsx`.

### Step 9.3: Create Key Modal

**File:** `apps/web/src/app/dashboard/api-keys/create-key-modal.tsx`

Form with:
- Key name input
- Rate limit slider (10–10,000)

On success: show the raw key ONCE with a copy button. Then it's gone forever.

> **STOP.** Create a key via UI. Copy it. Use it in a curl to the API. Verify it works.

---

## Phase 9.5: Dataset Explorer (Web)

**Goal:** Browse datasets, view details, see sample measurements.

### Step 9.6: Dataset List Page

**File:** `apps/web/src/app/dashboard/datasets/page.tsx`

Table with:
- Name, Source, Unit, Tags
- Search by name
- Filter by source

### Step 9.7: Dataset Detail Page

**File:** `apps/web/src/app/dashboard/datasets/[slug]/page.tsx`

Show:
- Dataset metadata
- Mini chart of recent measurements (use `recharts`)
- Download CSV button

---

## Phase 10: Python ETL — Extractors

**Goal:** Fetch raw data from EU environmental APIs.  
**TDD Focus:** Use `respx` to mock HTTPX calls. Use `pytest-mock` for time.

### Step 10.1: Define the Port

**File:** `apps/ingestion/src/ports/extractor.py`

```python
from abc import ABC, abstractmethod
import polars as pl

class DataExtractor(ABC):
    @abstractmethod
    async def extract(self, dataset_slug: str) -> pl.DataFrame:
        """Return a Polars DataFrame with raw data."""
```

### Step 10.2: RED — Test EEA Extractor

**File:** `apps/ingestion/tests/unit/extractors/test_eea_extractor.py`

Use `respx` to mock `https://discomap.eea.europa.eu/...` endpoints.

Test cases:
1. Returns valid Polars DataFrame on 200
2. Retries on 500 (use `tenacity`)
3. Raises `ExtractionError` on repeated failure
4. Handles empty response gracefully

Run:

```bash
cd apps/ingestion
pytest tests/unit/extractors/test_eea_extractor.py -v
```

Confirm red.

### Step 10.3: GREEN — Implement

**File:** `apps/ingestion/src/extractors/eea/eea_extractor.py`

Use `httpx.AsyncClient`. Parse JSON/XML responses into Polars DataFrame.

### Step 10.4: Repeat for Eurostat and Copernicus

**Files:**
- `apps/ingestion/src/extractors/eurostat/eurostat_extractor.py`
- `apps/ingestion/tests/unit/extractors/test_eurostat_extractor.py`
- `apps/ingestion/src/extractors/copernicus/copernicus_extractor.py`
- `apps/ingestion/tests/unit/extractors/test_copernicus_extractor.py`

> **STOP.** All extractor tests green? Coverage >= 80%? Check:

```bash
pytest --cov=src --cov-report=term-missing
```

---

## Phase 11: Python ETL — Transformers

**Goal:** Normalize messy EU data into the Measurement schema.

### Step 11.1: Define the Port

**File:** `apps/ingestion/src/ports/transformer.py`

```python
class DataTransformer(ABC):
    @abstractmethod
    def transform(self, raw_df: pl.DataFrame, dataset_slug: str) -> pl.DataFrame:
        """
        Return a DataFrame with columns:
        country, region, recorded_at, value, raw_metadata
        """
```

### Step 11.2: RED — Test Transformer

**File:** `apps/ingestion/tests/unit/transformers/test_measurement_transformer.py`

Create fixtures in `apps/ingestion/tests/fixtures/api_responses.py`:

```python
import polars as pl

@pytest.fixture
def messy_eea_df() -> pl.DataFrame:
    return pl.DataFrame({
        "countryCode": ["DE", "FR", None],
        "city": ["Berlin", "Paris", "Madrid"],
        "datetime_begin": ["2024-01-01T00:00:00Z", "invalid", "2024-06-15T00:00:00Z"],
        "value_numeric": [12.5, "N/A", 8.3],
        "unit": ["µg/m³", "µg/m³", "µg/m³"],
    })
```

Tests:
1. Normalizes country codes to ISO-3166-1 alpha-2 uppercase
2. Parses ISO datetimes, drops invalid rows
3. Coerces values to float, drops non-numeric
4. Stores original row as JSON in `raw_metadata`
5. Output schema matches Measurement model exactly

Run. Red.

### Step 11.3: GREEN — Implement

**File:** `apps/ingestion/src/transformers/measurement_transformer.py`

Use Polars expressions. No loops. Vectorized operations only.

Example pattern:

```python
return (
    raw_df
    .with_columns(
        pl.col("countryCode").str.to_uppercase().alias("country"),
        pl.col("datetime_begin").str.to_datetime(strict=False).alias("recorded_at"),
        pl.col("value_numeric").cast(pl.Float64, strict=False).alias("value"),
    )
    .filter(
        pl.col("country").is_not_null()
        & pl.col("recorded_at").is_not_null()
        & pl.col("value").is_not_null()
    )
    .with_columns(
        pl.struct(pl.all()).alias("raw_metadata")
    )
    .select(["country", "region", "recorded_at", "value", "raw_metadata"])
)
```

### Step 11.4: REFACTOR

Extract common Polars utils to `apps/ingestion/src/utils/polars_helpers.py`.

> **STOP.** `pytest --cov=src`. Green and >= 80%?

---

## Phase 12: Python ETL — Loaders

**Goal:** Write transformed Polars DataFrames to PostgreSQL efficiently.

### Step 12.1: Define the Port

**File:** `apps/ingestion/src/ports/loader.py`

```python
class DataLoader(ABC):
    @abstractmethod
    async def load(self, df: pl.DataFrame, dataset_slug: str) -> int:
        """Return number of rows written."""
```

### Step 12.2: RED — Test the Loader

**File:** `apps/ingestion/tests/unit/loaders/test_postgres_loader.py`

Mock `psycopg.AsyncConnection` or use a test database. For unit tests, mock.

Tests:
1. Writes DataFrame rows as INSERT statements in batches
2. Tracks ingestion run in `ingestion_runs` table
3. On success: updates run status to SUCCESS
4. On failure: updates run status to FAILED, stores error message
5. Invalidates Redis cache keys for the dataset

### Step 12.3: GREEN — Implement

**File:** `apps/ingestion/src/loaders/postgres_loader.py`

Use `COPY FROM` or batched INSERTs. Use `psycopg` async API.

### Step 12.4: Integration Test

**File:** `apps/ingestion/tests/integration/test_etl_pipeline.py`

Use `testcontainers` or the local Docker PostgreSQL:

```python
async def test_full_pipeline():
    extractor = EEAExtractor()
    transformer = MeasurementTransformer()
    loader = PostgresLoader()
    
    raw = await extractor.extract("air-quality")
    clean = transformer.transform(raw, "air-quality")
    count = await loader.load(clean, "air-quality")
    
    assert count > 0
    # Verify DB state
```

Run:

```bash
pytest tests/integration/ -v
```

> **STOP.** Integration tests require Docker. Ensure `docker-compose.yml` is running.

---

## Phase 13: Integration & Docker Compose

### Step 13.1: Validate Dockerfiles

**File:** `docker/api.Dockerfile`

Ensure multi-stage build:
1. `deps` — install npm packages
2. `builder` — run `nx build api`
3. `runner` — copy dist, install prod deps, run `node main.js`

**File:** `docker/web.Dockerfile`

Multi-stage:
1. `deps`
2. `builder` — `nx build web`
3. `runner` — `next start`

**File:** `docker/ingestion.Dockerfile`

Use `python:3.12-slim`. Install deps from `pyproject.toml`. Set `PYTHONPATH`.

### Step 13.2: Build and Run

```bash
docker-compose down -v
docker-compose up --build -d
```

### Step 13.3: End-to-End Smoke Test

```bash
# 1. Register
curl -X POST http://localhost:3000/auth/register -H "Content-Type: application/json" -d '{...}'

# 2. Login, get token

# 3. Create API key

# 4. Query dataset with API key
curl -H "X-API-Key: YOUR_KEY" http://localhost:3000/datasets

# 5. Run ingestion
docker-compose run ingestion python -m src.orchestrator --dataset air-quality

# 6. Query measurements — should return data
```

> **STOP.** Everything works end-to-end? You have built a production-grade DaaS.

---

## Appendix A: ESLint / TS Strictness Cheatsheet

### Forbidden Patterns (will error)

```typescript
// ❌ any
function bad(x: any) { ... }

// ❌ unknown without narrowing
function bad2(x: unknown) { return x.foo; }

// ❌ implicit any in catch
try { } catch (e) { console.log(e.message); }
// Fix: catch (e: unknown) { if (e instanceof Error) console.log(e.message); }

// ❌ leaking Prisma types into domain
// Domain entity must be a pure interface, not `Prisma.UserGetPayload<...>`
```

### Required Patterns

```typescript
// ✅ Explicit return types on Ports
export interface IUserRepository {
  findById(id: string): Promise<User | null>;
}

// ✅ Zod schema at every boundary
const apiResponse = SomeSchema.parse(await res.json());

// ✅ Custom error types
throw new NotFoundError(`User ${id} not found`);

// ✅ Narrowed unknown
catch (err: unknown) {
  if (err instanceof DomainError) { ... }
  else { throw err; }
}
```

---

## Appendix B: TDD Checklist (Print This)

```
□ RED   I wrote a test that describes the behavior I want.
□ RUN   I ran the test and watched it FAIL. I read the failure message.
□ GREEN I wrote the MINIMUM code to make the test pass.
□ RUN   I ran the test and watched it PASS.
□ REF   I cleaned up duplication, improved names, kept tests green.
□ NEXT  I committed the change with a descriptive message.
```

Tape this to your monitor. Do not skip a box.

---

## Appendix C: File Reference (Complete Structure)

```
DataMesh/
├── apps/
│   ├── api/
│   │   └── src/app/
│   │       ├── domain/
│   │       │   ├── entities/
│   │       │   │   ├── user.entity.ts
│   │       │   │   ├── api-key.entity.ts
│   │       │   │   ├── dataset.entity.ts
│   │       │   │   ├── measurement.entity.ts
│   │       │   │   └── ingestion-run.entity.ts
│   │       │   ├── ports/
│   │       │   │   ├── inbound/
│   │       │   │   │   ├── auth.use-case.ts
│   │       │   │   │   ├── api-key.use-case.ts
│   │       │   │   │   ├── dataset.use-case.ts
│   │       │   │   │   └── measurement.use-case.ts
│   │       │   │   └── outbound/
│   │       │   │       ├── user-repository.port.ts
│   │       │   │       ├── api-key-repository.port.ts
│   │       │   │       ├── dataset-repository.port.ts
│   │       │   │       ├── measurement-repository.port.ts
│   │       │   │       ├── cache.port.ts
│   │       │   │       ├── password.port.ts
│   │       │   │       └── token.port.ts
│   │       │   └── services/
│   │       │       └── (pure business logic if needed)
│   │       ├── application/
│   │       │   ├── dtos/
│   │       │   │   ├── register.dto.ts
│   │       │   │   ├── login.dto.ts
│   │       │   │   └── (imported from api-contracts ideally)
│   │       │   └── use-cases/
│   │       │       ├── auth.use-case.ts
│   │       │       ├── auth.use-case.spec.ts
│   │       │       ├── api-key.use-case.ts
│   │       │       ├── api-key.use-case.spec.ts
│   │       │       ├── dataset.use-case.ts
│   │       │       ├── dataset.use-case.spec.ts
│   │       │       ├── measurement.use-case.ts
│   │       │       └── measurement.use-case.spec.ts
│   │       ├── infrastructure/
│   │       │   ├── common/
│   │       │   │   ├── interceptors/
│   │       │   │   │   └── transform.interceptor.ts
│   │       │   │   ├── filters/
│   │       │   │   │   └── domain-error.filter.ts
│   │       │   │   └── decorators/
│   │       │   │       ├── current-user.decorator.ts
│   │       │   │       └── roles.decorator.ts
│   │       │   ├── inbound/
│   │       │   │   ├── controllers/
│   │       │   │   │   ├── auth.controller.ts
│   │       │   │   │   ├── auth.controller.spec.ts
│   │       │   │   │   ├── api-key.controller.ts
│   │       │   │   │   ├── api-key.controller.spec.ts
│   │       │   │   │   ├── dataset.controller.ts
│   │       │   │   │   ├── dataset.controller.spec.ts
│   │       │   │   │   ├── measurement.controller.ts
│   │       │   │   │   └── measurement.controller.spec.ts
│   │       │   │   ├── guards/
│   │       │   │   │   ├── jwt-auth.guard.ts
│   │       │   │   │   ├── jwt-auth.guard.spec.ts
│   │       │   │   │   ├── api-key-auth.guard.ts
│   │       │   │   │   ├── api-key-auth.guard.spec.ts
│   │       │   │   │   └── roles.guard.ts
│   │       │   │   └── pipes/
│   │       │   │       └── zod-validation.pipe.ts
│   │       │   └── outbound/
│   │       │       ├── cache/
│   │       │       │   ├── redis-cache.adapter.ts
│   │       │       │   └── redis-cache.adapter.spec.ts
│   │       │       ├── http/
│   │       │       │   └── (external HTTP clients if needed)
│   │       │       └── persistence/
│   │       │           ├── prisma.module.ts
│   │       │           ├── prisma.service.ts
│   │       │           ├── prisma-user.repository.ts
│   │       │           ├── prisma-user.repository.spec.ts
│   │       │           ├── prisma-api-key.repository.ts
│   │       │           ├── prisma-api-key.repository.spec.ts
│   │       │           ├── prisma-dataset.repository.ts
│   │       │           ├── prisma-dataset.repository.spec.ts
│   │       │           ├── prisma-measurement.repository.ts
│   │       │           └── prisma-measurement.repository.spec.ts
│   │       └── app.module.ts
│   │   └── test/e2e/
│   │       └── app.e2e-spec.ts
│   ├── web/
│   │   └── src/
│   │       ├── app/
│   │       │   ├── (auth)/
│   │       │   │   ├── login/
│   │       │   │   │   ├── page.tsx
│   │       │   │   │   └── page.test.tsx
│   │       │   │   ├── register/
│   │       │   │   │   ├── page.tsx
│   │       │   │   │   └── page.test.tsx
│   │       │   │   └── forgot-password/
│   │       │   │       └── page.tsx
│   │       │   ├── (marketing)/
│   │       │   │   └── page.tsx
│   │       │   ├── dashboard/
│   │       │   │   ├── layout.tsx
│   │       │   │   ├── page.tsx
│   │       │   │   ├── loading.tsx
│   │       │   │   ├── api-keys/
│   │       │   │   │   ├── page.tsx
│   │       │   │   │   ├── page.test.tsx
│   │       │   │   │   └── create-key-modal.tsx
│   │       │   │   ├── datasets/
│   │       │   │   │   ├── page.tsx
│   │       │   │   │   └── [slug]/
│   │       │   │   │       └── page.tsx
│   │       │   │   ├── analytics/
│   │       │   │   │   └── page.tsx
│   │       │   │   └── settings/
│   │       │   │       └── page.tsx
│   │       │   ├── api/
│   │       │   │   └── auth/
│   │       │   │       └── [...nextauth]/route.ts (if using NextAuth)
│   │       │   ├── globals.css
│   │       │   ├── layout.tsx
│   │       │   ├── error.tsx
│   │       │   └── page.tsx
│   │       ├── components/
│   │       │   ├── ui/               # shadcn/ui components
│   │       │   ├── layout/
│   │       │   │   ├── sidebar.tsx
│   │       │   │   ├── header.tsx
│   │       │   │   └── mobile-nav.tsx
│   │       │   └── charts/
│   │       │       └── measurement-chart.tsx
│   │       ├── hooks/
│   │       │   ├── use-auth.ts
│   │       │   └── use-api-keys.ts
│   │       ├── lib/
│   │       │   ├── api/
│   │       │   │   └── client.ts
│   │       │   └── utils.ts
│   │       ├── providers/
│   │       │   └── query-provider.tsx
│   │       ├── stores/
│   │       │   └── auth-store.ts
│   │       └── types/
│   │           └── next-auth.d.ts
│   └── ingestion/
│       ├── src/
│       │   ├── __init__.py
│       │   ├── config/
│       │   │   └── settings.py
│       │   ├── extractors/
│       │   │   ├── eea/
│       │   │   │   ├── __init__.py
│       │   │   │   └── eea_extractor.py
│       │   │   ├── eurostat/
│       │   │   │   ├── __init__.py
│       │   │   │   └── eurostat_extractor.py
│       │   │   └── copernicus/
│       │   │       ├── __init__.py
│       │   │       └── copernicus_extractor.py
│       │   ├── transformers/
│       │   │   ├── __init__.py
│       │   │   └── measurement_transformer.py
│       │   ├── loaders/
│       │   │   ├── __init__.py
│       │   │   └── postgres_loader.py
│       │   ├── models/
│       │   │   ├── __init__.py
│       │   │   └── measurement.py
│       │   ├── ports/
│       │   │   ├── __init__.py
│       │   │   ├── base.py
│       │   │   ├── extractor.py
│       │   │   ├── transformer.py
│       │   │   └── loader.py
│       │   └── orchestrator/
│       │       ├── __init__.py
│       │       └── pipeline.py
│       └── tests/
│           ├── conftest.py
│           ├── fixtures/
│           │   └── api_responses.py
│           ├── unit/
│           │   ├── extractors/
│           │   │   ├── test_eea_extractor.py
│           │   │   ├── test_eurostat_extractor.py
│           │   │   └── test_copernicus_extractor.py
│           │   ├── transformers/
│           │   │   └── test_measurement_transformer.py
│           │   └── loaders/
│           │       └── test_postgres_loader.py
│           └── integration/
│               └── test_etl_pipeline.py
├── libs/
│   ├── api-contracts/
│   │   └── src/
│   │       ├── index.ts
│   │       └── lib/
│   │           ├── dtos/
│   │           │   └── pagination.dto.ts
│   │           └── schemas/
│   │               ├── dataset.schema.ts
│   │               ├── measurement.schema.ts
│   │               ├── auth.schema.ts
│   │               └── api-key.schema.ts
│   └── shared/
│       ├── types/
│       │   └── src/lib/
│       │       └── api-response.types.ts
│       ├── errors/
│       │   └── src/lib/
│       │       └── domain-errors.ts
│       └── utils/
│           └── src/lib/
│               └── (shared utilities)
├── prisma/
│   ├── schema.prisma
│   ├── migrations/
│   └── seeds/
│       └── seed.ts
├── docker/
│   ├── api.Dockerfile
│   ├── web.Dockerfile
│   └── ingestion.Dockerfile
├── docs/
│   ├── architecture/
│   │   └── hexagonal-flow.md
│   └── api/
│       └── openapi-notes.md
├── .github/
│   └── workflows/
│       └── ci.yml
├── tools/
│   └── generators/
│       └── api-feature/
│           └── (Nx generator for new API features)
├── .env.example
├── docker-compose.yml
├── nx.json
├── package.json
├── tsconfig.base.json
├── jest.preset.js
└── TDD_MUSCLE_MEMORY_GUIDE.md   <-- you are here
```

---

## Final Words

Every time you feel the urge to paste generated code, open this guide to the current phase and **type it yourself**. Feel the friction. That's your brain building the grooves.

You are not done when the code works. You are done when:
1. Every function has a test.
2. Every test was red before it was green.
3. You can delete any adapter and replace it without touching domain logic.
4. You can explain why each file lives where it lives.

Now close this file, pick Phase 1, and write the first failing test.

**Go.**
