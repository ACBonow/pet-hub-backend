/**
 * @module vaccine-catalog
 * @file index.ts
 * @description Public exports for the vaccine-catalog module.
 */

export { VaccineCatalogService } from './vaccineCatalog.service'
export { PrismaVaccineCatalogRepository } from './vaccineCatalog.repository'
export { registerVaccineCatalogRoutes } from './vaccineCatalog.routes'
export type { VaccineTemplateRecord, VaccineBrandRecord, ListVaccineCatalogFilter } from './vaccineCatalog.types'
