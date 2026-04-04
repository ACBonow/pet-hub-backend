/**
 * @module shared/plugins
 * @file rate-limit.test.ts
 * @description Integration tests for the rate-limit plugin behavior.
 */

import Fastify from 'fastify'
import rateLimit from '@fastify/rate-limit'
import { AUTH_RATE_LIMITS } from '../rate-limit'

describe('rate-limit plugin', () => {
  it('should return 200 for requests under the limit', async () => {
    const app = Fastify()
    await app.register(rateLimit, { global: false })
    app.get('/test', {
      config: { rateLimit: { max: 3, timeWindow: 60_000 } },
      handler: async () => ({ ok: true }),
    })
    await app.ready()

    const response = await app.inject({ method: 'GET', url: '/test' })

    expect(response.statusCode).toBe(200)
    await app.close()
  })

  it('should return 429 after exceeding the rate limit', async () => {
    const app = Fastify()
    await app.register(rateLimit, { global: false })
    app.get('/limited', {
      config: { rateLimit: { max: 2, timeWindow: 60_000 } },
      handler: async () => ({ ok: true }),
    })
    await app.ready()

    await app.inject({ method: 'GET', url: '/limited' })
    await app.inject({ method: 'GET', url: '/limited' })
    const response = await app.inject({ method: 'GET', url: '/limited' })

    expect(response.statusCode).toBe(429)
    await app.close()
  })

  it('should include rate-limit headers in the response', async () => {
    const app = Fastify()
    await app.register(rateLimit, { global: false })
    app.get('/headers', {
      config: { rateLimit: { max: 5, timeWindow: 60_000 } },
      handler: async () => ({ ok: true }),
    })
    await app.ready()

    const response = await app.inject({ method: 'GET', url: '/headers' })

    expect(response.headers['x-ratelimit-limit']).toBeDefined()
    expect(response.headers['x-ratelimit-remaining']).toBeDefined()
    await app.close()
  })

  it('should not apply rate limit to routes without config', async () => {
    const app = Fastify()
    await app.register(rateLimit, { global: false })
    app.get('/unlimited', { handler: async () => ({ ok: true }) })
    await app.ready()

    for (let i = 0; i < 5; i++) {
      const response = await app.inject({ method: 'GET', url: '/unlimited' })
      expect(response.statusCode).toBe(200)
    }
    await app.close()
  })

  describe('AUTH_RATE_LIMITS', () => {
    it('should export login limit as 10 req/min', () => {
      expect(AUTH_RATE_LIMITS.login.max).toBe(10)
      expect(AUTH_RATE_LIMITS.login.timeWindow).toBe(60_000)
    })

    it('should export register limit as 5 req/min', () => {
      expect(AUTH_RATE_LIMITS.register.max).toBe(5)
      expect(AUTH_RATE_LIMITS.register.timeWindow).toBe(60_000)
    })

    it('should export forgotPassword limit as 3 req/min', () => {
      expect(AUTH_RATE_LIMITS.forgotPassword.max).toBe(3)
      expect(AUTH_RATE_LIMITS.forgotPassword.timeWindow).toBe(60_000)
    })

    it('should export refresh limit as 30 req/min', () => {
      expect(AUTH_RATE_LIMITS.refresh.max).toBe(30)
      expect(AUTH_RATE_LIMITS.refresh.timeWindow).toBe(60_000)
    })

    it('should export resendVerification limit as 3 req/min', () => {
      expect(AUTH_RATE_LIMITS.resendVerification.max).toBe(3)
      expect(AUTH_RATE_LIMITS.resendVerification.timeWindow).toBe(60_000)
    })
  })
})
