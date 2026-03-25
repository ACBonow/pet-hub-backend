/**
 * @module pet
 * @file pet.repository.ts
 * @description Repository interface and Prisma implementation for pet persistence.
 */

import { prisma } from '../../shared/config/database'
import type { Prisma } from '@prisma/client'
import type {
  AddCoTutorRepoInput,
  CoTutorRecord,
  PetCreateInput,
  PetRecord,
  PetUpdateInput,
  TransferTutorshipRepoInput,
  TutorshipRecord,
} from './pet.types'

export interface IPetRepository {
  create(data: PetCreateInput): Promise<PetRecord>
  findById(id: string): Promise<PetRecord | null>
  update(id: string, data: PetUpdateInput): Promise<PetRecord>
  delete(id: string): Promise<void>
  updatePhotoUrl(id: string, photoUrl: string | null): Promise<void>
  transferTutorship(petId: string, data: TransferTutorshipRepoInput): Promise<TutorshipRecord>
  getTutorshipHistory(petId: string): Promise<TutorshipRecord[]>
  findActiveTutorship(petId: string): Promise<TutorshipRecord | null>
  addCoTutor(petId: string, data: AddCoTutorRepoInput): Promise<CoTutorRecord>
  removeCoTutor(petId: string, coTutorId: string): Promise<void>
}

const tutorshipInclude = {
  tutorships: { where: { active: true }, take: 1 },
  coTutors: true,
}

function mapTutorship(t: any): TutorshipRecord {
  return {
    id: t.id,
    petId: t.petId,
    tutorType: t.tutorType as 'PERSON' | 'ORGANIZATION',
    personTutorId: t.personTutorId,
    orgTutorId: t.orgTutorId,
    type: t.type as 'OWNER' | 'TUTOR' | 'TEMPORARY_HOME',
    active: t.active,
    startDate: t.startDate,
    endDate: t.endDate,
    transferNotes: t.transferNotes,
    createdAt: t.createdAt,
  }
}

function mapCoTutor(c: any): CoTutorRecord {
  return {
    id: c.id,
    petId: c.petId,
    tutorType: c.tutorType as 'PERSON' | 'ORGANIZATION',
    personTutorId: c.personTutorId,
    orgTutorId: c.orgTutorId,
    assignedAt: c.assignedAt,
  }
}

function mapPet(pet: any): PetRecord {
  return {
    id: pet.id,
    name: pet.name,
    species: pet.species,
    breed: pet.breed,
    gender: pet.gender,
    birthDate: pet.birthDate,
    photoUrl: pet.photoUrl,
    microchip: pet.microchip,
    notes: pet.notes,
    createdAt: pet.createdAt,
    updatedAt: pet.updatedAt,
    activeTutorship: pet.tutorships?.[0] ? mapTutorship(pet.tutorships[0]) : null,
    coTutors: (pet.coTutors ?? []).map(mapCoTutor),
  }
}

export class PrismaPetRepository implements IPetRepository {
  async create(data: PetCreateInput): Promise<PetRecord> {
    return prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      const pet = await tx.pet.create({
        data: {
          name: data.name,
          species: data.species,
          breed: data.breed ?? null,
          gender: data.gender ?? null,
          birthDate: data.birthDate ?? null,
          microchip: data.microchip ?? null,
          notes: data.notes ?? null,
        },
        include: tutorshipInclude,
      })

      const tutorship = await tx.tutorship.create({
        data: {
          petId: pet.id,
          tutorType: data.tutorType as any,
          personTutorId: data.personTutorId ?? null,
          orgTutorId: data.orgTutorId ?? null,
          type: data.tutorshipType as any,
          active: true,
        },
      })

      return mapPet({ ...pet, tutorships: [tutorship], coTutors: [] })
    })
  }

  async findById(id: string): Promise<PetRecord | null> {
    const pet = await prisma.pet.findUnique({ where: { id }, include: tutorshipInclude })
    return pet ? mapPet(pet) : null
  }

  async update(id: string, data: PetUpdateInput): Promise<PetRecord> {
    const pet = await prisma.pet.update({
      where: { id },
      data: {
        name: data.name,
        species: data.species,
        breed: data.breed,
        gender: data.gender,
        birthDate: data.birthDate,
        microchip: data.microchip,
        notes: data.notes,
      },
      include: tutorshipInclude,
    })
    return mapPet(pet)
  }

  async delete(id: string): Promise<void> {
    await prisma.pet.delete({ where: { id } })
  }

  async updatePhotoUrl(id: string, photoUrl: string | null): Promise<void> {
    await prisma.pet.update({ where: { id }, data: { photoUrl } })
  }

  async transferTutorship(petId: string, data: TransferTutorshipRepoInput): Promise<TutorshipRecord> {
    return prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      await tx.tutorship.updateMany({
        where: { petId, active: true },
        data: { active: false, endDate: new Date() },
      })

      const tutorship = await tx.tutorship.create({
        data: {
          petId,
          tutorType: data.tutorType as any,
          personTutorId: data.personTutorId ?? null,
          orgTutorId: data.orgTutorId ?? null,
          type: data.tutorshipType as any,
          active: true,
          transferNotes: data.transferNotes ?? null,
        },
      })

      return mapTutorship(tutorship)
    })
  }

  async getTutorshipHistory(petId: string): Promise<TutorshipRecord[]> {
    const tutorships = await prisma.tutorship.findMany({
      where: { petId },
      orderBy: { startDate: 'desc' },
    })
    return tutorships.map(mapTutorship)
  }

  async findActiveTutorship(petId: string): Promise<TutorshipRecord | null> {
    const tutorship = await prisma.tutorship.findFirst({
      where: { petId, active: true },
    })
    return tutorship ? mapTutorship(tutorship) : null
  }

  async addCoTutor(petId: string, data: AddCoTutorRepoInput): Promise<CoTutorRecord> {
    const coTutor = await prisma.coTutor.create({
      data: {
        petId,
        tutorType: data.tutorType as any,
        personTutorId: data.personTutorId ?? null,
        orgTutorId: data.orgTutorId ?? null,
      },
    })
    return mapCoTutor(coTutor)
  }

  async removeCoTutor(petId: string, coTutorId: string): Promise<void> {
    await prisma.coTutor.delete({ where: { id: coTutorId, petId } })
  }
}
