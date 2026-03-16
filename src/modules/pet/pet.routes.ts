/**
 * @module pet
 * @file pet.routes.ts
 * @description Fastify route registration for the pet module.
 */

import type { FastifyInstance } from 'fastify'
import { authMiddleware } from '../../shared/middleware/auth.middleware'
import type { PetService } from './pet.service'
import { PetController } from './pet.controller'

export function registerPetRoutes(app: FastifyInstance, service: PetService): void {
  const controller = new PetController(service)
  const auth = { preHandler: [authMiddleware] }

  app.post('/api/v1/pets', { ...auth, handler: controller.create.bind(controller) })
  app.get('/api/v1/pets/:id', { ...auth, handler: controller.getById.bind(controller) })
  app.patch('/api/v1/pets/:id', { ...auth, handler: controller.update.bind(controller) })
  app.delete('/api/v1/pets/:id', { ...auth, handler: controller.delete.bind(controller) })
  app.post('/api/v1/pets/:id/transfer-tutorship', { ...auth, handler: controller.transferTutorship.bind(controller) })
  app.get('/api/v1/pets/:id/tutorship-history', { ...auth, handler: controller.getTutorshipHistory.bind(controller) })
  app.post('/api/v1/pets/:id/co-tutors', { ...auth, handler: controller.addCoTutor.bind(controller) })
  app.delete('/api/v1/pets/:id/co-tutors/:coTutorId', { ...auth, handler: controller.removeCoTutor.bind(controller) })
}
