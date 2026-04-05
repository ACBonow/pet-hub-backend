/**
 * @module adoption
 * @file adoption.service.ts
 * @description Business logic for adoption listing management.
 */

import { HttpError } from '../../shared/errors/HttpError'
import { AppError } from '../../shared/errors/AppError'
import { buildPaginationMeta } from '../../shared/types/pagination'
import type { IAdoptionRepository } from './adoption.repository'
import type { IPetRepository } from '../pet'
import type { IPersonRepository } from '../person'
import type { IOrganizationRepository } from '../organization'
import type {
  AdoptionCreateInput,
  AdoptionCreateForUserInput,
  AdoptionListFilters,
  AdoptionListResult,
  AdoptionListingRecord,
  AdoptionStatus,
} from './adoption.types'

export class AdoptionService {
  constructor(
    private repository: IAdoptionRepository,
    private petRepository: IPetRepository,
    private personRepository: IPersonRepository,
    private orgRepository: IOrganizationRepository,
  ) {}

  private async validateLister(input: { listerType: string; personId?: string | null; organizationId?: string | null }): Promise<void> {
    if (input.listerType === 'PERSON') {
      if (!input.personId) {
        throw HttpError.badRequest('LISTER_REQUIRED', 'ID da pessoa listante é obrigatório.')
      }
      const person = await this.personRepository.findById(input.personId)
      if (!person) {
        throw HttpError.notFound('Pessoa listante')
      }
    } else if (input.listerType === 'ORGANIZATION') {
      if (!input.organizationId) {
        throw HttpError.badRequest('LISTER_REQUIRED', 'ID da organização listante é obrigatório.')
      }
      const org = await this.orgRepository.findById(input.organizationId)
      if (!org) {
        throw HttpError.notFound('Organização listante')
      }
    }
  }

  async createForUser(userId: string, input: AdoptionCreateForUserInput): Promise<AdoptionListingRecord> {
    const pet = await this.petRepository.findById(input.petId)
    if (!pet) throw HttpError.notFound('Pet')

    const existing = await this.repository.findByPetId(input.petId)
    if (existing) throw HttpError.conflict('ALREADY_EXISTS', 'Este pet já possui uma listagem de adoção.')

    const person = await this.personRepository.findByUserId(userId)
    if (!person) throw HttpError.notFound('Perfil de pessoa do usuário')

    let listerType: 'PERSON' | 'ORGANIZATION' = 'PERSON'
    let personId: string | undefined = person.id
    let organizationId: string | undefined = undefined

    if (input.organizationId) {
      const org = await this.orgRepository.findById(input.organizationId)
      if (!org) throw HttpError.notFound('Organização')

      const isMember = await this.orgRepository.hasPerson(input.organizationId, person.id)
      if (!isMember) throw HttpError.forbidden('Você não tem permissão para publicar por esta organização.')

      listerType = 'ORGANIZATION'
      personId = undefined
      organizationId = input.organizationId
    }

    return this.repository.create({
      petId: input.petId,
      listerType,
      personId,
      organizationId,
      description: input.description ?? null,
      contactEmail: input.contactEmail ?? null,
      contactPhone: input.contactPhone ?? null,
      contactWhatsapp: input.contactWhatsapp ?? null,
    })
  }

  async create(input: AdoptionCreateInput): Promise<AdoptionListingRecord> {
    const pet = await this.petRepository.findById(input.petId)
    if (!pet) {
      throw HttpError.notFound('Pet')
    }

    const existing = await this.repository.findByPetId(input.petId)
    if (existing) {
      throw HttpError.conflict('ALREADY_EXISTS', 'Este pet já possui uma listagem de adoção.')
    }

    await this.validateLister(input)

    return this.repository.create(input)
  }

  async findAll(filters: AdoptionListFilters): Promise<AdoptionListResult> {
    const page = filters.page ?? 1
    const pageSize = filters.pageSize ?? 20

    const { listings, total } = await this.repository.findAll({ ...filters, page, pageSize })

    return { data: listings, meta: buildPaginationMeta(total, page, pageSize) }
  }

  async findById(id: string): Promise<AdoptionListingRecord> {
    const listing = await this.repository.findById(id)
    if (!listing) {
      throw HttpError.notFound('Listagem de adoção')
    }
    return listing
  }

  private async verifyListingOwnership(listing: AdoptionListingRecord, userId: string): Promise<void> {
    const person = await this.personRepository.findByUserId(userId)
    if (!person) {
      throw new AppError(403, 'INSUFFICIENT_PERMISSION', 'Sem permissão para modificar esta listagem.')
    }
    if (listing.listerType === 'PERSON') {
      if (listing.personId !== person.id) {
        throw new AppError(403, 'INSUFFICIENT_PERMISSION', 'Apenas o criador da listagem pode modificá-la.')
      }
    } else {
      const role = listing.organizationId
        ? await this.orgRepository.getRole(listing.organizationId, person.id)
        : null
      if (!role || role === 'MEMBER') {
        throw new AppError(403, 'INSUFFICIENT_PERMISSION', 'Apenas OWNER ou MANAGER podem modificar esta listagem.')
      }
    }
  }

  async updateStatus(id: string, status: AdoptionStatus, userId: string): Promise<AdoptionListingRecord> {
    const listing = await this.repository.findById(id)
    if (!listing) {
      throw HttpError.notFound('Listagem de adoção')
    }
    await this.verifyListingOwnership(listing, userId)
    return this.repository.updateStatus(id, status)
  }

  async delete(id: string, userId: string): Promise<void> {
    const listing = await this.repository.findById(id)
    if (!listing) {
      throw HttpError.notFound('Listagem de adoção')
    }
    await this.verifyListingOwnership(listing, userId)
    await this.repository.delete(id)
  }
}
