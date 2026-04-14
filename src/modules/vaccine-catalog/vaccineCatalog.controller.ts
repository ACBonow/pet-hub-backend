/**
 * @module vaccine-catalog
 * @file vaccineCatalog.controller.ts
 * @description HTTP handlers for vaccine-catalog endpoints.
 */

import type { FastifyRequest, FastifyReply } from 'fastify'
import type { VaccineCatalogService } from './vaccineCatalog.service'
import { listCatalogQuerySchema } from './vaccineCatalog.schema'
import { AppError } from '../../shared/errors/AppError'

export class VaccineCatalogController {
  constructor(private readonly service: VaccineCatalogService) {}

  async list(request: FastifyRequest, reply: FastifyReply) {
    const parsed = listCatalogQuerySchema.safeParse(request.query)
    if (!parsed.success) {
      throw new AppError(400, 'VALIDATION_ERROR', 'Parâmetros inválidos.')
    }
    const templates = await this.service.listTemplates(parsed.data)
    return reply.status(200).send({ success: true, data: templates })
  }

  async getBySlug(request: FastifyRequest<{ Params: { slug: string } }>, reply: FastifyReply) {
    const template = await this.service.getTemplateBySlug(request.params.slug)
    return reply.status(200).send({ success: true, data: template })
  }
}
