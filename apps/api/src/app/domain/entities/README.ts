/**
 * DOMAIN LAYER — Entities
 *
 * Pure TypeScript classes/interfaces with NO framework dependencies.
 * These are the heart of the Hexagonal Architecture.
 *
 * Rules:
 *  - NO NestJS decorators here
 *  - NO Prisma types here (map from Prisma model → Domain entity at the adapter boundary)
 *  - MUST have explicit TypeScript interfaces — no `any`, no `unknown`
 *
 * Files to be added here (following TDD, one test file per entity):
 *   - dataset.entity.ts         + dataset.entity.spec.ts
 *   - user.entity.ts            + user.entity.spec.ts
 *   - api-key.entity.ts         + api-key.entity.spec.ts
 *   - measurement.entity.ts     + measurement.entity.spec.ts
 */
