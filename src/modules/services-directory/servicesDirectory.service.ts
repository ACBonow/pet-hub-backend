/**
 * @module services-directory
 * @file servicesDirectory.service.ts
 * @description Business logic for services-directory management.
 */

import { AppError } from '../../shared/errors/AppError'
import { HttpError } from '../../shared/errors/HttpError'
import type { IServicesDirectoryRepository, IServiceTypeRepository } from './servicesDirectory.repository'
import type {
  CreateServiceListingInput,
  ListServicesFilter,
  PaginatedServiceListings,
  ServiceListing,
  ServiceTypeRecord,
  UpdateServiceListingInput,
} from './servicesDirectory.types'

export class ServicesDirectoryService {
  constructor(
    private repository: IServicesDirectoryRepository,
    private typeRepository: IServiceTypeRepository,
  ) {}

  async listTypes(): Promise<ServiceTypeRecord[]> {
    return this.typeRepository.findAll()
  }

  async create(input: CreateServiceListingInput): Promise<ServiceListing> {
    const serviceType = await this.typeRepository.findByCode(input.type)
    if (!serviceType) {
      throw new AppError(400, 'VALIDATION_ERROR', 'Tipo de serviço não encontrado.')
    }
    return this.repository.create({ ...input, serviceTypeId: serviceType.id })
  }

  async findAll(filter: ListServicesFilter = {}): Promise<PaginatedServiceListings> {
    return this.repository.findAll(filter)
  }

  async findById(id: string): Promise<ServiceListing> {
    const listing = await this.repository.findById(id)
    if (!listing) throw HttpError.notFound('Serviço')
    return listing
  }

  async update(id: string, input: UpdateServiceListingInput): Promise<ServiceListing> {
    const existing = await this.repository.findById(id)
    if (!existing) throw HttpError.notFound('Serviço')

    let serviceTypeId: string | undefined
    if (input.type !== undefined) {
      const serviceType = await this.typeRepository.findByCode(input.type)
      if (!serviceType) {
        throw new AppError(400, 'VALIDATION_ERROR', 'Tipo de serviço não encontrado.')
      }
      serviceTypeId = serviceType.id
    }

    return this.repository.update(id, { ...input, serviceTypeId })
  }

  async delete(id: string): Promise<void> {
    const existing = await this.repository.findById(id)
    if (!existing) throw HttpError.notFound('Serviço')
    await this.repository.delete(id)
  }
}
