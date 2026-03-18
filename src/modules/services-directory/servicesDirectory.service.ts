/**
 * @module services-directory
 * @file servicesDirectory.service.ts
 * @description Business logic for services-directory management.
 */

import { AppError } from '../../shared/errors/AppError'
import { HttpError } from '../../shared/errors/HttpError'
import type { IServicesDirectoryRepository } from './servicesDirectory.repository'
import type {
  CreateServiceListingInput,
  ListServicesFilter,
  PaginatedServiceListings,
  ServiceListing,
  ServiceType,
  UpdateServiceListingInput,
} from './servicesDirectory.types'

const VALID_SERVICE_TYPES: ServiceType[] = [
  'VETERINARIAN',
  'CLINIC',
  'EXAM',
  'PHARMACY',
  'GROOMING',
  'BOARDING',
  'TRANSPORT',
  'OTHER',
]

export class ServicesDirectoryService {
  constructor(private repository: IServicesDirectoryRepository) {}

  async create(input: CreateServiceListingInput): Promise<ServiceListing> {
    if (!VALID_SERVICE_TYPES.includes(input.type)) {
      throw new AppError(400, 'VALIDATION_ERROR', 'Tipo de serviço inválido.')
    }
    return this.repository.create(input)
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
    return this.repository.update(id, input)
  }

  async delete(id: string): Promise<void> {
    const existing = await this.repository.findById(id)
    if (!existing) throw HttpError.notFound('Serviço')
    await this.repository.delete(id)
  }
}
