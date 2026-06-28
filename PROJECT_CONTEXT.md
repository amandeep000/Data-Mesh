# Data-Mesh — Project Context

## What it is

**Data-Mesh** is a "Data-as-a-Service" platform: it ingests, normalizes, caches, and
serves EU environmental public datasets (air quality, biodiversity, emissions, energy,
climate) through a clean, rate-limited HTTP API. Think of it as a unified gateway over
several fragmented EU open-data sources, with a dashboard for browsing/consuming the data.

## What we're building

Three cooperating apps in an Nx monorepo:

1. **`apps/api`** — NestJS API (Hexagonal/Ports-and-Adapters architecture) that exposes
   datasets/measurements over a rate-limited, API-key-authenticated REST API, backed by
   Postgres (via Prisma) and Redis (cache + rate limiting).
2. **`apps/web`** — Next.js dashboard (App Router) for browsing datasets, managing API
   keys, and viewing ingestion status.
3. **`apps/ingestion`** — Python ETL service that pulls from EEA, Eurostat, and
   Copernicus, normalizes with Polars, and loads into Postgres.

### Data sources being integrated
- **EEA** (European Environment Agency) — air quality, biodiversity
- **Eurostat** (EU Statistical Office) — emissions, energy
- **Copernicus** (Climate Change Service) — temperature, precipitation

## Tech stack

| Layer | Technology |
|---|---|
| Monorepo tooling | Nx 18 (integrated monorepo) |
| API | NestJS 10 + Fastify adapter, Hexagonal Architecture |
| API docs | `@nestjs/swagger` (Swagger UI + OpenAPI JSON) |
| Frontend | Next.js 14 (App Router), Tailwind CSS, Shadcn UI |
| ETL | Python 3.12, Polars, HTTPX, Pydantic models |
| Database | PostgreSQL 16 via Prisma ORM (Prisma 7) |
| Cache / rate-limit | Redis (ioredis client; Upstash-compatible) |
| Auth | JWT (access + refresh tokens); `better-auth` dependency present |
| Validation | Zod schemas at all architectural/external boundaries |
| Testing (TS) | Jest + `@swc-node/jest` |
| Testing (Python) | Pytest, respx, pytest-mock |
| CI/CD | GitHub Actions |
| Containers | Docker + Docker Compose (Postgres, Redis, app services) |
| Lint/format | ESLint (strict — no `any`/unchecked `unknown`), Prettier |

## Architecture

`apps/api` follows **Hexagonal Architecture**:
```
infrastructure (inbound)  → controllers, guards, pipes
application               → use-cases, DTOs
domain                    → entities, ports (interfaces)
infrastructure (outbound) → Prisma, Redis, HTTP client adapters
```
Shared code lives in `libs/`:
- `libs/shared/types` — pure TS types, no runtime
- `libs/shared/errors` — typed domain errors
- `libs/api-contracts` — Zod schemas shared between API and Web

`apps/ingestion` mirrors the same ports-and-adapters idea in Python: `extractors/` (per
source: eea, eurostat, copernicus), `transformers/`, `loaders/`, `models/`, `ports/`.

## Data model (Prisma schema, `prisma/schema.prisma`)

- **User** (`ADMIN` / `DEVELOPER` roles) — has many `ApiKey`s
- **ApiKey** — hashed key, per-key rate limit, active/expiry flags
- **Dataset** — slug, name, `source` enum (`EEA` / `EUROSTAT` / `COPERNICUS`), tags
- **Measurement** — belongs to a `Dataset`; country (ISO 3166-1 alpha-2), region,
  recordedAt, value, raw metadata JSON
- **IngestionRun** — tracks ETL runs per dataset slug with status (`RUNNING` /
  `SUCCESS` / `FAILED`), rows written, error message

One migration applied: `20260612115807_init_environmental_datamesh`.

## Current state of the build (as of this writing)

This is **early-stage scaffolding** — the monorepo structure, Nx config, Prisma schema/
migration, and dependency set are in place, but most app code is still placeholder:

- `apps/api/src/app/infrastructure/outbound/persistence/` — Prisma module + service
  implemented (this is the only non-scaffold API code so far).
- `apps/api/src/app/domain/{entities,ports}` — only `README.ts` placeholders, no real
  entities/ports yet.
- `apps/web/src` — only default Next.js `layout.tsx`/`page.tsx`/`globals.css`; routes for
  `(auth)`, `(marketing)`, `dashboard`, `api/auth` exist as empty directories.
- `apps/ingestion/src` — `config/settings.py` and `models/measurement.py` exist;
  `extractors/`, `orchestrator/` are empty placeholders.

Recent commits: initial repository/project setup, then Prisma module/service + type
annotation updates (`66cd0da`).

## Project conventions worth knowing

- **Strict TDD** is enforced: Red → Run (confirm fail) → Green → Run (confirm pass) →
  Refactor. See `docs/architecture/TDD_MUSCLE_MEMORY_GUIDE.md`.
- **No `any`**, and no unchecked `unknown` — ESLint error.
- All third-party/external data must pass through a Zod schema at architectural
  boundaries.
- See `docs/architecture/HEXAGONAL_ARCHITECTURE_CODE_GUIDE.md`,
  `docs/ONBOARDING_WALKTHROUGH.md`, and `docs/PRISMA_WALKTHROUGH.md` for deeper guides.

## Key commands

```bash
npm run docker:up           # start Postgres + Redis (+ services)
npm run prisma:migrate:dev  # run migrations
npm run api:dev             # NestJS API → http://localhost:3000 (Swagger at /api/docs)
npm run web:dev             # Next.js Web → http://localhost:4200
npm run ingestion:run       # run Python ETL
npm test                    # run all TS tests via Nx
```
