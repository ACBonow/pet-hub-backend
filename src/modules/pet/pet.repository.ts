/**
 * @module pet
 * @file pet.repository.ts
 * @description Repository interface and Prisma implementation for pet persistence.
 */

import { prisma } from '../../shared/config/database'
import type { Prisma } from '@prisma/client'
import { coTutorInclude, petListInclude, petDetailInclude, mapTutorship, mapCoTutor, mapPet } from './pet.mapper'
import type {
  AddCoTutorRepoInput,
  CoTutorRecord,
  PetCreateInput,
  PetRecord,
  PetUpdateInput,
  TransferTutorshipRepoInput,
  TutorshipRecord,
} from './pet.types'
import type { PaginatedResult, PaginationParams } from '../../shared/types/pagination'
import { buildPaginationMeta } from '../../shared/types/pagination'

export interface IPetRepository {
  create(data: PetCreateInput): Promise<PetRecord>
  findById(id: string): Promise<PetRecord | null>
  findByPersonId(personId: string): Promise<PetRecord[]>
  findByOrgId(orgId: string): Promise<PetRecord[]>
  update(id: string, data: PetUpdateInput): Promise<PetRecord>
  delete(id: string): Promise<void>
  updatePhotoUrl(id: string, photoUrl: string | null): Promise<void>
  transferTutorship(petId: string, data: TransferTutorshipRepoInput): Promise<TutorshipRecord>
  getTutorshipHistory(petId: string, params?: PaginationParams): Promise<PaginatedResult<TutorshipRecord>>
  findActiveTutorship(petId: string): Promise<TutorshipRecord | null>
  addCoTutor(petId: string, data: AddCoTutorRepoInput): Promise<CoTutorRecord>
  removeCoTutor(petId: string, coTutorId: string): Promise<void>
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
          castrated: data.castrated ?? null,
          birthDate: data.birthDate ?? null,
          microchip: data.microchip ?? null,
          notes: data.notes ?? null,
        },
        include: petListInclude,
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
    const pet = await prisma.pet.findFirst({ where: { id, deletedAt: null }, include: petDetailInclude })
    return pet ? mapPet(pet) : null
  }

  async findByPersonId(personId: string): Promise<PetRecord[]> {
    const pets = await prisma.pet.findMany({
      where: {
        deletedAt: null,
        tutorships: { some: { personTutorId: personId, active: true } },
      },
      include: petListInclude,
    })
    return pets.map(mapPet)
  }

  async findByOrgId(orgId: string): Promise<PetRecord[]> {
    const pets = await prisma.pet.findMany({
      where: {
        deletedAt: null,
        tutorships: { some: { orgTutorId: orgId, active: true } },
      },
      include: petListInclude,
    })
    return pets.map(mapPet)
  }

  async update(id: string, data: PetUpdateInput): Promise<PetRecord> {
    const pet = await prisma.pet.update({
      where: { id },
      data: {
        name: data.name,
        species: data.species,
        breed: data.breed,
        gender: data.gender,
        castrated: data.castrated,
        birthDate: data.birthDate,
        microchip: data.microchip,
        notes: data.notes,
      },
      include: petListInclude,
    })
    return mapPet(pet)
  }

  async delete(id: string): Promise<void> {
    await prisma.pet.update({ where: { id }, data: { deletedAt: new Date() } })
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

  async getTutorshipHistory(petId: string, params?: PaginationParams): Promise<PaginatedResult<TutorshipRecord>> {
    const page = params?.page ?? 1
    const pageSize = params?.pageSize ?? 20
    const skip = (page - 1) * pageSize

    const [total, tutorships] = await Promise.all([
      prisma.tutorship.count({ where: { petId } }),
      prisma.tutorship.findMany({
        where: { petId },
        orderBy: { startDate: 'desc' },
        skip,
        take: pageSize,
      }),
    ])

    return {
      data: tutorships.map(mapTutorship),
      meta: buildPaginationMeta(total, page, pageSize),
    }
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
      include: coTutorInclude,
    })
    return mapCoTutor(coTutor)
  }

  async removeCoTutor(petId: string, coTutorId: string): Promise<void> {
    await prisma.coTutor.delete({ where: { id: coTutorId, petId } })
  }
}
