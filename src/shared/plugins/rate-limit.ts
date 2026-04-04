/**
 * @module shared/plugins
 * @file rate-limit.ts
 * @description Rate limiting plugin for Fastify. Registers @fastify/rate-limit
 * with per-route opt-in. Auth endpoints use the exported AUTH_RATE_LIMITS configs.
 */

import type { FastifyInstance } from 'fastify'
import rateLimit from '@fastify/rate-limit'

export const AUTH_RATE_LIMITS = {
  login: { max: 10, timeWindow: 60_000 },
  register: { max: 5, timeWindow: 60_000 },
  forgotPassword: { max: 3, timeWindow: 60_000 },
  refresh: { max: 30, timeWindow: 60_000 },
  resendVerification: { max: 3, timeWindow: 60_000 },
} as const

export async function registerRateLimit(app: FastifyInstance): Promise<void> {
  await app.register(rateLimit, { global: false })
}
