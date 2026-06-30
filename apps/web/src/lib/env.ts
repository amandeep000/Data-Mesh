import { z } from 'zod';

const envSchema = z.object({
  NEXT_PUBLIC_API_URL: z.string().url().default('http://localhost:3000'),
  NEXT_PUBLIC_API_MODE: z.enum(['mock', 'live']).default('mock'),
});

export type Env = z.infer<typeof envSchema>;

function parseEnv(): Env {
  const result = envSchema.safeParse({
    NEXT_PUBLIC_API_URL: process.env['NEXT_PUBLIC_API_URL'],
    NEXT_PUBLIC_API_MODE: process.env['NEXT_PUBLIC_API_MODE'],
  });
  if (!result.success) {
    // Fall back to defaults rather than crashing the client bundle.
    return {
      NEXT_PUBLIC_API_URL: 'http://localhost:3000',
      NEXT_PUBLIC_API_MODE: 'mock',
    };
  }
  return result.data;
}

export const env: Env = parseEnv();

export const isMockMode = env.NEXT_PUBLIC_API_MODE === 'mock';
