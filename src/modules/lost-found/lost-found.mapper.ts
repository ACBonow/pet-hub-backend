/**
 * @module lost-found
 * @file lost-found.mapper.ts
 * @description Maps Prisma LostFoundReport payloads to domain types.
 */

import type { Prisma } from '@prisma/client'
import type { LostFoundReport, LostFoundStatus, LostFoundType } from './lost-found.types'

export const LOST_FOUND_INCLUDE = {
  organization: true,
} as const

export type PrismaLostFoundReportWithOrg = Prisma.LostFoundReportGetPayload<{
  include: typeof LOST_FOUND_INCLUDE
}>

export function mapReport(row: PrismaLostFoundReportWithOrg): LostFoundReport {
  return {
    id: row.id,
    type: row.type as LostFoundType,
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
    organizationId: row.organizationId ?? null,
    organization: row.organization
      ? { id: row.organization.id, name: row.organization.name, photoUrl: row.organization.photoUrl ?? null }
      : null,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  }
}
