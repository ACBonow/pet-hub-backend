/**
 * @module core
 * @file app.ts
 * @description Fastify application factory. Registers plugins and routes.
 */

import Fastify, { FastifyInstance } from 'fastify'
import cors from '@fastify/cors'
import helmet from '@fastify/helmet'
import { registerErrorHandler } from './shared/middleware/error.middleware'
import { PrismaAuthRepository, registerAuthRoutes, AuthService } from './modules/auth'
import { PrismaPersonRepository, registerPersonRoutes, PersonService } from './modules/person'

export function buildApp(): FastifyInstance {
  const app = Fastify({
    logger: process.env.NODE_ENV !== 'test',
  })

  // Plugins
  app.register(cors, {
    origin: process.env.CORS_ORIGIN ?? '*',
  })

  app.register(helmet)

  // Global error handler
  registerErrorHandler(app)

  // Health check
  app.get('/health', async () => ({ status: 'ok' }))

  // Auth routes
  const authService = new AuthService(new PrismaAuthRepository())
  registerAuthRoutes(app, authService)

  // Person routes
  const personService = new PersonService(new PrismaPersonRepository())
  registerPersonRoutes(app, personService)

  return app
}
