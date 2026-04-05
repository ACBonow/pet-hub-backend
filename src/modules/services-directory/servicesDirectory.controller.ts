/**
 * @module services-directory
 * @file servicesDirectory.controller.ts
 * @description HTTP handlers for services-directory endpoints.
 */

import type { FastifyReply, FastifyRequest } from 'fastify'
import {
  CreateServiceListingSchema,
  ListServicesQuerySchema,
  UpdateServiceListingSchema,
} from './servicesDirectory.schema'
import type { ServicesDirectoryService } from './servicesDirectory.service'
import { validateImageMagicBytes } from '../../shared/utils/validate-image-magic'

export class ServicesDirectoryController {
  constructor(private service: ServicesDirectoryService) {}

  async listTypes(_request: FastifyRequest, reply: FastifyReply) {
    const types = await this.service.listTypes()
    return reply.status(200).send({ success: true, data: types })
  }

  async list(request: FastifyRequest, reply: FastifyReply) {
    const parsed = ListServicesQuerySchema.safeParse(request.query)
    if (!parsed.success) {
      return reply.status(400).send({
        success: false,
        error: { code: 'VALIDATION_ERROR', message: 'Parâmetros inválidos.', details: parsed.error.issues },
      })
    }

    const result = await this.service.findAll(parsed.data)
    return reply.status(200).send({ success: true, data: result.data, meta: result.meta })
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

    const listing = await this.service.create(parsed.data, request.user!.id)
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
    const listing = await this.service.update(id, parsed.data, request.user!.id)
    return reply.status(200).send({ success: true, data: listing })
  }

  async delete(
    request: FastifyRequest<{ Params: { id: string } }>,
    reply: FastifyReply,
  ) {
    const { id } = request.params
    await this.service.delete(id, request.user!.id)
    return reply.status(204).send()
  }

  async uploadPhoto(
    request: FastifyRequest<{ Params: { id: string } }>,
    reply: FastifyReply,
  ) {
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

    if (!validateImageMagicBytes(buffer, data.mimetype)) {
      return reply.status(400).send({
        success: false,
        error: { code: 'INVALID_FILE_TYPE', message: 'O conteúdo do arquivo não corresponde ao tipo declarado.' },
      })
    }

    const service = await this.service.uploadPhoto(request.params.id, request.user!.id, buffer, data.mimetype)
    return reply.status(200).send({ success: true, data: service })
  }
}
