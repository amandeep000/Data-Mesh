import { Test, TestingModule } from '@nestjs/testing';
import { AuthController } from './auth.controller';
import { IAuthUseCase } from '../../../domain/ports/inbound/auth.use-case';

describe('AuthController', () => {
  let controller: AuthController;
  let authUseCase: jest.Mocked<IAuthUseCase>;

  beforeEach(async () => {
    authUseCase = {
      register: jest.fn(),
      login: jest.fn(),
      refresh_token: jest.fn(),
    };

    const moduleRef = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [{ provide: 'IAuthUseCase', useValue: authUseCase }],
    }).compile();

    controller = moduleRef.get<AuthController>(AuthController);
  });

  it('should call register on the auth use case', async () => {
    const dto = { email: 'test@test.com', password: 'Strong1!' };
    const mockUser = {
      id: 'uid1',
      email: 'test@test.com',
      name: null,
      role: 'DEVELOPER' as const,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    const mockTokens = { accessToken: 'at', refreshToken: 'rt', expiresIn: 900 };

    authUseCase.register.mockResolvedValue({ user: mockUser, tokens: mockTokens });

    const result = await controller.register(dto);

    expect(authUseCase.register).toHaveBeenCalledWith(dto);
    expect(result.tokens.accessToken).toBe('at');
    expect(result.user).toHaveProperty('id');
  });
});