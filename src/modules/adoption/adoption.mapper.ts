/**
 * @module adoption
 * @file adoption.mapper.ts
 * @description Maps Prisma AdoptionListing payloads to domain types.
 */

import type { Prisma } from '@prisma/client'
import type { AdoptionListingRecord, AdoptionStatus } from './adoption.types'

export const ADOPTION_LISTING_INCLUDE = {
  pet: true,
} as const

export type PrismaAdoptionListingWithPet = Prisma.AdoptionListingGetPayload<{
  include: typeof ADOPTION_LISTING_INCLUDE
}>

export function mapListing(row: PrismaAdoptionListingWithPet): AdoptionListingRecord {
  return {
    id: row.id,
    petId: row.petId,
    petName: row.pet?.name ?? '',
    species: row.pet?.species ?? '',
    breed: row.pet?.breed ?? null,
    photoUrl: row.pet?.photoUrl ?? null,
    gender: row.pet?.gender ?? null,
    castrated: row.pet?.castrated ?? null,
    listerType: row.listenerType as 'PERSON' | 'ORGANIZATION',
    personId: row.personId,
    organizationId: row.organizationId,
    description: row.description,
    contactEmail: row.contactEmail,
    contactPhone: row.contactPhone,
    contactWhatsapp: row.contactWhatsapp,
    status: row.status as AdoptionStatus,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  }
}
