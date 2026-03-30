/**
 * @module organization
 * @file organization.service.ts
 * @description Business logic for organization management, including CNPJ validation.
 *              responsiblePersonId is optional — defaults to the creator's person profile.
 */

import { sanitizeCnpj, validateCnpj } from '../../shared/validators/cnpj.validator'
import { HttpError } from '../../shared/errors/HttpError'
import { AppError } from '../../shared/errors/AppError'
import { uploadFile, deleteFile, extractPathFromUrl } from '../../shared/utils/storage'
import type { IOrganizationRepository } from './organization.repository'
import type { IPersonRepository } from '../person'
import type {
  OrgRole,
  OrganizationCreateInput,
  OrganizationPersonRecord,
  OrganizationRecord,
  OrganizationUpdateInput,
} from './organization.types'

const ALLOWED_ROLES_FOR_PHOTO: OrgRole[] = ['OWNER', 'MANAGER']

export class OrganizationService {
  constructor(
    private repository: IOrganizationRepository,
    private personRepository: IPersonRepository,
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

    return this.repository.create({ ...input, cnpj, responsiblePersonId })
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

  async update(id: string, data: OrganizationUpdateInput): Promise<OrganizationRecord> {
    const org = await this.repository.findById(id)
    if (!org) {
      throw HttpError.notFound('Organização')
    }
    return this.repository.update(id, data)
  }

  async delete(id: string): Promise<void> {
    const org = await this.repository.findById(id)
    if (!org) {
      throw HttpError.notFound('Organização')
    }
    await this.repository.delete(id)
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
  }

  async getMembers(organizationId: string): Promise<OrganizationPersonRecord[]> {
    const org = await this.repository.findById(organizationId)
    if (!org) {
      throw HttpError.notFound('Organização')
    }
    return this.repository.findMembers(organizationId)
  }

  async uploadPhoto(orgId: string, userId: string, file: Buffer, mimeType: string): Promise<OrganizationRecord> {
    const org = await this.repository.findById(orgId)
    if (!org) {
      throw HttpError.notFound('Organização')
    }

    const person = await this.personRepository.findByUserId(userId)
    const role = person ? await this.repository.getRole(orgId, person.id) : null

    if (!role || !ALLOWED_ROLES_FOR_PHOTO.includes(role)) {
      throw new AppError(403, 'INSUFFICIENT_PERMISSION', 'Apenas OWNER ou MANAGER podem atualizar a foto da organização.')
    }

    if (org.photoUrl) {
      const oldPath = extractPathFromUrl(org.photoUrl, 'org-images')
      await deleteFile('org-images', oldPath).catch(() => {})
    }

    const ext = mimeType === 'image/png' ? 'png' : mimeType === 'image/webp' ? 'webp' : 'jpg'
    const path = `${orgId}/${Date.now()}.${ext}`
    const photoUrl = await uploadFile('org-images', path, file, mimeType)

    await this.repository.updatePhotoUrl(orgId, photoUrl)

    const updated = await this.repository.findById(orgId)
    return updated!
  }
}
