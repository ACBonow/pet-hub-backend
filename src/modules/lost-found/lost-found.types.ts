/**
 * @module lost-found
 * @file lost-found.types.ts
 * @description TypeScript interfaces for the lost-found module.
 */

export type LostFoundType = 'LOST' | 'FOUND'

export type LostFoundStatus = 'OPEN' | 'RESOLVED'

export interface LostFoundReport {
  id: string
  type: LostFoundType
  petId: string | null
  reporterId: string
  petName: string | null
  species: string | null
  description: string
  location: string | null
  photoUrl: string | null
  contactEmail: string | null
  contactPhone: string | null
  status: LostFoundStatus
  createdAt: Date
  updatedAt: Date
}

export interface LostFoundCreateInput {
  type: LostFoundType
  petId?: string
  reporterId: string
  petName?: string
  species?: string
  description: string
  location?: string
  photoUrl?: string
  contactEmail: string
  contactPhone?: string
}

export interface LostFoundUpdateStatusInput {
  status: LostFoundStatus
}

export interface LostFoundListFilters {
  type?: LostFoundType
  status?: LostFoundStatus
  page?: number
  pageSize?: number
}

export interface LostFoundListResult {
  data: LostFoundReport[]
  total: number
  page: number
  pageSize: number
}
