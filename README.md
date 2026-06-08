# Data-Mesh 🌍

> **Data-as-a-Service** — Ingest, normalize, cache, and serve EU Environmental public datasets via a clean, rate-limited API.

---

## Architecture Overview

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
│         │                          │                            │
│         ▼                          ▼                            │
│    ┌─────────┐              ┌─────────────┐                    │
│    │PostgreSQL│              │    Redis     │                    │
│    │  (16)   │              │  (Upstash)  │                    │
│    └─────────┘              └─────────────┘                    │
└─────────────────────────────────────────────────────────────────┘
```

## Stack

| Layer | Technology |
|---|---|
| Monorepo | Nx 18 (Integrated) |
| API | NestJS 10, Fastify, Hexagonal Architecture |
| Frontend | Next.js 14 (App Router), Tailwind CSS, Shadcn UI |
| ETL | Python 3.12, Polars, HTTPX |
| Database | PostgreSQL 16 via Prisma ORM |
| Cache / Rate-limit | Redis (Upstash) |
| Auth | JWT (access + refresh tokens) |
| Testing (TS) | Jest, `@swc-node/jest` |
| Testing (Python) | Pytest, respx, pytest-mock |
| CI/CD | GitHub Actions |
| Containers | Docker + Docker Compose |

---

## Project Structure

```
DataMesh/
├── apps/
│   ├── api/                          # NestJS — Hexagonal Architecture
│   │   └── src/app/
│   │       ├── domain/               # Entities, Ports (interfaces)
│   │       ├── application/          # Use-cases, DTOs
│   │       └── infrastructure/       # Controllers, Prisma, Redis adapters
│   ├── web/                          # Next.js dashboard
│   └── ingestion/                    # Python ETL service
│       ├── src/
│       │   ├── extractors/           # HTTPX EU API clients
│       │   ├── transformers/         # Polars normalisation
│       │   ├── loaders/              # PostgreSQL writers
│       │   ├── models/               # Pydantic domain models
│       │   └── ports/                # Abstract base classes
│       └── tests/
├── libs/
│   ├── shared/types/                 # Pure TS types (no runtime)
│   ├── shared/errors/                # Typed domain errors
│   └── api-contracts/                # Zod schemas shared by API + Web
├── prisma/                           # Schema + migrations
├── docker/                           # Per-service Dockerfiles
└── .github/workflows/                # CI/CD pipelines
```

---

## Getting Started

### Prerequisites

| Tool | Version |
|---|---|
| Node.js | ≥ 20 |
| Python | ≥ 3.12 |
| Docker + Docker Compose | Latest |
| npm | ≥ 10 |

### 1. Clone and install

```bash
git clone https://github.com/your-org/data-mesh.git
cd data-mesh
npm install
```

### 2. Configure environment

```bash
cp .env.example .env
# Edit .env with your values
```

### 3. Start infrastructure

```bash
npm run docker:up
```

### 4. Run database migrations

```bash
npm run prisma:migrate:dev
```

### 5. Start development servers

```bash
# NestJS API  → http://localhost:3000
npm run api:dev

# Next.js Web → http://localhost:4200
npm run web:dev
```

---

## TDD Protocol

This project enforces **strict Test-Driven Development**:

```
RED   → Write the failing test first
RUN   → Confirm it fails
GREEN → Write minimum code to pass
RUN   → Confirm it passes
REFACTOR → Clean up, keep tests green
```

**Run tests:**

```bash
# NestJS (affected only)
npx nx affected --target=test

# All TS projects with coverage
npm run test

# Python (from apps/ingestion)
pytest --cov=src
```

---

## API Docs

Once the API is running, visit:

- **Swagger UI** → `http://localhost:3000/api/docs`
- **OpenAPI JSON** → `http://localhost:3000/api/docs-json`

---

## TypeScript Rules

- ❌ `any` is **forbidden** (ESLint error)
- ❌ `unknown` without explicit narrowing is **forbidden**
- ✅ Every Port (interface), Entity, and DTO must be explicitly typed
- ✅ All third-party data must pass through a Zod schema at architectural boundaries

---

## Data Sources

| Source | Description |
|---|---|
| [EEA](https://www.eea.europa.eu) | European Environment Agency — air quality, biodiversity |
| [Eurostat](https://ec.europa.eu/eurostat) | EU Statistical Office — emissions, energy |
| [Copernicus](https://climate.copernicus.eu) | Climate Change Service — temperature, precipitation |

---

## License

MIT © Data-Mesh Team
