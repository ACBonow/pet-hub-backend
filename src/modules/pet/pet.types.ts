/**
 * @module pet
 * @file pet.types.ts
 * @description TypeScript interfaces for the pet module.
 */

export type TutorType = 'PERSON' | 'ORGANIZATION'

export type TutorshipType = 'OWNER' | 'TUTOR' | 'TEMPORARY_HOME'

export interface TutorshipRecord {
  id: string
  petId: string
  tutorType: TutorType
  personTutorId: string | null
  orgTutorId: string | null
  type: TutorshipType
  active: boolean
  startDate: Date
  endDate: Date | null
  transferNotes: string | null
  createdAt: Date
}

export interface CoTutorRecord {
  id: string
  petId: string
  tutorType: TutorType
  personTutorId: string | null
  orgTutorId: string | null
  name: string
  assignedAt: Date
}

export interface PetRecord {
  id: string
  name: string
  species: string
  breed: string | null
  gender: string | null
  castrated: boolean | null
  birthDate: Date | null
  photoUrl: string | null
  microchip: string | null
  notes: string | null
  createdAt: Date
  updatedAt: Date
  activeTutorship: TutorshipRecord | null
  coTutors: CoTutorRecord[]
}

export interface PetCreateInput {
  name: string
  species: string
  breed?: string
  gender?: string
  castrated?: boolean
  birthDate?: Date
  microchip?: string
  notes?: string
  tutorType: TutorType
  personTutorId?: string
  orgTutorId?: string
  tutorshipType: TutorshipType
}

// Simplified input for createForUser — tutor is derived from the authenticated user
export interface PetCreateForUserInput {
  name: string
  species: string
  breed?: string
  gender?: string
  castrated?: boolean
  birthDate?: Date
  microchip?: string
  notes?: string
  tutorshipType?: TutorshipType
}

export interface PetUpdateInput {
  name?: string
  species?: string
  breed?: string | null
  gender?: string | null
  castrated?: boolean | null
  birthDate?: Date | null
  microchip?: string | null
  notes?: string | null
}

export interface TransferTutorshipInput {
  tutorType: TutorType
  personCpf?: string        // CPF used to look up the new person tutor
  orgTutorId?: string
  tutorshipType: TutorshipType
  transferNotes?: string
}

// Resolved version used by the repository after CPF lookup
export interface TransferTutorshipRepoInput {
  tutorType: TutorType
  personTutorId?: string
  orgTutorId?: string
  tutorshipType: TutorshipType
  transferNotes?: string | null
}

export interface AddCoTutorInput {
  tutorType: TutorType
  personCpf?: string        // CPF used to look up the co-tutor person
  orgTutorId?: string
}

// Resolved version used by the repository after CPF lookup
export interface AddCoTutorRepoInput {
  tutorType: TutorType
  personTutorId?: string
  orgTutorId?: string
}
