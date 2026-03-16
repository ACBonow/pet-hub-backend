/**
 * @module person
 * @file person.routes.ts
 * @description Fastify route registration for the person module.
 */

import type { FastifyInstance } from 'fastify'
import { authMiddleware } from '../../shared/middleware/auth.middleware'
import type { PersonService } from './person.service'
import { PersonController } from './person.controller'

export function registerPersonRoutes(app: FastifyInstance, service: PersonService): void {
  const controller = new PersonController(service)
  const auth = { preHandler: [authMiddleware] }

  app.post('/api/v1/persons', { ...auth, handler: controller.create.bind(controller) })
  app.get('/api/v1/persons/me', { ...auth, handler: controller.getMe.bind(controller) })
  app.get('/api/v1/persons/:id', { ...auth, handler: controller.getById.bind(controller) })
  app.patch('/api/v1/persons/:id', { ...auth, handler: controller.update.bind(controller) })
  app.delete('/api/v1/persons/:id', { ...auth, handler: controller.delete.bind(controller) })
}
