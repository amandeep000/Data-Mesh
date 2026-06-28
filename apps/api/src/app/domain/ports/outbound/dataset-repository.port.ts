import { Dataset, CreateDatasetInput, UpdateDatasetInput } from '../../entities/dataset.entity';

export interface IDatasetRepository {
  findById(id: string): Promise<Dataset | null>;
  findBySlug(slug: string): Promise<Dataset | null>;
  findAll(page: number, limit: number, filters?: { source?: string; tags?: string[] }): Promise<{ data: Dataset[]; total: number }>;
  create(input: CreateDatasetInput): Promise<Dataset>;
  update(slug: string, input: UpdateDatasetInput): Promise<Dataset>;
  delete(slug: string): Promise<void>;
}