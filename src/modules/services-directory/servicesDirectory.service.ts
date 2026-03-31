/**
 * @module services-directory
 * @file servicesDirectory.service.ts
 * @description Business logic for services-directory management.
 */

import { AppError } from '../../shared/errors/AppError'
import { HttpError } from '../../shared/errors/HttpError'
import { uploadFile, deleteFile, extractPathFromUrl } from '../../shared/utils/storage'
import type { IServicesDirectoryRepository, IServiceTypeRepository } from './servicesDirectory.repository'
import type { IPersonRepository } from '../person'
import type { IOrganizationRepository } from '../organization'
import type {
  CreateServiceListingInput,
  ListServicesFilter,
  PaginatedServiceListings,
  ServiceListing,
  ServiceTypeRecord,
  UpdateServiceListingInput,
} from './servicesDirectory.types'

const ALLOWED_ORG_ROLES = ['OWNER', 'MANAGER'] as const

export class ServicesDirectoryService {
  constructor(
    private repository: IServicesDirectoryRepository,
    private typeRepository: IServiceTypeRepository,
    private personRepository?: IPersonRepository,
    private orgRepository?: IOrganizationRepository,
  ) {}

  async listTypes(): Promise<ServiceTypeRecord[]> {
    return this.typeRepository.findAll()
  }

  async create(input: CreateServiceListingInput, userId?: string): Promise<ServiceListing> {
    const serviceType = await this.typeRepository.findByCode(input.type)
    if (!serviceType) {
      throw new AppError(400, 'VALIDATION_ERROR', 'Tipo de serviço não encontrado.')
    }

    if (input.organizationId) {
      const person = this.personRepository ? await this.personRepository.findByUserId(userId ?? '') : null
      const role = person && this.orgRepository
        ? await this.orgRepository.getRole(input.organizationId, person.id)
        : null
      if (!role || !(ALLOWED_ORG_ROLES as readonly string[]).includes(role)) {
        throw new AppError(403, 'INSUFFICIENT_PERMISSION', 'Apenas OWNER ou MANAGER da organização podem cadastrar serviços.')
      }
    }

    return this.repository.create({ ...input, serviceTypeId: serviceType.id, createdByUserId: userId })
  }

  async findAll(filter: ListServicesFilter = {}): Promise<PaginatedServiceListings> {
    return this.repository.findAll(filter)
  }

  async findById(id: string): Promise<ServiceListing> {
    const listing = await this.repository.findById(id)
    if (!listing) throw HttpError.notFound('Serviço')
    return listing
  }

  async update(id: string, input: UpdateServiceListingInput, userId?: string): Promise<ServiceListing> {
    const existing = await this.repository.findById(id)
    if (!existing) throw HttpError.notFound('Serviço')

    if (existing.organizationId) {
      const person = this.personRepository ? await this.personRepository.findByUserId(userId ?? '') : null
      const role = person && this.orgRepository
        ? await this.orgRepository.getRole(existing.organizationId, person.id)
        : null
      if (!role || !(ALLOWED_ORG_ROLES as readonly string[]).includes(role)) {
        throw new AppError(403, 'INSUFFICIENT_PERMISSION', 'Apenas OWNER ou MANAGER da organização podem editar este serviço.')
      }
    }

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

  async delete(id: string, userId?: string): Promise<void> {
    const existing = await this.repository.findById(id)
    if (!existing) throw HttpError.notFound('Serviço')

    if (existing.organizationId) {
      const person = this.personRepository ? await this.personRepository.findByUserId(userId ?? '') : null
      const role = person && this.orgRepository
        ? await this.orgRepository.getRole(existing.organizationId, person.id)
        : null
      if (!role || !(ALLOWED_ORG_ROLES as readonly string[]).includes(role)) {
        throw new AppError(403, 'INSUFFICIENT_PERMISSION', 'Apenas OWNER ou MANAGER da organização podem excluir este serviço.')
      }
    }

    await this.repository.delete(id)
  }

  async uploadPhoto(serviceId: string, userId: string, file: Buffer, mimeType: string): Promise<ServiceListing> {
    const service = await this.repository.findById(serviceId)
    if (!service) throw HttpError.notFound('Serviço')

    // Check permission
    if (service.organizationId) {
      // Org service: OWNER or MANAGER of the org can upload
      const person = this.personRepository ? await this.personRepository.findByUserId(userId) : null
      const role = person && this.orgRepository
        ? await this.orgRepository.getRole(service.organizationId, person.id)
        : null

      if (!role || !(ALLOWED_ORG_ROLES as readonly string[]).includes(role)) {
        throw new AppError(403, 'INSUFFICIENT_PERMISSION', 'Apenas OWNER ou MANAGER da organização podem atualizar a foto do serviço.')
      }
    } else {
      // Personal service: only the creator can upload
      if (!service.createdByUserId || service.createdByUserId !== userId) {
        throw new AppError(403, 'INSUFFICIENT_PERMISSION', 'Apenas o criador do serviço pode atualizar a foto.')
      }
    }

    if (service.photoUrl) {
      const oldPath = extractPathFromUrl(service.photoUrl, 'service-images')
      await deleteFile('service-images', oldPath).catch(() => {})
    }

    const ext = mimeType === 'image/png' ? 'png' : mimeType === 'image/webp' ? 'webp' : 'jpg'
    const path = `${serviceId}/${Date.now()}.${ext}`
    const photoUrl = await uploadFile('service-images', path, file, mimeType)

    await this.repository.updatePhotoUrl(serviceId, photoUrl)

    const updated = await this.repository.findById(serviceId)
    return updated!
  }
}
