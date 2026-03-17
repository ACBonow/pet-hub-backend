/**
 * @module lost-found
 * @file index.ts
 * @description Public API surface for the lost-found module.
 */

export { LostFoundService } from './lost-found.service'
export { PrismaLostFoundRepository } from './lost-found.repository'
export type { ILostFoundRepository } from './lost-found.repository'
export { registerLostFoundRoutes } from './lost-found.routes'
export type {
  LostFoundReport,
  LostFoundCreateInput,
  LostFoundUpdateStatusInput,
  LostFoundListFilters,
  LostFoundListResult,
  LostFoundType,
  LostFoundStatus,
} from './lost-found.types'
