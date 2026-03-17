/**
 * @module lost-found
 * @file lost-found.controller.ts
 * @description HTTP handlers for lost-found endpoints. Validates with Zod, delegates logic to service.
 */

import type { FastifyReply, FastifyRequest } from 'fastify'
import {
  CreateLostFoundSchema,
  LostFoundListQuerySchema,
  UpdateLostFoundStatusSchema,
} from './lost-found.schema'
import type { LostFoundService } from './lost-found.service'

export class LostFoundController {
  constructor(private service: LostFoundService) {}

  async create(request: FastifyRequest, reply: FastifyReply) {
    const parsed = CreateLostFoundSchema.safeParse(request.body)
    if (!parsed.success) {
      return reply.status(400).send({
        success: false,
        error: { code: 'VALIDATION_ERROR', message: 'Dados inválidos.', details: parsed.error.issues },
      })
    }
    const report = await this.service.create(parsed.data)
    return reply.status(201).send({ success: true, data: report })
  }

  async findAll(request: FastifyRequest, reply: FastifyReply) {
    const parsed = LostFoundListQuerySchema.safeParse(request.query)
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
    const report = await this.service.findById(request.params.id)
    return reply.status(200).send({ success: true, data: report })
  }

  async updateStatus(request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) {
    const parsed = UpdateLostFoundStatusSchema.safeParse(request.body)
    if (!parsed.success) {
      return reply.status(400).send({
        success: false,
        error: { code: 'VALIDATION_ERROR', message: 'Dados inválidos.', details: parsed.error.issues },
      })
    }
    const report = await this.service.updateStatus(request.params.id, parsed.data.status)
    return reply.status(200).send({ success: true, data: report })
  }

  async delete(request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) {
    await this.service.delete(request.params.id)
    return reply.status(204).send()
  }
}
