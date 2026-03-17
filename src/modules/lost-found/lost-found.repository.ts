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
  delete(id: string): Promise<void>
}

function mapReport(row: any): LostFoundReport {
  return {
    id: row.id,
    type: row.type as 'LOST' | 'FOUND',
    petId: row.petId,
    reporterId: row.reporterId,
    description: row.description,
    location: row.location,
    photoUrl: row.photoUrl,
    contactInfo: row.contactInfo,
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
        description: data.description,
        location: data.location ?? null,
        photoUrl: data.photoUrl ?? null,
        contactInfo: data.contactInfo,
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

  async delete(id: string): Promise<void> {
    await prisma.lostFoundReport.delete({ where: { id } })
  }
}
