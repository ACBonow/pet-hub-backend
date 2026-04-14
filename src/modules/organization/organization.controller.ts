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
import { resolveActorContext } from '../../shared/utils/resolve-actor-context'
import { validateImageMagicBytes } from '../../shared/utils/validate-image-magic'

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
    await resolveActorContext(request.user!.id, request.params.id)

    const parsed = UpdateOrganizationSchema.safeParse(request.body)
    if (!parsed.success) {
      return reply.status(400).send({
        success: false,
        error: { code: 'VALIDATION_ERROR', message: 'Dados inválidos.', details: parsed.error.issues },
      })
    }
    const org = await this.service.update(request.params.id, parsed.data, request.user!.id)
    return reply.status(200).send({ success: true, data: org })
  }

  async delete(request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) {
    await resolveActorContext(request.user!.id, request.params.id)
    await this.service.delete(request.params.id, request.user!.id)
    return reply.status(204).send()
  }

  async addPerson(
    request: FastifyRequest<{ Params: { id: string; personId: string } }>,
    reply: FastifyReply,
  ) {
    await resolveActorContext(request.user!.id, request.params.id)
    await this.service.addPerson(request.params.id, request.params.personId)
    return reply.status(201).send({ success: true })
  }

  async removePerson(
    request: FastifyRequest<{ Params: { id: string; personId: string } }>,
    reply: FastifyReply,
  ) {
    await resolveActorContext(request.user!.id, request.params.id)
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
    await this.service.addMember(request.params.id, parsed.data.cpf, parsed.data.role, request.user!.id)
    return reply.status(201).send({ success: true })
  }

  async changeMemberRole(
    request: FastifyRequest<{ Params: { id: string; personId: string } }>,
    reply: FastifyReply,
  ) {
    await resolveActorContext(request.user!.id, request.params.id)
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
    await resolveActorContext(request.user!.id, request.params.id)
    await this.service.removePerson(request.params.id, request.params.personId)
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

    if (!validateImageMagicBytes(buffer, data.mimetype)) {
      return reply.status(400).send({
        success: false,
        error: { code: 'INVALID_FILE_TYPE', message: 'O conteúdo do arquivo não corresponde ao tipo declarado.' },
      })
    }

    const org = await this.service.uploadPhoto(request.params.id, request.user!.id, buffer, data.mimetype)
    return reply.status(200).send({ success: true, data: org })
  }
}
