/**
 * @module vaccine-catalog
 * @file vaccineCatalog.repository.ts
 * @description Repository interface and Prisma implementation for vaccine catalog persistence.
 */

import { prisma } from '../../shared/config/database'
import type { ListVaccineCatalogFilter, VaccineTemplateRecord } from './vaccineCatalog.types'

// ─── Prisma include ───────────────────────────────────────────────────────────

const TEMPLATE_INCLUDE = {
  brands: {
    select: { id: true, brandName: true, manufacturer: true, presentation: true },
  },
} as const

// ─── Interface ────────────────────────────────────────────────────────────────

export interface IVaccineCatalogRepository {
  findAll(filter: ListVaccineCatalogFilter): Promise<VaccineTemplateRecord[]>
  findBySlug(slug: string): Promise<VaccineTemplateRecord | null>
  findById(id: string): Promise<VaccineTemplateRecord | null>
}

// ─── Prisma implementation ────────────────────────────────────────────────────

export class PrismaVaccineCatalogRepository implements IVaccineCatalogRepository {
  async findAll(filter: ListVaccineCatalogFilter): Promise<VaccineTemplateRecord[]> {
    const rows = await prisma.vaccineTemplate.findMany({
      where: {
        active: true,
        ...(filter.type ? { type: filter.type } : {}),
        ...(filter.category ? { category: filter.category } : {}),
        ...(filter.species ? { species: { has: filter.species } } : {}),
      },
      include: TEMPLATE_INCLUDE,
      orderBy: [{ category: 'asc' }, { name: 'asc' }],
    })
    return rows as VaccineTemplateRecord[]
  }

  async findBySlug(slug: string): Promise<VaccineTemplateRecord | null> {
    const row = await prisma.vaccineTemplate.findUnique({
      where: { slug },
      include: TEMPLATE_INCLUDE,
    })
    return row ? (row as VaccineTemplateRecord) : null
  }

  async findById(id: string): Promise<VaccineTemplateRecord | null> {
    const row = await prisma.vaccineTemplate.findUnique({
      where: { id },
      include: TEMPLATE_INCLUDE,
    })
    return row ? (row as VaccineTemplateRecord) : null
  }
}
