/**
 * @module organization
 * @file organization.controller.ts
 * @description HTTP handlers for organization endpoints. Validates with Zod, delegates logic to service.
 */

import type { FastifyReply, FastifyRequest } from 'fastify'
import {
  AddMemberSchema,
  ChangeRoleSchema,
  CreateOrganizationSchema,
  UpdateOrganizationSchema,
} from './organization.schema'
import type { OrganizationService } from './organization.service'

export class OrganizationController {
  constructor(private service: OrganizationService) {}

  async create(request: FastifyRequest, reply: FastifyReply) {
    const parsed = CreateOrganizationSchema.safeParse(request.body)
    if (!parsed.success) {
      return reply.status(400).send({
        success: false,
        error: { code: 'VALIDATION_ERROR', message: 'Dados inválidos.', details: parsed.error.issues },
      })
    }
    const org = await this.service.create(parsed.data, request.user!.id)
    return reply.status(201).send({ success: true, data: org })
  }

  async getMyOrganizations(request: FastifyRequest, reply: FastifyReply) {
    const orgs = await this.service.findMyOrganizations(request.user!.id)
    return reply.status(200).send({ success: true, data: orgs })
  }

  async getById(request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) {
    const org = await this.service.findById(request.params.id, request.user?.id)
    return reply.status(200).send({ success: true, data: org })
  }

  async update(request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) {
    const parsed = UpdateOrganizationSchema.safeParse(request.body)
    if (!parsed.success) {
      return reply.status(400).send({
        success: false,
        error: { code: 'VALIDATION_ERROR', message: 'Dados inválidos.', details: parsed.error.issues },
      })
    }
    const org = await this.service.update(request.params.id, parsed.data)
    return reply.status(200).send({ success: true, data: org })
  }

  async delete(request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) {
    await this.service.delete(request.params.id)
    return reply.status(204).send()
  }

  async addPerson(
    request: FastifyRequest<{ Params: { id: string; personId: string } }>,
    reply: FastifyReply,
  ) {
    await this.service.addPerson(request.params.id, request.params.personId)
    return reply.status(200).send({ success: true })
  }

  async removePerson(
    request: FastifyRequest<{ Params: { id: string; personId: string } }>,
    reply: FastifyReply,
  ) {
    await this.service.removePerson(request.params.id, request.params.personId)
    return reply.status(204).send()
  }

  async getMembers(request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) {
    const members = await this.service.getMembers(request.params.id)
    return reply.status(200).send({ success: true, data: members })
  }

  async addMember(request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) {
    const parsed = AddMemberSchema.safeParse(request.body)
    if (!parsed.success) {
      return reply.status(400).send({
        success: false,
        error: { code: 'VALIDATION_ERROR', message: 'Dados inválidos.', details: parsed.error.issues },
      })
    }
    await this.service.addPerson(request.params.id, parsed.data.personId, parsed.data.role)
    return reply.status(201).send({ success: true })
  }

  async changeMemberRole(
    request: FastifyRequest<{ Params: { id: string; personId: string } }>,
    reply: FastifyReply,
  ) {
    const parsed = ChangeRoleSchema.safeParse(request.body)
    if (!parsed.success) {
      return reply.status(400).send({
        success: false,
        error: { code: 'VALIDATION_ERROR', message: 'Dados inválidos.', details: parsed.error.issues },
      })
    }
    await this.service.changeRole(request.params.id, request.params.personId, parsed.data.role)
    return reply.status(200).send({ success: true })
  }

  async removeMember(
    request: FastifyRequest<{ Params: { id: string; personId: string } }>,
    reply: FastifyReply,
  ) {
    await this.service.removePerson(request.params.id, request.params.personId)
    return reply.status(204).send()
  }
}
