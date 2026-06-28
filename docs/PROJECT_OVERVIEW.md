# Data-Mesh — Project Overview & Tech Stack

> **Data-as-a-Service (DaaS)** platform that ingests, normalizes, caches, and serves EU environmental public datasets through a clean, rate-limited HTTP API. It acts as a unified gateway over fragmented EU open-data sources.

---

## 1. Project Purpose & Context

Data-Mesh is a unified gateway over fragmented EU open-data sources. It ingests public environmental datasets, normalizes and caches them, then exposes them through a clean, rate-limited REST API.

### Data Sources

| Data Source | Provider | Data Types |
|---|---|---|
| **EEA** | European Environment Agency | Air quality, biodiversity |
| **Eurostat** | EU Statistical Office | Emissions, energy |
| **Copernicus** | Climate Change Service | Temperature, precipitation |

### System Composition

Three cooperating services share a PostgreSQL database and Redis cache:

1. **API** (NestJS) — REST gateway with rate limiting, auth, and Zod-validated contracts
2. **Web** (Next.js) — Developer dashboard
3. **Ingestion** (Python) — ETL pipeline that fetches and loads EU datasets

### Maturity

Currently at an **early scaffolding stage**: the monorepo structure, Nx config, Prisma schema/migration, shared libs, and CI pipeline are all in place. Most feature code remains to be written following a strict TDD workflow. The only implemented API code is the Prisma service/module; the Python ETL pipeline and domain/use-case layers are scaffolded but await TDD-driven implementation.

---

## 2. Repository Structure

```
Data-Mesh/
├── apps/
│   ├── api/            # NestJS + Fastify REST API (port 3000)
│   ├── web/            # Next.js 14 dashboard (port 4200)
│   └── ingestion/      # Python 3.12 ETL pipeline
├── libs/
│   ├── api-contracts/  # Zod schemas + inferred TS types (shared by API & Web)
│   └── shared/
│       ├── types/      # Pure TS types/interfaces
│       ├── errors/     # Typed, serializable domain error classes
│       └── utils/      # Shared utility functions
├── prisma/             # Schema, migrations, lock file
├── docker/             # Per-service multi-stage Dockerfiles
├── docs/               # Onboarding, architecture, and TDD guides
└── .github/workflows/  # CI pipeline
```

### `apps/api` — Hexagonal Architecture (Ports & Adapters)

```
src/app/
├── domain/              # Pure TypeScript — zero framework deps
│   ├── entities/
│   └── ports/
│       ├── inbound/     # Use-case interfaces (IGetDatasetUseCase...)
│       └── outbound/    # Repository/cache interfaces (IDatasetRepository...)
├── application/         # Use-case implementations + DTOs (not yet built)
└── infrastructure/
    ├── inbound/         # Controllers, guards, pipes (not yet built)
    └── outbound/
        └── persistence/ # PrismaModule + PrismaService (IMPLEMENTED)
```

- `main.ts` — Fastify bootstrap, global prefix `api/v1`, Swagger at `/api/docs`, CORS
- `app.module.ts` — Root module with `ThrottlerModule` (rate limiting)
- `prisma.service.ts` — Wraps `PrismaClient`, connects/disconnects on lifecycle hooks
- `prisma.module.ts` — `@Global()` module exporting `PrismaService`

### `apps/web` — Next.js 14 Dashboard

- App Router, standalone output, typed routes
- `layout.tsx` — Root layout with Inter font, SEO metadata
- `globals.css` — Dark-themed design system (HSL tokens, Inter/JetBrains Mono fonts)
- `next.config.js` — transpiles shared libs for the browser bundle

### `apps/ingestion` — Python ETL

- `src/config/settings.py` — `pydantic-settings` `Settings` (DB URL, EU API base URLs, timeouts)
- `src/models/measurement.py` — Pydantic models with ISO 3166-1 alpha-2 country validation
- `src/ports/base.py` — Abstract bases: `BaseExtractor`, `BaseTransformer`, `BaseLoader`
- `extractors/`, `transformers/`, `loaders/`, `orchestrator/` — placeholder directories

### `libs/` — Shared Libraries

| Library | Package | Purpose |
|---|---|---|
| `api-contracts` | `@data-mesh/api-contracts` | Zod schemas + inferred TS types (auth, API keys, datasets, pagination) |
| `shared/types` | `@data-mesh/shared-types` | Pure TS types — `PaginatedResponse<T>`, `Dataset`, `Measurement`, `UserProfile`, `AuthTokens`, `ApiKey` |
| `shared/errors` | `@data-mesh/shared-errors` | `DomainError`, `NotFoundError`, `ConflictError`, `UnauthorizedError`, `ForbiddenError`, `ValidationError` |
| `shared/utils` | `@data-mesh/shared-utils` | Shared utility functions (declared, not yet populated) |

### `prisma/` — Database Schema & Migrations

- `schema.prisma` — 5 models, 3 enums, PostgreSQL provider, `prisma-client-js` generator
- `migrations/` — Full `CREATE TABLE` + indexes + foreign keys for all 5 tables
- `migration_lock.toml` — Locks provider to `postgresql`

### `docker/` — Per-Service Dockerfiles (multi-stage)

| Dockerfile | Base Image | Stages | Runtime User |
|---|---|---|---|
| `api.Dockerfile` | `node:20-alpine` | deps → builder (nx build) → runner | `nestjs:nodejs` |
| `web.Dockerfile` | `node:20-alpine` | deps → builder (nx build, standalone) → runner | `nextjs:nodejs` |
| `ingestion.Dockerfile` | `python:3.12-slim` | builder (hatch/pip install) → runner | `ingestion:ingestion` |

### `docs/` — Documentation

| File | Content |
|---|---|
| `ONBOARDING_WALKTHROUGH.md` | Prerequisites, setup, folder map, Nx concepts, hexagonal mental model, TDD protocol, 6-phase build order, env reference, command cheatsheet |
| `PRISMA_WALKTHROUGH.md` | Schema anatomy, migrate workflow, client usage, NestJS integration, troubleshooting, v6 upgrade notes |
| `architecture/HEXAGONAL_ARCHITECTURE_CODE_GUIDE.md` | 12-step code guide: entities, ports, adapters, use cases, controllers, guards, pipes, filters, modules, Redis cache adapter |
| `architecture/TDD_MUSCLE_MEMORY_GUIDE.md` | 13-phase TDD guide enforcing Red-Green-Refactor across all three services |

---

## 3. Complete Tech Stack

### Languages

| Language | Version | Where |
|---|---|---|
| TypeScript | ^5.4.0 (target ES2022, `strict: true`) | API, Web, Libs |
| Python | ≥3.12 | Ingestion |
| SQL | PostgreSQL dialect | Migrations (auto-generated) |

### Backend (API)

| Technology | Version | Purpose |
|---|---|---|
| NestJS | ^10.3.0 | API framework |
| `@nestjs/platform-fastify` | ^10.3.0 | Fastify HTTP adapter |
| `@nestjs/swagger` | ^7.3.0 | OpenAPI/Swagger UI generation |
| `@nestjs/throttler` | ^5.1.0 | Rate limiting (Redis-backed) |
| `@prisma/client` | ^7.8.0 | Type-safe ORM client |
| `ioredis` | ^5.3.2 | Redis client (cache + rate limiting) |
| `better-auth` | ^1.6.14 | Auth library |
| `reflect-metadata` | ^0.1.14 | NestJS decorator metadata |
| `rxjs` | ^7.8.1 | Reactive extensions (NestJS dependency) |
| `zod` | ^3.22.4 | Schema validation at all boundaries |

### Frontend (Web)

| Technology | Purpose |
|---|---|
| Next.js 14 | App Router, standalone output, typed routes |
| Tailwind CSS | Styling |
| Shadcn UI | Component library |
| Inter font (Google Fonts) | Typography |
| `transpilePackages` | Compiles `@data-mesh/shared-types` and `@data-mesh/api-contracts` for browser |

### ETL (Ingestion — Python)

| Dependency | Version | Purpose |
|---|---|---|
| `polars` | ≥1.3.0 | DataFrame operations (transformation) |
| `httpx` | ≥0.27.0 | Async HTTP client (EU API fetching) |
| `psycopg[binary]` | ≥3.1.0 | PostgreSQL async driver (loading) |
| `python-dotenv` | ≥1.0.0 | Env file loading |
| `pydantic` | ≥2.6.0 | Data validation models |
| `pydantic-settings` | ≥2.2.0 | Typed settings from env |
| `structlog` | ≥24.1.0 | Structured logging |
| `tenacity` | ≥8.2.0 | Retry logic for HTTP calls |

### Databases & Infrastructure

| Technology | Version | Purpose |
|---|---|---|
| PostgreSQL | 16 (alpine) | Primary database |
| Redis | 7 (alpine) | Cache + rate limiting |
| Upstash Redis | (compatible) | Production Redis (REST API) |
| Docker Compose | v3.9 | Local dev orchestration |

### Monorepo & Build Tooling

| Tool | Version | Purpose |
|---|---|---|
| Nx | ^18.2.0 | Integrated monorepo management |
| `@nx/nest` | ^18.2.0 | NestJS generators/executors |
| `@nx/next` | ^18.2.0 | Next.js generators/executors |
| `@nx/jest` | ^18.2.0 | Jest test executor |
| `@nx/eslint` | ^18.2.0 | ESLint executor |
| `@nx/js`, `@nx/node`, `@nx/workspace` | ^18.2.0 | Core Nx plugins |
| `@swc/core` + `@swc-node/register` + `@swc-node/jest` | ^1.4.0 / ^1.8.0 | Fast TS compilation |
| Hatch (hatchling) | — | Python build backend |

### Testing

| Tool | Version | Purpose |
|---|---|---|
| Jest | ^29.7.0 | TS unit testing |
| `ts-jest` | ^29.1.0 | TS Jest transformer |
| `jest-environment-node` | ^29.7.0 | Node test environment |
| Pytest | ≥8.0.0 | Python testing |
| `pytest-asyncio` | ≥0.23.0 | Async test support |
| `pytest-cov` | ≥5.0.0 | Coverage reporting (80% threshold) |
| `pytest-mock` | ≥3.14.0 | Mocking |
| `respx` | ≥0.21.0 | HTTPX request mocking |
| Codecov | v4 action | Coverage upload (CI) |

### Linting & Formatting

| Tool | Version | Purpose |
|---|---|---|
| ESLint | ^8.57.0 | TS/JS linting |
| `@typescript-eslint/eslint-plugin` + parser | ^7.0.0 | TypeScript-specific rules |
| `eslint-config-prettier` | ^9.1.0 | Prettier compatibility |
| Prettier | ^3.2.0 | Code formatting |
| Ruff | ≥0.3.0 | Python linting |
| Mypy | ≥1.9.0 | Python type checking (`--strict`) |

### CI/CD

| Tool | Purpose |
|---|---|
| GitHub Actions | CI pipeline (lint, type-check, test, Prisma validation) |
| `actions/checkout@v4` | Source checkout |
| `actions/setup-node@v4` | Node setup |
| `actions/setup-python@v5` | Python setup |
| `codecov/codecov-action@v4` | Coverage upload |

---

## 4. How the Parts Connect

### Monorepo Dependency Graph

```
                    ┌──────────────────────────────────────────────┐
                    │              Shared Libraries                 │
                    │                                               │
                    │  @data-mesh/shared-types  (pure TS types)     │
                    │  @data-mesh/shared-errors (error classes)     │
                    │  @data-mesh/api-contracts (Zod schemas+types) │
                    └──────┬──────────────────────┬─────────────────┘
                           │                      │
              ┌────────────▼────────┐  ┌──────────▼──────────┐
              │     apps/api        │  │     apps/web        │
              │  (NestJS + Fastify) │  │  (Next.js)          │
              │  Port 3000          │  │  Port 4200          │
              │  ┌───────────────┐  │  │  ┌───────────────┐  │
              │  │  Domain       │  │  │  │  Fetches API  │  │
              │  │  (no deps)    │  │  │  │  validates    │  │
              │  ├───────────────┤  │  │  │  with Zod     │  │
              │  │  Application  │  │  │  │  schemas      │  │
              │  │  (use cases)  │  │  │  └───────────────┘  │
              │  ├───────────────┤  │  └─────────────────────┘
              │  │ Infrastructure│  │
              │  │ (Prisma/Redis)│  │
              │  └───────────────┘  │
              └────────┬────────────┘
                       │
              ┌────────▼────────┐
              │   PostgreSQL    │  ←── apps/ingestion (Python ETL)
              │     (v16)       │       writes measurements here
              └─────────────────┘
                       │
              ┌────────▼────────┐
              │     Redis       │  ←── apps/api (cache + rate limit)
              │      (v7)       │
              └─────────────────┘
```

### Key Connection Points

1. **Shared contracts** (`libs/api-contracts`): Both `apps/api` and `apps/web` import the same Zod schemas. The API uses them in validation pipes; the web app uses them to parse API responses — guaranteeing end-to-end type safety.
2. **Shared errors** (`libs/shared/errors`): The API imports domain error classes and maps them to HTTP status codes via exception filters.
3. **Shared types** (`libs/shared/types`): Pure interfaces used across both apps.
4. **TypeScript path aliases** (`tsconfig.base.json`): `@data-mesh/shared-types`, `@data-mesh/shared-utils`, `@data-mesh/shared-errors`, `@data-mesh/api-contracts` → `libs/` source.
5. **ESLint module boundaries** (`.eslintrc.json`): Enforces dependency direction via `scope` tags:
   - `scope:api` → may depend on `scope:shared` + `scope:api-contracts`
   - `scope:web` → may depend on `scope:shared` + `scope:api-contracts`
   - `scope:shared` → may only depend on `scope:shared`
6. **Database sharing**: The API reads/writes via Prisma; ingestion writes directly via `psycopg`. Both share the same PostgreSQL tables defined by the Prisma schema.
7. **Docker Compose** orchestrates all 5 services with health-check dependencies: `api` depends on `postgres` + `redis` (healthy); `web` depends on `api`; `ingestion` depends on `postgres` + `redis` (healthy).
8. **Next.js transpilation**: `next.config.js` uses `transpilePackages` so shared libs work in the browser bundle.

### Data Model (Prisma Schema → 5 tables)

| Model | Table | Key Fields | Relations |
|---|---|---|---|
| `User` | `users` | id (cuid), email (unique), passwordHash, name, role (ADMIN/DEVELOPER) | has many ApiKey |
| `ApiKey` | `api_keys` | id, keyHash (unique), name, rateLimit (default 100), isActive, lastUsed, expiresAt | belongs to User (cascade delete) |
| `Dataset` | `datasets` | id, slug (unique), name, source (EEA/EUROSTAT/COPERNICUS), description, unit, tags[] | has many Measurement |
| `Measurement` | `measurements` | id, datasetId, country (ISO alpha-2), region, recordedAt, value, rawMetadata (JSON) | belongs to Dataset (cascade delete) |
| `IngestionRun` | `ingestion_runs` | id, datasetSlug, status (RUNNING/SUCCESS/FAILED), rowsWritten, errorMsg, startedAt, finishedAt | standalone (tracked by slug) |

**Indexes:** `api_keys(user_id)`, `datasets(slug)`, `measurements(dataset_id, country, recorded_at)`, `ingestion_runs(dataset_slug, status)`.

---

## 5. Build & Tooling Setup

### Package Manager

- **npm** (≥10) with `package-lock.json` — single root `package.json` manages all TS dependencies
- Python dependencies managed separately via `apps/ingestion/pyproject.toml` (Hatchling backend, `pip install -e ".[dev]"`)

### Nx Configuration (`nx.json`)

- `defaultBase: "main"` — default git branch for `affected` commands
- **Named inputs**: `default` (all project files + shared globals), `production` (excludes test/spec files)
- **Target defaults**: `build` (depends on `^build`, cached), `test` (cached), `lint` (cached), `e2e` (cached)
- **Generators**: `@nx/nest` (strict), `@nx/next` (CSS style, ESLint)
- No plugins registered (traditional `project.json` approach)

### Per-App Targets

| App | build | serve | test | lint |
|---|---|---|---|---|
| `api` | `@nx/node:build` → `dist/apps/api` | `@nx/node:node` | `@nx/jest:jest` (80% coverage) | `@nx/eslint:lint` |
| `web` | `@nx/next:build` → `dist/apps/web` | `@nx/next:server` (port 4200) | `@nx/jest:jest` | `@nx/eslint:lint` |

### Key npm Scripts

| Script | Purpose |
|---|---|
| `dev` | Concurrently runs api + web dev servers |
| `build` | `nx build api && nx build web` |
| `health` | Checks Postgres/Redis/API/Web health |
| `api:dev` / `web:dev` | Individual dev servers |
| `ingestion:run` | `python -m ingestion` — run ETL pipeline |
| `ingestion:test` / `ingestion:lint` / `ingestion:typecheck` | Python pytest / ruff / mypy |
| `prisma:generate` | Generate Prisma Client |
| `prisma:migrate:dev` | Create + apply migrations |
| `prisma:migrate:deploy` | Apply pending migrations (CI/prod) |
| `prisma:studio` | DB GUI browser |
| `docker:up` / `docker:down` | Container lifecycle |
| `docker:up:infra` | Start only postgres + redis |
| `test` / `lint` / `format` | Cross-project `nx run-many` |

### TypeScript Configuration (`tsconfig.base.json`)

- `strict: true`, `noImplicitAny`, `strictNullChecks`, `noImplicitReturns`, `noFallthroughCasesInSwitch`, `noUncheckedIndexedAccess`, `forceConsistentCasingInFileNames`
- Target: `ES2022`, Module: `commonjs`, `experimentalDecorators` + `emitDecoratorMetadata` (NestJS)
- Path aliases for all 4 shared libs

### Jest Configuration

- `jest.preset.js`: `@swc-node/jest` transformer, `@nx/jest` resolver, `lcov` + `text-summary` reporters
- `apps/api/jest.config.ts`: 80% coverage threshold (branches, functions, lines, statements)

### ESLint Strictness

- `@typescript-eslint/no-explicit-any: error` — **`any` is forbidden**
- `@typescript-eslint/no-unsafe-*: error` — no unsafe assignment/call/member-access/return
- `@typescript-eslint/explicit-function-return-type: error` — all functions must have explicit return types
- `@typescript-eslint/explicit-module-boundary-types: error`
- `@nx/enforce-module-boundaries: error` — enforces scope-based dependency rules

### Prisma Configuration (`prisma.config.ts`)

Uses Prisma 7's `defineConfig` API: schema at `prisma/schema.prisma`, migrations at `prisma/migrations`, datasource URL from `env("DATABASE_URL")`, loads `.env` via `dotenv/config`.

### CI Pipeline (`.github/workflows/ci.yml`)

Three parallel jobs:

1. **`typescript`** — Node 20, `npm ci`, `tsc --noEmit`, `nx affected` lint + test with coverage → Codecov
2. **`python`** — Python 3.12, `pip install -e .[dev]`, `ruff check`, `mypy --strict`, `pytest --cov-fail-under=80` → Codecov
3. **`prisma`** — PostgreSQL 16 service container, `prisma validate`, `prisma migrate deploy` (dry-run validation)

### Environment Variables (`.env.example`)

| Variable | Used By | Purpose |
|---|---|---|
| `NODE_ENV`, `PORT` | NestJS | Runtime config (port 3000) |
| `DATABASE_URL` | Prisma, psycopg | PostgreSQL connection string |
| `REDIS_URL` | ioredis | Redis connection |
| `UPSTASH_REDIS_REST_URL/TOKEN` | Production Redis | Upstash REST API |
| `JWT_SECRET`, `JWT_EXPIRY` | JWT tokens | Access token signing (15m) |
| `JWT_REFRESH_SECRET`, `JWT_REFRESH_EXPIRY` | JWT tokens | Refresh token signing (7d) |
| `RATE_LIMIT_TTL`, `RATE_LIMIT_MAX` | ThrottlerModule | 60s window, 100 requests |
| `EEA_BASE_URL`, `EUROSTAT_BASE_URL` | Python ingestion | EU API endpoints |
| `NEXT_PUBLIC_API_URL` | Next.js, CORS | API URL for frontend |
| `NEXTAUTH_SECRET`, `NEXTAUTH_URL` | NextAuth.js | Session signing (port 4200) |

---

## 6. Engineering Principles

- **Hexagonal Architecture (Ports & Adapters)** — zero framework dependencies in the domain layer
- **Strict TDD** — Red-Green-Refactor enforced for every feature across all three services
- **Zero `any`** TypeScript — enforced by ESLint
- **Zod validation at all boundaries** — request/response contracts shared between API and Web
- **80%+ test coverage** — enforced in Jest and Pytest configs
- **Scope-based module boundaries** — dependency direction enforced by ESLint
