/**
 * @module pet
 * @file pet.controller.ts
 * @description HTTP handlers for pet endpoints. Validates with Zod, delegates logic to service.
 */

import type { FastifyReply, FastifyRequest } from 'fastify'
import {
  AddCoTutorSchema,
  CreatePetSchema,
  TransferTutorshipSchema,
  UpdatePetSchema,
} from './pet.schema'
import type { PetService } from './pet.service'

export class PetController {
  constructor(private service: PetService) {}

  async listOrgPets(request: FastifyRequest<{ Params: { orgId: string } }>, reply: FastifyReply) {
    const userId = (request as any).user!.id
    const pets = await this.service.findByOrg(request.params.orgId, userId)
    return reply.status(200).send({ success: true, data: pets })
  }

  async listMyPets(request: FastifyRequest, reply: FastifyReply) {
    const userId = (request as any).user!.id
    const pets = await this.service.findByUser(userId)
    return reply.status(200).send({ success: true, data: pets })
  }

  async create(request: FastifyRequest, reply: FastifyReply) {
    const parsed = CreatePetSchema.safeParse(request.body)
    if (!parsed.success) {
      return reply.status(400).send({
        success: false,
        error: { code: 'VALIDATION_ERROR', message: 'Dados inválidos.', details: parsed.error.issues },
      })
    }
    const userId = (request as any).user!.id
    const pet = await this.service.createForUser(userId, parsed.data)
    return reply.status(201).send({ success: true, data: pet })
  }

  async getById(request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) {
    const pet = await this.service.findById(request.params.id)
    return reply.status(200).send({ success: true, data: pet })
  }

  async update(request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) {
    const parsed = UpdatePetSchema.safeParse(request.body)
    if (!parsed.success) {
      return reply.status(400).send({
        success: false,
        error: { code: 'VALIDATION_ERROR', message: 'Dados inválidos.', details: parsed.error.issues },
      })
    }
    const userId = (request as any).user!.id
    const pet = await this.service.update(request.params.id, parsed.data, userId)
    return reply.status(200).send({ success: true, data: pet })
  }

  async delete(request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) {
    const userId = (request as any).user!.id
    await this.service.delete(request.params.id, userId)
    return reply.status(204).send()
  }

  async transferTutorship(request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) {
    const parsed = TransferTutorshipSchema.safeParse(request.body)
    if (!parsed.success) {
      return reply.status(400).send({
        success: false,
        error: { code: 'VALIDATION_ERROR', message: 'Dados inválidos.', details: parsed.error.issues },
      })
    }
    const tutorship = await this.service.transferTutorship(request.params.id, parsed.data)
    return reply.status(200).send({ success: true, data: tutorship })
  }

  async getTutorshipHistory(request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) {
    const history = await this.service.getTutorshipHistory(request.params.id)
    return reply.status(200).send({ success: true, data: history })
  }

  async addCoTutor(request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) {
    const parsed = AddCoTutorSchema.safeParse(request.body)
    if (!parsed.success) {
      return reply.status(400).send({
        success: false,
        error: { code: 'VALIDATION_ERROR', message: 'Dados inválidos.', details: parsed.error.issues },
      })
    }
    const coTutor = await this.service.addCoTutor(request.params.id, parsed.data)
    return reply.status(201).send({ success: true, data: coTutor })
  }

  async removeCoTutor(
    request: FastifyRequest<{ Params: { id: string; coTutorId: string } }>,
    reply: FastifyReply,
  ) {
    await this.service.removeCoTutor(request.params.id, request.params.coTutorId)
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

    const pet = await this.service.uploadPhoto(request.params.id, buffer, data.mimetype)
    return reply.status(200).send({ success: true, data: pet })
  }
}
