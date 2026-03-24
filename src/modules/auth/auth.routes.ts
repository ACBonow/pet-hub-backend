/**
 * @module auth
 * @file auth.routes.ts
 * @description Fastify route registration for the auth module.
 */

import type { FastifyInstance } from 'fastify'
import { authMiddleware } from '../../shared/middleware/auth.middleware'
import type { AuthService } from './auth.service'
import { AuthController } from './auth.controller'

export function registerAuthRoutes(app: FastifyInstance, service: AuthService): void {
  const controller = new AuthController(service)

  app.post('/api/v1/auth/register', controller.register.bind(controller))
  app.post('/api/v1/auth/login', controller.login.bind(controller))
  app.post('/api/v1/auth/refresh', controller.refresh.bind(controller))
  app.post('/api/v1/auth/logout', {
    preHandler: [authMiddleware],
    handler: controller.logout.bind(controller),
  })
  app.post('/api/v1/auth/verify-email', controller.verifyEmail.bind(controller))
  app.post('/api/v1/auth/resend-verification', controller.resendVerification.bind(controller))
  app.post('/api/v1/auth/forgot-password', controller.forgotPassword.bind(controller))
  app.post('/api/v1/auth/reset-password', controller.resetPassword.bind(controller))
}
