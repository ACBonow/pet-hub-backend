/**
 * @module services-directory
 * @file servicesDirectory.repository.ts
 * @description Repository interface and Prisma implementation for services-directory persistence.
 */

import { prisma } from '../../shared/config/database'
import type {
  CreateServiceListingInput,
  ListServicesFilter,
  PaginatedServiceListings,
  ServiceListing,
  UpdateServiceListingInput,
} from './servicesDirectory.types'

export interface IServicesDirectoryRepository {
  create(data: CreateServiceListingInput): Promise<ServiceListing>
  findById(id: string): Promise<ServiceListing | null>
  findAll(filter: ListServicesFilter): Promise<PaginatedServiceListings>
  update(id: string, data: UpdateServiceListingInput): Promise<ServiceListing>
  delete(id: string): Promise<void>
}

export class PrismaServicesDirectoryRepository implements IServicesDirectoryRepository {
  async create(data: CreateServiceListingInput): Promise<ServiceListing> {
    return prisma.serviceListing.create({
      data: {
        name: data.name,
        type: data.type,
        description: data.description ?? null,
        address: data.address ?? null,
        phone: data.phone ?? null,
        email: data.email ?? null,
        website: data.website ?? null,
        organizationId: data.organizationId ?? null,
      },
    }) as Promise<ServiceListing>
  }

  async findById(id: string): Promise<ServiceListing | null> {
    return prisma.serviceListing.findUnique({ where: { id } }) as Promise<ServiceListing | null>
  }

  async findAll(filter: ListServicesFilter): Promise<PaginatedServiceListings> {
    const page = filter.page ?? 1
    const pageSize = filter.pageSize ?? 20
    const skip = (page - 1) * pageSize

    const where: Record<string, unknown> = {}
    if (filter.type) where.type = filter.type
    if (filter.name) where.name = { contains: filter.name, mode: 'insensitive' }

    const [data, total] = await Promise.all([
      prisma.serviceListing.findMany({
        where,
        skip,
        take: pageSize,
        orderBy: { name: 'asc' },
      }),
      prisma.serviceListing.count({ where }),
    ])

    return { data: data as ServiceListing[], total, page, pageSize }
  }

  async update(id: string, data: UpdateServiceListingInput): Promise<ServiceListing> {
    return prisma.serviceListing.update({
      where: { id },
      data: {
        ...(data.name !== undefined && { name: data.name }),
        ...(data.type !== undefined && { type: data.type }),
        ...(data.description !== undefined && { description: data.description }),
        ...(data.address !== undefined && { address: data.address }),
        ...(data.phone !== undefined && { phone: data.phone }),
        ...(data.email !== undefined && { email: data.email }),
        ...(data.website !== undefined && { website: data.website }),
        ...(data.organizationId !== undefined && { organizationId: data.organizationId }),
      },
    }) as Promise<ServiceListing>
  }

  async delete(id: string): Promise<void> {
    await prisma.serviceListing.delete({ where: { id } })
  }
}
