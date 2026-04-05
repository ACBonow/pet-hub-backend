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
    const userId = (request as any).user!.id
    const report = await this.service.createForUser(userId, parsed.data)
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
    return reply.status(200).send({ success: true, data: result.data, meta: result.meta })
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
    const userId = (request as any).user!.id
    const report = await this.service.updateStatus(request.params.id, parsed.data.status, userId)
    return reply.status(200).send({ success: true, data: report })
  }

  async delete(request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) {
    const userId = (request as any).user!.id
    await this.service.delete(request.params.id, userId)
    return reply.status(204).send()
  }

  async uploadPhoto(request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) {
    if (!request.isMultipart()) {
      return reply.status(400).send({
        success: false,
        error: { code: 'NO_FILE', message: 'Nenhum arquivo enviado.' },
      })
    }

    const data = await request.file()
    if (!data) {
      return reply.status(400).send({
        success: false,
        error: { code: 'NO_FILE', message: 'Nenhum arquivo enviado.' },
      })
    }

    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp']
    if (!allowedTypes.includes(data.mimetype)) {
      return reply.status(400).send({
        success: false,
        error: { code: 'INVALID_FILE_TYPE', message: 'Tipo inválido. Use JPEG, PNG ou WebP.' },
      })
    }

    const buffer = await data.toBuffer()
    if (buffer.length > 5 * 1024 * 1024) {
      return reply.status(400).send({
        success: false,
        error: { code: 'FILE_TOO_LARGE', message: 'Arquivo muito grande. Limite: 5 MB.' },
      })
    }

    const report = await this.service.uploadPhoto(request.params.id, buffer, data.mimetype)
    return reply.status(200).send({ success: true, data: report })
  }
}
