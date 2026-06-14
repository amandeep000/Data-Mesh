# Prisma — Complete Walkthrough for Data-Mesh

> **Who is this for?** You understand that `schema.prisma` defines models, but
> Prisma Client and Prisma Migrate make you nervous. This guide explains
> everything in simple language and walks you through every command.

---

## Table of Contents

1. [What is Prisma? (The 10-Second Answer)](#1-what-is-prisma)
2. [Part 1 — Prisma Schema (The Blueprint)](#2-part-1--prisma-schema)
3. [Part 2 — Prisma Migrate (The Builder)](#3-part-2--prisma-migrate)
4. [Part 3 — Prisma Client (The Query Tool)](#4-part-3--prisma-client)
5. [How the Three Parts Work Together](#5-how-the-three-parts-work-together)
6. [Your Project Files Explained](#6-your-project-files-explained)
7. [Step-by-Step: First-Time Database Setup](#7-step-by-step-first-time-setup)
8. [Step-by-Step: Making a Schema Change](#8-step-by-step-schema-change)
9. [Step-by-Step: Connecting Prisma to NestJS](#9-step-by-step-nestjs-integration)
10. [Upgrading to Prisma v6 (Latest)](#10-upgrading-to-prisma-v6)
11. [Troubleshooting Common Errors](#11-troubleshooting)
12. [Commands Cheatsheet](#12-cheatsheet)

---

## 1. What is Prisma?

Prisma is a **TypeScript-first ORM** (Object-Relational Mapper). It's the bridge
between your TypeScript code and your PostgreSQL database.

The simplest analogy:

```
  Your TypeScript Code          Prisma          PostgreSQL
 ┌────────────────────┐      ┌──────────┐     ┌────────────┐
 │                    │      │          │     │            │
 │  prisma.user.find  │ ───► │  Prisma  │ ──► │  SELECT *  │
 │  Unique({ email }) │      │  Client  │     │  FROM users│
 │                    │      │          │     │            │
 └────────────────────┘      └──────────┘     └────────────┘
```

Without Prisma, you'd write raw SQL strings. With Prisma, you write
TypeScript — and it gives you full **autocomplete** and **type safety**.

Prisma has **three parts** that work together:

| Part | What it is | File/Folder |
|---|---|---|
| **Prisma Schema** | The blueprint — defines your tables and columns | `prisma/schema.prisma` |
| **Prisma Migrate** | The builder — creates/changes actual database tables | `prisma/migrations/` |
| **Prisma Client** | The query tool — type-safe TypeScript library to query the DB | `node_modules/@prisma/client` |

---

## 2. Part 1 — Prisma Schema

### What it is

The schema file (`prisma/schema.prisma`) is the **blueprint** of your database.
It says: "Here are the tables I want, their columns, their types, and how they
relate to each other."

**You never write SQL.** You write this schema, and Prisma generates the SQL for you.

### The 3 Sections

Every `schema.prisma` has exactly three sections:

```prisma
// SECTION 1: Generator — How to build the client
generator client {
  provider = "prisma-client-js"
}

// SECTION 2: Datasource — Which database to connect to
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

// SECTION 3: Models — Your tables
model User {
  id    String @id @default(cuid())
  email String @unique
  // ...
}
```

| Section | What it does |
|---|---|
| **Generator** | Tells Prisma to build you a TypeScript client library |
| **Datasource** | Says "connect to PostgreSQL using this connection string" |
| **Models** | Defines your tables, columns, types, and relationships |

### Your Data-Mesh Models

You have **5 models** and **3 enums**:

| Model | Table Name | Purpose |
|---|---|---|
| `User` | `users` | Users who can log in (Admin or Developer) |
| `ApiKey` | `api_keys` | API keys tied to users, with rate limits |
| `Dataset` | `datasets` | Environmental datasets (EEA, Eurostat, Copernicus) |
| `Measurement` | `measurements` | Individual data points belonging to a dataset |
| `IngestionRun` | `ingestion_runs` | Tracks each ETL job (success/failure) |

| Enum | Values |
|---|---|
| `UserRole` | `ADMIN`, `DEVELOPER` |
| `DataSource` | `EEA`, `EUROSTAT`, `COPERNICUS` |
| `IngestionStatus` | `RUNNING`, `SUCCESS`, `FAILED` |

### Key Prisma Annotations

| Annotation | Meaning |
|---|---|
| `@id` | This is the primary key |
| `@default(cuid())` | Auto-generate a unique ID |
| `@unique` | No two rows can have the same value |
| `@map("column_name")` | Rename the column in the actual DB (snake_case) |
| `@@map("table_name")` | Rename the table in the actual DB |
| `@@index([col1, col2])` | Create a database index for faster queries |
| `@relation(fields: [...], references: [...])` | Foreign key relationship |
| `@updatedAt` | Automatically set to `now()` on every update |
| `@default(now())` | Set to current timestamp when created |

### The `@relation` Attribute — Connecting Tables

This is the most important annotation. Here's how yours work:

```prisma
// In ApiKey model:
user User @relation(fields: [userId], references: [id], onDelete: Cascade)
```

Read as: "ApiKey has a `userId` column that points to User's `id` column. If a
User is deleted, delete all their ApiKeys too (Cascade)."

The inverse side (in User):
```prisma
apiKeys ApiKey[]   // "A User has many ApiKeys"
```

---

## 3. Part 2 — Prisma Migrate

### What it is

**Prisma Migrate reads your schema and creates/updates the actual PostgreSQL
tables to match.** It's like a "sync" button between your schema file and your
database.

### The Simple Mental Model

Think of Prisma Migrate as a **version control system for your database**:

```
  schema.prisma            Migration Files           PostgreSQL
 ┌──────────────┐      ┌────────────────────┐      ┌──────────────┐
 │ model User { │      │ migration.sql:     │      │              │
 │   id String  │ ───► │ CREATE TABLE       │ ───► │  users table │
 │   email Str  │      │ "users" (...)      │      │  api_keys    │
 │ }            │      └────────────────────┘      │  datasets    │
 └──────────────┘                                  └──────────────┘
```

### How Migration Works (The Full Flow)

When you run `prisma migrate dev`:

1. **Prisma reads** your `schema.prisma`
2. **Prisma compares** the schema with what's actually in the database
3. **Prisma generates** a SQL migration file (in `prisma/migrations/`)
4. **Prisma runs** that SQL against your PostgreSQL database
5. **Prisma regenerates** the Prisma Client (so your types are up to date)

Each migration file is a timestamped folder with raw SQL inside:
```
prisma/migrations/
└── 20260110000000_init/
    └── migration.sql          ← Contains CREATE TABLE, ALTER TABLE, etc.
```

**You NEVER edit these files** — they are auto-generated. You commit them to
git so every developer (and CI) gets the same database structure.

### Migration Commands

| Command | What it does | When to use |
|---|---|---|
| `prisma migrate dev` | Creates + applies migration | During development |
| `prisma migrate deploy` | Applies pending migrations | Production / CI |
| `prisma migrate reset` | Drops everything, re-runs from scratch | Dev only — when things break |
| `prisma migrate status` | Shows which migrations ran | Debugging |
| `prisma db push` | Pushes schema changes directly (no migration file) | Prototyping only |

> **Golden rule:** Always use `prisma migrate dev` in development. It creates
> migration files you can commit. Other developers run `prisma migrate deploy`
> to apply them.

---

## 4. Part 3 — Prisma Client

### What it is

**Prisma Client is a type-safe query builder generated from your schema.**
After you run `prisma generate`, you get a TypeScript library that lets you
query your database with full autocomplete.

### How It's Generated

```
  prisma/schema.prisma         prisma generate        @prisma/client
 ┌──────────────────┐                              ┌──────────────────────┐
 │  model User {    │                              │  prisma.user.find    │
 │    id    String  │  ─────────────────────────►  │    Unique({...})     │
 │    email String  │                              │  prisma.user.create  │
 │    name  String? │                              │    ({...})           │
 │  }               │                              │  prisma.user.find    │
 └──────────────────┘                              │    Many()            │
                                                   │  prisma.user.update  │
                                                   │    ({...})           │
                                                   │  prisma.user.delete  │
                                                   │    ({...})           │
                                                   └──────────────────────┘
```

### What You Get For Each Model

For your `User` model, Prisma generates these methods:

| Method | What it does | Example |
|---|---|---|
| `findUnique()` | Find one row by a unique field | `prisma.user.findUnique({ where: { email: "..." } })` |
| `findFirst()` | Find the first matching row | `prisma.user.findFirst({ where: { name: "Aman" } })` |
| `findMany()` | Get all matching rows | `prisma.user.findMany()` |
| `create()` | Insert a new row | `prisma.user.create({ data: { email: "...", ... } })` |
| `update()` | Update a row | `prisma.user.update({ where: { id: "..." }, data: { ... } })` |
| `delete()` | Delete a row | `prisma.user.delete({ where: { id: "..." } })` |
| `upsert()` | Update or create | `prisma.user.upsert({ where: ..., create: ..., update: ... })` |
| `count()` | Count rows | `prisma.user.count()` |

### Type Safety

Because Prisma Client is generated from YOUR specific schema, TypeScript knows
exactly what fields exist. You get autocomplete everywhere:

```typescript
// ✅ Works — TypeScript knows "email" exists on User
const user = await prisma.user.findUnique({ where: { email: "a@b.com" } })
console.log(user.email) // TypeScript: user.email is string | undefined

// ❌ Compile error — "username" does not exist on your User model
const user = await prisma.user.findUnique({ where: { username: "aman" } })
//                                  TypeScript error: ~~~~~~~~
```

### Nested Queries (Including Relations)

Because you defined `apiKeys ApiKey[]` on the `User` model, you can fetch
related data in ONE query:

```typescript
// Get a user AND all their API keys in a single database round-trip
const user = await prisma.user.findUnique({
  where: { email: "a@b.com" },
  include: { apiKeys: true }
})
// user.apiKeys is ApiKey[] — fully typed, no manual JOINs
```

### The Generated Client Location

Import it like any npm package:
```typescript
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()
```

---

## 5. How the Three Parts Work Together

Here is the full lifecycle — this is the most important diagram:

```
┌──────────────────────────────────────────────────────────────┐
│                    THE PRISMA WORKFLOW                        │
│                                                              │
│   1. YOU EDIT schema.prisma                                  │
│      (Define what tables/columns you want)                   │
│              │                                               │
│              ▼                                               │
│   2. YOU RUN prisma migrate dev                              │
│      (Prisma generates migration SQL + applies to DB)        │
│              │                                               │
│              ├──────────────────────────────────┐            │
│              ▼                                  ▼            │
│   3a. MIGRATION SQL CREATED             3b. CLIENT REGENERATED│
│   prisma/migrations/                    @prisma/client        │
│   └── 2026xxx_init/                     types updated         │
│       └── migration.sql                                      │
│              │                                  │            │
│              ▼                                  ▼            │
│   4a. SQL APPLIED TO DB              4b. YOUR CODE GETS      │
│   PostgreSQL tables created            NEW TYPES             │
│   to match schema.prisma              Autocomplete works     │
│                                       with new fields         │
└──────────────────────────────────────────────────────────────┘
```

**The key insight:** You never write SQL. You write the schema, and Prisma
generates both the SQL migrations AND the TypeScript client.

---

## 6. Your Project Files Explained

Here is every Prisma-related file in the Data-Mesh project and what it does:

### `prisma/schema.prisma`
**The blueprint.** 5 models, 3 enums. This is the **source of truth** for your
database structure. Every table, column, type, and relationship is defined here.

### `prisma/migrations/` (currently empty)
This folder will hold auto-generated migration SQL files. Each migration is a
timestamped folder with a `migration.sql` inside. **Never edit these manually.**

After your first migration, it will look like:
```
prisma/migrations/
└── 20260110xxxxxx_init/
    └── migration.sql          ← CREATE TABLE users, api_keys, etc.
```

### `prisma/seeds/` (currently empty)
For scripts that populate the database with test/dev data. You'll create a
`seed.ts` here that uses Prisma Client:

```typescript
// Example seed file (not yet created)
import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()

await prisma.user.create({
  data: { email: 'admin@datamesh.io', passwordHash: '...', role: 'ADMIN' }
})
await prisma.dataset.create({
  data: { slug: 'eea-air-quality', name: 'Air Quality', source: 'EEA' }
})
```

### `.env`
Contains `DATABASE_URL` — the connection string Prisma uses to reach
PostgreSQL. **Important rule:** No quotes in `.env` files!

```env
# ❌ WRONG — Quotes become part of the connection string
DATABASE_URL="postgresql://..."

# ✅ CORRECT — No quotes
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/datamesh_dev?schema=public
```

(This has been fixed in your `.env` already.)

### `.env.example`
A template file. Contains placeholder values. New developers copy this to
`.env` and fill in real secrets.

### `package.json` Prisma Scripts
```json
"prisma:generate":       "prisma generate",
"prisma:migrate:dev":    "prisma migrate dev",
"prisma:migrate:deploy": "prisma migrate deploy",
"prisma:studio":         "prisma studio",
"prisma:reset":          "prisma migrate reset"
```

### `node_modules/@prisma/client/` (not yet generated)
Where the **generated Prisma Client** appears after you run `prisma generate`.
Contains all the TypeScript types and query functions derived from your schema.

### `apps/api/src/app/infrastructure/outbound/prisma/` (empty — TODO)
Where you'll create `PrismaService` — a NestJS class that wraps Prisma Client
and connects to PostgreSQL on app startup.

### `apps/api/src/app/infrastructure/outbound/persistence/` (empty — TODO)
Where you'll create repository adapters (e.g., `prisma-dataset.repository.ts`)
that use Prisma Client to implement your domain port interfaces.

### `.github/workflows/ci.yml`
Contains a `prisma` CI job that:
1. Spins up a PostgreSQL service container
2. Runs `npx prisma validate` — checks the schema is valid
3. Runs `npx prisma migrate deploy` — validates migrations can be applied

---

## 7. Step-by-Step: First-Time Database Setup

These are the commands **you** will run. Follow them in order.

### Step 1: Install npm Dependencies

```bash
npm install
```

This installs `prisma`, `@prisma/client`, NestJS, and everything else from
`package.json`.

### Step 2: Verify `.env` is Correct

Open `.env` and confirm `DATABASE_URL` has **no quotes**:
```env
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/datamesh_dev?schema=public
```

### Step 3: Start PostgreSQL with Docker

```bash
docker-compose up -d postgres
```

Wait a few seconds, then verify:
```bash
docker ps
```

You should see a container named `datamesh-postgres` with status `Up` and
image `postgres:16-alpine`.

### Step 4: Generate Prisma Client (First Time)

```bash
npm run prisma:generate
```

**What happens:** Prisma reads `schema.prisma`, validates it, and generates the
TypeScript client in `node_modules/@prisma/client`. Even though the database has
no tables yet, you can validate the schema works.

You should see output like:
```
✔ Generated Prisma Client (v5.22.0) to .\node_modules\@prisma\client
```

### Step 5: Create Your First Migration

```bash
npm run prisma:migrate:dev
```

Prisma will ask: **"Enter a name for the new migration:"**

Type: `init` and press Enter.

**What happens behind the scenes:**
1. Prisma reads `schema.prisma`
2. It checks the database — sees it's empty (no tables)
3. It generates a migration SQL file: `prisma/migrations/2026xxxxxx_init/migration.sql`
4. That SQL contains all the `CREATE TABLE` statements for your 5 models
5. Prisma runs that SQL against PostgreSQL
6. Your 5 tables (`users`, `api_keys`, `datasets`, `measurements`, `ingestion_runs`) now exist
7. Prisma also creates an internal `_prisma_migrations` table to track which migrations ran
8. Prisma regenerates the client

You should see output like:
```
Applying migration `20260110xxxxxx_init`

The following migration(s) have been created and applied from new schema changes:

migrations/
  └─ 20260110xxxxxx_init/
    └─ migration.sql

Your database is now in sync with your schema.
```

### Step 6: Verify the Tables Exist

Option A — Prisma Studio (GUI in browser):
```bash
npm run prisma:studio
```
Opens `http://localhost:5555` — you'll see all 5 tables (empty, but they exist).

Option B — Command line:
```bash
docker exec -it datamesh-postgres psql -U postgres -d datamesh_dev -c "\dt"
```

You should see:
```
           List of relations
 Schema |       Name        | Type  |  Owner
--------+-------------------+-------+----------
 public | _prisma_migrations | table | postgres
 public | api_keys          | table | postgres
 public | datasets          | table | postgres
 public | ingestion_runs    | table | postgres
 public | measurements      | table | postgres
 public | users             | table | postgres
```

### Step 7: Look at the Generated Migration

Open `prisma/migrations/2026xxxxxx_init/migration.sql` and read it. It's the
actual SQL that created your tables. Understanding this demystifies the entire
process:

```sql
-- Example of what you'll see:
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password_hash" TEXT NOT NULL,
    "name" TEXT,
    "role" "UserRole" NOT NULL DEFAULT 'DEVELOPER',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "users_email_key" ON "users"("email");
-- ... and so on for all 5 tables
```

**🎉 Done.** Your database is fully set up. The Prisma Client is generated,
your types are available, and you can start querying.

---

## 8. Step-by-Step: Making a Schema Change

Let's walk through a real example. Say you want to add a `description` field to
the `IngestionRun` model.

### Step 1: Edit the Schema

Open `prisma/schema.prisma`, find the `IngestionRun` model, and add:

```prisma
model IngestionRun {
  // ... existing fields ...
  description String?  @map("description")  // ← NEW FIELD
}
```

### Step 2: Create the Migration

```bash
npm run prisma:migrate:dev
```

Prisma will ask for a migration name. Type: `add-ingestion-description`

**What happens:**
1. Prisma compares `schema.prisma` with the current database
2. It detects: "The `ingestion_runs` table doesn't have a `description` column"
3. It generates `prisma/migrations/2026xxxxxx_add_ingestion_description/migration.sql`
4. The SQL file contains:
   ```sql
   ALTER TABLE "ingestion_runs" ADD COLUMN "description" TEXT;
   ```
5. Prisma runs that SQL against the database
6. Prisma regenerates the client — now `description` exists in the TypeScript types

### Step 3: Your Code Now Has the New Field

```typescript
// This now compiles and works:
const run = await prisma.ingestionRun.create({
  data: {
    datasetSlug: 'eea-air',
    status: 'RUNNING',
    startedAt: new Date(),
    description: 'Nightly ETL run'  // ✅ New field, fully typed
  }
})
```

### The Pattern

Every schema change follows this exact flow:
```
Edit schema.prisma → prisma migrate dev → give it a name → done.
```

---

## 9. Step-by-Step: Connecting Prisma to NestJS

The Prisma Client is a standalone library. To use it inside NestJS, you wrap
it in a NestJS service. Here's how.

### Step 1: Create PrismaService

Create the file: `apps/api/src/app/infrastructure/outbound/prisma/prisma.service.ts`

```typescript
import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common'
import { PrismaClient } from '@prisma/client'

@Injectable()
export class PrismaService
  extends PrismaClient
  implements OnModuleInit, OnModuleDestroy
{
  async onModuleInit() {
    // Connect to PostgreSQL when NestJS starts up
    await this.$connect()
  }

  async onModuleDestroy() {
    // Gracefully disconnect when the app shuts down
    await this.$disconnect()
  }
}
```

**What this does:**
- `extends PrismaClient` → Inherits all query methods (`findUnique`, `create`, etc.)
- `onModuleInit()` → Runs automatically when NestJS boots — connects to the database
- `onModuleDestroy()` → Runs on shutdown — disconnects cleanly

### Step 2: Create PrismaModule

Create the file: `apps/api/src/app/infrastructure/outbound/prisma/prisma.module.ts`

```typescript
import { Global, Module } from '@nestjs/common'
import { PrismaService } from './prisma.service'

@Global()   // Makes PrismaService available everywhere without re-importing
@Module({
  providers: [PrismaService],
  exports: [PrismaService],
})
export class PrismaModule {}
```

**Why `@Global()`?** Every repository adapter will need `PrismaService`.
Without `@Global()`, you'd have to add `PrismaModule` to the `imports` array
of every single feature module. `@Global()` registers it once in `AppModule`
and it's automatically available everywhere.

### Step 3: Register in AppModule

Edit `apps/api/src/app/app.module.ts`:

```typescript
import { Module } from '@nestjs/common'
import { ThrottlerModule } from '@nestjs/throttler'
import { PrismaModule } from './infrastructure/outbound/prisma/prisma.module'

@Module({
  imports: [
    ThrottlerModule.forRoot([{
      ttl: parseInt(process.env.RATE_LIMIT_TTL || '60'),
      limit: parseInt(process.env.RATE_LIMIT_MAX || '100'),
    }]),
    PrismaModule,  // ← Add this line
  ],
})
export class AppModule {}
```

### Step 4: Use PrismaService in a Repository Adapter

Here's an example of how a repository adapter uses `PrismaService`:

```typescript
// File: apps/api/src/app/infrastructure/outbound/persistence/prisma-dataset.repository.ts

import { Injectable } from '@nestjs/common'
import { PrismaService } from '../prisma/prisma.service'

@Injectable()
export class PrismaDatasetRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findBySlug(slug: string) {
    return this.prisma.dataset.findUnique({
      where: { slug },
      include: { measurements: true },  // Nested query — includes related measurements
    })
  }

  async findAll(limit: number, offset: number) {
    return this.prisma.dataset.findMany({
      take: limit,
      skip: offset,
      orderBy: { createdAt: 'desc' },
    })
  }

  async create(data: { slug: string; name: string; source: 'EEA' | 'EUROSTAT' | 'COPERNICUS' }) {
    return this.prisma.dataset.create({ data })
  }
}
```

**Key point:** `PrismaService` is injected via NestJS dependency injection. You
don't create `new PrismaService()` — NestJS gives you the single shared instance.

### How the Whole Chain Works

```
 HTTP Request
     │
     ▼
 Controller (@Get, @Post...)
     │
     ▼
 Use Case (business logic)
     │
     ▼
 Repository Adapter (PrismaDatasetRepository)
     │
     ▼
 PrismaService (single instance, connected to DB)
     │
     ▼
 PostgreSQL
```

---

## 10. Upgrading to Prisma v6 (Latest)

Your project uses `prisma ^5.10.0` (resolved to 5.22.0). Prisma v6 is the
latest major version. Here's how to upgrade.

### Step 1: Check Your Current Version

```bash
npx prisma --version
```

### Step 2: Upgrade Both Packages

```bash
npm install prisma@latest @prisma/client@latest
```

This upgrades:
- `prisma` (the CLI tool, in `devDependencies`)
- `@prisma/client` (the runtime library, in `dependencies`)

### Step 3: Check for Breaking Changes

Prisma v6 is largely backwards-compatible for standard PostgreSQL setups. Your
current schema configuration still works:

```prisma
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}
```

If you see a warning about the datasource configuration after upgrading, you
can optionally add the `directUrl` field (used when you have a connection
pooler like PgBouncer):

```prisma
datasource db {
  provider  = "postgresql"
  url       = env("DATABASE_URL")
  directUrl = env("DIRECT_DATABASE_URL")  // Optional — for connection pooling
}
```

### Step 4: Regenerate the Client

```bash
npm run prisma:generate
```

### Step 5: Verify Migrations are in Sync

```bash
npm run prisma:migrate:dev
```

Prisma will say **"No changes detected"** if everything matches.

### Step 6: Verify Everything Works

```bash
npm run prisma:studio
```

Browse your tables — they should still be there.

### If Something Breaks

Run this to check for drift:
```bash
npx prisma migrate status
npx prisma validate
```

---

## 11. Troubleshooting Common Errors

### Error: "Can't reach database server at `localhost:5432`"

**Problem:** PostgreSQL isn't running.

**Fix:**
```bash
docker-compose up -d postgres
docker ps  # Verify container is running and healthy
```

### Error: "Environment variable not found: DATABASE_URL"

**Problem:** Prisma can't find the `.env` file or the variable.

**Fix:** Make sure:
1. `.env` exists in the **project root** (same folder as `package.json`)
2. You're running prisma commands from the project root
3. The variable is not commented out with `#`

### Error: "The table `_prisma_migrations` does not exist"

**Problem:** First migration hasn't been run yet on this database.

**Fix:** This is normal for a fresh database. Run:
```bash
prisma migrate dev
```

### Error: "Drift detected: Your database schema is not in sync"

**Problem:** The database has changes that Prisma didn't make. This happens if
someone ran raw SQL directly, or you pulled schema changes from git.

**Fix:**
```bash
# In development — let Prisma reconcile:
prisma migrate dev

# If things are really broken (DEV ONLY — destroys data):
prisma migrate reset
```

### Error: "Quoted DATABASE_URL" (Connection String Invalid)

**Problem:** Your `.env` has quotes around the URL:
```env
DATABASE_URL="postgresql://..."  # ❌ Wrong
```

**Fix:** Remove the quotes. In `.env` files, quotes are literal characters —
`"postgresql://..."` includes the quote marks, which is not a valid URL.
```env
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/datamesh_dev?schema=public  # ✅ Correct
```

### Error: "@prisma/client not found" / "Cannot find module"

**Problem:** The client hasn't been generated.

**Fix:**
```bash
npm run prisma:generate
```

### Error: "Type 'X' has no property 'Y'"

**Problem:** You made a schema change but didn't regenerate the client.

**Fix:**
```bash
npm run prisma:generate
```

### Error: "Migration already applied"

**Problem:** You ran `prisma migrate dev` but the migration already exists.

**Fix:** This is normal — Prisma will say "No changes detected." Nothing to fix.

---

## 12. Commands Cheatsheet

```bash
# ─── Prisma ──────────────────────────────────────────────

# Generate the type-safe client from schema
npm run prisma:generate

# Create and apply a new migration
npm run prisma:migrate:dev

# Apply pending migrations (production / CI)
npm run prisma:migrate:deploy

# Open GUI to browse your database
npm run prisma:studio

# Reset database (drop all → re-run migrations → run seed)
npm run prisma:reset

# Validate that schema.prisma has correct syntax
npx prisma validate

# Push schema directly to DB (no migration file — prototyping only!)
npx prisma db push

# Show which migrations have been applied
npx prisma migrate status

# Check Prisma version
npx prisma --version

# ─── Docker (PostgreSQL) ─────────────────────────────────

# Start PostgreSQL
docker-compose up -d postgres

# Start both PostgreSQL and Redis
docker-compose up -d postgres redis

# Stop all services
docker-compose down

# Check running containers
docker ps

# Connect to PostgreSQL directly
docker exec -it datamesh-postgres psql -U postgres -d datamesh_dev

# List all tables in the database
docker exec -it datamesh-postgres psql -U postgres -d datamesh_dev -c "\dt"
```

---

## Summary — The Mental Model

```
 ┌──────────────┐      ┌─────────────────┐      ┌──────────────────┐
 │   SCHEMA     │      │    MIGRATE      │      │     CLIENT       │
 │  (Blueprint) │      │   (Builder)     │      │  (Query Tool)    │
 ├──────────────┤      ├─────────────────┤      ├──────────────────┤
 │              │      │                 │      │                  │
 │ schema.      │ ───► │ prisma migrate  │ ───► │ prisma.user.     │
 │ prisma       │      │ dev             │      │ findMany()       │
 │              │      │                 │      │ prisma.dataset.  │
 │ You write    │      │ Reads schema,   │      │ findUnique()     │
 │ this.        │      │ generates SQL,  │      │                  │
 │              │      │ applies to DB.  │      │ Type-safe        │
 │              │      │                 │      │ autocomplete.    │
 └──────────────┘      └─────────────────┘      └──────────────────┘
         │                      │                        │
         │                      ▼                        │
         │             migrations/                       │
         │             └── init/                         │
         │                 └── migration.sql ────────────┘
         │                      │               (client regenerated
         │                      ▼                after every migration)
         │               PostgreSQL
         │               ┌──────────┐
         └──────────────►│  users   │
                         │  api_keys│
                         │  datasets│
                         └──────────┘
```

**Three rules to remember:**

1. **Schema** = You define what you want. Edit only `schema.prisma`.
2. **Migrate** = Prisma builds it. Run `prisma migrate dev` to sync the database.
3. **Client** = Prisma gives you a query tool. Import `PrismaClient` and start querying.

That's it. You write the schema. Prisma handles the rest.
