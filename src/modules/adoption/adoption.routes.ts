/**
 * @module adoption
 * @file adoption.routes.ts
 * @description Fastify route registration for the adoption module.
 */

import type { FastifyInstance } from 'fastify'
import { authMiddleware } from '../../shared/middleware/auth.middleware'
import type { AdoptionService } from './adoption.service'
import { AdoptionController } from './adoption.controller'

export function registerAdoptionRoutes(app: FastifyInstance, service: AdoptionService): void {
  const controller = new AdoptionController(service)
  const auth = { preHandler: [authMiddleware] }

  // Public routes
  app.get('/api/v1/adoptions', { handler: controller.findAll.bind(controller) })
  app.get('/api/v1/adoptions/:id', { handler: controller.findById.bind(controller) })

  // Protected routes
  app.post('/api/v1/adoptions', { ...auth, handler: controller.create.bind(controller) })
  app.patch('/api/v1/adoptions/:id/status', { ...auth, handler: controller.updateStatus.bind(controller) })
  app.delete('/api/v1/adoptions/:id', { ...auth, handler: controller.delete.bind(controller) })
}
