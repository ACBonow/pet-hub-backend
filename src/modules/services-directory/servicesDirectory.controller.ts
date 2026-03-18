/**
 * @module services-directory
 * @file servicesDirectory.controller.ts
 * @description HTTP handlers for services-directory endpoints. Validates input, delegates logic to service.
 */

import type { FastifyReply, FastifyRequest } from 'fastify'
import {
  CreateServiceListingSchema,
  ListServicesQuerySchema,
  UpdateServiceListingSchema,
} from './servicesDirectory.schema'
import type { ServicesDirectoryService } from './servicesDirectory.service'

export class ServicesDirectoryController {
  constructor(private service: ServicesDirectoryService) {}

  async list(request: FastifyRequest, reply: FastifyReply) {
    const parsed = ListServicesQuerySchema.safeParse(request.query)
    if (!parsed.success) {
      return reply.status(400).send({
        success: false,
        error: { code: 'VALIDATION_ERROR', message: 'Parâmetros inválidos.', details: parsed.error.issues },
      })
    }

    const result = await this.service.findAll(parsed.data)
    return reply.status(200).send({
      success: true,
      data: result.data,
      meta: { total: result.total, page: result.page, pageSize: result.pageSize },
    })
  }

  async getById(
    request: FastifyRequest<{ Params: { id: string } }>,
    reply: FastifyReply,
  ) {
    const { id } = request.params
    const listing = await this.service.findById(id)
    return reply.status(200).send({ success: true, data: listing })
  }

  async create(request: FastifyRequest, reply: FastifyReply) {
    const parsed = CreateServiceListingSchema.safeParse(request.body)
    if (!parsed.success) {
      return reply.status(400).send({
        success: false,
        error: { code: 'VALIDATION_ERROR', message: 'Dados inválidos.', details: parsed.error.issues },
      })
    }

    const listing = await this.service.create(parsed.data)
    return reply.status(201).send({ success: true, data: listing })
  }

  async update(
    request: FastifyRequest<{ Params: { id: string } }>,
    reply: FastifyReply,
  ) {
    const parsed = UpdateServiceListingSchema.safeParse(request.body)
    if (!parsed.success) {
      return reply.status(400).send({
        success: false,
        error: { code: 'VALIDATION_ERROR', message: 'Dados inválidos.', details: parsed.error.issues },
      })
    }

    const { id } = request.params
    const listing = await this.service.update(id, parsed.data)
    return reply.status(200).send({ success: true, data: listing })
  }

  async delete(
    request: FastifyRequest<{ Params: { id: string } }>,
    reply: FastifyReply,
  ) {
    const { id } = request.params
    await this.service.delete(id)
    return reply.status(204).send()
  }
}
