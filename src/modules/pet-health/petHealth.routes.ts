/**
 * @module pet-health
 * @file petHealth.routes.ts
 * @description Fastify route registration for the pet-health module.
 */

import type { FastifyInstance } from 'fastify'
import { authMiddleware } from '../../shared/middleware/auth.middleware'
import type { PetHealthService } from './petHealth.service'
import { PetHealthController } from './petHealth.controller'

export function registerPetHealthRoutes(app: FastifyInstance, service: PetHealthService): void {
  const controller = new PetHealthController(service)
  const auth = { preHandler: [authMiddleware] }

  app.get(
    '/api/v1/pet-health/:petId/vaccination-card',
    { ...auth, handler: controller.getVaccinationCard.bind(controller) },
  )

  app.post(
    '/api/v1/pet-health/:petId/vaccinations',
    { ...auth, handler: controller.addVaccination.bind(controller) },
  )

  app.delete(
    '/api/v1/pet-health/:petId/vaccinations/:vaccinationId',
    { ...auth, handler: controller.deleteVaccination.bind(controller) },
  )

  app.get(
    '/api/v1/pet-health/:petId/exams',
    { ...auth, handler: controller.listExamFiles.bind(controller) },
  )

  app.post(
    '/api/v1/pet-health/:petId/exams',
    { ...auth, handler: controller.uploadExamFile.bind(controller) },
  )

  app.delete(
    '/api/v1/pet-health/:petId/exams/:examId',
    { ...auth, handler: controller.deleteExamFile.bind(controller) },
  )

  app.get(
    '/api/v1/pet-health/:petId/vaccine-status',
    { ...auth, handler: controller.getVaccineStatus.bind(controller) },
  )

  app.get(
    '/api/v1/pet-health/:petId/preventives',
    { ...auth, handler: controller.listPreventives.bind(controller) },
  )

  app.post(
    '/api/v1/pet-health/:petId/preventives',
    { ...auth, handler: controller.addPreventive.bind(controller) },
  )

  app.delete(
    '/api/v1/pet-health/:petId/preventives/:preventiveId',
    { ...auth, handler: controller.deletePreventive.bind(controller) },
  )
}
