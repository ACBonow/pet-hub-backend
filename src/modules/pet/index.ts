/**
 * @module pet
 * @file index.ts
 * @description Public surface of the pet module.
 */

export { PetService } from './pet.service'
export { PrismaPetRepository } from './pet.repository'
export type { IPetRepository } from './pet.repository'
export { registerPetRoutes } from './pet.routes'
export type {
  PetCreateInput,
  PetRecord,
  PetUpdateInput,
  TransferTutorshipInput,
  AddCoTutorInput,
  CoTutorRecord,
  TutorshipRecord,
  TutorType,
  TutorshipType,
} from './pet.types'
