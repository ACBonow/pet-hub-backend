/**
 * @module adoption
 * @file adoption.repository.ts
 * @description Repository interface and Prisma implementation for adoption persistence.
 */

import { prisma } from '../../shared/config/database'
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

function mapListing(row: any): AdoptionListingRecord {
  return {
    id: row.id,
    petId: row.petId,
    listerType: row.listenerType as 'PERSON' | 'ORGANIZATION',
    personId: row.personId,
    organizationId: row.organizationId,
    description: row.description,
    status: row.status as AdoptionStatus,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  }
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
        status: 'AVAILABLE',
      },
    })
    return mapListing(row)
  }

  async findById(id: string): Promise<AdoptionListingRecord | null> {
    const row = await prisma.adoptionListing.findUnique({ where: { id } })
    return row ? mapListing(row) : null
  }

  async findByPetId(petId: string): Promise<AdoptionListingRecord | null> {
    const row = await prisma.adoptionListing.findUnique({ where: { petId } })
    return row ? mapListing(row) : null
  }

  async findAll(filters: AdoptionListFilters): Promise<{ listings: AdoptionListingRecord[]; total: number }> {
    const page = filters.page ?? 1
    const pageSize = filters.pageSize ?? 20
    const where = filters.status ? { status: filters.status as any } : {}

    const [rows, total] = await prisma.$transaction([
      prisma.adoptionListing.findMany({
        where,
        skip: (page - 1) * pageSize,
        take: pageSize,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.adoptionListing.count({ where }),
    ])

    return { listings: rows.map(mapListing), total }
  }

  async updateStatus(id: string, status: AdoptionStatus): Promise<AdoptionListingRecord> {
    const row = await prisma.adoptionListing.update({
      where: { id },
      data: { status: status as any },
    })
    return mapListing(row)
  }

  async delete(id: string): Promise<void> {
    await prisma.adoptionListing.delete({ where: { id } })
  }
}
