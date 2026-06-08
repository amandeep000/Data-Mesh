import { z } from 'zod';

// ─── Auth Schemas ─────────────────────────────────────────────
export const RegisterSchema = z.object({
  email: z.string().email(),
  password: z
    .string()
    .min(8)
    .regex(/[A-Z]/, 'Must contain uppercase')
    .regex(/[0-9]/, 'Must contain a number')
    .regex(/[^a-zA-Z0-9]/, 'Must contain a special character'),
  name: z.string().min(2).max(100).optional(),
});

export const LoginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export const TokenResponseSchema = z.object({
  accessToken: z.string(),
  refreshToken: z.string(),
  expiresIn: z.number().int().positive(),
});

export const RefreshSchema = z.object({
  refreshToken: z.string(),
});

export const UserProfileSchema = z.object({
  id: z.string().cuid(),
  email: z.string().email(),
  name: z.string().nullable(),
  role: z.enum(['ADMIN', 'DEVELOPER']),
  createdAt: z.string().datetime(),
});

// ─── Inferred Types ───────────────────────────────────────────
export type RegisterDto = z.infer<typeof RegisterSchema>;
export type LoginDto = z.infer<typeof LoginSchema>;
export type TokenResponse = z.infer<typeof TokenResponseSchema>;
export type RefreshDto = z.infer<typeof RefreshSchema>;
export type UserProfile = z.infer<typeof UserProfileSchema>;
