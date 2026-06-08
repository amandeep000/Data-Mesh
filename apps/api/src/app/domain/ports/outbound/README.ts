/**
 * DOMAIN LAYER — Ports (Outbound / Secondary)
 *
 * Outbound ports are interfaces that the domain DEPENDS ON but does NOT implement.
 * Infrastructure adapters (Prisma repos, Redis cache, HTTP clients) implement them.
 *
 * Naming convention:  I<Resource>Repository  |  I<Resource>Cache  |  I<Resource>Client
 *
 * Example (add when starting the Datasets feature):
 *
 * export interface IDatasetRepository {
 *   findById(id: string): Promise<Dataset | null>;
 *   save(dataset: Dataset): Promise<Dataset>;
 * }
 *
 * Files to be added here (one per feature, following TDD):
 *   - dataset.repository.port.ts
 *   - dataset.cache.port.ts
 *   - eu-data.http-client.port.ts
 *   - api-key.repository.port.ts
 */
