/**
 * @module services-directory
 * @file servicesDirectory.mapper.ts
 * @description Maps Prisma ServiceListing payloads to domain types.
 */

import type { Prisma } from '@prisma/client'
import type { ServiceListing, ServiceTypeRecord } from './servicesDirectory.types'

export const SERVICE_TYPE_SELECT = {
  id: true,
  code: true,
  label: true,
  color: true,
  active: true,
  sortOrder: true,
} as const

export const LISTING_INCLUDE = {
  serviceType: { select: SERVICE_TYPE_SELECT },
} as const

export type PrismaServiceListingWithType = Prisma.ServiceListingGetPayload<{
  include: typeof LISTING_INCLUDE
}>

export function mapListing(raw: PrismaServiceListingWithType): ServiceListing {
  return raw as unknown as ServiceListing
}

export function mapServiceType(raw: Prisma.ServiceTypeGetPayload<{ select: typeof SERVICE_TYPE_SELECT }>): ServiceTypeRecord {
  return raw as ServiceTypeRecord
}
