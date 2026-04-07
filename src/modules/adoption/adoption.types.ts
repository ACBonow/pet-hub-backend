/**
 * @module adoption
 * @file adoption.types.ts
 * @description TypeScript interfaces for the adoption module.
 */

import type { PaginatedResult } from '../../shared/types/pagination'

export type AdoptionStatus = 'AVAILABLE' | 'RESERVED' | 'ADOPTED'

export type AdoptionListerType = 'PERSON' | 'ORGANIZATION'

export interface AdoptionListingRecord {
  id: string
  petId: string
  petName: string
  species: string
  breed: string | null
  photoUrl: string | null
  gender: string | null
  castrated: boolean | null
  listerType: AdoptionListerType
  personId: string | null
  organizationId: string | null
  description: string | null
  contactEmail: string | null
  contactPhone: string | null
  contactWhatsapp: string | null
  status: AdoptionStatus
  createdAt: Date
  updatedAt: Date
}

/** Internal input — all fields resolved by the service before hitting the repository */
export interface AdoptionCreateInput {
  petId: string
  listerType: AdoptionListerType
  personId?: string | null
  organizationId?: string | null
  description?: string | null
  contactEmail?: string | null
  contactPhone?: string | null
  contactWhatsapp?: string | null
}

/** Simplified input received from the controller — lister resolved from JWT */
export interface AdoptionCreateForUserInput {
  petId: string
  description?: string | null
  contactEmail?: string | null
  contactPhone?: string | null
  contactWhatsapp?: string | null
  organizationId?: string | null
}

export interface AdoptionUpdateInput {
  description?: string | null
  contactEmail?: string | null
  contactPhone?: string | null
  contactWhatsapp?: string | null
}

export interface AdoptionUpdateStatusInput {
  status: AdoptionStatus
}

export interface AdoptionListFilters {
  status?: AdoptionStatus
  organizationId?: string
  page?: number
  pageSize?: number
}

export type AdoptionListResult = PaginatedResult<AdoptionListingRecord>
