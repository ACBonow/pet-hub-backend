/**
 * @module adoption
 * @file adoption.repository.ts
 * @description Repository interface and Prisma implementation for adoption persistence.
 */

import { prisma } from '../../shared/config/database'
import { mapListing, ADOPTION_LISTING_INCLUDE } from './adoption.mapper'
import type {
  AdoptionCreateInput,
  AdoptionListFilters,
  AdoptionListingRecord,
  AdoptionStatus,
} from './adoption.types'

export interface IAdoptionRepository {
  create(data: AdoptionCreateInput): Promise<AdoptionListingRecord>
  findById(id: string): Promise<AdoptionListingRecord | null>
  findByPetId(petId: string): Promise<AdoptionListingRecord | null>
  findAll(filters: AdoptionListFilters): Promise<{ listings: AdoptionListingRecord[]; total: number }>
  updateStatus(id: string, status: AdoptionStatus): Promise<AdoptionListingRecord>
  delete(id: string): Promise<void>
}


export class PrismaAdoptionRepository implements IAdoptionRepository {
  async create(data: AdoptionCreateInput): Promise<AdoptionListingRecord> {
    const row = await prisma.adoptionListing.create({
      data: {
        petId: data.petId,
        listenerType: data.listerType as any,
        personId: data.personId ?? null,
        organizationId: data.organizationId ?? null,
        description: data.description ?? null,
        contactEmail: data.contactEmail ?? null,
        contactPhone: data.contactPhone ?? null,
        contactWhatsapp: data.contactWhatsapp ?? null,
        status: 'AVAILABLE',
      },
      include: ADOPTION_LISTING_INCLUDE,
    })
    return mapListing(row)
  }

  async findById(id: string): Promise<AdoptionListingRecord | null> {
    const row = await prisma.adoptionListing.findFirst({ where: { id, deletedAt: null }, include: { pet: true } })
    return row ? mapListing(row) : null
  }

  async findByPetId(petId: string): Promise<AdoptionListingRecord | null> {
    const row = await prisma.adoptionListing.findFirst({ where: { petId, deletedAt: null }, include: { pet: true } })
    return row ? mapListing(row) : null
  }

  async findAll(filters: AdoptionListFilters): Promise<{ listings: AdoptionListingRecord[]; total: number }> {
    const page = filters.page ?? 1
    const pageSize = filters.pageSize ?? 20
    const where: Record<string, unknown> = { deletedAt: null }
    if (filters.status) where.status = filters.status
    if (filters.organizationId) where.organizationId = filters.organizationId

    const [rows, total] = await prisma.$transaction([
      prisma.adoptionListing.findMany({
        where,
        skip: (page - 1) * pageSize,
        take: pageSize,
        orderBy: { createdAt: 'desc' },
        include: ADOPTION_LISTING_INCLUDE,
      }),
      prisma.adoptionListing.count({ where }),
    ])

    return { listings: rows.map(mapListing), total }
  }

  async updateStatus(id: string, status: AdoptionStatus): Promise<AdoptionListingRecord> {
    const row = await prisma.adoptionListing.update({
      where: { id },
      data: { status: status as any },
      include: ADOPTION_LISTING_INCLUDE,
    })
    return mapListing(row)
  }

  async delete(id: string): Promise<void> {
    await prisma.adoptionListing.update({ where: { id }, data: { deletedAt: new Date() } })
  }
}
