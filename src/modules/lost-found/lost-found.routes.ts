/**
 * @module lost-found
 * @file lost-found.routes.ts
 * @description Fastify route registration for the lost-found module.
 */

import type { FastifyInstance } from 'fastify'
import { authMiddleware } from '../../shared/middleware/auth.middleware'
import type { LostFoundService } from './lost-found.service'
import { LostFoundController } from './lost-found.controller'

export function registerLostFoundRoutes(app: FastifyInstance, service: LostFoundService): void {
  const controller = new LostFoundController(service)
  const auth = { preHandler: [authMiddleware] }

  // Public routes
  app.get('/api/v1/lost-found', { handler: controller.findAll.bind(controller) })
  app.get('/api/v1/lost-found/:id', { handler: controller.findById.bind(controller) })

  // Protected routes
  app.post('/api/v1/lost-found', { ...auth, handler: controller.create.bind(controller) })
  app.patch('/api/v1/lost-found/:id/status', { ...auth, handler: controller.updateStatus.bind(controller) })
  app.delete('/api/v1/lost-found/:id', { ...auth, handler: controller.delete.bind(controller) })
}
