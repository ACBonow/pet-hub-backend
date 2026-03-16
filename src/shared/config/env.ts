/**
 * @module shared
 * @file env.ts
 * @description Validates and exports typed environment variables.
 * Throws at startup if any required variable is missing.
 */

import { z } from 'zod'

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.coerce.number().default(3000),

  DATABASE_URL: z.string().min(1, 'DATABASE_URL é obrigatória.'),
  DIRECT_URL: z.string().optional(),

  SUPABASE_URL: z.string().min(1, 'SUPABASE_URL é obrigatória.'),
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1, 'SUPABASE_SERVICE_ROLE_KEY é obrigatória.'),
  SUPABASE_ANON_KEY: z.string().min(1, 'SUPABASE_ANON_KEY é obrigatória.'),

  JWT_SECRET: z.string().min(32, 'JWT_SECRET deve ter pelo menos 32 caracteres.'),
  JWT_REFRESH_SECRET: z.string().min(32, 'JWT_REFRESH_SECRET deve ter pelo menos 32 caracteres.'),
  JWT_EXPIRES_IN: z.string().default('15m'),
  JWT_REFRESH_EXPIRES_IN: z.string().default('7d'),

  CORS_ORIGIN: z.string().default('*'),
})

const parsed = envSchema.safeParse(process.env)

if (!parsed.success) {
  const messages = parsed.error.issues.map((i) => `  - ${i.path.join('.')}: ${i.message}`)
  throw new Error(`Variáveis de ambiente inválidas:\n${messages.join('\n')}`)
}

export const env = parsed.data
