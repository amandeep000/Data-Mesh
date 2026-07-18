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