/**
 * @module organization
 * @file index.ts
 * @description Public surface of the organization module.
 */

export { OrganizationService } from './organization.service'
export { PrismaOrganizationRepository } from './organization.repository'
export type { IOrganizationRepository } from './organization.repository'
export { registerOrganizationRoutes } from './organization.routes'
export type {
  OrganizationCreateInput,
  OrganizationRecord,
  OrganizationUpdateInput,
  OrgType,
} from './organization.types'
