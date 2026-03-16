/**
 * @module auth
 * @file auth.controller.test.ts
 * @description HTTP-layer tests for auth routes using Fastify inject — service is mocked.
 */

import { buildApp } from '../../../app'
import { AuthService } from '../auth.service'

jest.mock('../auth.service')
const MockedAuthService = AuthService as jest.MockedClass<typeof AuthService>

// ─── Helpers ─────────────────────────────────────────────────────────────────

async function buildTestApp() {
  MockedAuthService.mockClear()
  const app = buildApp()
  await app.ready()
  // buildApp() instantiates AuthService — grab the mock instance
  const service = MockedAuthService.mock.instances[0]
  return { app, service }
}

// ─── Tests ───────────────────────────────────────────────────────────────────

describe('Auth routes', () => {
  // ── POST /api/v1/auth/register ─────────────────────────────────────────────

  describe('POST /api/v1/auth/register', () => {
    it('returns 201 with tokens on successful registration', async () => {
      const { app, service } = await buildTestApp()
      jest.mocked(service.register).mockResolvedValueOnce({
        accessToken: 'access-token',
        refreshToken: 'refresh-token',
      })

      const response = await app.inject({
        method: 'POST',
        url: '/api/v1/auth/register',
        payload: { email: 'new@example.com', password: 'password123' },
      })

      expect(response.statusCode).toBe(201)
      const body = response.json()
      expect(body.success).toBe(true)
      expect(body.data).toHaveProperty('accessToken')
      expect(body.data).toHaveProperty('refreshToken')

      await app.close()
    })

    it('returns 400 on invalid email', async () => {
      const { app } = await buildTestApp()

      const response = await app.inject({
        method: 'POST',
        url: '/api/v1/auth/register',
        payload: { email: 'not-an-email', password: 'password123' },
      })

      expect(response.statusCode).toBe(400)
      await app.close()
    })

    it('returns 400 when password is too short', async () => {
      const { app } = await buildTestApp()

      const response = await app.inject({
        method: 'POST',
        url: '/api/v1/auth/register',
        payload: { email: 'valid@example.com', password: 'short' },
      })

      expect(response.statusCode).toBe(400)
      await app.close()
    })

    it('returns 409 when email is already in use', async () => {
      const { app, service } = await buildTestApp()
      const { HttpError } = await import('../../../shared/errors/HttpError')
      jest.mocked(service.register).mockRejectedValueOnce(
        HttpError.conflict('EMAIL_ALREADY_IN_USE', 'E-mail já está em uso.'),
      )

      const response = await app.inject({
        method: 'POST',
        url: '/api/v1/auth/register',
        payload: { email: 'taken@example.com', password: 'password123' },
      })

      expect(response.statusCode).toBe(409)
      await app.close()
    })
  })

  // ── POST /api/v1/auth/login ────────────────────────────────────────────────

  describe('POST /api/v1/auth/login', () => {
    it('returns 200 with tokens on valid credentials', async () => {
      const { app, service } = await buildTestApp()
      jest.mocked(service.login).mockResolvedValueOnce({
        accessToken: 'access-token',
        refreshToken: 'refresh-token',
      })

      const response = await app.inject({
        method: 'POST',
        url: '/api/v1/auth/login',
        payload: { email: 'test@example.com', password: 'correctpassword' },
      })

      expect(response.statusCode).toBe(200)
      const body = response.json()
      expect(body.success).toBe(true)
      expect(body.data).toHaveProperty('accessToken')
      expect(body.data).toHaveProperty('refreshToken')

      await app.close()
    })

    it('returns 401 on invalid credentials', async () => {
      const { app, service } = await buildTestApp()
      const { HttpError } = await import('../../../shared/errors/HttpError')
      jest.mocked(service.login).mockRejectedValueOnce(HttpError.unauthorized())

      const response = await app.inject({
        method: 'POST',
        url: '/api/v1/auth/login',
        payload: { email: 'test@example.com', password: 'wrongpassword' },
      })

      expect(response.statusCode).toBe(401)
      await app.close()
    })
  })

  // ── POST /api/v1/auth/refresh ──────────────────────────────────────────────

  describe('POST /api/v1/auth/refresh', () => {
    it('returns 200 with new accessToken', async () => {
      const { app, service } = await buildTestApp()
      jest.mocked(service.refresh).mockResolvedValueOnce({ accessToken: 'new-access-token' })

      const response = await app.inject({
        method: 'POST',
        url: '/api/v1/auth/refresh',
        payload: { refreshToken: 'valid-refresh-token' },
      })

      expect(response.statusCode).toBe(200)
      const body = response.json()
      expect(body.success).toBe(true)
      expect(body.data).toHaveProperty('accessToken')

      await app.close()
    })

    it('returns 401 on invalid refresh token', async () => {
      const { app, service } = await buildTestApp()
      const { HttpError } = await import('../../../shared/errors/HttpError')
      jest.mocked(service.refresh).mockRejectedValueOnce(HttpError.unauthorized())

      const response = await app.inject({
        method: 'POST',
        url: '/api/v1/auth/refresh',
        payload: { refreshToken: 'bad-token' },
      })

      expect(response.statusCode).toBe(401)
      await app.close()
    })
  })

  // ── POST /api/v1/auth/logout ───────────────────────────────────────────────

  describe('POST /api/v1/auth/logout', () => {
    it('returns 204 when authenticated user logs out', async () => {
      const { app, service } = await buildTestApp()
      jest.mocked(service.logout).mockResolvedValueOnce(undefined)

      // Generate a real token for the test
      const jwt = await import('jsonwebtoken')
      const token = jwt.default.sign(
        { sub: 'user-1' },
        process.env.JWT_SECRET ?? 'test-secret',
        { expiresIn: '15m' },
      )

      const response = await app.inject({
        method: 'POST',
        url: '/api/v1/auth/logout',
        headers: { authorization: `Bearer ${token}` },
      })

      expect(response.statusCode).toBe(204)
      expect(service.logout).toHaveBeenCalledWith('user-1')

      await app.close()
    })

    it('returns 401 when not authenticated', async () => {
      const { app } = await buildTestApp()

      const response = await app.inject({
        method: 'POST',
        url: '/api/v1/auth/logout',
      })

      expect(response.statusCode).toBe(401)
      await app.close()
    })
  })
})
