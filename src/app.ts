/**
 * @module core
 * @file app.ts
 * @description Fastify application factory. Registers plugins and routes.
 */

import Fastify, { FastifyInstance } from 'fastify'
import cors from '@fastify/cors'
import helmet from '@fastify/helmet'
import { registerErrorHandler } from './shared/middleware/error.middleware'

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

  return app
}
