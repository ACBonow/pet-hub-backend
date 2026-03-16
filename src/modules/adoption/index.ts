/**
 * @module adoption
 * @file index.ts
 * @description Public API surface for the adoption module.
 */

export { AdoptionService } from './adoption.service'
export { PrismaAdoptionRepository } from './adoption.repository'
export type { IAdoptionRepository } from './adoption.repository'
export { registerAdoptionRoutes } from './adoption.routes'
export type {
  AdoptionListingRecord,
  AdoptionCreateInput,
  AdoptionUpdateStatusInput,
  AdoptionListFilters,
  AdoptionListResult,
  AdoptionStatus,
  AdoptionListerType,
} from './adoption.types'
