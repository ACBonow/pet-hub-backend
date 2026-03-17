/**
 * @module pet-health
 * @file index.ts
 * @description Public API surface for the pet-health module.
 */

export { PetHealthService } from './petHealth.service'
export { PrismaPetHealthRepository } from './petHealth.repository'
export type { IPetHealthRepository } from './petHealth.repository'
export { registerPetHealthRoutes } from './petHealth.routes'
export type {
  VaccinationRecord,
  VaccinationCreateInput,
  AddVaccinationInput,
  ExamFileRecord,
  ExamFileCreateInput,
  UploadExamFileInput,
} from './petHealth.types'
