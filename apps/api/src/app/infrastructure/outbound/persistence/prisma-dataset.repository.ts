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