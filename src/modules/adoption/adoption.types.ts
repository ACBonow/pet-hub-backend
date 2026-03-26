/**
 * @module adoption
 * @file adoption.types.ts
 * @description TypeScript interfaces for the adoption module.
 */

export type AdoptionStatus = 'AVAILABLE' | 'RESERVED' | 'ADOPTED'

export type AdoptionListerType = 'PERSON' | 'ORGANIZATION'

export interface AdoptionListingRecord {
  id: string
  petId: string
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

export interface AdoptionUpdateStatusInput {
  status: AdoptionStatus
}

export interface AdoptionListFilters {
  status?: AdoptionStatus
  page?: number
  pageSize?: number
}

export interface AdoptionListResult {
  data: AdoptionListingRecord[]
  total: number
  page: number
  pageSize: number
}
