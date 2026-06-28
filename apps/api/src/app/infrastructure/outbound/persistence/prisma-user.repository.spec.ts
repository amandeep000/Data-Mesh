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