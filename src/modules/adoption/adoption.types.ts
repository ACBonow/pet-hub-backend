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
  status: AdoptionStatus
  createdAt: Date
  updatedAt: Date
}

export interface AdoptionCreateInput {
  petId: string
  listerType: AdoptionListerType
  personId?: string
  organizationId?: string
  description?: string
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
