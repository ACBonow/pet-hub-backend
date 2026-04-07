/**
 * @module lost-found
 * @file lost-found.repository.ts
 * @description Repository interface and Prisma implementation for lost-found persistence.
 */

import { prisma } from '../../shared/config/database'
import { mapReport, LOST_FOUND_INCLUDE } from './lost-found.mapper'
import type {
  LostFoundCreateInput,
  LostFoundListFilters,
  LostFoundReport,
  LostFoundStatus,
  LostFoundUpdateInput,
} from './lost-found.types'

export interface ILostFoundRepository {
  create(data: LostFoundCreateInput): Promise<LostFoundReport>
  findById(id: string): Promise<LostFoundReport | null>
  findAll(filters: LostFoundListFilters): Promise<{ reports: LostFoundReport[]; total: number }>
  update(id: string, data: LostFoundUpdateInput): Promise<LostFoundReport>
  updateStatus(id: string, status: LostFoundStatus): Promise<LostFoundReport>
  updatePhotoUrl(id: string, photoUrl: string): Promise<void>
  delete(id: string): Promise<void>
}


export class PrismaLostFoundRepository implements ILostFoundRepository {
  async create(data: LostFoundCreateInput): Promise<LostFoundReport> {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const row = await (prisma.lostFoundReport as any).create({
      data: {
        type: data.type,
        petId: data.petId ?? null,
        reporterId: data.reporterId,
        organizationId: data.organizationId ?? null,
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
      include: LOST_FOUND_INCLUDE,
    })
    return mapReport(row)
  }

  async findById(id: string): Promise<LostFoundReport | null> {
    const row = await prisma.lostFoundReport.findFirst({
      where: { id, deletedAt: null },
      include: LOST_FOUND_INCLUDE,
    })
    return row ? mapReport(row) : null
  }

  async findAll(filters: LostFoundListFilters): Promise<{ reports: LostFoundReport[]; total: number }> {
    const page = filters.page ?? 1
    const pageSize = filters.pageSize ?? 20

    const where: Record<string, unknown> = { deletedAt: null }
    if (filters.type) where['type'] = filters.type
    if (filters.status) where['status'] = filters.status
    if (filters.organizationId) where['organizationId'] = filters.organizationId

    const [rows, total] = await prisma.$transaction([
      prisma.lostFoundReport.findMany({
        where,
        skip: (page - 1) * pageSize,
        take: pageSize,
        orderBy: { createdAt: 'desc' },
        include: LOST_FOUND_INCLUDE,
      }),
      prisma.lostFoundReport.count({ where }),
    ])

    return { reports: rows.map(mapReport), total }
  }

  async update(id: string, data: LostFoundUpdateInput): Promise<LostFoundReport> {
    const row = await prisma.lostFoundReport.update({
      where: { id },
      data: {
        ...(data.petName !== undefined && { petName: data.petName }),
        ...(data.species !== undefined && { species: data.species }),
        ...(data.description !== undefined && { description: data.description }),
        ...(data.location !== undefined && { location: data.location }),
        ...(data.addressStreet !== undefined && { addressStreet: data.addressStreet }),
        ...(data.addressNeighborhood !== undefined && { addressNeighborhood: data.addressNeighborhood }),
        ...(data.addressNumber !== undefined && { addressNumber: data.addressNumber }),
        ...(data.addressCep !== undefined && { addressCep: data.addressCep }),
        ...(data.addressCity !== undefined && { addressCity: data.addressCity }),
        ...(data.addressState !== undefined && { addressState: data.addressState }),
        ...(data.addressNotes !== undefined && { addressNotes: data.addressNotes }),
        ...(data.contactEmail !== undefined && { contactEmail: data.contactEmail }),
        ...(data.contactPhone !== undefined && { contactPhone: data.contactPhone }),
      },
      include: LOST_FOUND_INCLUDE,
    })
    return mapReport(row)
  }

  async updateStatus(id: string, status: LostFoundStatus): Promise<LostFoundReport> {
    const row = await prisma.lostFoundReport.update({
      where: { id },
      data: { status: status as any },
      include: LOST_FOUND_INCLUDE,
    })
    return mapReport(row)
  }

  async updatePhotoUrl(id: string, photoUrl: string): Promise<void> {
    await prisma.lostFoundReport.update({ where: { id }, data: { photoUrl } })
  }

  async delete(id: string): Promise<void> {
    await prisma.lostFoundReport.update({ where: { id }, data: { deletedAt: new Date() } })
  }
}
