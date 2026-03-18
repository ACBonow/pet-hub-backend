/**
 * @module services-directory
 * @file servicesDirectory.types.ts
 * @description TypeScript interfaces for the services-directory module.
 */

export type ServiceType =
  | 'VETERINARIAN'
  | 'CLINIC'
  | 'EXAM'
  | 'PHARMACY'
  | 'GROOMING'
  | 'BOARDING'
  | 'TRANSPORT'
  | 'OTHER'

export interface ServiceListing {
  id: string
  name: string
  type: ServiceType
  description: string | null
  address: string | null
  phone: string | null
  email: string | null
  website: string | null
  organizationId: string | null
  createdAt: Date
  updatedAt: Date
}

export interface CreateServiceListingInput {
  name: string
  type: ServiceType
  description?: string
  address?: string
  phone?: string
  email?: string
  website?: string
  organizationId?: string
}

export interface UpdateServiceListingInput {
  name?: string
  type?: ServiceType
  description?: string
  address?: string
  phone?: string
  email?: string
  website?: string
  organizationId?: string
}

export interface ListServicesFilter {
  type?: ServiceType
  name?: string
  page?: number
  pageSize?: number
}

export interface PaginatedServiceListings {
  data: ServiceListing[]
  total: number
  page: number
  pageSize: number
}
