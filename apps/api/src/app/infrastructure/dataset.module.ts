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