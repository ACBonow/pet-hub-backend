/**
 * @module services-directory
 * @file servicesDirectory.routes.ts
 * @description Fastify route registration for the services-directory module.
 */

import type { FastifyInstance } from 'fastify'
import { authMiddleware } from '../../shared/middleware/auth.middleware'
import type { ServicesDirectoryService } from './servicesDirectory.service'
import { ServicesDirectoryController } from './servicesDirectory.controller'

export function registerServicesDirectoryRoutes(
  app: FastifyInstance,
  service: ServicesDirectoryService,
): void {
  const controller = new ServicesDirectoryController(service)
  const auth = { preHandler: [authMiddleware] }

  // Public routes
  app.get('/api/v1/services-directory', {
    handler: controller.list.bind(controller),
  })

  app.get('/api/v1/services-directory/:id', {
    handler: controller.getById.bind(controller),
  })

  // Authenticated routes
  app.post('/api/v1/services-directory', {
    ...auth,
    handler: controller.create.bind(controller),
  })

  app.patch('/api/v1/services-directory/:id', {
    ...auth,
    handler: controller.update.bind(controller),
  })

  app.delete('/api/v1/services-directory/:id', {
    ...auth,
    handler: controller.delete.bind(controller),
  })
}
