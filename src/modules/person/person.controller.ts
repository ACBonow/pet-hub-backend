/**
 * @module person
 * @file person.controller.ts
 * @description HTTP handlers for person endpoints. Validates with Zod, delegates logic to service.
 */

import type { FastifyReply, FastifyRequest } from 'fastify'
import { UpdatePersonSchema } from './person.schema'
import type { PersonService } from './person.service'

export class PersonController {
  constructor(private service: PersonService) {}

  async getMe(request: FastifyRequest, reply: FastifyReply) {
    const person = await this.service.getProfile(request.user!.id)
    return reply.status(200).send({ success: true, data: person })
  }

  async getById(request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) {
    const person = await this.service.findById(request.params.id)
    return reply.status(200).send({ success: true, data: person })
  }

  async update(request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) {
    const parsed = UpdatePersonSchema.safeParse(request.body)
    if (!parsed.success) {
      return reply.status(400).send({
        success: false,
        error: { code: 'VALIDATION_ERROR', message: 'Dados inválidos.', details: parsed.error.issues },
      })
    }
    const person = await this.service.update(request.params.id, parsed.data)
    return reply.status(200).send({ success: true, data: person })
  }

  async delete(request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) {
    await this.service.delete(request.params.id)
    return reply.status(204).send()
  }
}
