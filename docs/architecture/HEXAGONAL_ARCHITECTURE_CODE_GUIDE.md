# Hexagonal Architecture — Code Guide for Data-Mesh

> Build the NestJS API step-by-step. Every concept is shown with real code tailored to this project's patterns, naming conventions, and existing contracts.

---

## Table of Contents

1. [What is Hexagonal Architecture](#1-what-is-hexagonal-architecture)
2. [Layer-by-Layer Breakdown](#2-layer-by-layer-breakdown)
3. [Step 1: Prisma Module — The Database Adapter](#step-1-prisma-module--the-database-adapter)
4. [Step 2: Domain Entities — Pure TypeScript](#step-2-domain-entities--pure-typescript)
5. [Step 3: Outbound Ports — What the Domain Needs](#step-3-outbound-ports--what-the-domain-needs)
6. [Step 4: Repository Adapters — Implement the Ports](#step-4-repository-adapters--implement-the-ports)
7. [Step 5: Inbound Ports — What the App Can Do](#step-5-inbound-ports--what-the-app-can-do)
8. [Step 6: Use Cases — Orchestration Layer](#step-6-use-cases--orchestration-layer)
9. [Step 7: Controllers — HTTP Adapters](#step-7-controllers--http-adapters)
10. [Step 8: Guards, Pipes, Filters — Infrastructure Concerns](#step-8-guards-pipes-filters--infrastructure-concerns)
11. [Step 9: Wire It All Together — NestJS Modules](#step-9-wire-it-all-together--nestjs-modules)
12. [Step 10: Zod Validation Pipe](#step-10-zod-validation-pipe)
13. [Step 11: Redis Cache Adapter](#step-11-redis-cache-adapter)
14. [Step 12: E2E Testing](#step-12-e2e-testing)
15. [Full File Reference](#full-file-reference)

---

## 1. What is Hexagonal Architecture

### The Core Idea

Your **business logic** lives in a protected inner hexagon. It knows nothing about HTTP, databases, queues, or third-party APIs. It only knows about **interfaces** (ports).

The outer hexagon contains **adapters** — concrete implementations of those interfaces. The controller (HTTP), the Prisma repository (database), and the Redis cache (infrastructure) are all adapters.

```
                    ┌──────────────────────────────┐
                    │       INFRASTRUCTURE          │
                    │  ┌────────────────────────┐   │
                    │  │     APPLICATION         │   │
                    │  │  ┌──────────────────┐   │   │
                    │  │  │     DOMAIN        │   │   │
  HTTP ────► Controller UseCase ◄── entities   ◄─── Repo ◄─── DB
                    │  │  │                  │   │   │
                    │  │  └──────────────────┘   │   │
                    │  │                   Cache ◄─── Redis
                    │  └────────────────────────┘   │
                    └──────────────────────────────┘
```

**The dependency arrow always points INWARD.** Controllers know about use cases. Use cases know about domain entities and ports. Domain knows about nothing.

### What is a Port

A **port** is just a TypeScript interface. Nothing more.

- **Inbound port** (driving port): "What can the outside world ask the app to do?" → `IAuthUseCase`, `IDatasetUseCase`
- **Outbound port** (driven port): "What does the app need from the outside world?" → `IUserRepository`, `ICachePort`

### What is an Adapter

An **adapter** is a class that implements a port.

- **Inbound adapter**: `AuthController` implements `IAuthUseCase` (by calling it, not implementing it directly — the controller calls the use case)
- **Outbound adapter**: `PrismaUserRepository` implements `IUserRepository`

### What is a Domain Service

A **domain service** is pure business logic that doesn't naturally belong to a single entity. Example: `PasswordService` (hashing rules), `SlugService` (slug generation rules). Domain services define their own interfaces — the implementation lives in infrastructure.

---

## 2. Layer-by-Layer Breakdown

### Layer Map (top to bottom)

| Layer | Folder | Depends on | Contains |
|-------|--------|-----------|----------|
| **Infrastructure** | `apps/api/src/app/infrastructure/` | Application + Domain | Controllers, guards, pipes, Prisma repos, Redis, external HTTP |
| **Application** | `apps/api/src/app/application/` | Domain only | Use cases (orchestration logic) |
| **Domain** | `apps/api/src/app/domain/` | Nothing | Entities, port interfaces, domain service interfaces |

### File Naming Conventions

| What | Convention | Example |
|------|-----------|---------|
| Entity | `<name>.entity.ts` | `user.entity.ts` |
| Inbound port | `<feature>.use-case.ts` | `auth.use-case.ts` |
| Outbound port | `<resource>.port.ts` | `user-repository.port.ts` |
| Use case (implements inbound port) | `<feature>.use-case.ts` | `auth.use-case.ts` |
| Repository (implements outbound port) | `prisma-<resource>.repository.ts` | `prisma-user.repository.ts` |
| Controller | `<feature>.controller.ts` | `auth.controller.ts` |
| Guard | `<feature>-auth.guard.ts` | `jwt-auth.guard.ts` |
| Pipe | `<name>.pipe.ts` | `zod-validation.pipe.ts` |
| Module | `<feature>.module.ts` | `auth.module.ts` |
| Test (unit) | `<file>.spec.ts` | `auth.use-case.spec.ts` |

---

## Step 1: Prisma Module — The Database Adapter

The Prisma module wraps `PrismaClient` into a NestJS service. Every repository adapter injects this single shared service.

### File: `apps/api/src/app/infrastructure/outbound/persistence/prisma.service.ts`

```typescript
import { Injectable, OnModuleInit, OnModuleDestroy, Logger } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService
  extends PrismaClient
  implements OnModuleInit, OnModuleDestroy
{
  private readonly logger = new Logger(PrismaService.name);

  async onModuleInit(): Promise<void> {
    this.logger.log('Connecting to PostgreSQL...');
    await this.$connect();
    this.logger.log('Connected to PostgreSQL');
  }

  async onModuleDestroy(): Promise<void> {
    this.logger.log('Disconnecting from PostgreSQL...');
    await this.$disconnect();
    this.logger.log('Disconnected from PostgreSQL');
  }
}
```

### File: `apps/api/src/app/infrastructure/outbound/persistence/prisma.module.ts`

```typescript
import { Global, Module } from '@nestjs/common';
import { PrismaService } from './prisma.service';

@Global()
@Module({
  providers: [PrismaService],
  exports: [PrismaService],
})
export class PrismaModule {}
```

**Why `@Global()`?** Every repository adapter needs `PrismaService`. Without `@Global()`, you'd have to import `PrismaModule` in every feature module. This registers it once in `AppModule` and it's available everywhere.

### Test: `apps/api/src/app/infrastructure/outbound/persistence/prisma.service.spec.ts`

```typescript
import { Test, TestingModule } from '@nestjs/testing';
import { PrismaService } from './prisma.service';

describe('PrismaService', () => {
  let service: PrismaService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [PrismaService],
    }).compile();

    service = module.get<PrismaService>(PrismaService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should have all model delegates', () => {
    expect(service.user).toBeDefined();
    expect(service.apiKey).toBeDefined();
    expect(service.dataset).toBeDefined();
    expect(service.measurement).toBeDefined();
    expect(service.ingestionRun).toBeDefined();
  });
});
```

### Register in AppModule

```typescript
// apps/api/src/app/app.module.ts
import { Module } from '@nestjs/common';
import { ThrottlerModule } from '@nestjs/throttler';
import { PrismaModule } from './infrastructure/outbound/persistence/prisma.module';

@Module({
  imports: [
    ThrottlerModule.forRoot([
      {
        ttl: parseInt(process.env['RATE_LIMIT_TTL'] ?? '60', 10),
        limit: parseInt(process.env['RATE_LIMIT_MAX'] ?? '100', 10),
      },
    ]),
    PrismaModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
```

---

## Step 2: Domain Entities — Pure TypeScript

Entities have **no NestJS decorators**, **no Prisma types**, and **no runtime dependencies**. They are plain interfaces.

### File: `apps/api/src/app/domain/entities/user.entity.ts`

```typescript
import { UserRole } from '@prisma/client';

export interface User {
  id: string;
  email: string;
  name: string | null;
  role: UserRole;
  createdAt: Date;
  updatedAt: Date;
}

export interface UserWithPassword extends User {
  passwordHash: string;
}

export interface CreateUserInput {
  email: string;
  passwordHash: string;
  name?: string;
}
```

### File: `apps/api/src/app/domain/entities/api-key.entity.ts`

```typescript
export interface ApiKey {
  id: string;
  keyHash: string;
  keyPrefix: string;
  name: string;
  userId: string;
  rateLimit: number;
  isActive: boolean;
  lastUsed: Date | null;
  expiresAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateApiKeyInput {
  name: string;
  rateLimit: number;
  expiresAt?: Date;
}

export interface ApiKeyWithSecret extends ApiKey {
  rawKey: string;
}
```

### File: `apps/api/src/app/domain/entities/dataset.entity.ts`

```typescript
import { DataSource } from '@prisma/client';

export interface Dataset {
  id: string;
  slug: string;
  name: string;
  source: DataSource;
  description: string | null;
  unit: string | null;
  tags: string[];
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateDatasetInput {
  slug?: string;
  name: string;
  source: DataSource;
  description?: string;
  unit?: string;
  tags?: string[];
}

export interface UpdateDatasetInput {
  name?: string;
  description?: string;
  unit?: string;
  tags?: string[];
}
```

### File: `apps/api/src/app/domain/entities/measurement.entity.ts`

```typescript
export interface Measurement {
  id: string;
  datasetId: string;
  country: string;
  region: string | null;
  recordedAt: Date;
  value: number;
  rawMetadata: Record<string, unknown> | null;
  createdAt: Date;
}

export interface AggregationResult {
  key: string;
  value: number;
}

export interface MeasurementQuery {
  country?: string;
  from?: Date;
  to?: Date;
  page: number;
  limit: number;
}
```

---

## Step 3: Outbound Ports — What the Domain Needs

These are interfaces. The domain says "I need a way to find users by email." The infrastructure adapter implements it.

### File: `apps/api/src/app/domain/ports/outbound/user-repository.port.ts`

```typescript
import { User, UserWithPassword, CreateUserInput } from '../../entities/user.entity';

export interface IUserRepository {
  findById(id: string): Promise<User | null>;
  findByEmail(email: string): Promise<UserWithPassword | null>;
  create(input: CreateUserInput): Promise<User>;
}
```

### File: `apps/api/src/app/domain/ports/outbound/api-key-repository.port.ts`

```typescript
import { ApiKey, CreateApiKeyInput } from '../../entities/api-key.entity';

export interface IApiKeyRepository {
  findByUserId(userId: string): Promise<ApiKey[]>;
  findByKeyHash(hash: string): Promise<ApiKey | null>;
  create(userId: string, input: CreateApiKeyInput): Promise<ApiKey>;
  revoke(keyId: string): Promise<void>;
  updateLastUsed(keyId: string): Promise<void>;
}
```

### File: `apps/api/src/app/domain/ports/outbound/dataset-repository.port.ts`

```typescript
import { Dataset, CreateDatasetInput, UpdateDatasetInput } from '../../entities/dataset.entity';

export interface IDatasetRepository {
  findById(id: string): Promise<Dataset | null>;
  findBySlug(slug: string): Promise<Dataset | null>;
  findAll(page: number, limit: number, filters?: { source?: string; tags?: string[] }): Promise<{ data: Dataset[]; total: number }>;
  create(input: CreateDatasetInput): Promise<Dataset>;
  update(slug: string, input: UpdateDatasetInput): Promise<Dataset>;
  delete(slug: string): Promise<void>;
}
```

### File: `apps/api/src/app/domain/ports/outbound/cache.port.ts`

```typescript
export interface ICachePort {
  get<T>(key: string): Promise<T | null>;
  set<T>(key: string, value: T, ttlSeconds: number): Promise<void>;
  delete(key: string): Promise<void>;
  deletePattern(pattern: string): Promise<void>;
}
```

### File: `apps/api/src/app/domain/ports/outbound/password.port.ts`

```typescript
export interface IPasswordPort {
  hash(password: string): Promise<string>;
  compare(password: string, hash: string): Promise<boolean>;
}
```

### File: `apps/api/src/app/domain/ports/outbound/token.port.ts`

```typescript
export interface ITokenPort {
  generateAccessToken(userId: string, role: string): Promise<string>;
  generateRefreshToken(userId: string): Promise<string>;
  verifyAccessToken(token: string): Promise<{ userId: string; role: string }>;
  verifyRefreshToken(token: string): Promise<{ userId: string }>;
}
```

---

## Step 4: Repository Adapters — Implement the Ports

Each adapter implements the corresponding port interface. It takes `PrismaService` as a constructor dependency and **maps Prisma types to domain entities** at the boundary.

### File: `apps/api/src/app/infrastructure/outbound/persistence/prisma-user.repository.ts`

```typescript
import { Injectable } from '@nestjs/common';
import { PrismaService } from './prisma.service';
import { IUserRepository } from '../../../domain/ports/outbound/user-repository.port';
import { User, UserWithPassword, CreateUserInput } from '../../../domain/entities/user.entity';

@Injectable()
export class PrismaUserRepository implements IUserRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findById(id: string): Promise<User | null> {
    const record = await this.prisma.user.findUnique({ where: { id } });
    if (!record) return null;
    return this.toDomain(record);
  }

  async findByEmail(email: string): Promise<UserWithPassword | null> {
    const record = await this.prisma.user.findUnique({ where: { email } });
    if (!record) return null;
    return this.toDomainWithPassword(record);
  }

  async create(input: CreateUserInput): Promise<User> {
    const record = await this.prisma.user.create({
      data: {
        email: input.email,
        passwordHash: input.passwordHash,
        name: input.name,
      },
    });
    return this.toDomain(record);
  }

  /** Map Prisma model → Domain entity. Keep Prisma types inside this class only. */
  private toDomain(record: { id: string; email: string; passwordHash: string; name: string | null; role: string; createdAt: Date; updatedAt: Date }): User {
    return {
      id: record.id,
      email: record.email,
      name: record.name,
      role: record.role as User['role'],
      createdAt: record.createdAt,
      updatedAt: record.updatedAt,
    };
  }

  private toDomainWithPassword(record: { id: string; email: string; passwordHash: string; name: string | null; role: string; createdAt: Date; updatedAt: Date }): UserWithPassword {
    return {
      ...this.toDomain(record),
      passwordHash: record.passwordHash,
    };
  }
}
```

### Test: `apps/api/src/app/infrastructure/outbound/persistence/prisma-user.repository.spec.ts`

```typescript
import { Test, TestingModule } from '@nestjs/testing';
import { PrismaUserRepository } from './prisma-user.repository';
import { PrismaService } from './prisma.service';

type MockPrismaService = {
  user: {
    findUnique: jest.Mock;
    create: jest.Mock;
  };
};

describe('PrismaUserRepository', () => {
  let repository: PrismaUserRepository;
  let prisma: MockPrismaService;

  beforeEach(async () => {
    prisma = {
      user: {
        findUnique: jest.fn(),
        create: jest.fn(),
      },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PrismaUserRepository,
        { provide: PrismaService, useValue: prisma },
      ],
    }).compile();

    repository = module.get<PrismaUserRepository>(PrismaUserRepository);
  });

  it('should find user by email', async () => {
    const mockRecord = {
      id: 'cuid1',
      email: 'test@example.com',
      passwordHash: 'hashed',
      name: 'Test',
      role: 'DEVELOPER',
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    prisma.user.findUnique.mockResolvedValue(mockRecord);

    const result = await repository.findByEmail('test@example.com');

    expect(result).not.toBeNull();
    expect(result!.email).toBe('test@example.com');
    expect((result as any).passwordHash).toBe('hashed');
    expect(prisma.user.findUnique).toHaveBeenCalledWith({ where: { email: 'test@example.com' } });
  });

  it('should return null when user is not found', async () => {
    prisma.user.findUnique.mockResolvedValue(null);

    const result = await repository.findByEmail('nobody@example.com');

    expect(result).toBeNull();
  });

  it('should create a user', async () => {
    const input = { email: 'new@example.com', passwordHash: 'hashed' };
    const mockRecord = {
      id: 'cuid2',
      email: 'new@example.com',
      passwordHash: 'hashed',
      name: null,
      role: 'DEVELOPER',
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    prisma.user.create.mockResolvedValue(mockRecord);

    const result = await repository.create(input);

    expect(result.email).toBe('new@example.com');
    expect(result.role).toBe('DEVELOPER');
    // passwordHash should NOT leak into the returned User
    expect((result as any).passwordHash).toBeUndefined();
  });
});
```

### File: `apps/api/src/app/infrastructure/outbound/persistence/prisma-dataset.repository.ts`

```typescript
import { Injectable } from '@nestjs/common';
import { PrismaService } from './prisma.service';
import { IDatasetRepository } from '../../../domain/ports/outbound/dataset-repository.port';
import {
  Dataset,
  CreateDatasetInput,
  UpdateDatasetInput,
} from '../../../domain/entities/dataset.entity';
import { Prisma } from '@prisma/client';

@Injectable()
export class PrismaDatasetRepository implements IDatasetRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findById(id: string): Promise<Dataset | null> {
    const record = await this.prisma.dataset.findUnique({ where: { id } });
    if (!record) return null;
    return this.toDomain(record);
  }

  async findBySlug(slug: string): Promise<Dataset | null> {
    const record = await this.prisma.dataset.findUnique({ where: { slug } });
    if (!record) return null;
    return this.toDomain(record);
  }

  async findAll(
    page: number,
    limit: number,
    filters?: { source?: string; tags?: string[] },
  ): Promise<{ data: Dataset[]; total: number }> {
    const where: Prisma.DatasetWhereInput = {};

    if (filters?.source) {
      where.source = filters.source as Prisma.EnumDataSourceFilter['equals'];
    }

    if (filters?.tags && filters.tags.length > 0) {
      where.tags = { hasSome: filters.tags };
    }

    const [records, total] = await Promise.all([
      this.prisma.dataset.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.dataset.count({ where }),
    ]);

    return { data: records.map((r) => this.toDomain(r)), total };
  }

  async create(input: CreateDatasetInput): Promise<Dataset> {
    const slug = input.slug ?? this.generateSlug(input.name);
    const record = await this.prisma.dataset.create({
      data: {
        slug,
        name: input.name,
        source: input.source,
        description: input.description ?? null,
        unit: input.unit ?? null,
        tags: input.tags ?? [],
      },
    });
    return this.toDomain(record);
  }

  async update(slug: string, input: UpdateDatasetInput): Promise<Dataset> {
    const record = await this.prisma.dataset.update({
      where: { slug },
      data: input,
    });
    return this.toDomain(record);
  }

  async delete(slug: string): Promise<void> {
    await this.prisma.dataset.delete({ where: { slug } });
  }

  private generateSlug(name: string): string {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '');
  }

  private toDomain(record: {
    id: string;
    slug: string;
    name: string;
    source: string;
    description: string | null;
    unit: string | null;
    tags: string[];
    createdAt: Date;
    updatedAt: Date;
  }): Dataset {
    return {
      id: record.id,
      slug: record.slug,
      name: record.name,
      source: record.source as Dataset['source'],
      description: record.description,
      unit: record.unit,
      tags: record.tags,
      createdAt: record.createdAt,
      updatedAt: record.updatedAt,
    };
  }
}
```

---

## Step 5: Inbound Ports — What the App Can Do

Inbound ports are the "use case" interfaces. Controllers call these. They define every operation your API exposes.

### File: `apps/api/src/app/domain/ports/inbound/auth.use-case.ts`

```typescript
import { User } from '../../entities/user.entity';
import type { RegisterDto, LoginDto, TokenResponse } from '@data-mesh/api-contracts';

export interface IAuthUseCase {
  register(dto: RegisterDto): Promise<{ user: User; tokens: TokenResponse }>;
  login(dto: LoginDto): Promise<{ user: User; tokens: TokenResponse }>;
  refreshToken(token: string): Promise<TokenResponse>;
}
```

### File: `apps/api/src/app/domain/ports/inbound/dataset.use-case.ts`

```typescript
import { Dataset, CreateDatasetInput, UpdateDatasetInput } from '../../entities/dataset.entity';
import { PaginatedResponse } from '@data-mesh/api-contracts';

export interface IDatasetUseCase {
  listDatasets(page: number, limit: number, filters?: { source?: string; tags?: string[] }): Promise<PaginatedResponse<Dataset>>;
  getDatasetBySlug(slug: string): Promise<Dataset>;
  createDataset(input: CreateDatasetInput): Promise<Dataset>;
  updateDataset(slug: string, input: UpdateDatasetInput): Promise<Dataset>;
  deleteDataset(slug: string): Promise<void>;
}
```

### File: `apps/api/src/app/domain/ports/inbound/api-key.use-case.ts`

```typescript
import { ApiKey, ApiKeyWithSecret, CreateApiKeyInput } from '../../entities/api-key.entity';

export interface IApiKeyUseCase {
  createKey(userId: string, input: CreateApiKeyInput): Promise<ApiKeyWithSecret>;
  listKeys(userId: string): Promise<ApiKey[]>;
  revokeKey(userId: string, keyId: string): Promise<void>;
  validateKey(rawKey: string): Promise<{ userId: string; rateLimit: number } | null>;
}
```

---

## Step 6: Use Cases — Orchestration Layer

Use cases implement inbound ports. They **orchestrate** — validate, call domain services, persist via outbound ports, and return results. They never touch HTTP or the database directly.

### File: `apps/api/src/app/application/use-cases/auth.use-case.ts`

```typescript
import { Injectable, Logger } from '@nestjs/common';
import { IAuthUseCase } from '../../domain/ports/inbound/auth.use-case';
import { IUserRepository } from '../../domain/ports/outbound/user-repository.port';
import { IPasswordPort } from '../../domain/ports/outbound/password.port';
import { ITokenPort } from '../../domain/ports/outbound/token.port';
import { User } from '../../domain/entities/user.entity';
import { ConflictError, UnauthorizedError } from '@data-mesh/shared-errors';
import type { RegisterDto, LoginDto, TokenResponse } from '@data-mesh/api-contracts';

@Injectable()
export class AuthUseCase implements IAuthUseCase {
  private readonly logger = new Logger(AuthUseCase.name);

  constructor(
    private readonly userRepository: IUserRepository,
    private readonly passwordPort: IPasswordPort,
    private readonly tokenPort: ITokenPort,
  ) {}

  async register(dto: RegisterDto): Promise<{ user: User; tokens: TokenResponse }> {
    const existing = await this.userRepository.findByEmail(dto.email);
    if (existing) {
      throw new ConflictError(`User with email "${dto.email}" already exists.`);
    }

    const passwordHash = await this.passwordPort.hash(dto.password);

    const user = await this.userRepository.create({
      email: dto.email,
      passwordHash,
      name: dto.name,
    });

    const [accessToken, refreshToken] = await Promise.all([
      this.tokenPort.generateAccessToken(user.id, user.role),
      this.tokenPort.generateRefreshToken(user.id),
    ]);

    this.logger.log(`User registered: ${user.id}`);

    return {
      user,
      tokens: { accessToken, refreshToken, expiresIn: 900 },
    };
  }

  async login(dto: LoginDto): Promise<{ user: User; tokens: TokenResponse }> {
    const userWithPass = await this.userRepository.findByEmail(dto.email);
    if (!userWithPass) {
      throw new UnauthorizedError('Invalid email or password.');
    }

    const isValid = await this.passwordPort.compare(dto.password, userWithPass.passwordHash);
    if (!isValid) {
      throw new UnauthorizedError('Invalid email or password.');
    }

    const { passwordHash: _, ...user } = userWithPass;

    const [accessToken, refreshToken] = await Promise.all([
      this.tokenPort.generateAccessToken(user.id, user.role),
      this.tokenPort.generateRefreshToken(user.id),
    ]);

    return {
      user,
      tokens: { accessToken, refreshToken, expiresIn: 900 },
    };
  }

  async refreshToken(token: string): Promise<TokenResponse> {
    const payload = await this.tokenPort.verifyRefreshToken(token);

    const user = await this.userRepository.findById(payload.userId);
    if (!user) {
      throw new UnauthorizedError('User no longer exists.');
    }

    const [accessToken, refreshToken] = await Promise.all([
      this.tokenPort.generateAccessToken(user.id, user.role),
      this.tokenPort.generateRefreshToken(user.id),
    ]);

    return { accessToken, refreshToken, expiresIn: 900 };
  }
}
```

### Test: `apps/api/src/app/application/use-cases/auth.use-case.spec.ts`

```typescript
import { Test, TestingModule } from '@nestjs/testing';
import { AuthUseCase } from './auth.use-case';
import { IUserRepository } from '../../domain/ports/outbound/user-repository.port';
import { IPasswordPort } from '../../domain/ports/outbound/password.port';
import { ITokenPort } from '../../domain/ports/outbound/token.port';
import { ConflictError, UnauthorizedError } from '@data-mesh/shared-errors';

describe('AuthUseCase', () => {
  let useCase: AuthUseCase;
  let userRepo: jest.Mocked<IUserRepository>;
  let passwordPort: jest.Mocked<IPasswordPort>;
  let tokenPort: jest.Mocked<ITokenPort>;

  beforeEach(async () => {
    userRepo = { findById: jest.fn(), findByEmail: jest.fn(), create: jest.fn() };
    passwordPort = { hash: jest.fn(), compare: jest.fn() };
    tokenPort = {
      generateAccessToken: jest.fn(),
      generateRefreshToken: jest.fn(),
      verifyAccessToken: jest.fn(),
      verifyRefreshToken: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthUseCase,
        { provide: 'IUserRepository', useValue: userRepo },
        { provide: 'IPasswordPort', useValue: passwordPort },
        { provide: 'ITokenPort', useValue: tokenPort },
      ],
    }).compile();

    useCase = module.get<AuthUseCase>(AuthUseCase);
  });

  it('should register a new user', async () => {
    const dto = { email: 'new@test.com', password: 'Strong1!', name: 'New' };
    const createdUser = {
      id: 'uid1',
      email: 'new@test.com',
      name: 'New',
      role: 'DEVELOPER' as const,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    userRepo.findByEmail.mockResolvedValue(null);
    passwordPort.hash.mockResolvedValue('hashed-pw');
    userRepo.create.mockResolvedValue(createdUser);
    tokenPort.generateAccessToken.mockResolvedValue('access-token');
    tokenPort.generateRefreshToken.mockResolvedValue('refresh-token');

    const result = await useCase.register(dto);

    expect(result.user.email).toBe('new@test.com');
    expect(result.tokens.accessToken).toBe('access-token');
    expect(result.tokens.refreshToken).toBe('refresh-token');
    expect(userRepo.findByEmail).toHaveBeenCalledWith('new@test.com');
    expect(passwordPort.hash).toHaveBeenCalledWith('Strong1!');
  });

  it('should throw ConflictError when registering duplicate email', async () => {
    userRepo.findByEmail.mockResolvedValue({
      id: 'existing',
      email: 'dup@test.com',
      passwordHash: 'x',
      name: null,
      role: 'DEVELOPER',
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    await expect(
      useCase.register({ email: 'dup@test.com', password: 'Strong1!' }),
    ).rejects.toThrow(ConflictError);
  });

  it('should login with valid credentials', async () => {
    const dto = { email: 'user@test.com', password: 'Strong1!' };
    const userWithPass = {
      id: 'uid1',
      email: 'user@test.com',
      passwordHash: 'hashed',
      name: null,
      role: 'DEVELOPER' as const,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    userRepo.findByEmail.mockResolvedValue(userWithPass);
    passwordPort.compare.mockResolvedValue(true);
    tokenPort.generateAccessToken.mockResolvedValue('access-token');
    tokenPort.generateRefreshToken.mockResolvedValue('refresh-token');

    const result = await useCase.login(dto);

    expect(result.user.email).toBe('user@test.com');
    expect((result.user as any).passwordHash).toBeUndefined();
    expect(result.tokens.accessToken).toBe('access-token');
  });

  it('should throw UnauthorizedError with wrong password', async () => {
    userRepo.findByEmail.mockResolvedValue({
      id: 'uid1',
      email: 'user@test.com',
      passwordHash: 'real',
      name: null,
      role: 'DEVELOPER',
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    passwordPort.compare.mockResolvedValue(false);

    await expect(
      useCase.login({ email: 'user@test.com', password: 'wrong' }),
    ).rejects.toThrow(UnauthorizedError);
  });
});
```

### File: `apps/api/src/app/application/use-cases/dataset.use-case.ts`

```typescript
import { Injectable, Logger } from '@nestjs/common';
import { IDatasetUseCase } from '../../domain/ports/inbound/dataset.use-case';
import { IDatasetRepository } from '../../domain/ports/outbound/dataset-repository.port';
import { Dataset, CreateDatasetInput, UpdateDatasetInput } from '../../domain/entities/dataset.entity';
import { PaginatedResponse } from '@data-mesh/api-contracts';
import { NotFoundError, ConflictError } from '@data-mesh/shared-errors';

@Injectable()
export class DatasetUseCase implements IDatasetUseCase {
  private readonly logger = new Logger(DatasetUseCase.name);

  constructor(private readonly datasetRepository: IDatasetRepository) {}

  async listDatasets(
    page: number,
    limit: number,
    filters?: { source?: string; tags?: string[] },
  ): Promise<PaginatedResponse<Dataset>> {
    const { data, total } = await this.datasetRepository.findAll(page, limit, filters);
    return {
      data,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async getDatasetBySlug(slug: string): Promise<Dataset> {
    const dataset = await this.datasetRepository.findBySlug(slug);
    if (!dataset) {
      throw new NotFoundError('Dataset', slug);
    }
    return dataset;
  }

  async createDataset(input: CreateDatasetInput): Promise<Dataset> {
    const existing = await this.datasetRepository.findBySlug(input.slug ?? input.name);
    if (existing) {
      throw new ConflictError(`Dataset with slug "${existing.slug}" already exists.`);
    }

    const dataset = await this.datasetRepository.create(input);
    this.logger.log(`Dataset created: ${dataset.slug}`);
    return dataset;
  }

  async updateDataset(slug: string, input: UpdateDatasetInput): Promise<Dataset> {
    const existing = await this.datasetRepository.findBySlug(slug);
    if (!existing) {
      throw new NotFoundError('Dataset', slug);
    }

    return this.datasetRepository.update(slug, input);
  }

  async deleteDataset(slug: string): Promise<void> {
    const existing = await this.datasetRepository.findBySlug(slug);
    if (!existing) {
      throw new NotFoundError('Dataset', slug);
    }

    await this.datasetRepository.delete(slug);
    this.logger.log(`Dataset deleted: ${slug}`);
  }
}
```

---

## Step 7: Controllers — HTTP Adapters

Controllers are the inbound adapters. They receive HTTP requests, call the use case (inbound port), and return HTTP responses. They know about HTTP — status codes, headers, Swagger decorators — but never about the database.

### File: `apps/api/src/app/infrastructure/inbound/controllers/auth.controller.ts`

```typescript
import { Controller, Post, Body, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBody } from '@nestjs/swagger';
import { IAuthUseCase } from '../../../domain/ports/inbound/auth.use-case';
import { RegisterSchema, LoginSchema, RefreshSchema } from '@data-mesh/api-contracts';
import { RegisterDto, LoginDto, TokenResponse } from '@data-mesh/api-contracts';

@ApiTags('Auth')
@Controller({ path: 'auth', version: '1' })
export class AuthController {
  constructor(private readonly authUseCase: IAuthUseCase) {}

  @Post('register')
  @ApiOperation({ summary: 'Register a new user' })
  @ApiResponse({ status: 201, description: 'User registered successfully' })
  @ApiResponse({ status: 409, description: 'Email already exists' })
  async register(@Body() dto: RegisterDto): Promise<{ user: unknown; tokens: TokenResponse }> {
    const result = await this.authUseCase.register(dto);
    return {
      user: {
        id: result.user.id,
        email: result.user.email,
        name: result.user.name,
        role: result.user.role,
        createdAt: result.user.createdAt.toISOString(),
        updatedAt: result.user.updatedAt.toISOString(),
      },
      tokens: result.tokens,
    };
  }

  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Login with email and password' })
  @ApiResponse({ status: 200, description: 'Login successful' })
  @ApiResponse({ status: 401, description: 'Invalid credentials' })
  async login(@Body() dto: LoginDto): Promise<{ user: unknown; tokens: TokenResponse }> {
    const result = await this.authUseCase.login(dto);
    return {
      user: {
        id: result.user.id,
        email: result.user.email,
        name: result.user.name,
        role: result.user.role,
        createdAt: result.user.createdAt.toISOString(),
        updatedAt: result.user.updatedAt.toISOString(),
      },
      tokens: result.tokens,
    };
  }

  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Refresh access token' })
  @ApiResponse({ status: 200, description: 'Tokens refreshed' })
  @ApiResponse({ status: 401, description: 'Invalid refresh token' })
  async refresh(@Body() dto: { refreshToken: string }): Promise<TokenResponse> {
    return this.authUseCase.refreshToken(dto.refreshToken);
  }
}
```

### Test: `apps/api/src/app/infrastructure/inbound/controllers/auth.controller.spec.ts`

```typescript
import { Test, TestingModule } from '@nestjs/testing';
import { AuthController } from './auth.controller';
import { IAuthUseCase } from '../../../domain/ports/inbound/auth.use-case';

describe('AuthController', () => {
  let controller: AuthController;
  let authUseCase: jest.Mocked<IAuthUseCase>;

  beforeEach(async () => {
    authUseCase = {
      register: jest.fn(),
      login: jest.fn(),
      refreshToken: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [{ provide: 'IAuthUseCase', useValue: authUseCase }],
    }).compile();

    controller = module.get<AuthController>(AuthController);
  });

  it('should call register on the auth use case', async () => {
    const dto = { email: 'test@test.com', password: 'Strong1!' };
    const mockUser = {
      id: 'uid1',
      email: 'test@test.com',
      name: null,
      role: 'DEVELOPER' as const,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    const mockTokens = { accessToken: 'at', refreshToken: 'rt', expiresIn: 900 };

    authUseCase.register.mockResolvedValue({ user: mockUser, tokens: mockTokens });

    const result = await controller.register(dto);

    expect(authUseCase.register).toHaveBeenCalledWith(dto);
    expect(result.tokens.accessToken).toBe('at');
    expect(result.user).toHaveProperty('id');
  });
});
```

### File: `apps/api/src/app/infrastructure/inbound/controllers/dataset.controller.ts`

```typescript
import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Body,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { IDatasetUseCase } from '../../../domain/ports/inbound/dataset.use-case';
import { CreateDatasetInput, UpdateDatasetInput } from '../../../domain/entities/dataset.entity';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';
import { RolesGuard } from '../guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';

@ApiTags('Datasets')
@Controller({ path: 'datasets', version: '1' })
export class DatasetController {
  constructor(private readonly datasetUseCase: IDatasetUseCase) {}

  @Get()
  @ApiOperation({ summary: 'List datasets' })
  @ApiQuery({ name: 'source', required: false, enum: ['EEA', 'EUROSTAT', 'COPERNICUS'] })
  @ApiQuery({ name: 'tags', required: false, type: [String] })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  async list(
    @Query('source') source?: string,
    @Query('tags') tags?: string[],
    @Query('page') page = '1',
    @Query('limit') limit = '20',
  ) {
    return this.datasetUseCase.listDatasets(
      parseInt(page, 10),
      parseInt(limit, 10),
      { source, tags },
    );
  }

  @Get(':slug')
  @ApiOperation({ summary: 'Get a dataset by slug' })
  @ApiResponse({ status: 200 })
  @ApiResponse({ status: 404, description: 'Dataset not found' })
  async getBySlug(@Param('slug') slug: string) {
    const dataset = await this.datasetUseCase.getDatasetBySlug(slug);
    return dataset;
  }

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create a new dataset (Admin only)' })
  @ApiResponse({ status: 201 })
  @ApiResponse({ status: 409, description: 'Slug already exists' })
  async create(@Body() input: CreateDatasetInput) {
    return this.datasetUseCase.createDataset(input);
  }

  @Patch(':slug')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update a dataset (Admin only)' })
  async update(@Param('slug') slug: string, @Body() input: UpdateDatasetInput) {
    return this.datasetUseCase.updateDataset(slug, input);
  }

  @Delete(':slug')
  @HttpCode(HttpStatus.NO_CONTENT)
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Delete a dataset (Admin only)' })
  @ApiResponse({ status: 204 })
  async delete(@Param('slug') slug: string): Promise<void> {
    await this.datasetUseCase.deleteDataset(slug);
  }
}
```

---

## Step 8: Guards, Pipes, Filters — Infrastructure Concerns

### JWT Auth Guard — `apps/api/src/app/infrastructure/inbound/guards/jwt-auth.guard.ts`

```typescript
import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
} from '@nestjs/common';
import { Request } from 'express';
import { ITokenPort } from '../../../domain/ports/outbound/token.port';

@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(private readonly tokenPort: ITokenPort) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<Request>();
    const authHeader = request.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new UnauthorizedException('Missing or invalid authorization header.');
    }

    const token = authHeader.slice(7);

    try {
      const payload = await this.tokenPort.verifyAccessToken(token);
      (request as any).user = payload;
      return true;
    } catch {
      throw new UnauthorizedException('Invalid or expired token.');
    }
  }
}
```

### Roles Guard — `apps/api/src/app/infrastructure/inbound/guards/roles.guard.ts`

```typescript
import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ROLES_KEY } from '../../common/decorators/roles.decorator';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<string[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (!requiredRoles || requiredRoles.length === 0) {
      return true;
    }

    const { user } = context.switchToHttp().getRequest();
    return requiredRoles.includes(user.role);
  }
}
```

### Roles Decorator — `apps/api/src/app/infrastructure/common/decorators/roles.decorator.ts`

```typescript
import { SetMetadata } from '@nestjs/common';

export const ROLES_KEY = 'roles';

export const Roles = (...roles: string[]): MethodDecorator & ClassDecorator =>
  SetMetadata(ROLES_KEY, roles);
```

### Current User Decorator — `apps/api/src/app/infrastructure/common/decorators/current-user.decorator.ts`

```typescript
import { createParamDecorator, ExecutionContext } from '@nestjs/common';

export const CurrentUser = createParamDecorator(
  (data: string | undefined, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    const user = request.user;

    return data ? user?.[data] : user;
  },
);
```

### Domain Error Filter — `apps/api/src/app/infrastructure/common/filters/domain-error.filter.ts`

```typescript
import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { FastifyReply } from 'fastify';
import { DomainError, NotFoundError, ConflictError, UnauthorizedError, ForbiddenError, ValidationError } from '@data-mesh/shared-errors';

const ERROR_STATUS_MAP: Record<string, HttpStatus> = {
  NOT_FOUND: HttpStatus.NOT_FOUND,
  CONFLICT: HttpStatus.CONFLICT,
  UNAUTHORIZED: HttpStatus.UNAUTHORIZED,
  FORBIDDEN: HttpStatus.FORBIDDEN,
  VALIDATION_ERROR: HttpStatus.BAD_REQUEST,
};

@Catch(DomainError)
export class DomainErrorFilter implements ExceptionFilter {
  private readonly logger = new Logger(DomainErrorFilter.name);

  catch(exception: DomainError, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const reply = ctx.getResponse<FastifyReply>();
    const status = ERROR_STATUS_MAP[exception.code] ?? HttpStatus.INTERNAL_SERVER_ERROR;

    this.logger.warn(`[${exception.code}] ${exception.message}`);

    reply.status(status).send({
      statusCode: status,
      code: exception.code,
      message: exception.message,
      timestamp: new Date().toISOString(),
    });
  }
}
```

---

## Step 9: Wire It All Together — NestJS Modules

Each feature gets its own module. The module declares which providers to register and which controllers to expose.

### File: `apps/api/src/app/infrastructure/auth.module.ts`

```typescript
import { Module } from '@nestjs/common';
import { AuthUseCase } from '../application/use-cases/auth.use-case';
import { AuthController } from './inbound/controllers/auth.controller';
import { PrismaUserRepository } from './outbound/persistence/prisma-user.repository';
import { BcryptPasswordAdapter } from './outbound/security/bcrypt-password.adapter';
import { JwtTokenAdapter } from './outbound/security/jwt-token.adapter';

@Module({
  controllers: [AuthController],
  providers: [
    AuthUseCase,
    { provide: 'IUserRepository', useClass: PrismaUserRepository },
    { provide: 'IPasswordPort', useClass: BcryptPasswordAdapter },
    { provide: 'ITokenPort', useClass: JwtTokenAdapter },
  ],
})
export class AuthModule {}
```

**Critical pattern:** The module binds interfaces to implementations. `IAuthUseCase` → `AuthUseCase`, `IUserRepository` → `PrismaUserRepository`. The controller injects `IAuthUseCase`, not the concrete class. This is what makes the architecture testable — in tests, you swap real adapters for mocks.

### File: `apps/api/src/app/infrastructure/dataset.module.ts`

```typescript
import { Module } from '@nestjs/common';
import { DatasetUseCase } from '../application/use-cases/dataset.use-case';
import { DatasetController } from './inbound/controllers/dataset.controller';
import { PrismaDatasetRepository } from './outbound/persistence/prisma-dataset.repository';

@Module({
  controllers: [DatasetController],
  providers: [
    DatasetUseCase,
    { provide: 'IDatasetRepository', useClass: PrismaDatasetRepository },
  ],
})
export class DatasetModule {}
```

### Security Adapters — `apps/api/src/app/infrastructure/outbound/security/`

**`bcrypt-password.adapter.ts`:**

```typescript
import { Injectable } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { IPasswordPort } from '../../../domain/ports/outbound/password.port';

@Injectable()
export class BcryptPasswordAdapter implements IPasswordPort {
  private readonly rounds = 12;

  async hash(password: string): Promise<string> {
    return bcrypt.hash(password, this.rounds);
  }

  async compare(password: string, hash: string): Promise<boolean> {
    return bcrypt.compare(password, hash);
  }
}
```

**`jwt-token.adapter.ts`:**

```typescript
import { Injectable } from '@nestjs/common';
import * as jwt from 'jsonwebtoken';
import { ITokenPort } from '../../../domain/ports/outbound/token.port';

@Injectable()
export class JwtTokenAdapter implements ITokenPort {
  private readonly accessSecret = process.env['JWT_SECRET'] ?? 'fallback-secret';
  private readonly refreshSecret = process.env['JWT_REFRESH_SECRET'] ?? 'fallback-refresh-secret';
  private readonly accessExpiry = process.env['JWT_EXPIRY'] ?? '15m';
  private readonly refreshExpiry = process.env['JWT_REFRESH_EXPIRY'] ?? '7d';

  async generateAccessToken(userId: string, role: string): Promise<string> {
    return jwt.sign({ sub: userId, role }, this.accessSecret, {
      expiresIn: this.accessExpiry,
    });
  }

  async generateRefreshToken(userId: string): Promise<string> {
    return jwt.sign({ sub: userId }, this.refreshSecret, {
      expiresIn: this.refreshExpiry,
    });
  }

  async verifyAccessToken(token: string): Promise<{ userId: string; role: string }> {
    const payload = jwt.verify(token, this.accessSecret) as { sub: string; role: string };
    return { userId: payload.sub, role: payload.role };
  }

  async verifyRefreshToken(token: string): Promise<{ userId: string }> {
    const payload = jwt.verify(token, this.refreshSecret) as { sub: string };
    return { userId: payload.sub };
  }
}
```

---

## Step 10: Zod Validation Pipe

This pipe validates incoming request bodies against Zod schemas. It replaces the `@Body()` decorator's default validation.

### File: `apps/api/src/app/infrastructure/inbound/pipes/zod-validation.pipe.ts`

```typescript
import {
  PipeTransform,
  Injectable,
  ArgumentMetadata,
  BadRequestException,
} from '@nestjs/common';
import { ZodSchema } from 'zod';

@Injectable()
export class ZodValidationPipe implements PipeTransform {
  constructor(private readonly schema: ZodSchema) {}

  transform(value: unknown, _metadata: ArgumentMetadata): unknown {
    const result = this.schema.safeParse(value);

    if (!result.success) {
      const errors = result.error.issues.map((issue) => ({
        field: issue.path.join('.'),
        message: issue.message,
      }));
      throw new BadRequestException({ message: 'Validation failed', errors });
    }

    return result.data;
  }
}

export const ZodBody = (schema: ZodSchema): ParameterDecorator[] => {
  return [
    // Body() decorator + custom pipe
    // NestJS's Body() doesn't directly support custom pipes per-route easily via decorator composition
    // Use the ValidationPipe approach in these cases:
    // @Body(new ZodValidationPipe(SomeSchema))
    // Which is the standard NestJS way
  ] as unknown as ParameterDecorator[];
};
```

**Usage in a controller:**

```typescript
import { ZodValidationPipe } from '../pipes/zod-validation.pipe';
import { RegisterSchema } from '@data-mesh/api-contracts';

@Post('register')
async register(
  @Body(new ZodValidationPipe(RegisterSchema)) dto: RegisterDto,
) {
  return this.authUseCase.register(dto);
}
```

---

## Step 11: Redis Cache Adapter

### File: `apps/api/src/app/infrastructure/outbound/cache/redis-cache.adapter.ts`

```typescript
import { Injectable, Logger, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import Redis, { Redis as RedisClient } from 'ioredis';
import { ICachePort } from '../../../domain/ports/outbound/cache.port';

@Injectable()
export class RedisCacheAdapter implements ICachePort, OnModuleInit, OnModuleDestroy {
  private client: RedisClient;
  private readonly logger = new Logger(RedisCacheAdapter.name);

  constructor() {
    const url = process.env['REDIS_URL'] ?? 'redis://localhost:6379';
    this.client = new Redis(url, { maxRetriesPerRequest: 3 });
  }

  async onModuleInit(): Promise<void> {
    this.logger.log('Connecting to Redis...');
    await this.client.ping();
    this.logger.log('Connected to Redis');
  }

  async onModuleDestroy(): Promise<void> {
    this.logger.log('Disconnecting from Redis...');
    await this.client.quit();
    this.logger.log('Disconnected from Redis');
  }

  async get<T>(key: string): Promise<T | null> {
    const value = await this.client.get(key);
    if (!value) return null;
    return JSON.parse(value) as T;
  }

  async set<T>(key: string, value: T, ttlSeconds: number): Promise<void> {
    await this.client.setex(key, ttlSeconds, JSON.stringify(value));
  }

  async delete(key: string): Promise<void> {
    await this.client.del(key);
  }

  async deletePattern(pattern: string): Promise<void> {
    const stream = this.client.scanStream({ match: pattern, count: 100 });
    const pipeline = this.client.pipeline();

    for await (const keys of stream) {
      if (keys.length > 0) {
        keys.forEach((key: string) => pipeline.del(key));
        await pipeline.exec();
      }
    }
  }
}
```

**Usage in a cached use case:**

```typescript
// In MeasurementUseCase
async queryMeasurements(slug: string, query: MeasurementQuery): Promise<PaginatedResponse<Measurement>> {
  const cacheKey = `measurements:${slug}:${query.country ?? '*'}:${query.page}:${query.limit}`;

  const cached = await this.cache.get<PaginatedResponse<Measurement>>(cacheKey);
  if (cached) {
    return cached;
  }

  const result = await this.measurementRepository.query(slug, query);
  await this.cache.set(cacheKey, result, 300); // 5 min TTL
  return result;
}
```

---

## Step 12: E2E Testing

### File: `apps/api/test/e2e/app.e2e-spec.ts`

```typescript
import { Test, TestingModule } from '@nestjs/testing';
import {
  FastifyAdapter,
  NestFastifyApplication,
} from '@nestjs/platform-fastify';
import { AppModule } from '../../src/app/app.module';
import { PrismaService } from '../../src/app/infrastructure/outbound/persistence/prisma.service';

describe('API (e2e)', () => {
  let app: NestFastifyApplication;
  let prisma: PrismaService;

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = module.createNestApplication<NestFastifyApplication>(
      new FastifyAdapter(),
    );

    app.setGlobalPrefix('api/v1');
    await app.init();
    await app.getHttpAdapter().getInstance().ready();

    prisma = app.get(PrismaService);
  });

  afterAll(async () => {
    await prisma.$disconnect();
    await app.close();
  });

  it('GET /api/v1/health — should return OK', async () => {
    const fastify = app.getHttpAdapter().getInstance();
    const response = await fastify.inject({
      method: 'GET',
      url: '/api/v1/health',
    });

    expect(response.statusCode).toBe(200);
  });
});
```

---

## Full File Reference

The complete file structure for the NestJS API after building all steps:

```
apps/api/
├── src/
│   ├── main.ts
│   └── app/
│       ├── app.module.ts
│       ├── domain/
│       │   ├── entities/
│       │   │   ├── user.entity.ts
│       │   │   ├── api-key.entity.ts
│       │   │   ├── dataset.entity.ts
│       │   │   └── measurement.entity.ts
│       │   ├── ports/
│       │   │   ├── inbound/
│       │   │   │   ├── auth.use-case.ts
│       │   │   │   ├── dataset.use-case.ts
│       │   │   │   ├── api-key.use-case.ts
│       │   │   │   └── measurement.use-case.ts
│       │   │   └── outbound/
│       │   │       ├── user-repository.port.ts
│       │   │       ├── api-key-repository.port.ts
│       │   │       ├── dataset-repository.port.ts
│       │   │       ├── measurement-repository.port.ts
│       │   │       ├── cache.port.ts
│       │   │       ├── password.port.ts
│       │   │       └── token.port.ts
│       │   └── services/
│       │       └── (pure business logic if needed)
│       ├── application/
│       │   └── use-cases/
│       │       ├── auth.use-case.ts
│       │       ├── auth.use-case.spec.ts
│       │       ├── dataset.use-case.ts
│       │       ├── dataset.use-case.spec.ts
│       │       ├── api-key.use-case.ts
│       │       └── api-key.use-case.spec.ts
│       └── infrastructure/
│           ├── auth.module.ts
│           ├── dataset.module.ts
│           ├── api-key.module.ts
│           ├── measurement.module.ts
│           ├── common/
│           │   ├── decorators/
│           │   │   ├── current-user.decorator.ts
│           │   │   └── roles.decorator.ts
│           │   └── filters/
│           │       └── domain-error.filter.ts
│           ├── inbound/
│           │   ├── controllers/
│           │   │   ├── auth.controller.ts
│           │   │   ├── auth.controller.spec.ts
│           │   │   ├── dataset.controller.ts
│           │   │   └── dataset.controller.spec.ts
│           │   ├── guards/
│           │   │   ├── jwt-auth.guard.ts
│           │   │   └── roles.guard.ts
│           │   └── pipes/
│           │       └── zod-validation.pipe.ts
│           └── outbound/
│               ├── cache/
│               │   ├── redis-cache.adapter.ts
│               │   └── redis-cache.adapter.spec.ts
│               ├── security/
│               │   ├── bcrypt-password.adapter.ts
│               │   └── jwt-token.adapter.ts
│               └── persistence/
│                   ├── prisma.module.ts
│                   ├── prisma.service.ts
│                   ├── prisma.service.spec.ts
│                   ├── prisma-user.repository.ts
│                   ├── prisma-user.repository.spec.ts
│                   ├── prisma-dataset.repository.ts
│                   └── prisma-dataset.repository.spec.ts
└── test/
    └── e2e/
        └── app.e2e-spec.ts
```

---

## Key Rules to Remember

1. **Domain knows nothing.** No Prisma, no NestJS, no HTTP — just interfaces and types.
2. **Test the use case by mocking outbound ports.** Never hit a real database in unit tests.
3. **Map at the adapter boundary.** `toDomain()` converts Prisma models to domain entities. Never leak Prisma types upward.
4. **DI binds interfaces to implementations.** The controller injects `IAuthUseCase`, not `AuthUseCase`. The module decides the concrete class.
5. **One module per feature.** Auth, Dataset, ApiKey, Measurement — each gets its own NestJS module.
6. **Never use `any`.** ESLint enforces this. Every function has an explicit return type.
