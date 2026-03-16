/**
 * @module adoption
 * @file adoption.controller.ts
 * @description HTTP handlers for adoption endpoints. Validates with Zod, delegates logic to service.
 */

import type { FastifyReply, FastifyRequest } from 'fastify'
import {
  AdoptionListQuerySchema,
  CreateAdoptionSchema,
  UpdateAdoptionStatusSchema,
} from './adoption.schema'
import type { AdoptionService } from './adoption.service'

export class AdoptionController {
  constructor(private service: AdoptionService) {}

  async create(request: FastifyRequest, reply: FastifyReply) {
    const parsed = CreateAdoptionSchema.safeParse(request.body)
    if (!parsed.success) {
      return reply.status(400).send({
        success: false,
        error: { code: 'VALIDATION_ERROR', message: 'Dados inválidos.', details: parsed.error.issues },
      })
    }
    const listing = await this.service.create(parsed.data)
    return reply.status(201).send({ success: true, data: listing })
  }

  async findAll(request: FastifyRequest, reply: FastifyReply) {
    const parsed = AdoptionListQuerySchema.safeParse(request.query)
    if (!parsed.success) {
      return reply.status(400).send({
        success: false,
        error: { code: 'VALIDATION_ERROR', message: 'Parâmetros de consulta inválidos.', details: parsed.error.issues },
      })
    }
    const result = await this.service.findAll(parsed.data)
    return reply.status(200).send({
      success: true,
      data: result.data,
      meta: { total: result.total, page: result.page, pageSize: result.pageSize },
    })
  }

  async findById(request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) {
    const listing = await this.service.findById(request.params.id)
    return reply.status(200).send({ success: true, data: listing })
  }

  async updateStatus(request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) {
    const parsed = UpdateAdoptionStatusSchema.safeParse(request.body)
    if (!parsed.success) {
      return reply.status(400).send({
        success: false,
        error: { code: 'VALIDATION_ERROR', message: 'Dados inválidos.', details: parsed.error.issues },
      })
    }
    const listing = await this.service.updateStatus(request.params.id, parsed.data.status)
    return reply.status(200).send({ success: true, data: listing })
  }

  async delete(request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) {
    await this.service.delete(request.params.id)
    return reply.status(204).send()
  }
}
