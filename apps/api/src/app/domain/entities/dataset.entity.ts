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