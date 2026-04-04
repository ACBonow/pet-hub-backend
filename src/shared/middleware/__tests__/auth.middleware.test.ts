/**
 * @module shared/middleware
 * @file auth.middleware.test.ts
 * @description Tests for the JWT auth middleware, including algorithm enforcement (TECH-BE-007).
 */

import Fastify from 'fastify'
import jwt from 'jsonwebtoken'
import 'dotenv/config'
import { authMiddleware } from '../auth.middleware'

const SECRET = process.env.JWT_SECRET ?? 'test-secret-that-is-long-enough-32chars'

function buildTestApp() {
  const app = Fastify()
  app.get('/protected', { preHandler: [authMiddleware] }, async (req) => {
    return { userId: req.user?.id }
  })
  return app
}

describe('authMiddleware — algorithm enforcement', () => {
  it('accepts a valid HS256 token', async () => {
    const app = buildTestApp()
    await app.ready()
    const token = jwt.sign({ sub: 'user-1' }, SECRET, { algorithm: 'HS256', expiresIn: '15m' })

    const res = await app.inject({
      method: 'GET',
      url: '/protected',
      headers: { authorization: `Bearer ${token}` },
    })

    expect(res.statusCode).toBe(200)
    expect(res.json().userId).toBe('user-1')
    await app.close()
  })

  it('rejects a token signed with HS512', async () => {
    const app = buildTestApp()
    await app.ready()
    const token = jwt.sign({ sub: 'user-1' }, SECRET, { algorithm: 'HS512', expiresIn: '15m' })

    const res = await app.inject({
      method: 'GET',
      url: '/protected',
      headers: { authorization: `Bearer ${token}` },
    })

    expect(res.statusCode).toBe(401)
    await app.close()
  })

  it('rejects a request with no Authorization header', async () => {
    const app = buildTestApp()
    await app.ready()

    const res = await app.inject({ method: 'GET', url: '/protected' })

    expect(res.statusCode).toBe(401)
    await app.close()
  })

  it('rejects a malformed token', async () => {
    const app = buildTestApp()
    await app.ready()

    const res = await app.inject({
      method: 'GET',
      url: '/protected',
      headers: { authorization: 'Bearer not.a.token' },
    })

    expect(res.statusCode).toBe(401)
    await app.close()
  })
})
