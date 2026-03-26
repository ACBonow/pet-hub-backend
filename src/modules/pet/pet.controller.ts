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
    const pet = await this.service.update(request.params.id, parsed.data)
    return reply.status(200).send({ success: true, data: pet })
  }

  async delete(request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) {
    await this.service.delete(request.params.id)
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
}
