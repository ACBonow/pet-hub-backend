/**
 * @module adoption
 * @file adoption.service.test.ts
 * @description Unit tests for AdoptionService — repositories are mocked.
 */

import type { IAdoptionRepository } from '../adoption.repository'
import type { IPetRepository } from '../../pet'
import type { IPersonRepository } from '../../person'
import type { IOrganizationRepository } from '../../organization'
import type { AdoptionListingRecord } from '../adoption.types'
import { AdoptionService } from '../adoption.service'

// ─── Fixtures ────────────────────────────────────────────────────────────────

const MOCK_LISTING: AdoptionListingRecord = {
  id: 'listing-1',
  petId: 'pet-1',
  listerType: 'PERSON',
  personId: 'person-1',
  organizationId: null,
  description: 'Cachorro amigável procura lar.',
  status: 'AVAILABLE',
  createdAt: new Date('2026-03-01'),
  updatedAt: new Date('2026-03-01'),
}

const MOCK_PET = {
  id: 'pet-1',
  name: 'Rex',
  species: 'Cão',
  breed: null,
  gender: null,
  birthDate: null,
  photoUrl: null,
  microchip: null,
  notes: null,
  createdAt: new Date('2026-01-01'),
  updatedAt: new Date('2026-01-01'),
  activeTutorship: null,
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

function makeAdoptionRepo(overrides: Partial<IAdoptionRepository> = {}): jest.Mocked<IAdoptionRepository> {
  return {
    create: jest.fn(),
    findById: jest.fn(),
    findByPetId: jest.fn(),
    findAll: jest.fn(),
    updateStatus: jest.fn(),
    delete: jest.fn(),
    ...overrides,
  } as jest.Mocked<IAdoptionRepository>
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

describe('AdoptionService', () => {
  let service: AdoptionService
  let adoptionRepo: jest.Mocked<IAdoptionRepository>
  let petRepo: jest.Mocked<IPetRepository>
  let personRepo: jest.Mocked<IPersonRepository>
  let orgRepo: jest.Mocked<IOrganizationRepository>

  beforeEach(() => {
    adoptionRepo = makeAdoptionRepo()
    petRepo = makePetRepo()
    personRepo = makePersonRepo()
    orgRepo = makeOrgRepo()
    service = new AdoptionService(adoptionRepo, petRepo, personRepo, orgRepo)
  })

  // ── create ────────────────────────────────────────────────────────────────

  describe('create', () => {
    it('should throw NOT_FOUND when pet does not exist', async () => {
      petRepo.findById.mockResolvedValueOnce(null)

      await expect(
        service.create({ petId: 'nonexistent', listerType: 'PERSON', personId: 'person-1' }),
      ).rejects.toMatchObject({ statusCode: 404, code: 'NOT_FOUND' })
    })

    it('should throw ALREADY_EXISTS when pet already has an active listing', async () => {
      petRepo.findById.mockResolvedValueOnce(MOCK_PET)
      adoptionRepo.findByPetId.mockResolvedValueOnce(MOCK_LISTING)

      await expect(
        service.create({ petId: 'pet-1', listerType: 'PERSON', personId: 'person-1' }),
      ).rejects.toMatchObject({ statusCode: 409, code: 'ALREADY_EXISTS' })
    })

    it('should throw LISTER_REQUIRED when personId not provided for PERSON listerType', async () => {
      petRepo.findById.mockResolvedValueOnce(MOCK_PET)
      adoptionRepo.findByPetId.mockResolvedValueOnce(null)

      await expect(
        service.create({ petId: 'pet-1', listerType: 'PERSON' }),
      ).rejects.toMatchObject({ statusCode: 400, code: 'LISTER_REQUIRED' })
    })

    it('should throw NOT_FOUND when person lister does not exist', async () => {
      petRepo.findById.mockResolvedValueOnce(MOCK_PET)
      adoptionRepo.findByPetId.mockResolvedValueOnce(null)
      personRepo.findById.mockResolvedValueOnce(null)

      await expect(
        service.create({ petId: 'pet-1', listerType: 'PERSON', personId: 'nonexistent' }),
      ).rejects.toMatchObject({ statusCode: 404, code: 'NOT_FOUND' })
    })

    it('should throw LISTER_REQUIRED when organizationId not provided for ORGANIZATION listerType', async () => {
      petRepo.findById.mockResolvedValueOnce(MOCK_PET)
      adoptionRepo.findByPetId.mockResolvedValueOnce(null)

      await expect(
        service.create({ petId: 'pet-1', listerType: 'ORGANIZATION' }),
      ).rejects.toMatchObject({ statusCode: 400, code: 'LISTER_REQUIRED' })
    })

    it('should throw NOT_FOUND when organization lister does not exist', async () => {
      petRepo.findById.mockResolvedValueOnce(MOCK_PET)
      adoptionRepo.findByPetId.mockResolvedValueOnce(null)
      orgRepo.findById.mockResolvedValueOnce(null)

      await expect(
        service.create({ petId: 'pet-1', listerType: 'ORGANIZATION', organizationId: 'nonexistent' }),
      ).rejects.toMatchObject({ statusCode: 404, code: 'NOT_FOUND' })
    })

    it('should create listing when all inputs are valid (PERSON)', async () => {
      petRepo.findById.mockResolvedValueOnce(MOCK_PET)
      adoptionRepo.findByPetId.mockResolvedValueOnce(null)
      personRepo.findById.mockResolvedValueOnce(MOCK_PERSON)
      adoptionRepo.create.mockResolvedValueOnce(MOCK_LISTING)

      const result = await service.create({ petId: 'pet-1', listerType: 'PERSON', personId: 'person-1' })

      expect(result).toEqual(MOCK_LISTING)
      expect(adoptionRepo.create).toHaveBeenCalledTimes(1)
    })

    it('should create listing when all inputs are valid (ORGANIZATION)', async () => {
      const orgListing: AdoptionListingRecord = {
        ...MOCK_LISTING,
        listerType: 'ORGANIZATION',
        personId: null,
        organizationId: 'org-1',
      }
      petRepo.findById.mockResolvedValueOnce(MOCK_PET)
      adoptionRepo.findByPetId.mockResolvedValueOnce(null)
      orgRepo.findById.mockResolvedValueOnce(MOCK_ORG)
      adoptionRepo.create.mockResolvedValueOnce(orgListing)

      const result = await service.create({ petId: 'pet-1', listerType: 'ORGANIZATION', organizationId: 'org-1' })

      expect(result).toEqual(orgListing)
      expect(adoptionRepo.create).toHaveBeenCalledTimes(1)
    })
  })

  // ── findAll ───────────────────────────────────────────────────────────────

  describe('findAll', () => {
    it('should return listings with pagination metadata', async () => {
      adoptionRepo.findAll.mockResolvedValueOnce({ listings: [MOCK_LISTING], total: 1 })

      const result = await service.findAll({ status: 'AVAILABLE', page: 1, pageSize: 20 })

      expect(result.data).toHaveLength(1)
      expect(result.total).toBe(1)
      expect(result.page).toBe(1)
      expect(result.pageSize).toBe(20)
    })

    it('should return all listings when no status filter applied', async () => {
      adoptionRepo.findAll.mockResolvedValueOnce({ listings: [MOCK_LISTING], total: 1 })

      const result = await service.findAll({})

      expect(result.data).toHaveLength(1)
      expect(adoptionRepo.findAll).toHaveBeenCalledWith(expect.objectContaining({ page: 1, pageSize: 20 }))
    })
  })

  // ── findById ──────────────────────────────────────────────────────────────

  describe('findById', () => {
    it('should return listing when found', async () => {
      adoptionRepo.findById.mockResolvedValueOnce(MOCK_LISTING)

      const result = await service.findById('listing-1')

      expect(result).toEqual(MOCK_LISTING)
    })

    it('should throw NOT_FOUND when listing does not exist', async () => {
      adoptionRepo.findById.mockResolvedValueOnce(null)

      await expect(service.findById('nonexistent')).rejects.toMatchObject({
        statusCode: 404,
        code: 'NOT_FOUND',
      })
    })
  })

  // ── updateStatus ──────────────────────────────────────────────────────────

  describe('updateStatus', () => {
    it('should throw NOT_FOUND when listing does not exist', async () => {
      adoptionRepo.findById.mockResolvedValueOnce(null)

      await expect(service.updateStatus('nonexistent', 'RESERVED')).rejects.toMatchObject({
        statusCode: 404,
        code: 'NOT_FOUND',
      })
    })

    it('should update status and return updated listing', async () => {
      const updated: AdoptionListingRecord = { ...MOCK_LISTING, status: 'RESERVED' }
      adoptionRepo.findById.mockResolvedValueOnce(MOCK_LISTING)
      adoptionRepo.updateStatus.mockResolvedValueOnce(updated)

      const result = await service.updateStatus('listing-1', 'RESERVED')

      expect(result.status).toBe('RESERVED')
      expect(adoptionRepo.updateStatus).toHaveBeenCalledWith('listing-1', 'RESERVED')
    })
  })

  // ── delete ────────────────────────────────────────────────────────────────

  describe('delete', () => {
    it('should throw NOT_FOUND when listing does not exist', async () => {
      adoptionRepo.findById.mockResolvedValueOnce(null)

      await expect(service.delete('nonexistent')).rejects.toMatchObject({
        statusCode: 404,
        code: 'NOT_FOUND',
      })
    })

    it('should delete listing when found', async () => {
      adoptionRepo.findById.mockResolvedValueOnce(MOCK_LISTING)
      adoptionRepo.delete.mockResolvedValueOnce(undefined)

      await service.delete('listing-1')

      expect(adoptionRepo.delete).toHaveBeenCalledWith('listing-1')
    })
  })
})
