/**
 * @module organization
 * @file organization.service.ts
 * @description Business logic for organization management, including CNPJ validation.
 *              responsiblePersonId is optional — defaults to the creator's person profile.
 */

import { sanitizeCnpj, validateCnpj } from '../../shared/validators/cnpj.validator'
import { HttpError } from '../../shared/errors/HttpError'
import type { IOrganizationRepository } from './organization.repository'
import type { IPersonRepository } from '../person'
import type { OrganizationCreateInput, OrganizationRecord, OrganizationUpdateInput } from './organization.types'

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

  async findById(id: string): Promise<OrganizationRecord> {
    const org = await this.repository.findById(id)
    if (!org) {
      throw HttpError.notFound('Organização')
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

  async addPerson(organizationId: string, personId: string): Promise<void> {
    const org = await this.repository.findById(organizationId)
    if (!org) {
      throw HttpError.notFound('Organização')
    }

    const person = await this.personRepository.findById(personId)
    if (!person) {
      throw HttpError.notFound('Pessoa')
    }

    await this.repository.addPerson(organizationId, personId)
  }

  async removePerson(organizationId: string, personId: string): Promise<void> {
    const org = await this.repository.findById(organizationId)
    if (!org) {
      throw HttpError.notFound('Organização')
    }

    const count = await this.repository.personCount(organizationId)
    if (count <= 1) {
      throw HttpError.conflict(
        'CANNOT_REMOVE_LAST_PERSON',
        'A organização deve ter pelo menos uma pessoa responsável.',
      )
    }

    await this.repository.removePerson(organizationId, personId)
  }
}
