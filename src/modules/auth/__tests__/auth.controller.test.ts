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
        user: { id: 'user-1', email: 'new@example.com' },
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
        user: { id: 'user-1', email: 'test@example.com' },
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

    it('returns 403 with EMAIL_NOT_VERIFIED when email is not verified', async () => {
      const { app, service } = await buildTestApp()
      const { AppError } = await import('../../../shared/errors/AppError')
      jest.mocked(service.login).mockRejectedValueOnce(
        new AppError(403, 'EMAIL_NOT_VERIFIED', 'E-mail não verificado.'),
      )

      const response = await app.inject({
        method: 'POST',
        url: '/api/v1/auth/login',
        payload: { email: 'test@example.com', password: 'correctpassword' },
      })

      expect(response.statusCode).toBe(403)
      const body = response.json()
      expect(body.error.code).toBe('EMAIL_NOT_VERIFIED')

      await app.close()
    })
  })

  // ── POST /api/v1/auth/refresh ──────────────────────────────────────────────

  describe('POST /api/v1/auth/refresh', () => {
    it('returns 200 with new accessToken', async () => {
      const { app, service } = await buildTestApp()
      jest.mocked(service.refresh).mockResolvedValueOnce({ accessToken: 'new-access-token', refreshToken: 'new-refresh-token' })

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

  // ── POST /api/v1/auth/verify-email ────────────────────────────────────────

  describe('POST /api/v1/auth/verify-email', () => {
    it('returns 200 on valid token', async () => {
      const { app, service } = await buildTestApp()
      jest.mocked(service.verifyEmail).mockResolvedValueOnce(undefined)

      const response = await app.inject({
        method: 'POST',
        url: '/api/v1/auth/verify-email',
        payload: { token: 'valid-token' },
      })

      expect(response.statusCode).toBe(200)
      const body = response.json()
      expect(body.success).toBe(true)

      await app.close()
    })

    it('returns 400 on invalid token', async () => {
      const { app, service } = await buildTestApp()
      const { AppError } = await import('../../../shared/errors/AppError')
      jest.mocked(service.verifyEmail).mockRejectedValueOnce(
        new AppError(400, 'INVALID_VERIFICATION_TOKEN', 'Token inválido.'),
      )

      const response = await app.inject({
        method: 'POST',
        url: '/api/v1/auth/verify-email',
        payload: { token: 'bad-token' },
      })

      expect(response.statusCode).toBe(400)
      const body = response.json()
      expect(body.error.code).toBe('INVALID_VERIFICATION_TOKEN')

      await app.close()
    })

    it('returns 400 when token field is missing', async () => {
      const { app } = await buildTestApp()

      const response = await app.inject({
        method: 'POST',
        url: '/api/v1/auth/verify-email',
        payload: {},
      })

      expect(response.statusCode).toBe(400)
      await app.close()
    })
  })

  // ── POST /api/v1/auth/resend-verification ─────────────────────────────────

  describe('POST /api/v1/auth/resend-verification', () => {
    it('returns 200 regardless of whether user exists (no info leak)', async () => {
      const { app, service } = await buildTestApp()
      jest.mocked(service.resendVerification).mockResolvedValueOnce(undefined)

      const response = await app.inject({
        method: 'POST',
        url: '/api/v1/auth/resend-verification',
        payload: { email: 'any@example.com' },
      })

      expect(response.statusCode).toBe(200)
      const body = response.json()
      expect(body.success).toBe(true)

      await app.close()
    })

    it('returns 400 on invalid email', async () => {
      const { app } = await buildTestApp()

      const response = await app.inject({
        method: 'POST',
        url: '/api/v1/auth/resend-verification',
        payload: { email: 'not-an-email' },
      })

      expect(response.statusCode).toBe(400)
      await app.close()
    })
  })

  // ── POST /api/v1/auth/forgot-password ─────────────────────────────────────

  describe('POST /api/v1/auth/forgot-password', () => {
    it('returns 200 regardless of whether user exists (no info leak)', async () => {
      const { app, service } = await buildTestApp()
      jest.mocked(service.forgotPassword).mockResolvedValueOnce(undefined)

      const response = await app.inject({
        method: 'POST',
        url: '/api/v1/auth/forgot-password',
        payload: { email: 'any@example.com' },
      })

      expect(response.statusCode).toBe(200)
      const body = response.json()
      expect(body.success).toBe(true)

      await app.close()
    })

    it('returns 400 on invalid email', async () => {
      const { app } = await buildTestApp()

      const response = await app.inject({
        method: 'POST',
        url: '/api/v1/auth/forgot-password',
        payload: { email: 'not-an-email' },
      })

      expect(response.statusCode).toBe(400)
      await app.close()
    })
  })

  // ── POST /api/v1/auth/reset-password ──────────────────────────────────────

  describe('POST /api/v1/auth/reset-password', () => {
    it('returns 200 on valid token', async () => {
      const { app, service } = await buildTestApp()
      jest.mocked(service.resetPassword).mockResolvedValueOnce(undefined)

      const response = await app.inject({
        method: 'POST',
        url: '/api/v1/auth/reset-password',
        payload: { token: 'valid-token', newPassword: 'newpass123' },
      })

      expect(response.statusCode).toBe(200)
      const body = response.json()
      expect(body.success).toBe(true)

      await app.close()
    })

    it('returns 400 on invalid reset token', async () => {
      const { app, service } = await buildTestApp()
      const { AppError } = await import('../../../shared/errors/AppError')
      jest.mocked(service.resetPassword).mockRejectedValueOnce(
        new AppError(400, 'INVALID_RESET_TOKEN', 'Token inválido.'),
      )

      const response = await app.inject({
        method: 'POST',
        url: '/api/v1/auth/reset-password',
        payload: { token: 'bad-token', newPassword: 'newpass123' },
      })

      expect(response.statusCode).toBe(400)
      const body = response.json()
      expect(body.error.code).toBe('INVALID_RESET_TOKEN')

      await app.close()
    })

    it('returns 400 when newPassword is too short', async () => {
      const { app } = await buildTestApp()

      const response = await app.inject({
        method: 'POST',
        url: '/api/v1/auth/reset-password',
        payload: { token: 'some-token', newPassword: 'short' },
      })

      expect(response.statusCode).toBe(400)
      await app.close()
    })
  })
})
