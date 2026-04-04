/**
 * @module auth
 * @file auth.routes.ts
 * @description Fastify route registration for the auth module.
 */

import type { FastifyInstance } from 'fastify'
import { authMiddleware } from '../../shared/middleware/auth.middleware'
import type { AuthService } from './auth.service'
import { AuthController } from './auth.controller'
import { AUTH_RATE_LIMITS } from '../../shared/plugins/rate-limit'

export function registerAuthRoutes(app: FastifyInstance, service: AuthService): void {
  const controller = new AuthController(service)

  app.post('/api/v1/auth/register', {
    config: { rateLimit: AUTH_RATE_LIMITS.register },
    handler: controller.register.bind(controller),
  })
  app.post('/api/v1/auth/login', {
    config: { rateLimit: AUTH_RATE_LIMITS.login },
    handler: controller.login.bind(controller),
  })
  app.post('/api/v1/auth/refresh', {
    config: { rateLimit: AUTH_RATE_LIMITS.refresh },
    handler: controller.refresh.bind(controller),
  })
  app.post('/api/v1/auth/logout', {
    preHandler: [authMiddleware],
    handler: controller.logout.bind(controller),
  })
  app.post('/api/v1/auth/verify-email', controller.verifyEmail.bind(controller))
  app.post('/api/v1/auth/resend-verification', {
    config: { rateLimit: AUTH_RATE_LIMITS.resendVerification },
    handler: controller.resendVerification.bind(controller),
  })
  app.post('/api/v1/auth/forgot-password', {
    config: { rateLimit: AUTH_RATE_LIMITS.forgotPassword },
    handler: controller.forgotPassword.bind(controller),
  })
  app.post('/api/v1/auth/reset-password', controller.resetPassword.bind(controller))
}
