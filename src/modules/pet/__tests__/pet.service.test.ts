/**
 * @module pet
 * @file pet.service.test.ts
 * @description Unit tests for PetService — repositories are mocked.
 */

import type { IPetRepository } from '../pet.repository'
import type { IPersonRepository } from '../../person'
import type { IOrganizationRepository } from '../../organization'
import type { PetRecord, TutorshipRecord, CoTutorRecord } from '../pet.types'
import { PetService } from '../pet.service'

// ─── Fixtures ────────────────────────────────────────────────────────────────

const MOCK_ACTIVE_TUTORSHIP: TutorshipRecord = {
  id: 'tutorship-1',
  petId: 'pet-1',
  tutorType: 'PERSON',
  personTutorId: 'person-1',
  orgTutorId: null,
  type: 'OWNER',
  active: true,
  startDate: new Date('2026-01-01'),
  endDate: null,
  transferNotes: null,
  createdAt: new Date('2026-01-01'),
}

const MOCK_PET: PetRecord = {
  id: 'pet-1',
  name: 'Rex',
  species: 'Cão',
  breed: 'Labrador',
  gender: 'M',
  birthDate: new Date('2022-01-01'),
  photoUrl: null,
  microchip: null,
  notes: null,
  createdAt: new Date('2026-01-01'),
  updatedAt: new Date('2026-01-01'),
  activeTutorship: MOCK_ACTIVE_TUTORSHIP,
  coTutors: [],
}

const MOCK_PERSON = {
  id: 'person-1',
  userId: 'user-1',
  name: 'João Silva',
  cpf: '52998224725',
  phone: null,
  createdAt: new Date('2026-01-01'),
  updatedAt: new Date('2026-01-01'),
}

const MOCK_ORG = {
  id: 'org-1',
  name: 'Pet Rescue ONG',
  type: 'NGO' as const,
  cnpj: null,
  description: null,
  phone: null,
  email: null,
  address: null,
  createdAt: new Date('2026-01-01'),
  updatedAt: new Date('2026-01-01'),
  responsiblePersons: [],
}

function makePetRepo(overrides: Partial<IPetRepository> = {}): jest.Mocked<IPetRepository> {
  return {
    create: jest.fn(),
    findById: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    updatePhotoUrl: jest.fn(),
    transferTutorship: jest.fn(),
    getTutorshipHistory: jest.fn(),
    findActiveTutorship: jest.fn(),
    addCoTutor: jest.fn(),
    removeCoTutor: jest.fn(),
    ...overrides,
  } as jest.Mocked<IPetRepository>
}

function makePersonRepo(overrides: Partial<IPersonRepository> = {}): jest.Mocked<IPersonRepository> {
  return {
    create: jest.fn(),
    findById: jest.fn(),
    findByUserId: jest.fn(),
    findByCpf: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    ...overrides,
  } as jest.Mocked<IPersonRepository>
}

function makeOrgRepo(overrides: Partial<IOrganizationRepository> = {}): jest.Mocked<IOrganizationRepository> {
  return {
    create: jest.fn(),
    findById: jest.fn(),
    findByCnpj: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    addPerson: jest.fn(),
    removePerson: jest.fn(),
    personCount: jest.fn(),
    ...overrides,
  } as jest.Mocked<IOrganizationRepository>
}

// ─── Tests ───────────────────────────────────────────────────────────────────

describe('PetService', () => {
  let service: PetService
  let petRepo: jest.Mocked<IPetRepository>
  let personRepo: jest.Mocked<IPersonRepository>
  let orgRepo: jest.Mocked<IOrganizationRepository>

  beforeEach(() => {
    petRepo = makePetRepo()
    personRepo = makePersonRepo()
    orgRepo = makeOrgRepo()
    service = new PetService(petRepo, personRepo, orgRepo)
  })

  // ── create ────────────────────────────────────────────────────────────────

  describe('create', () => {
    it('should throw TUTOR_REQUIRED when personTutorId not provided for PERSON tutor', async () => {
      await expect(
        service.create({
          name: 'Rex',
          species: 'Cão',
          tutorType: 'PERSON',
          tutorshipType: 'OWNER',
        }),
      ).rejects.toMatchObject({ statusCode: 400, code: 'TUTOR_REQUIRED' })
    })

    it('should throw NOT_FOUND when person tutor does not exist', async () => {
      personRepo.findById.mockResolvedValueOnce(null)

      await expect(
        service.create({
          name: 'Rex',
          species: 'Cão',
          tutorType: 'PERSON',
          personTutorId: 'nonexistent',
          tutorshipType: 'OWNER',
        }),
      ).rejects.toMatchObject({ statusCode: 404, code: 'NOT_FOUND' })
    })

    it('should throw NOT_FOUND when org tutor does not exist', async () => {
      orgRepo.findById.mockResolvedValueOnce(null)

      await expect(
        service.create({
          name: 'Rex',
          species: 'Cão',
          tutorType: 'ORGANIZATION',
          orgTutorId: 'nonexistent',
          tutorshipType: 'TUTOR',
        }),
      ).rejects.toMatchObject({ statusCode: 404, code: 'NOT_FOUND' })
    })

    it('should create pet with active tutorship on valid PERSON input', async () => {
      personRepo.findById.mockResolvedValueOnce(MOCK_PERSON)
      petRepo.create.mockResolvedValueOnce(MOCK_PET)

      const result = await service.create({
        name: 'Rex',
        species: 'Cão',
        tutorType: 'PERSON',
        personTutorId: 'person-1',
        tutorshipType: 'OWNER',
      })

      expect(result).toEqual(MOCK_PET)
      expect(petRepo.create).toHaveBeenCalledTimes(1)
      expect(result.activeTutorship).not.toBeNull()
    })

    it('should create pet with active tutorship on valid ORGANIZATION input', async () => {
      orgRepo.findById.mockResolvedValueOnce(MOCK_ORG)
      const petWithOrgTutor: PetRecord = {
        ...MOCK_PET,
        activeTutorship: {
          ...MOCK_ACTIVE_TUTORSHIP,
          tutorType: 'ORGANIZATION',
          personTutorId: null,
          orgTutorId: 'org-1',
        },
      }
      petRepo.create.mockResolvedValueOnce(petWithOrgTutor)

      const result = await service.create({
        name: 'Rex',
        species: 'Cão',
        tutorType: 'ORGANIZATION',
        orgTutorId: 'org-1',
        tutorshipType: 'TUTOR',
      })

      expect(result).toEqual(petWithOrgTutor)
      expect(petRepo.create).toHaveBeenCalledTimes(1)
    })
  })

  // ── findById ──────────────────────────────────────────────────────────────

  describe('findById', () => {
    it('should return pet with active tutorship when found', async () => {
      petRepo.findById.mockResolvedValueOnce(MOCK_PET)

      const result = await service.findById('pet-1')

      expect(result).toEqual(MOCK_PET)
      expect(result.activeTutorship).not.toBeNull()
    })

    it('should throw NOT_FOUND when pet does not exist', async () => {
      petRepo.findById.mockResolvedValueOnce(null)

      await expect(service.findById('nonexistent')).rejects.toMatchObject({
        statusCode: 404,
        code: 'NOT_FOUND',
      })
    })
  })

  // ── update ────────────────────────────────────────────────────────────────

  describe('update', () => {
    it('should throw NOT_FOUND when pet does not exist', async () => {
      petRepo.findById.mockResolvedValueOnce(null)

      await expect(service.update('nonexistent', { name: 'Rex II' })).rejects.toMatchObject({
        statusCode: 404,
        code: 'NOT_FOUND',
      })
    })

    it('should update and return pet', async () => {
      const updated = { ...MOCK_PET, name: 'Rex II' }
      petRepo.findById.mockResolvedValueOnce(MOCK_PET)
      petRepo.update.mockResolvedValueOnce(updated)

      const result = await service.update('pet-1', { name: 'Rex II' })

      expect(result.name).toBe('Rex II')
    })
  })

  // ── delete ────────────────────────────────────────────────────────────────

  describe('delete', () => {
    it('should throw NOT_FOUND when pet does not exist', async () => {
      petRepo.findById.mockResolvedValueOnce(null)

      await expect(service.delete('nonexistent')).rejects.toMatchObject({
        statusCode: 404,
        code: 'NOT_FOUND',
      })
    })

    it('should delete pet when found', async () => {
      petRepo.findById.mockResolvedValueOnce(MOCK_PET)
      petRepo.delete.mockResolvedValueOnce(undefined)

      await service.delete('pet-1')

      expect(petRepo.delete).toHaveBeenCalledWith('pet-1')
    })
  })

  // ── transferTutorship ─────────────────────────────────────────────────────

  describe('transferTutorship', () => {
    it('should throw NOT_FOUND when pet does not exist', async () => {
      petRepo.findById.mockResolvedValueOnce(null)

      await expect(
        service.transferTutorship('nonexistent', {
          tutorType: 'PERSON',
          personTutorId: 'person-1',
          tutorshipType: 'OWNER',
        }),
      ).rejects.toMatchObject({ statusCode: 404, code: 'NOT_FOUND' })
    })

    it('should throw NOT_FOUND when new person tutor does not exist', async () => {
      petRepo.findById.mockResolvedValueOnce(MOCK_PET)
      personRepo.findById.mockResolvedValueOnce(null)

      await expect(
        service.transferTutorship('pet-1', {
          tutorType: 'PERSON',
          personTutorId: 'nonexistent',
          tutorshipType: 'OWNER',
        }),
      ).rejects.toMatchObject({ statusCode: 404, code: 'NOT_FOUND' })
    })

    it('should create new active tutorship and deactivate old one', async () => {
      const newTutorship: TutorshipRecord = {
        ...MOCK_ACTIVE_TUTORSHIP,
        id: 'tutorship-2',
        personTutorId: 'person-2',
        startDate: new Date('2026-03-01'),
      }
      petRepo.findById.mockResolvedValueOnce(MOCK_PET)
      personRepo.findById.mockResolvedValueOnce({ ...MOCK_PERSON, id: 'person-2' })
      petRepo.transferTutorship.mockResolvedValueOnce(newTutorship)

      const result = await service.transferTutorship('pet-1', {
        tutorType: 'PERSON',
        personTutorId: 'person-2',
        tutorshipType: 'OWNER',
      })

      expect(result).toEqual(newTutorship)
      expect(petRepo.transferTutorship).toHaveBeenCalledWith('pet-1', expect.objectContaining({
        personTutorId: 'person-2',
      }))
    })
  })

  // ── getTutorshipHistory ───────────────────────────────────────────────────

  describe('getTutorshipHistory', () => {
    it('should throw NOT_FOUND when pet does not exist', async () => {
      petRepo.findById.mockResolvedValueOnce(null)

      await expect(service.getTutorshipHistory('nonexistent')).rejects.toMatchObject({
        statusCode: 404,
        code: 'NOT_FOUND',
      })
    })

    it('should return tutorship history for existing pet', async () => {
      const history: TutorshipRecord[] = [
        { ...MOCK_ACTIVE_TUTORSHIP, id: 'tutorship-2', active: false, endDate: new Date() },
        MOCK_ACTIVE_TUTORSHIP,
      ]
      petRepo.findById.mockResolvedValueOnce(MOCK_PET)
      petRepo.getTutorshipHistory.mockResolvedValueOnce(history)

      const result = await service.getTutorshipHistory('pet-1')

      expect(result).toHaveLength(2)
    })
  })

  // ── addCoTutor ────────────────────────────────────────────────────────────

  describe('addCoTutor', () => {
    it('should throw NOT_FOUND when pet does not exist', async () => {
      petRepo.findById.mockResolvedValueOnce(null)

      await expect(
        service.addCoTutor('nonexistent', { tutorType: 'PERSON', personTutorId: 'person-2' }),
      ).rejects.toMatchObject({ statusCode: 404, code: 'NOT_FOUND' })
    })

    it('should throw TUTOR_CONFLICT when co-tutor is same as active primary tutor', async () => {
      petRepo.findById.mockResolvedValueOnce(MOCK_PET) // active tutorship has personTutorId: 'person-1'
      personRepo.findById.mockResolvedValueOnce(MOCK_PERSON)

      await expect(
        service.addCoTutor('pet-1', { tutorType: 'PERSON', personTutorId: 'person-1' }),
      ).rejects.toMatchObject({ statusCode: 409, code: 'TUTOR_CONFLICT' })
    })

    it('should add co-tutor when valid', async () => {
      const coTutor: CoTutorRecord = {
        id: 'co-1',
        petId: 'pet-1',
        tutorType: 'PERSON',
        personTutorId: 'person-2',
        orgTutorId: null,
        assignedAt: new Date(),
      }
      petRepo.findById.mockResolvedValueOnce(MOCK_PET)
      personRepo.findById.mockResolvedValueOnce({ ...MOCK_PERSON, id: 'person-2' })
      petRepo.addCoTutor.mockResolvedValueOnce(coTutor)

      const result = await service.addCoTutor('pet-1', { tutorType: 'PERSON', personTutorId: 'person-2' })

      expect(result).toEqual(coTutor)
      expect(petRepo.addCoTutor).toHaveBeenCalledWith('pet-1', expect.objectContaining({
        personTutorId: 'person-2',
      }))
    })
  })

  // ── removeCoTutor ─────────────────────────────────────────────────────────

  describe('removeCoTutor', () => {
    it('should throw NOT_FOUND when pet does not exist', async () => {
      petRepo.findById.mockResolvedValueOnce(null)

      await expect(service.removeCoTutor('nonexistent', 'co-1')).rejects.toMatchObject({
        statusCode: 404,
        code: 'NOT_FOUND',
      })
    })

    it('should remove co-tutor when pet exists', async () => {
      petRepo.findById.mockResolvedValueOnce(MOCK_PET)
      petRepo.removeCoTutor.mockResolvedValueOnce(undefined)

      await service.removeCoTutor('pet-1', 'co-1')

      expect(petRepo.removeCoTutor).toHaveBeenCalledWith('pet-1', 'co-1')
    })
  })
})
