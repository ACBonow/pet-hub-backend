/**
 * @module services-directory
 * @file servicesDirectory.repository.ts
 * @description Repository interfaces and Prisma implementations for services-directory persistence.
 */

import { prisma } from '../../shared/config/database'
import { mapListing, mapServiceType, LISTING_INCLUDE, SERVICE_TYPE_SELECT } from './servicesDirectory.mapper'
import type {
  CreateServiceListingInput,
  ListServicesFilter,
  PaginatedServiceListings,
  ServiceListing,
  ServiceTypeRecord,
  UpdateServiceListingInput,
} from './servicesDirectory.types'

// ─── ServiceType Repository ───────────────────────────────────────────────────

export interface IServiceTypeRepository {
  findAll(): Promise<ServiceTypeRecord[]>
  findByCode(code: string): Promise<ServiceTypeRecord | null>
}

export class PrismaServiceTypeRepository implements IServiceTypeRepository {
  async findAll(): Promise<ServiceTypeRecord[]> {
    const rows = await prisma.serviceType.findMany({
      where: { active: true },
      orderBy: { sortOrder: 'asc' },
      select: SERVICE_TYPE_SELECT,
    })
    return rows.map(mapServiceType)
  }

  async findByCode(code: string): Promise<ServiceTypeRecord | null> {
    const row = await prisma.serviceType.findUnique({
      where: { code },
      select: SERVICE_TYPE_SELECT,
    })
    return row ? mapServiceType(row) : null
  }
}

// ─── ServicesDirectory Repository ────────────────────────────────────────────

export interface IServicesDirectoryRepository {
  create(data: CreateServiceListingInput & { serviceTypeId: string; createdByUserId?: string }): Promise<ServiceListing>
  findById(id: string): Promise<ServiceListing | null>
  findAll(filter: ListServicesFilter): Promise<PaginatedServiceListings>
  update(id: string, data: UpdateServiceListingInput & { serviceTypeId?: string }): Promise<ServiceListing>
  delete(id: string): Promise<void>
  updatePhotoUrl(id: string, photoUrl: string | null): Promise<void>
}

export class PrismaServicesDirectoryRepository implements IServicesDirectoryRepository {
  async create(data: CreateServiceListingInput & { serviceTypeId: string; createdByUserId?: string }): Promise<ServiceListing> {
    const raw = await prisma.serviceListing.create({
      data: {
        name: data.name,
        serviceTypeId: data.serviceTypeId,
        description: data.description ?? null,
        zipCode: data.zipCode ?? null,
        street: data.street ?? null,
        number: data.number ?? null,
        complement: data.complement ?? null,
        neighborhood: data.neighborhood ?? null,
        city: data.city ?? null,
        state: data.state ?? null,
        phone: data.phone ?? null,
        whatsapp: data.whatsapp ?? null,
        email: data.email ?? null,
        website: data.website ?? null,
        instagram: data.instagram ?? null,
        facebook: data.facebook ?? null,
        tiktok: data.tiktok ?? null,
        youtube: data.youtube ?? null,
        googleMapsUrl: data.googleMapsUrl ?? null,
        googleBusinessUrl: data.googleBusinessUrl ?? null,
        organizationId: data.organizationId ?? null,
        createdByUserId: data.createdByUserId ?? null,
      },
      include: LISTING_INCLUDE,
    })
    return mapListing(raw)
  }

  async findById(id: string): Promise<ServiceListing | null> {
    const raw = await prisma.serviceListing.findFirst({
      where: { id, deletedAt: null },
      include: LISTING_INCLUDE,
    })
    return raw ? mapListing(raw) : null
  }

  async findAll(filter: ListServicesFilter): Promise<PaginatedServiceListings> {
    const page = filter.page ?? 1
    const pageSize = filter.pageSize ?? 20
    const skip = (page - 1) * pageSize

    const where: Record<string, unknown> = { deletedAt: null }
    if (filter.type) where.serviceType = { code: filter.type }
    if (filter.name) where.name = { contains: filter.name, mode: 'insensitive' }
    if (filter.organizationId) where.organizationId = filter.organizationId

    const [data, total] = await Promise.all([
      prisma.serviceListing.findMany({
        where,
        skip,
        take: pageSize,
        orderBy: { name: 'asc' },
        include: LISTING_INCLUDE,
      }),
      prisma.serviceListing.count({ where }),
    ])

    return { data: data.map(mapListing), total, page, pageSize }
  }

  async update(id: string, data: UpdateServiceListingInput & { serviceTypeId?: string }): Promise<ServiceListing> {
    const raw = await prisma.serviceListing.update({
      where: { id },
      data: {
        ...(data.name !== undefined && { name: data.name }),
        ...(data.serviceTypeId !== undefined && { serviceTypeId: data.serviceTypeId }),
        ...(data.description !== undefined && { description: data.description }),
        ...(data.zipCode !== undefined && { zipCode: data.zipCode }),
        ...(data.street !== undefined && { street: data.street }),
        ...(data.number !== undefined && { number: data.number }),
        ...(data.complement !== undefined && { complement: data.complement }),
        ...(data.neighborhood !== undefined && { neighborhood: data.neighborhood }),
        ...(data.city !== undefined && { city: data.city }),
        ...(data.state !== undefined && { state: data.state }),
        ...(data.phone !== undefined && { phone: data.phone }),
        ...(data.whatsapp !== undefined && { whatsapp: data.whatsapp }),
        ...(data.email !== undefined && { email: data.email }),
        ...(data.website !== undefined && { website: data.website }),
        ...(data.instagram !== undefined && { instagram: data.instagram }),
        ...(data.facebook !== undefined && { facebook: data.facebook }),
        ...(data.tiktok !== undefined && { tiktok: data.tiktok }),
        ...(data.youtube !== undefined && { youtube: data.youtube }),
        ...(data.googleMapsUrl !== undefined && { googleMapsUrl: data.googleMapsUrl }),
        ...(data.googleBusinessUrl !== undefined && { googleBusinessUrl: data.googleBusinessUrl }),
        ...(data.organizationId !== undefined && { organizationId: data.organizationId }),
      },
      include: LISTING_INCLUDE,
    })
    return mapListing(raw)
  }

  async delete(id: string): Promise<void> {
    await prisma.serviceListing.update({ where: { id }, data: { deletedAt: new Date() } })
  }

  async updatePhotoUrl(id: string, photoUrl: string | null): Promise<void> {
    await prisma.serviceListing.update({ where: { id }, data: { photoUrl } })
  }
}
