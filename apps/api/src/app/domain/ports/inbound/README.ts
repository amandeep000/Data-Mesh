/**
 * DOMAIN LAYER — Ports (Inbound / Primary)
 *
 * Inbound ports are interfaces that define the USE CASES the domain exposes.
 * Controllers and other external drivers call these interfaces — they never
 * touch domain services directly.
 *
 * Naming convention:  I<FeatureName>UseCase
 *
 * Example (add when starting the Datasets feature):
 *
 * export interface IGetDatasetUseCase {
 *   execute(id: string): Promise<Dataset>;
 * }
 *
 * Files to be added here (one per feature, following TDD):
 *   - dataset.use-case.port.ts
 *   - auth.use-case.port.ts
 *   - api-key.use-case.port.ts
 */
