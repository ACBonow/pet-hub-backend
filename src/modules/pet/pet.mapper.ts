/**
 * @module pet
 * @file pet.mapper.ts
 * @description Maps Prisma Pet, Tutorship, and CoTutor payloads to domain types.
 */

import type { Tutorship, Prisma } from '@prisma/client'
import type { CoTutorRecord, PetRecord, TutorshipRecord } from './pet.types'

export const coTutorInclude = {
  personTutor: { select: { name: true } },
  orgTutor: { select: { name: true } },
} as const

export const tutorshipInclude = {
  tutorships: { where: { active: true }, take: 1 },
  coTutors: { include: coTutorInclude },
} as const

export type PrismaCoTutorWithName = Prisma.CoTutorGetPayload<{
  include: typeof coTutorInclude
}>

export type PrismaPetWithRelations = Prisma.PetGetPayload<{
  include: {
    tutorships: true
    coTutors: { include: typeof coTutorInclude }
  }
}>

export function mapTutorship(t: Tutorship): TutorshipRecord {
  return {
    id: t.id,
    petId: t.petId,
    tutorType: t.tutorType as 'PERSON' | 'ORGANIZATION',
    personTutorId: t.personTutorId,
    orgTutorId: t.orgTutorId,
    type: t.type as 'OWNER' | 'TUTOR' | 'TEMPORARY_HOME',
    active: t.active,
    startDate: t.startDate,
    endDate: t.endDate ?? null,
    transferNotes: t.transferNotes ?? null,
    createdAt: t.createdAt,
  }
}

export function mapCoTutor(c: PrismaCoTutorWithName): CoTutorRecord {
  const name: string = c.personTutor?.name ?? c.orgTutor?.name ?? ''
  return {
    id: c.id,
    petId: c.petId,
    tutorType: c.tutorType as 'PERSON' | 'ORGANIZATION',
    personTutorId: c.personTutorId,
    orgTutorId: c.orgTutorId,
    name,
    assignedAt: c.assignedAt,
  }
}

export function mapPet(pet: PrismaPetWithRelations): PetRecord {
  return {
    id: pet.id,
    name: pet.name,
    species: pet.species,
    breed: pet.breed,
    gender: pet.gender,
    castrated: pet.castrated ?? null,
    birthDate: pet.birthDate,
    photoUrl: pet.photoUrl,
    microchip: pet.microchip,
    notes: pet.notes,
    createdAt: pet.createdAt,
    updatedAt: pet.updatedAt,
    activeTutorship: pet.tutorships?.[0] ? mapTutorship(pet.tutorships[0]) : null,
    coTutors: pet.coTutors.map(mapCoTutor),
  }
}
