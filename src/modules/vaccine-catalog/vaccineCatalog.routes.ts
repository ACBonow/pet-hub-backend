/**
 * @module vaccine-catalog
 * @file vaccineCatalog.routes.ts
 * @description Fastify route registration for vaccine-catalog endpoints.
 */

import type { FastifyInstance } from 'fastify'
import { VaccineCatalogController } from './vaccineCatalog.controller'
import type { VaccineCatalogService } from './vaccineCatalog.service'

export function registerVaccineCatalogRoutes(app: FastifyInstance, service: VaccineCatalogService) {
  const controller = new VaccineCatalogController(service)

  app.get('/api/v1/vaccine-catalog', (req, reply) => controller.list(req, reply))
  app.get('/api/v1/vaccine-catalog/:slug', (req, reply) => controller.getBySlug(req as any, reply))
}
