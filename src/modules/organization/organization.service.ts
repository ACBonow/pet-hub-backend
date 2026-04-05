/**
 * @module organization
 * @file organization.service.ts
 * @description Business logic for organization management, including CNPJ validation.
 *              responsiblePersonId is optional — defaults to the creator's person profile.
 */

import { sanitizeCnpj, validateCnpj } from '../../shared/validators/cnpj.validator'
import { HttpError } from '../../shared/errors/HttpError'
import { AppError } from '../../shared/errors/AppError'
import { extractPathFromUrl } from '../../shared/storage/IFileStorage'
import type { IFileStorage } from '../../shared/storage/IFileStorage'
import { hasOrgPermission } from '../../shared/utils/org-permission'
import { logger } from '../../shared/utils/logger'
import type { IOrganizationRepository } from './organization.repository'
import type { IPersonRepository } from '../person'
import type {
  OrgRole,
  OrganizationCreateInput,
  OrganizationMemberView,
  OrganizationPersonRecord,
  OrganizationRecord,
  OrganizationUpdateInput,
} from './organization.types'

export class OrganizationService {
  constructor(
    private repository: IOrganizationRepository,
    private personRepository: IPersonRepository,
    private fileStorage: IFileStorage,
  ) {}

  async create(input: OrganizationCreateInput, creatorUserId: string): Promise<OrganizationRecord> {
    // Resolve responsible person: explicit ID takes precedence, otherwise default to creator
    let responsiblePersonId: string

    if (input.responsiblePersonId) {
      const person = await this.personRepository.findById(input.responsiblePersonId)
      if (!person) {
        throw HttpError.notFound('Pessoa responsável')
      }
      responsiblePersonId = input.responsiblePersonId
    } else {
      const person = await this.personRepository.findByUserId(creatorUserId)
      if (!person) {
        throw HttpError.notFound('Perfil de pessoa do usuário')
      }
      responsiblePersonId = person.id
    }

    let cnpj: string | undefined

    if (input.cnpj) {
      cnpj = sanitizeCnpj(input.cnpj)
      if (!validateCnpj(cnpj)) {
        throw HttpError.badRequest('INVALID_CNPJ', 'O CNPJ informado não é válido.')
      }

      const existing = await this.repository.findByCnpj(cnpj)
      if (existing) {
        throw HttpError.conflict('CNPJ_ALREADY_IN_USE', 'Este CNPJ já está cadastrado.')
      }
    }

    if (input.type === 'COMPANY' && !cnpj) {
      throw HttpError.badRequest('CNPJ_REQUIRED', 'CNPJ é obrigatório para empresas.')
    }

    const org = await this.repository.create({ ...input, cnpj, responsiblePersonId })
    logger.info('org.created', { orgId: org.id, actorUserId: creatorUserId, action: 'org.created', payload: { name: org.name, type: org.type } })
    return org
  }

  async findById(id: string, userId?: string): Promise<OrganizationRecord> {
    const org = await this.repository.findById(id)
    if (!org) {
      throw HttpError.notFound('Organização')
    }
    if (userId) {
      const person = await this.personRepository.findByUserId(userId)
      if (person) {
        const membership = org.responsiblePersons.find(p => p.personId === person.id)
        if (membership) {
          return { ...org, myRole: membership.role }
        }
      }
    }
    return org
  }

  async update(id: string, data: OrganizationUpdateInput, userId: string): Promise<OrganizationRecord> {
    const org = await this.repository.findById(id)
    if (!org) {
      throw HttpError.notFound('Organização')
    }

    if (!await hasOrgPermission(userId, id, 'OWNER')) {
      throw new AppError(403, 'INSUFFICIENT_PERMISSION', 'Apenas o OWNER pode editar a organização.')
    }

    const updated = await this.repository.update(id, data)
    logger.info('org.updated', { orgId: id, actorUserId: userId, action: 'org.updated', payload: data })
    return updated
  }

  async delete(id: string, userId: string): Promise<void> {
    const org = await this.repository.findById(id)
    if (!org) {
      throw HttpError.notFound('Organização')
    }

    if (!await hasOrgPermission(userId, id, 'OWNER')) {
      throw new AppError(403, 'INSUFFICIENT_PERMISSION', 'Apenas o OWNER pode excluir a organização.')
    }

    await this.repository.delete(id)
    logger.info('org.deleted', { orgId: id, actorUserId: userId, action: 'org.deleted', payload: {} })
  }

  async findMyOrganizations(userId: string): Promise<OrganizationRecord[]> {
    const person = await this.personRepository.findByUserId(userId)
    if (!person) return []
    const orgs = await this.repository.findByPersonId(person.id)
    return orgs.map(org => {
      const membership = org.responsiblePersons.find(p => p.personId === person.id)
      return membership ? { ...org, myRole: membership.role } : org
    })
  }

  async addPerson(organizationId: string, personId: string, role: OrgRole = 'MEMBER'): Promise<void> {
    const org = await this.repository.findById(organizationId)
    if (!org) {
      throw HttpError.notFound('Organização')
    }

    const person = await this.personRepository.findById(personId)
    if (!person) {
      throw HttpError.notFound('Pessoa')
    }

    await this.repository.addPerson(organizationId, personId, role)
  }

  async removePerson(organizationId: string, personId: string): Promise<void> {
    const org = await this.repository.findById(organizationId)
    if (!org) {
      throw HttpError.notFound('Organização')
    }

    const currentRole = await this.repository.getRole(organizationId, personId)
    if (currentRole === 'OWNER') {
      const ownerCount = await this.repository.countByRole(organizationId, 'OWNER')
      if (ownerCount <= 1) {
        throw HttpError.conflict(
          'LAST_OWNER',
          'Não é possível remover o último OWNER da organização.',
        )
      }
    }

    await this.repository.removePerson(organizationId, personId)
    logger.info('org.member.removed', { orgId: organizationId, action: 'org.member.removed', payload: { personId } })
  }

  async changeRole(organizationId: string, personId: string, newRole: OrgRole): Promise<void> {
    const org = await this.repository.findById(organizationId)
    if (!org) {
      throw HttpError.notFound('Organização')
    }

    const hasPerson = await this.repository.hasPerson(organizationId, personId)
    if (!hasPerson) {
      throw HttpError.notFound('Membro')
    }

    if (newRole !== 'OWNER') {
      const currentRole = await this.repository.getRole(organizationId, personId)
      if (currentRole === 'OWNER') {
        const ownerCount = await this.repository.countByRole(organizationId, 'OWNER')
        if (ownerCount <= 1) {
          throw HttpError.conflict(
            'LAST_OWNER',
            'Não é possível rebaixar o último OWNER da organização.',
          )
        }
      }
    }

    await this.repository.setRole(organizationId, personId, newRole)
    logger.info('org.member.role.changed', { orgId: organizationId, action: 'org.member.role.changed', payload: { personId, newRole } })
  }

  async getMembers(organizationId: string): Promise<OrganizationMemberView[]> {
    const org = await this.repository.findById(organizationId)
    if (!org) {
      throw HttpError.notFound('Organização')
    }
    return this.repository.findMembersWithNames(organizationId)
  }

  async addMember(orgId: string, cpf: string, role: OrgRole, requestingUserId: string): Promise<void> {
    const org = await this.repository.findById(orgId)
    if (!org) {
      throw HttpError.notFound('Organização')
    }

    if (!await hasOrgPermission(requestingUserId, orgId, 'OWNER')) {
      throw new AppError(403, 'INSUFFICIENT_PERMISSION', 'Apenas o OWNER pode adicionar membros.')
    }

    // Find target person by CPF
    const targetPerson = await this.personRepository.findByCpf(cpf)
    if (!targetPerson) {
      throw new AppError(404, 'PERSON_NOT_FOUND', 'Nenhuma pessoa encontrada com este CPF.')
    }

    // Check not already a member
    const isMember = await this.repository.hasPerson(orgId, targetPerson.id)
    if (isMember) {
      throw HttpError.conflict('ALREADY_A_MEMBER', 'Esta pessoa já é membro da organização.')
    }

    await this.repository.addPerson(orgId, targetPerson.id, role)
    logger.info('org.member.added', { orgId, actorUserId: requestingUserId, action: 'org.member.added', payload: { personId: targetPerson.id, role } })
  }

  async uploadPhoto(orgId: string, userId: string, file: Buffer, mimeType: string): Promise<OrganizationRecord> {
    const org = await this.repository.findById(orgId)
    if (!org) {
      throw HttpError.notFound('Organização')
    }

    if (!await hasOrgPermission(userId, orgId, 'MANAGER')) {
      throw new AppError(403, 'INSUFFICIENT_PERMISSION', 'Apenas OWNER ou MANAGER podem atualizar a foto da organização.')
    }

    if (org.photoUrl) {
      const oldPath = extractPathFromUrl(org.photoUrl, 'org-images')
      await this.fileStorage.delete('org-images', oldPath).catch((err) => logger.warn('storage.delete.failed', { err, bucket: 'org-images', path: oldPath }))
    }

    const ext = mimeType === 'image/png' ? 'png' : mimeType === 'image/webp' ? 'webp' : 'jpg'
    const path = `${orgId}/${Date.now()}.${ext}`
    const photoUrl = await this.fileStorage.upload('org-images', path, file, mimeType)

    await this.repository.updatePhotoUrl(orgId, photoUrl)

    const updated = await this.repository.findById(orgId)
    logger.info('org.photo.updated', { orgId, actorUserId: userId, action: 'org.photo.updated', payload: {} })
    return updated!
  }
}
