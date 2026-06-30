<div align="center">

# Data-Mesh

**A Data-as-a-Service (DaaS) platform for EU environmental datasets**

Ingest · Normalize · Cache · Serve — a unified, rate-limited gateway over fragmented European open-data sources.

[Overview](#overview) ·
[Architecture](#architecture) ·
[Features](#key-features) ·
[Stack](#technology-stack) ·
[Getting Started](#getting-started) ·
[Development](#development) ·
[Contributing](#contributing)

</div>

---

## Overview

Data-Mesh is a backend-first platform that turns scattered EU environmental open-data sources into a single, clean, authenticated REST API. It pulls raw datasets from public European agencies, normalizes them into a consistent schema, caches hot paths in Redis, and exposes them through a versioned, rate-limited HTTP API backed by PostgreSQL.

The platform is composed of three cooperating services inside an Nx monorepo:

| Service | Responsibility | Port |
| --- | --- | --- |
| **`apps/api`** | NestJS + Fastify REST API — auth, rate limiting, dataset & measurement queries | `3000` |
| **`apps/web`** | Next.js 14 dashboard — browse datasets, manage API keys, monitor ingestion | `4200` |
| **`apps/ingestion`** | Python 3.12 ETL pipeline — extract from EU sources, transform with Polars, load into Postgres | — |

### Data Sources

| Source | Provider | Data Types |
| --- | --- | --- |
| **EEA** | European Environment Agency | Air quality, biodiversity |
| **Eurostat** | EU Statistical Office | Emissions, energy |
| **Copernicus** | Climate Change Service | Temperature, precipitation |

---

## Architecture

Data-Mesh follows **Hexagonal Architecture (Ports & Adapters)** in the API. The domain layer is pure TypeScript with zero framework dependencies; all I/O is isolated behind interfaces (ports) that infrastructure adapters implement. This keeps business logic testable, swappable, and insulated from changes in databases, caches, or HTTP frameworks.

```
┌─────────────────────────────────────────────────────────────────┐
│                        Nx Monorepo                              │
│                                                                 │
│  ┌──────────────┐    ┌─────────────────────────────────────┐   │
│  │  apps/web    │    │           apps/api                  │   │
│  │  (Next.js)   │───▶│        (NestJS + Fastify)           │   │
│  │  Port 4200   │    │  ┌──────────────────────────────┐  │   │
│  └──────────────┘    │  │  Infrastructure (Inbound)    │  │   │
│                       │  │  Controllers · Guards · Pipes│  │   │
│  ┌──────────────┐    │  ├──────────────────────────────┤  │   │
│  │apps/ingestion│    │  │  Application (Use Cases)     │  │   │
│  │  (Python ETL)│    │  ├──────────────────────────────┤  │   │
│  │  Polars+HTTPX│    │  │  Domain (Entities + Ports)   │  │   │
│  └──────┬───────┘    │  ├──────────────────────────────┤  │   │
│         │            │  │  Infrastructure (Outbound)   │  │   │
│         │            │  │  Prisma · Redis · HTTP Client│  │   │
│         │            │  └──────────────────────────────┘  │   │
│         │            └─────────────────────────────────────┘   │
│         ▼                          ▼                           │
│    ┌──────────┐              ┌─────────────┐                   │
│    │PostgreSQL│              │    Redis     │                   │
│    │   (16)   │              │ (cache+RL)  │                   │
│    └──────────┘              └─────────────┘                   │
└─────────────────────────────────────────────────────────────────┘
```

Shared code lives in `libs/` and is consumed by both the API and Web apps through TypeScript path aliases, guaranteeing end-to-end type safety:

- **`@data-mesh/api-contracts`** — Zod schemas + inferred types, used by the API for validation and by Web to parse responses.
- **`@data-mesh/shared-types`** — Pure TS interfaces (`Dataset`, `Measurement`, `AuthTokens`, `ApiKey`, `PaginatedResponse<T>`).
- **`@data-mesh/shared-errors`** — Typed domain errors mapped to HTTP status codes via exception filters.

### Dependency Direction

ESLint enforces scope-based module boundaries so dependencies only ever point inward:

```
apps/web  ─┐
           ├─▶  libs/shared + libs/api-contracts  ◀─  apps/api
apps/api  ─┘
```

- `scope:shared` may only depend on `scope:shared`
- `scope:api` / `scope:web` may depend on `scope:shared` + `scope:api-contracts`

---

## Key Features

- **Unified data gateway** — one consistent REST surface over EEA, Eurostat, and Copernicus.
- **Hexagonal architecture** — domain logic decoupled from frameworks, databases, and caches.
- **API-key authentication** with per-key rate limits, active/expiry flags, and usage tracking.
- **JWT auth** — short-lived access tokens (role-embedded) + refresh tokens.
- **Redis-backed caching & rate limiting** — hot-path caching and per-window throttling.
- **Shared contracts** — Zod schemas validated at every architectural boundary, shared API ↔ Web.
- **Automated ETL** — Python pipeline with retries (`tenacity`), structured logging, and ISO country validation.
- **Strict type safety** — `strict: true`, no `any`, no unchecked `unknown`, explicit return types everywhere.
- **TDD by convention** — Red → Green → Refactor enforced across all three services.
- **CI/CD** — GitHub Actions runs lint, type-check, tests (80% coverage gate), and Prisma validation on every push.

---

## Technology Stack

| Layer | Technology |
| --- | --- |
| Monorepo | Nx 18 (integrated) |
| API | NestJS + Fastify, Hexagonal Architecture |
| API Docs | `@nestjs/swagger` (Swagger UI + OpenAPI JSON) |
| Frontend | Next.js 14 (App Router), Tailwind CSS, Shadcn UI |
| ETL | Python 3.12, Polars, HTTPX, Pydantic, Tenacity |
| Database | PostgreSQL 16 via Prisma ORM (Prisma 7) |
| Cache / Rate-limit | Redis (ioredis; Upstash-compatible) |
| Auth | JWT (access + refresh tokens) |
| Validation | Zod at all boundaries |
| Testing (TS) | Jest + `@swc-node/jest` |
| Testing (Python) | Pytest, respx, pytest-mock, pytest-cov |
| Lint / Format | ESLint (strict), Prettier, Ruff, Mypy (`--strict`) |
| CI/CD | GitHub Actions |
| Containers | Docker + Docker Compose (multi-stage builds) |

---

## Repository Structure

```
Data-Mesh/
├── apps/
│   ├── api/                          # NestJS — Hexagonal Architecture
│   │   └── src/app/
│   │       ├── domain/               # Entities + Ports (interfaces, zero deps)
│   │       │   ├── ports/inbound/    # Use-case interfaces
│   │       │   └── ports/outbound/   # Repository/cache/token interfaces
│   │       ├── application/          # Use-cases, DTOs
│   │       └── infrastructure/       # Controllers, Prisma, Redis adapters
│   ├── web/                          # Next.js dashboard
│   └── ingestion/                    # Python ETL service
│       └── src/
│           ├── extractors/           # HTTPX EU API clients
│           ├── transformers/         # Polars normalisation
│           ├── loaders/              # PostgreSQL writers
│           ├── models/               # Pydantic domain models
│           └── ports/                # Abstract base classes
├── libs/
│   ├── api-contracts/                # Zod schemas shared by API + Web
│   └── shared/
│       ├── types/                    # Pure TS types (no runtime)
│       ├── errors/                   # Typed domain errors
│       └── utils/                    # Shared utilities
├── prisma/                           # Schema + migrations
├── docker/                           # Per-service multi-stage Dockerfiles
├── docs/                             # Onboarding, architecture, TDD guides
└── .github/workflows/                # CI/CD pipelines
```

---

## Getting Started

### Prerequisites

| Tool | Version |
| --- | --- |
| Node.js | ≥ 20 |
| npm | ≥ 10 |
| Python | ≥ 3.12 |
| Docker + Docker Compose | Latest |

### 1. Clone & install

```bash
git clone https://github.com/your-org/data-mesh.git
cd data-mesh
npm install
```

### 2. Configure environment

```bash
cp .env.example .env
# Edit .env with your DATABASE_URL, REDIS_URL, JWT secrets, etc.
```

### 3. Start infrastructure

```bash
npm run docker:up          # Postgres + Redis + app services
# or, just the data layer:
npm run docker:up:infra    # Postgres + Redis only
```

### 4. Run database migrations

```bash
npm run prisma:migrate:dev
```

### 5. Start development servers

```bash
npm run dev                # API + Web concurrently
# or individually:
npm run api:dev            # API  → http://localhost:3000
npm run web:dev            # Web  → http://localhost:4200
npm run ingestion:run      # Python ETL pipeline
```

### Verify the stack

```bash
npm run health             # Checks Postgres, Redis, API, and Web
```

---

## API Documentation

Once the API is running, interactive docs are available at:

- **Swagger UI** → `http://localhost:3000/api/docs`
- **OpenAPI JSON** → `http://localhost:3000/api/docs-json`

All routes are served under the global prefix `api/v1`.

### Data Model

| Model | Description |
| --- | --- |
| `User` | `ADMIN` / `DEVELOPER` roles; owns API keys |
| `ApiKey` | Hashed key, per-key rate limit, active/expiry flags |
| `Dataset` | Slug, name, source (`EEA` / `EUROSTAT` / `COPERNICUS`), tags |
| `Measurement` | Belongs to a Dataset; ISO country, region, recordedAt, value, raw metadata |
| `IngestionRun` | Tracks ETL runs per dataset slug with status, rows written, errors |

---

## Development

### Common commands

| Command | Purpose |
| --- | --- |
| `npm run dev` | Run API + Web dev servers concurrently |
| `npm run build` | Build API + Web for production |
| `npm test` | Run all TypeScript tests via Nx |
| `npm run lint` | Lint all projects via Nx |
| `npm run format` | Format the repo with Prettier |
| `npm run api:test` | Run API tests (80% coverage gate) |
| `npm run ingestion:test` | Run Python tests (`pytest --cov`) |
| `npm run ingestion:lint` | Lint Python with Ruff |
| `npm run ingestion:typecheck` | Type-check Python with Mypy (`--strict`) |
| `npm run prisma:studio` | Browse the database in a GUI |
| `npm run docker:down` | Stop all containers |

### Test-Driven Development

This project enforces strict TDD. Every feature follows:

```
RED       → Write the failing test first
RUN       → Confirm it fails for the right reason
GREEN     → Write the minimum code to pass
RUN       → Confirm it passes
REFACTOR  → Clean up while keeping tests green
```

Coverage thresholds of **80%** are enforced in both Jest and Pytest configurations and checked in CI.

### Code Conventions

- `any` is **forbidden** (ESLint error). Unchecked `unknown` is also forbidden.
- Every Port, Entity, and DTO must be explicitly typed with explicit return types.
- All third-party / external data must pass through a Zod schema at architectural boundaries.
- The domain layer has **zero** framework imports.
- Dependency direction is enforced via ESLint module-boundary scope tags.

---

## CI/CD

GitHub Actions runs three parallel jobs on every push and pull request:

1. **TypeScript** — `npm ci`, `tsc --noEmit`, `nx affected` lint + test with coverage → Codecov.
2. **Python** — install dev deps, `ruff check`, `mypy --strict`, `pytest --cov-fail-under=80` → Codecov.
3. **Prisma** — PostgreSQL 16 service container, `prisma validate`, migration dry-run.

All services ship as multi-stage Docker images (`docker/api.Dockerfile`, `web.Dockerfile`, `ingestion.Dockerfile`) with non-root runtime users.

---

## Documentation

| Guide | Contents |
| --- | --- |
| [`docs/ONBOARDING_WALKTHROUGH.md`](docs/ONBOARDING_WALKTHROUGH.md) | Setup, folder map, Nx concepts, hexagonal model, TDD protocol, build phases |
| [`docs/PRISMA_WALKTHROUGH.md`](docs/PRISMA_WALKTHROUGH.md) | Schema anatomy, migrate workflow, NestJS integration, troubleshooting |
| [`docs/architecture/HEXAGONAL_ARCHITECTURE_CODE_GUIDE.md`](docs/architecture/HEXAGONAL_ARCHITECTURE_CODE_GUIDE.md) | Entities, ports, adapters, use cases, controllers, guards, filters |
| [`docs/architecture/TDD_MUSCLE_MEMORY_GUIDE.md`](docs/architecture/TDD_MUSCLE_MEMORY_GUIDE.md) | Red-Green-Refactor across all three services |

---

## Contributing

1. Create a feature branch from `main`.
2. Follow the TDD workflow for every change.
3. Ensure `npm run lint`, type-checks, and tests all pass locally.
4. Maintain the 80% coverage threshold.
5. Keep the domain layer free of framework dependencies.
6. Open a pull request with a clear description of the change.

---

## License

MIT © Data-Mesh Team
