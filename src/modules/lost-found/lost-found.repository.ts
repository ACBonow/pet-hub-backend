/**
 * @module lost-found
 * @file lost-found.repository.ts
 * @description Repository interface and Prisma implementation for lost-found persistence.
 */

import { prisma } from '../../shared/config/database'
import type {
  LostFoundCreateInput,
  LostFoundListFilters,
  LostFoundReport,
  LostFoundStatus,
} from './lost-found.types'

export interface ILostFoundRepository {
  create(data: LostFoundCreateInput): Promise<LostFoundReport>
  findById(id: string): Promise<LostFoundReport | null>
  findAll(filters: LostFoundListFilters): Promise<{ reports: LostFoundReport[]; total: number }>
  updateStatus(id: string, status: LostFoundStatus): Promise<LostFoundReport>
  updatePhotoUrl(id: string, photoUrl: string): Promise<void>
  delete(id: string): Promise<void>
}

function mapReport(row: any): LostFoundReport {
  return {
    id: row.id,
    type: row.type as 'LOST' | 'FOUND',
    petId: row.petId,
    reporterId: row.reporterId,
    petName: row.petName ?? null,
    species: row.species ?? null,
    description: row.description,
    location: row.location ?? null,
    addressStreet: row.addressStreet ?? null,
    addressNeighborhood: row.addressNeighborhood ?? null,
    addressNumber: row.addressNumber ?? null,
    addressCep: row.addressCep ?? null,
    addressCity: row.addressCity ?? null,
    addressState: row.addressState ?? null,
    addressNotes: row.addressNotes ?? null,
    photoUrl: row.photoUrl ?? null,
    contactEmail: row.contactEmail ?? null,
    contactPhone: row.contactPhone ?? null,
    status: row.status as LostFoundStatus,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  }
}

export class PrismaLostFoundRepository implements ILostFoundRepository {
  async create(data: LostFoundCreateInput): Promise<LostFoundReport> {
    const row = await prisma.lostFoundReport.create({
      data: {
        type: data.type as any,
        petId: data.petId ?? null,
        reporterId: data.reporterId,
        petName: data.petName ?? null,
        species: data.species ?? null,
        description: data.description,
        location: data.location ?? null,
        addressStreet: data.addressStreet ?? null,
        addressNeighborhood: data.addressNeighborhood ?? null,
        addressNumber: data.addressNumber ?? null,
        addressCep: data.addressCep ?? null,
        addressCity: data.addressCity ?? null,
        addressState: data.addressState ?? null,
        addressNotes: data.addressNotes ?? null,
        photoUrl: data.photoUrl ?? null,
        contactEmail: data.contactEmail,
        contactPhone: data.contactPhone ?? null,
        status: 'OPEN',
      },
    })
    return mapReport(row)
  }

  async findById(id: string): Promise<LostFoundReport | null> {
    const row = await prisma.lostFoundReport.findUnique({ where: { id } })
    return row ? mapReport(row) : null
  }

  async findAll(filters: LostFoundListFilters): Promise<{ reports: LostFoundReport[]; total: number }> {
    const page = filters.page ?? 1
    const pageSize = filters.pageSize ?? 20

    const where: Record<string, unknown> = {}
    if (filters.type) where['type'] = filters.type
    if (filters.status) where['status'] = filters.status

    const [rows, total] = await prisma.$transaction([
      prisma.lostFoundReport.findMany({
        where,
        skip: (page - 1) * pageSize,
        take: pageSize,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.lostFoundReport.count({ where }),
    ])

    return { reports: rows.map(mapReport), total }
  }

  async updateStatus(id: string, status: LostFoundStatus): Promise<LostFoundReport> {
    const row = await prisma.lostFoundReport.update({
      where: { id },
      data: { status: status as any },
    })
    return mapReport(row)
  }

  async updatePhotoUrl(id: string, photoUrl: string): Promise<void> {
    await prisma.lostFoundReport.update({ where: { id }, data: { photoUrl } })
  }

  async delete(id: string): Promise<void> {
    await prisma.lostFoundReport.delete({ where: { id } })
  }
}
