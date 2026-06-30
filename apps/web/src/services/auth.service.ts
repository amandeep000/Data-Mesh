import {
  LoginSchema,
  RegisterSchema,
  TokenResponseSchema,
  UserProfileSchema,
  type LoginDto,
  type RegisterDto,
  type TokenResponse,
  type UserProfile,
} from '@data-mesh/api-contracts';
import { httpClient } from './http-client';
import { isMockMode } from '@/lib/env';
import { sleep } from '@/lib/utils';

async function login(dto: LoginDto): Promise<{ tokens: TokenResponse; user: UserProfile }> {
  const parsed = LoginSchema.parse(dto);
  if (isMockMode) {
    await sleep(400);
    return {
      tokens: {
        accessToken: 'mock-access-token',
        refreshToken: 'mock-refresh-token',
        expiresIn: 3600,
      },
      user: {
        id: 'ck-user-demo',
        email: parsed.email,
        name: 'Demo Developer',
        role: 'DEVELOPER',
        createdAt: '2026-01-01T00:00:00.000Z',
      },
    };
  }
  const tokens = await httpClient.post<TokenResponse>('/auth/login', TokenResponseSchema, {
    body: parsed,
  });
  const user = await httpClient.get<UserProfile>('/auth/me', UserProfileSchema, {
    token: tokens.accessToken,
  });
  return { tokens, user };
}

async function register(dto: RegisterDto): Promise<{ tokens: TokenResponse; user: UserProfile }> {
  const parsed = RegisterSchema.parse(dto);
  if (isMockMode) {
    await sleep(500);
    return {
      tokens: {
        accessToken: 'mock-access-token',
        refreshToken: 'mock-refresh-token',
        expiresIn: 3600,
      },
      user: {
        id: 'ck-user-new',
        email: parsed.email,
        name: parsed.name ?? null,
        role: 'DEVELOPER',
        createdAt: new Date().toISOString(),
      },
    };
  }
  const tokens = await httpClient.post<TokenResponse>('/auth/register', TokenResponseSchema, {
    body: parsed,
  });
  const user = await httpClient.get<UserProfile>('/auth/me', UserProfileSchema, {
    token: tokens.accessToken,
  });
  return { tokens, user };
}

export const authService = { login, register };
