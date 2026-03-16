/**
 * @module adoption
 * @file adoption.service.ts
 * @description Business logic for adoption listing management.
 */

import { HttpError } from '../../shared/errors/HttpError'
import type { IAdoptionRepository } from './adoption.repository'
import type { IPetRepository } from '../pet'
import type { IPersonRepository } from '../person'
import type { IOrganizationRepository } from '../organization'
import type {
  AdoptionCreateInput,
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

  private async validateLister(input: { listerType: string; personId?: string; organizationId?: string }): Promise<void> {
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

    return { data: listings, total, page, pageSize }
  }

  async findById(id: string): Promise<AdoptionListingRecord> {
    const listing = await this.repository.findById(id)
    if (!listing) {
      throw HttpError.notFound('Listagem de adoção')
    }
    return listing
  }

  async updateStatus(id: string, status: AdoptionStatus): Promise<AdoptionListingRecord> {
    const listing = await this.repository.findById(id)
    if (!listing) {
      throw HttpError.notFound('Listagem de adoção')
    }
    return this.repository.updateStatus(id, status)
  }

  async delete(id: string): Promise<void> {
    const listing = await this.repository.findById(id)
    if (!listing) {
      throw HttpError.notFound('Listagem de adoção')
    }
    await this.repository.delete(id)
  }
}
