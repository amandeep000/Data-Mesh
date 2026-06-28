/* eslint-disable @typescript-eslint/no-var-requires */
import { Test } from '@nestjs/testing';
jest.mock('@prisma/client', () => ({
  PrismaClient: class MockPrismaClient {
    $connect = jest.fn().mockResolvedValue(undefined);
    $disconnect = jest.fn().mockResolvedValue(undefined);
  },
}));

// Required after jest.mock() so the mock applies. Import is avoided to
// prevent swc from hoisting the require above the mock registration
// (@swc-node/jest does not hoist jest.mock like babel-jest does).
const { PrismaService } = require('./prisma.service') as typeof import('./prisma.service');
const { PrismaModule } = require('./prisma.module') as typeof import('./prisma.module');

// Derive the instance type from the constructor value so we don't need a
// type-only import (which would still conflict with the const above).
type PrismaService = InstanceType<typeof PrismaService>;

describe('PrismaService', () => {
  let prismaService: PrismaService;

  beforeEach(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [PrismaModule],
    }).compile();

    prismaService = moduleRef.get<PrismaService>(PrismaService);
  });

  it('should be defined', () => {
    expect(prismaService).toBeDefined();
  });

  it('should connect to the database on module init', async () => {
    await prismaService.onModuleInit();
    expect(jest.mocked(prismaService.$connect)).toHaveBeenCalledTimes(1);
  });

  it('should disconnect from the database on module destroy', async () => {
    await prismaService.onModuleDestroy();
    expect(jest.mocked(prismaService.$disconnect)).toHaveBeenCalledTimes(1);
  });
});
