# Data-Mesh — Developer Onboarding & Walkthrough Guide

> **Who is this for?** You've just joined the project, you know how to code,
> and you want to build real muscle memory — not copy-paste from an AI.  
> This guide tells you **what exists**, **what still needs to be done**, and
> **how to think through every step yourself**.

---

## Table of Contents

1. [Project Snapshot — What is Data-Mesh?](#1-project-snapshot)
2. [Prerequisites Checklist](#2-prerequisites-checklist)
3. [Repository Setup — What is Already Done?](#3-repository-setup)
4. [Full Folder Structure Map](#4-full-folder-structure-map)
5. [Understanding the Nx Monorepo](#5-understanding-the-nx-monorepo)
6. [Hexagonal Architecture — The Mental Model](#6-hexagonal-architecture)
7. [The Three Layers in This Codebase](#7-the-three-layers-in-this-codebase)
8. [The TDD Protocol You Must Follow](#8-the-tdd-protocol)
9. [Backend First — Step-by-Step Build Order](#9-backend-first--step-by-step-build-order)
10. [Environment Setup](#10-environment-setup)
11. [Useful Commands Cheatsheet](#11-useful-commands-cheatsheet)

---

## 1. Project Snapshot

**Data-Mesh** is a **Data-as-a-Service (DaaS)** platform. It does three things:

```
[EU Public Environmental APIs]
          │
          ▼
[Python ETL (ingestion service)]  ──→  PostgreSQL
          │
          ▼
[NestJS API (hexagonal arch)]     ←──  Redis Cache
          │
          ▼
[Next.js Dashboard (web)]
```

| Service | Tech | Location |
|---|---|---|
| Public REST API | NestJS + Fastify | `apps/api` |
| Developer Dashboard | Next.js (App Router) | `apps/web` |
| ETL Data Pipeline | Python + Polars + HTTPX | `apps/ingestion` |
| Shared Types/Contracts | TypeScript | `libs/api-contracts`, `libs/shared` |
| Database | PostgreSQL via Prisma | `prisma/` |
| Cache + Rate-Limit | Redis (Upstash) | via `ioredis` in the API |

---

## 2. Prerequisites Checklist

Before writing a single line of code, verify each tool is installed.

### Node.js & Package Manager

- [ ] **Node.js ≥ 20 LTS** — `node --version`  
  ↳ If missing: https://nodejs.org/en/download

- [ ] **npm ≥ 10** — `npm --version`  
  ↳ Ships with Node.js

### Global CLI Tools

- [ ] **Nx CLI** — `npx nx --version`  
  ↳ You do NOT need to install Nx globally. `npx nx` always works.  
  ↳ Optional global install: `npm install -g nx`

### Python

- [ ] **Python ≥ 3.12** — `python --version`  
  ↳ If missing: https://www.python.org/downloads/

- [ ] **pip / uv** — For installing Python dependencies  
  ↳ `pip --version`  
  ↳ Alternatively use `uv` (faster): `pip install uv`

### Docker

- [ ] **Docker Desktop** — `docker --version`  
  ↳ Required to run PostgreSQL and Redis locally  
  ↳ https://www.docker.com/products/docker-desktop/

- [ ] **Docker Compose** — `docker compose version`  
  ↳ Ships with Docker Desktop

### Database Tools (Optional but Recommended)

- [ ] **TablePlus** or **DBeaver** — GUI to inspect your PostgreSQL database

---

## 3. Repository Setup

### ✅ What is Already Done

The project skeleton has been scaffolded for you. Here is what exists:

| Item | Status | Notes |
|---|---|---|
| Nx Monorepo initialized | ✅ Done | `nx.json`, `package.json` present |
| `apps/api` — NestJS app | ✅ Scaffolded | Hexagonal folder structure created, `main.ts` wired |
| `apps/web` — Next.js app | ✅ Scaffolded | Folder created, `next.config.js` present |
| `apps/ingestion` — Python ETL | ✅ Scaffolded | `pyproject.toml`, folder structure present |
| `prisma/schema.prisma` | ✅ Written | All models: `User`, `ApiKey`, `Dataset`, `Measurement`, `IngestionRun` |
| `docker-compose.yml` | ✅ Written | PostgreSQL + Redis + API + Web + Ingestion |
| `.env.example` | ✅ Written | All required env vars documented |
| TypeScript config | ✅ Done | `tsconfig.base.json`, per-app configs |
| ESLint + Prettier | ✅ Done | `.eslintrc.json`, `.prettierrc` |
| Jest preset | ✅ Done | `jest.preset.js` |
| `npm` dependencies | ⚠️ Need to install | Run `npm install` |
| Python dependencies | ⚠️ Need to install | Run `pip install -e ".[dev]"` inside `apps/ingestion` |
| `.env` file | ⚠️ You must create | Copy `.env.example` → `.env` and fill in secrets |
| Prisma migration | ⚠️ Not yet run | Needs Docker up + `prisma migrate dev` |
| Feature code | ❌ Not written | **This is your job — start from Step 9** |

---

### ⚙️ First-Time Setup Steps (Do These Once)

**Step A — Install Node dependencies**
```bash
# Run from the project root
npm install
```
This installs everything in `package.json` — NestJS, Prisma, Nx plugins, etc.

---

**Step B — Copy the environment file**
```bash
# Windows PowerShell
Copy-Item .env.example .env
```
Then open `.env` and set at minimum:
- `DATABASE_URL` — already has a local default, leave it for now
- `JWT_SECRET` — change to any long random string
- `JWT_REFRESH_SECRET` — change to another long random string

---

**Step C — Start Docker services**
```bash
npm run docker:up
# or directly:
docker-compose up -d
```
This starts:
- PostgreSQL on port `5432`
- Redis on port `6379`

Verify they're running:
```bash
docker ps
```

---

**Step D — Run the first Prisma migration**
```bash
npm run prisma:migrate:dev
# You'll be asked for a migration name — type: "init"
```
This reads `prisma/schema.prisma` and creates all tables in PostgreSQL.

---

**Step E — Generate Prisma Client**
```bash
npm run prisma:generate
```
This generates the type-safe database client in `node_modules/@prisma/client`.

---

**Step F — Install Python dependencies**
```bash
# Navigate to the ingestion service
cd apps/ingestion

# Install with pip (editable mode + dev tools)
pip install -e ".[dev]"
```
Or if using `uv`:
```bash
uv pip install -e ".[dev]"
```

---

**Step G — Verify the API starts**
```bash
npm run api:dev
```
Open: http://localhost:3000/api/docs — you should see the Swagger UI (empty, no routes yet).

---

## 4. Full Folder Structure Map

```
DataMesh/                          ← Nx Monorepo Root
│
├── apps/
│   ├── api/                       ← NestJS API (your main focus)
│   │   └── src/
│   │       ├── main.ts            ← Fastify bootstrap, Swagger, CORS
│   │       └── app/
│   │           ├── app.module.ts  ← Root NestJS module
│   │           │
│   │           ├── domain/        ← ❤️ THE CORE (no frameworks, no DB)
│   │           │   ├── entities/  ← Pure TypeScript classes/interfaces
│   │           │   ├── ports/
│   │           │   │   ├── inbound/   ← Use Case interfaces (IGetDatasetUseCase...)
│   │           │   │   └── outbound/  ← Repository/Cache interfaces (IDatasetRepository...)
│   │           │   └── services/  ← Domain logic (pure functions, no side effects)
│   │           │
│   │           ├── application/   ← 🔄 Orchestration layer
│   │           │   ├── use-cases/ ← Implements inbound ports, calls outbound ports
│   │           │   └── dtos/      ← Zod-validated input/output shapes
│   │           │
│   │           └── infrastructure/← 🔌 Adapters (implements outbound ports)
│   │               ├── inbound/
│   │               │   ├── controllers/ ← HTTP Controllers (call use-cases)
│   │               │   ├── guards/      ← JWT Auth Guards
│   │               │   └── pipes/       ← Validation Pipes
│   │               └── outbound/
│   │                   ├── persistence/ ← Repository implementations
│   │                   ├── prisma/      ← PrismaService
│   │                   ├── cache/       ← Redis adapter
│   │                   └── http/        ← External HTTP clients
│   │
│   ├── web/                       ← Next.js Dashboard (later)
│   │   └── src/
│   │
│   └── ingestion/                 ← Python ETL service
│       ├── src/
│       │   ├── config/            ← Pydantic settings
│       │   ├── extractors/        ← Fetches raw data via HTTPX
│       │   ├── transformers/      ← Normalizes with Polars
│       │   ├── loaders/           ← Writes to PostgreSQL
│       │   ├── models/            ← Pydantic data models
│       │   ├── ports/             ← Abstract base classes (Python's "interfaces")
│       │   └── orchestrator/      ← Ties ETL pipeline together
│       └── tests/
│
├── libs/
│   ├── api-contracts/             ← Shared request/response types (used by web + api)
│   └── shared/
│       ├── errors/                ← Shared error classes
│       ├── types/                 ← Shared TypeScript types
│       └── utils/                 ← Shared utility functions
│
├── prisma/
│   ├── schema.prisma              ← ✅ All DB models already written
│   ├── migrations/                ← Auto-generated by `prisma migrate dev`
│   └── seeds/                     ← Seed scripts (to be written)
│
├── docker/                        ← Dockerfiles for each service
├── docker-compose.yml             ← ✅ Local dev services
├── nx.json                        ← ✅ Nx workspace config
├── package.json                   ← ✅ All npm dependencies listed
└── .env.example                   ← ✅ Copy this to .env
```

---

## 5. Understanding the Nx Monorepo

An **Nx Integrated Monorepo** means all projects (api, web, ingestion) live in
**one repository** and share tooling, configuration, and libraries.

### Why Nx?

| Problem without Nx | How Nx Solves It |
|---|---|
| Running tests for all apps is manual | `npx nx run-many --target=test --all` |
| Building only what changed is hard | Nx has a **computation cache** — it skips unchanged projects |
| Sharing types between frontend and API means copy-pasting | `libs/` folder — import shared code like a package |
| Each app needs its own config files | `tsconfig.base.json` at root, each app extends it |

### Key Nx Concepts

**`project.json`** — Every app and lib has one. It defines the targets (build,
test, serve, lint) that Nx knows how to run.

**`nx.json`** — Workspace-level config. Defines default inputs/outputs for
caching, default generators, and plugins.

**Generators** — Nx can scaffold code for you:
```bash
# Generate a new NestJS module inside the api app
npx nx generate @nx/nest:module --name=dataset --project=api --directory=app
```

**`apps/` vs `libs/`** — The key mental model:
- `apps/` = things that **run** (servers, UIs)
- `libs/` = things that are **imported** (shared code, contracts)

---

## 6. Hexagonal Architecture

### The Mental Model

Hexagonal Architecture (also called **Ports and Adapters**) is built around one
core idea:

> **Your business logic should not know or care how it talks to the outside world.**

Imagine a hexagon. In the center is your **Domain** — the heart of the
application. The domain contains your business rules, entities, and logic.

Around the hexagon are **Ports** — holes through which the outside world
communicates with the domain. There are two kinds:

```
                    ┌─────────────────────────────┐
  HTTP Request ───► │  Inbound Port (Use Case IF) │ ◄─ Controller calls this
                    │                             │
                    │    ┌───────────────┐        │
                    │    │               │        │
                    │    │    DOMAIN     │        │
                    │    │  (The Core)   │        │
                    │    │               │        │
                    │    └───────────────┘        │
                    │                             │
                    │ Outbound Port (Repository IF)│ ──► Prisma / Redis implement this
                    └─────────────────────────────┘
```

### The Three Rules That Make It Work

**Rule 1: The Domain has zero dependencies.**  
It does not import NestJS decorators, Prisma, Redis, or HTTP. It is pure
TypeScript. This means you can test it without spinning up a database.

**Rule 2: The Domain defines the Ports (interfaces).**  
The domain says *"I need something that can find a dataset by ID"* — it defines
an interface for that. It does NOT decide how that is implemented.

**Rule 3: Adapters implement the Ports.**  
The Prisma repository adapter implements `IDatasetRepository`. The Redis adapter
implements `IDatasetCache`. The NestJS controller implements nothing — it just
calls the Use Case port.

### Why This Matters For You

When you write a test for a Use Case, you **mock the port (interface)**. Your
test does not touch the real database. This is how you get fast, reliable unit
tests that actually test business logic.

---

## 7. The Three Layers in This Codebase

### Layer 1 — Domain (`apps/api/src/app/domain/`)

**What goes here:** Pure business logic. No NestJS. No Prisma. No HTTP.

| Sub-folder | What you put here | Example |
|---|---|---|
| `entities/` | TypeScript interfaces for your core objects | `Dataset`, `ApiKey`, `User` |
| `ports/inbound/` | Use Case interfaces the domain **exposes** | `IGetDatasetUseCase`, `ICreateApiKeyUseCase` |
| `ports/outbound/` | Repository/Cache interfaces the domain **requires** | `IDatasetRepository`, `IDatasetCache` |
| `services/` | Domain service classes (pure logic, no side effects) | `ApiKeyHashingService` |

**Naming convention:**
- Inbound ports: `I<Feature>UseCase` — e.g., `IGetDatasetUseCase`
- Outbound ports: `I<Resource>Repository`, `I<Resource>Cache` — e.g., `IDatasetRepository`
- Entities: Plain names — `Dataset`, `Measurement`, `ApiKey`

---

### Layer 2 — Application (`apps/api/src/app/application/`)

**What goes here:** Use Case implementations. These are the classes that
implement the inbound ports and orchestrate the domain.

| Sub-folder | What you put here | Example |
|---|---|---|
| `use-cases/` | Classes that implement inbound port interfaces | `GetDatasetUseCase` implements `IGetDatasetUseCase` |
| `dtos/` | Zod schemas for validating input/output shapes | `GetDatasetQueryDto`, `DatasetResponseDto` |

A Use Case class:
- Gets injected with outbound port implementations (via NestJS DI)
- Calls the repository/cache ports to fetch/save data
- Returns a typed response
- Contains **no HTTP concepts** (no `req`, `res`, no status codes)

---

### Layer 3 — Infrastructure (`apps/api/src/app/infrastructure/`)

**What goes here:** All the wiring to the outside world.

| Sub-folder | What you put here |
|---|---|
| `inbound/controllers/` | NestJS `@Controller` classes — parse HTTP, call use cases |
| `inbound/guards/` | `@Injectable()` guards — JWT auth, API key validation |
| `inbound/pipes/` | `@Injectable()` pipes — Zod validation pipes |
| `outbound/persistence/` | Repository classes that implement domain ports using Prisma |
| `outbound/cache/` | Redis adapter implementing domain cache ports |
| `outbound/prisma/` | `PrismaService` — the NestJS wrapper around `PrismaClient` |
| `outbound/http/` | HTTP clients for calling external EU data APIs |

---

## 8. The TDD Protocol

You **must** follow Red-Green-Refactor. No exceptions.

```
  ┌─────────────────────────────────────────────────────────┐
  │                  Red-Green-Refactor Loop                 │
  │                                                         │
  │   1. RED    Write a failing test first                  │
  │             Run it — watch it FAIL                      │
  │             (If it passes without code, your test is    │
  │              wrong — fix the test)                      │
  │                                                         │
  │   2. GREEN  Write the MINIMUM code to make it pass      │
  │             Do not over-engineer                        │
  │             Run it — watch it PASS                      │
  │                                                         │
  │   3. REFACTOR  Clean up duplication, naming, structure  │
  │             Run tests again — they must STILL pass      │
  └─────────────────────────────────────────────────────────┘
```

### For NestJS Unit Tests

- **What to test:** Use Case classes in `application/use-cases/`
- **How to mock:** Use Jest's `jest.fn()` to mock the outbound port (repository, cache)
- **Never use:** Real Prisma, real Redis, real HTTP in a unit test
- **Test file location:** Co-locate or in `apps/api/src/app/<layer>/__tests__/`
- **Run command:** `npm run api:test` or `npx nx test api`

### For Python Tests

- **Framework:** `pytest`
- **Mock HTTP:** Use `respx` to mock HTTPX calls
- **Mock DB:** Pass in a mock/fake loader instead of real psycopg connection
- **Test file location:** `apps/ingestion/tests/`
- **Run command:** From inside `apps/ingestion/`: `pytest`

---

## 9. Backend First — Step-by-Step Build Order

Here is the exact sequence to build the backend, feature by feature.  
**Each step is a mini Red-Green-Refactor cycle.**  
I will tell you the **what** and **why** — you figure out the **how**.

---

### PHASE 1 — Foundation (Infrastructure Plumbing)

#### Step 1.1 — PrismaService

**Goal:** Create a NestJS service that wraps `PrismaClient` and connects to PostgreSQL on startup.

**Location:** `apps/api/src/app/infrastructure/outbound/prisma/`

**What to create:**
- A class `PrismaService` that extends `PrismaClient` and implements `OnModuleInit`
- A `PrismaModule` that exports `PrismaService` as a global provider

**Why:** Every repository adapter will need `PrismaService`. Making it a global
module means you don't have to import it in every feature module.

**Think about:**
- What lifecycle hook connects to the database when the module initializes?
- How do you declare a NestJS module as `@Global()`?
- How should `PrismaModule` be registered in `AppModule`?

**TDD Note:** `PrismaService` is infrastructure. You don't need to unit test the
connection itself. But you WILL need it working before you can write integration
tests later.

---

#### Step 1.2 — Domain Entity: `Dataset`

**Goal:** Define the pure TypeScript interface for what a `Dataset` is in your domain.

**Location:** `apps/api/src/app/domain/entities/`

**What to create:**
- A TypeScript `interface Dataset` (NOT a class, NOT a Prisma model — your own domain type)
- A `DataSource` enum (matching the Prisma schema values: EEA, EUROSTAT, COPERNICUS)

**Why:** The domain must own its data shapes. You never pass raw Prisma objects
through your entire application — you map them to domain entities at the
boundary.

**Think about:**
- What fields does a `Dataset` logically need? (look at `prisma/schema.prisma` for reference)
- Should `createdAt` and `updatedAt` be in the domain entity, or are they infrastructure concerns?
- What is the difference between a domain `Dataset` interface and the Prisma-generated `Dataset` type?

---

#### Step 1.3 — Outbound Port: `IDatasetRepository`

**Goal:** Define the contract (interface) that the domain needs for data persistence.

**Location:** `apps/api/src/app/domain/ports/outbound/`

**What to create:**
- File: `dataset.repository.port.ts`
- Interface: `IDatasetRepository` with methods the domain will need

**Think about:**
- What operations will the use cases need? (hint: findBySlug, findAll with pagination, save)
- What should `findAll` return — a plain array or a paginated result shape?
- Should any method be `async`? (Yes — all DB calls are async. Return `Promise<T>`)

---

#### Step 1.4 — Outbound Port: `IDatasetCache`

**Goal:** Define the caching contract.

**Location:** `apps/api/src/app/domain/ports/outbound/`

**What to create:**
- File: `dataset.cache.port.ts`
- Interface: `IDatasetCache`

**Think about:**
- What methods does a cache need? (get, set, invalidate)
- What types should the cache methods return? (hint: `Promise<Dataset | null>` for get)
- How do you handle a cache miss vs a found value?

---

### PHASE 2 — First Real Feature: Get Datasets

This is where TDD begins in earnest.

#### Step 2.1 — Inbound Port: `IGetDatasetUseCase` ← Define first

**Goal:** Define what the "get a dataset" use case looks like from the outside.

**Location:** `apps/api/src/app/domain/ports/inbound/`

**What to create:**
- File: `dataset.use-case.port.ts`
- Interface: `IGetDatasetUseCase` with an `execute` method

**Think about:**
- What input does `execute` receive? (a slug? an ID?)
- What does it return? (`Promise<Dataset>`)
- What happens if the dataset is not found? (throw a domain error? return null?)

---

#### Step 2.2 — 🔴 RED: Write the test for `GetDatasetUseCase`

**Goal:** Write a failing test for the use case — before writing any implementation.

**Location:** `apps/api/src/app/application/use-cases/` (create a `__tests__` subfolder)

**Test file name:** `get-dataset.use-case.spec.ts`

**What the test should verify:**
1. Given a valid slug, the use case checks the cache first (`IDatasetCache.get`)
2. If cache hits → return the cached dataset without touching the repository
3. If cache misses → call `IDatasetRepository.findBySlug`
4. If found in DB → call `IDatasetCache.set` to warm the cache, return the dataset
5. If not found in DB → throw a `DatasetNotFoundException` (a domain error)

**How to set up the test:**
- Create mock objects for `IDatasetRepository` and `IDatasetCache` using `jest.fn()`
- Inject the mocks into the use case constructor
- Call `execute()` and assert the return value or thrown error

**Run the test:**
```bash
npx nx test api --testFile=get-dataset.use-case.spec.ts
```
It MUST fail because `GetDatasetUseCase` doesn't exist yet. ✅ Red confirmed.

---

#### Step 2.3 — 🟢 GREEN: Implement `GetDatasetUseCase`

**Goal:** Write the minimum code to make the test pass.

**Location:** `apps/api/src/app/application/use-cases/`

**File:** `get-dataset.use-case.ts`

**What to implement:**
- A class `GetDatasetUseCase` that implements `IGetDatasetUseCase`
- Constructor receives `IDatasetRepository` and `IDatasetCache` (injected)
- `execute(slug: string)` — check cache, check DB, throw or return

**Think about:**
- How do you inject the repository and cache? NestJS uses `@Inject(TOKEN)` with injection tokens
- What is an injection token? It is a symbol or string that NestJS uses to know which implementation to inject
- The use case should import from domain ports — NOT from Prisma or Redis directly

Run the test again — it should **pass** now. 🟢

---

#### Step 2.4 — Implement the Repository Adapter

**Goal:** Write the Prisma-backed implementation of `IDatasetRepository`.

**Location:** `apps/api/src/app/infrastructure/outbound/persistence/`

**File:** `prisma-dataset.repository.ts`

**What to implement:**
- `PrismaDatasetRepository` class implements `IDatasetRepository`
- Gets `PrismaService` injected
- Maps Prisma objects to domain `Dataset` entities (do NOT return raw Prisma types)

**Think about:**
- Why do you map from Prisma type → domain type? (Because the domain must not depend on Prisma)
- What is the mapping function? A simple pure function: `toDomain(prismaDataset): Dataset`
- Where does this mapper live? You could put it in the adapter file itself for now

---

#### Step 2.5 — Implement the Cache Adapter

**Goal:** Write the Redis-backed implementation of `IDatasetCache`.

**Location:** `apps/api/src/app/infrastructure/outbound/cache/`

**File:** `redis-dataset.cache.ts`

**What to implement:**
- `RedisDatasetCache` class implements `IDatasetCache`
- Uses `ioredis` Redis client
- Serialize/deserialize `Dataset` to/from JSON strings in Redis
- Set a TTL (time-to-live) on cache entries

**Think about:**
- What Redis key naming convention will you use? (e.g., `dataset:{slug}`)
- How do you handle JSON parse errors if Redis has corrupt data?
- Should the cache adapter know about the domain `Dataset` type? Yes — it maps to/from JSON

---

#### Step 2.6 — Wire it in a Feature Module

**Goal:** Create a `DatasetModule` that wires up all the pieces using NestJS DI.

**Location:** `apps/api/src/app/infrastructure/` (or create `apps/api/src/app/modules/dataset/`)

**What to create:**
- `DatasetModule` class decorated with `@Module`
- Providers array: `PrismaDatasetRepository`, `RedisDatasetCache`, `GetDatasetUseCase`
- Use injection tokens to bind the interface to the implementation

**Think about:**
- How does NestJS know to inject `PrismaDatasetRepository` when something asks for `IDatasetRepository`?
- Answer: You use a custom provider: `{ provide: DATASET_REPOSITORY_TOKEN, useClass: PrismaDatasetRepository }`
- Where do you define the token? In a `tokens.ts` file in the domain or feature folder

---

#### Step 2.7 — Write the Controller

**Goal:** Create the HTTP endpoint that calls the use case.

**Location:** `apps/api/src/app/infrastructure/inbound/controllers/`

**File:** `dataset.controller.ts`

**Route:** `GET /api/v1/datasets/:slug`

**What to implement:**
- `@Controller('datasets')` class
- `@Get(':slug')` method
- Inject `IGetDatasetUseCase` (via injection token)
- Call `useCase.execute(slug)` and return the result
- Add Swagger decorators: `@ApiOperation`, `@ApiResponse`

**Think about:**
- The controller's job is ONLY to: receive HTTP input → call use case → return HTTP output
- No business logic lives in the controller
- What HTTP status codes should different outcomes return? (200 for found, 404 for not found)
- How do you catch `DatasetNotFoundException` and return a 404? (Use `@Catch` filter or a global filter)

---

### PHASE 3 — Authentication

After Phase 2 works end-to-end, repeat the same pattern for Auth:

1. Domain entity: `User`
2. Domain ports: `IUserRepository`, `IAuthUseCase`, `IApiKeyUseCase`
3. Tests first (🔴 Red)
4. Use case implementations (🟢 Green)
5. Prisma adapter for `UserRepository`
6. JWT strategy using `@nestjs/passport`
7. Auth controller: `POST /api/v1/auth/register`, `POST /api/v1/auth/login`
8. JWT Guard to protect routes

---

### PHASE 4 — API Keys

1. Domain entity: `ApiKey`
2. Port: `IApiKeyRepository`
3. Use cases: `CreateApiKeyUseCase`, `RevokeApiKeyUseCase`, `ValidateApiKeyUseCase`
4. Controller: `GET /api/v1/api-keys`, `POST /api/v1/api-keys`, `DELETE /api/v1/api-keys/:id`

---

### PHASE 5 — Measurements Endpoint

1. Domain entity: `Measurement`
2. Port: `IMeasurementRepository`
3. Use case: `GetMeasurementsUseCase` (with filters: country, date range, pagination)
4. Add cache layer for measurement queries
5. Controller: `GET /api/v1/datasets/:slug/measurements`

---

### PHASE 6 — Python Ingestion Service

After the API is solid, build the ETL:

1. Implement extractor: fetch raw CSV/JSON from EEA / Eurostat using HTTPX
2. Implement transformer: normalize with Polars into a clean `Measurement` shape
3. Implement loader: write to PostgreSQL using psycopg
4. Wire in orchestrator: extract → transform → load → log `IngestionRun`
5. Add retry logic using `tenacity`
6. All of the above with `pytest` + `respx` mocks first

---

## 10. Environment Setup

Here is what each env variable in `.env` is used for:

| Variable | Used By | Notes |
|---|---|---|
| `NODE_ENV` | NestJS | Set to `development` locally |
| `PORT` | NestJS `main.ts` | API listens on this port (default: 3000) |
| `DATABASE_URL` | Prisma | PostgreSQL connection string |
| `REDIS_URL` | `ioredis` in cache adapter | Local Redis from Docker |
| `UPSTASH_REDIS_REST_URL` | For production | Leave as placeholder locally |
| `UPSTASH_REDIS_REST_TOKEN` | For production | Leave as placeholder locally |
| `JWT_SECRET` | `@nestjs/jwt` | Sign/verify access tokens |
| `JWT_EXPIRY` | `@nestjs/jwt` | Access token lifetime (e.g., `15m`) |
| `JWT_REFRESH_SECRET` | `@nestjs/jwt` | Sign/verify refresh tokens |
| `JWT_REFRESH_EXPIRY` | `@nestjs/jwt` | Refresh token lifetime (e.g., `7d`) |
| `RATE_LIMIT_TTL` | `ThrottlerModule` in `AppModule` | Already wired in (seconds window) |
| `RATE_LIMIT_MAX` | `ThrottlerModule` in `AppModule` | Max requests per TTL window |
| `EEA_BASE_URL` | Python ingestion | EU Environment Agency API base |
| `EUROSTAT_BASE_URL` | Python ingestion | Eurostat API base |
| `NEXT_PUBLIC_API_URL` | Next.js + NestJS CORS | Public API URL the frontend calls |
| `NEXTAUTH_SECRET` | NextAuth.js in `apps/web` | Session signing key |
| `NEXTAUTH_URL` | NextAuth.js | Callback URL (default: port 4200) |

---

## 11. Useful Commands Cheatsheet

### Nx

```bash
# Run the NestJS API in dev mode (with file watching)
npm run api:dev
# or
npx nx serve api

# Run all tests
npm test
# or
npx nx run-many --target=test --all

# Run only API tests
npm run api:test
# or
npx nx test api

# Run API tests in watch mode
npm run api:test:watch

# Run linting across everything
npm run lint

# Format all code with Prettier
npm run format

# Run the Next.js web app
npm run web:dev

# Build the API
npm run api:build
```

### Prisma

```bash
# Create a new migration (after changing schema.prisma)
npm run prisma:migrate:dev

# Re-generate the Prisma client after schema changes
npm run prisma:generate

# Open Prisma Studio (GUI to browse your database)
npm run prisma:studio
```

### Docker

```bash
# Start all Docker services (PostgreSQL + Redis)
npm run docker:up

# Stop all Docker services
npm run docker:down

# Check running containers
docker ps

# View logs for a specific service
docker logs datamesh-postgres
docker logs datamesh-redis
```

### Python

```bash
# Run all Python tests (from apps/ingestion/)
pytest

# Run with verbose output
pytest -v

# Run a specific test file
pytest tests/test_eea_extractor.py

# Run linting
ruff check src/

# Run type checking
mypy src/
```

---

## A Final Note — On Muscle Memory

The goal of this architecture is not to impress anyone.  
The goal is that **you can look at any file and immediately know why it exists**.

- If it has zero imports from NestJS → it's Domain.
- If it implements a domain port interface → it's Application or Infrastructure.
- If it has `@Controller` or `@Injectable` → it's Infrastructure.
- If it has Prisma types → it's an outbound adapter.
- If it has `@Get` or `@Post` → it's a controller.

When you feel confused, come back to this rule:

> **Dependency Rule:** Inner layers (Domain) know NOTHING about outer layers.  
> Outer layers (Infrastructure) know everything about inner layers.  
> The arrow of dependency always points INWARD.

Now go build. Write the test first. Always. 🔴 → 🟢 → ♻️
