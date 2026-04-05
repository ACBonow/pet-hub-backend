/**
 * @module services-directory
 * @file servicesDirectory.types.ts
 * @description TypeScript interfaces for the services-directory module.
 */

import type { PaginatedResult } from '../../shared/types/pagination'

export interface ServiceTypeRecord {
  id: string
  code: string
  label: string
  color: string
  active: boolean
  sortOrder: number
}

export interface ServiceListing {
  id: string
  name: string
  serviceTypeId: string
  serviceType: ServiceTypeRecord
  description: string | null
  zipCode: string | null
  street: string | null
  number: string | null
  complement: string | null
  neighborhood: string | null
  city: string | null
  state: string | null
  phone: string | null
  whatsapp: string | null
  email: string | null
  website: string | null
  instagram: string | null
  facebook: string | null
  tiktok: string | null
  youtube: string | null
  googleMapsUrl: string | null
  googleBusinessUrl: string | null
  organizationId: string | null
  photoUrl: string | null
  createdByUserId: string | null
  createdAt: Date
  updatedAt: Date
}

export interface CreateServiceListingInput {
  name: string
  type: string
  description?: string
  zipCode?: string
  street?: string
  number?: string
  complement?: string
  neighborhood?: string
  city?: string
  state?: string
  phone?: string
  whatsapp?: string
  email?: string
  website?: string
  instagram?: string
  facebook?: string
  tiktok?: string
  youtube?: string
  googleMapsUrl?: string
  googleBusinessUrl?: string
  organizationId?: string
}

export interface UpdateServiceListingInput {
  name?: string
  type?: string
  description?: string
  zipCode?: string
  street?: string
  number?: string
  complement?: string
  neighborhood?: string
  city?: string
  state?: string
  phone?: string
  whatsapp?: string
  email?: string
  website?: string
  instagram?: string
  facebook?: string
  tiktok?: string
  youtube?: string
  googleMapsUrl?: string
  googleBusinessUrl?: string
  organizationId?: string
}

export interface ListServicesFilter {
  type?: string
  name?: string
  organizationId?: string
  page?: number
  pageSize?: number
}

/** Internal repo return type — use PaginatedResult<ServiceListing> at the service layer */
export interface PaginatedServiceListings {
  data: ServiceListing[]
  total: number
  page: number
  pageSize: number
}

export type ServiceListingPage = PaginatedResult<ServiceListing>
