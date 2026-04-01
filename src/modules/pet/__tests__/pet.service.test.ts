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

jest.mock('../../../shared/utils/storage', () => ({
  uploadFile: jest.fn(),
  deleteFile: jest.fn(),
  extractPathFromUrl: jest.fn(),
}))
import * as storage from '../../../shared/utils/storage'

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
  castrated: null,
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
  website: null,
  instagram: null,
  photoUrl: null,
  address: null,
  addressStreet: null,
  addressNeighborhood: null,
  addressNumber: null,
  addressCep: null,
  addressCity: null,
  addressState: null,
  createdAt: new Date('2026-01-01'),
  updatedAt: new Date('2026-01-01'),
  responsiblePersons: [],
}

function makePetRepo(overrides: Partial<IPetRepository> = {}): jest.Mocked<IPetRepository> {
  return {
    create: jest.fn(),
    findById: jest.fn(),
    findByPersonId: jest.fn(),
    findByOrgId: jest.fn(),
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
    getRole: jest.fn(),
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

  // ── createForUser ─────────────────────────────────────────────────────────

  describe('createForUser', () => {
    it('should throw NOT_FOUND when user has no person profile', async () => {
      personRepo.findByUserId.mockResolvedValueOnce(null)

      await expect(
        service.createForUser('user-1', { name: 'Rex', species: 'Cão' }),
      ).rejects.toMatchObject({ statusCode: 404, code: 'NOT_FOUND' })
    })

    it('should create pet with logged-in user person as tutor', async () => {
      personRepo.findByUserId.mockResolvedValueOnce(MOCK_PERSON)
      petRepo.create.mockResolvedValueOnce(MOCK_PET)

      const result = await service.createForUser('user-1', { name: 'Rex', species: 'Cão' })

      expect(result).toEqual(MOCK_PET)
      expect(petRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({
          tutorType: 'PERSON',
          personTutorId: 'person-1',
          tutorshipType: 'OWNER',
        }),
      )
    })

    it('should use provided tutorshipType when specified', async () => {
      personRepo.findByUserId.mockResolvedValueOnce(MOCK_PERSON)
      petRepo.create.mockResolvedValueOnce(MOCK_PET)

      await service.createForUser('user-1', { name: 'Rex', species: 'Cão', tutorshipType: 'TEMPORARY_HOME' })

      expect(petRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({ tutorshipType: 'TEMPORARY_HOME' }),
      )
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

      await expect(service.update('nonexistent', { name: 'Rex II' }, 'user-1')).rejects.toMatchObject({
        statusCode: 404,
        code: 'NOT_FOUND',
      })
    })

    it('should throw INSUFFICIENT_PERMISSION when user is not primary tutor', async () => {
      petRepo.findById.mockResolvedValueOnce(MOCK_PET)
      personRepo.findByUserId.mockResolvedValueOnce({ ...MOCK_PERSON, id: 'person-2' })

      await expect(service.update('pet-1', { name: 'Rex II' }, 'user-2')).rejects.toMatchObject({
        statusCode: 403,
        code: 'INSUFFICIENT_PERMISSION',
      })
    })

    it('should throw INSUFFICIENT_PERMISSION when user has no person profile', async () => {
      petRepo.findById.mockResolvedValueOnce(MOCK_PET)
      personRepo.findByUserId.mockResolvedValueOnce(null)

      await expect(service.update('pet-1', { name: 'Rex II' }, 'user-x')).rejects.toMatchObject({
        statusCode: 403,
        code: 'INSUFFICIENT_PERMISSION',
      })
    })

    it('should update and return pet when user is primary tutor', async () => {
      const updated = { ...MOCK_PET, name: 'Rex II' }
      petRepo.findById.mockResolvedValueOnce(MOCK_PET)
      personRepo.findByUserId.mockResolvedValueOnce(MOCK_PERSON)
      petRepo.update.mockResolvedValueOnce(updated)

      const result = await service.update('pet-1', { name: 'Rex II' }, 'user-1')

      expect(result.name).toBe('Rex II')
    })
  })

  // ── delete ────────────────────────────────────────────────────────────────

  describe('delete', () => {
    it('should throw NOT_FOUND when pet does not exist', async () => {
      petRepo.findById.mockResolvedValueOnce(null)

      await expect(service.delete('nonexistent', 'user-1')).rejects.toMatchObject({
        statusCode: 404,
        code: 'NOT_FOUND',
      })
    })

    it('should throw INSUFFICIENT_PERMISSION when user is not primary tutor', async () => {
      petRepo.findById.mockResolvedValueOnce(MOCK_PET)
      personRepo.findByUserId.mockResolvedValueOnce({ ...MOCK_PERSON, id: 'person-2' })

      await expect(service.delete('pet-1', 'user-2')).rejects.toMatchObject({
        statusCode: 403,
        code: 'INSUFFICIENT_PERMISSION',
      })
    })

    it('should delete pet when user is primary tutor', async () => {
      petRepo.findById.mockResolvedValueOnce(MOCK_PET)
      personRepo.findByUserId.mockResolvedValueOnce(MOCK_PERSON)
      petRepo.delete.mockResolvedValueOnce(undefined)

      await service.delete('pet-1', 'user-1')

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
          personCpf: '52998224725',
          tutorshipType: 'OWNER',
        }),
      ).rejects.toMatchObject({ statusCode: 404, code: 'NOT_FOUND' })
    })

    it('should throw TUTOR_REQUIRED when personCpf not provided for PERSON tutor', async () => {
      petRepo.findById.mockResolvedValueOnce(MOCK_PET)

      await expect(
        service.transferTutorship('pet-1', {
          tutorType: 'PERSON',
          tutorshipType: 'OWNER',
        }),
      ).rejects.toMatchObject({ statusCode: 400, code: 'TUTOR_REQUIRED' })
    })

    it('should throw NOT_FOUND when new person tutor CPF does not exist', async () => {
      petRepo.findById.mockResolvedValueOnce(MOCK_PET)
      personRepo.findByCpf.mockResolvedValueOnce(null)

      await expect(
        service.transferTutorship('pet-1', {
          tutorType: 'PERSON',
          personCpf: '52998224725',
          tutorshipType: 'OWNER',
        }),
      ).rejects.toMatchObject({ statusCode: 404, code: 'NOT_FOUND' })
    })

    it('should create new active tutorship using CPF-resolved person id', async () => {
      const newTutorship: TutorshipRecord = {
        ...MOCK_ACTIVE_TUTORSHIP,
        id: 'tutorship-2',
        personTutorId: 'person-2',
        startDate: new Date('2026-03-01'),
      }
      petRepo.findById.mockResolvedValueOnce(MOCK_PET)
      personRepo.findByCpf.mockResolvedValueOnce({ ...MOCK_PERSON, id: 'person-2', cpf: '07493124050' })
      petRepo.transferTutorship.mockResolvedValueOnce(newTutorship)

      const result = await service.transferTutorship('pet-1', {
        tutorType: 'PERSON',
        personCpf: '07493124050',
        tutorshipType: 'OWNER',
      })

      expect(result).toEqual(newTutorship)
      expect(personRepo.findByCpf).toHaveBeenCalledWith('07493124050')
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
        service.addCoTutor('nonexistent', { tutorType: 'PERSON', personCpf: '52998224725' }),
      ).rejects.toMatchObject({ statusCode: 404, code: 'NOT_FOUND' })
    })

    it('should throw TUTOR_REQUIRED when personCpf not provided for PERSON type', async () => {
      petRepo.findById.mockResolvedValueOnce(MOCK_PET)

      await expect(
        service.addCoTutor('pet-1', { tutorType: 'PERSON' }),
      ).rejects.toMatchObject({ statusCode: 400, code: 'TUTOR_REQUIRED' })
    })

    it('should throw NOT_FOUND when co-tutor CPF does not exist', async () => {
      petRepo.findById.mockResolvedValueOnce(MOCK_PET)
      personRepo.findByCpf.mockResolvedValueOnce(null)

      await expect(
        service.addCoTutor('pet-1', { tutorType: 'PERSON', personCpf: '52998224725' }),
      ).rejects.toMatchObject({ statusCode: 404, code: 'NOT_FOUND' })
    })

    it('should throw TUTOR_CONFLICT when co-tutor is same as active primary tutor', async () => {
      // MOCK_PET has activeTutorship.personTutorId = 'person-1'
      petRepo.findById.mockResolvedValueOnce(MOCK_PET)
      personRepo.findByCpf.mockResolvedValueOnce(MOCK_PERSON) // resolves to person-1

      await expect(
        service.addCoTutor('pet-1', { tutorType: 'PERSON', personCpf: '52998224725' }),
      ).rejects.toMatchObject({ statusCode: 409, code: 'TUTOR_CONFLICT' })
    })

    it('should add co-tutor using CPF-resolved person id', async () => {
      const coTutor: CoTutorRecord = {
        id: 'co-1',
        petId: 'pet-1',
        tutorType: 'PERSON',
        personTutorId: 'person-2',
        orgTutorId: null,
        assignedAt: new Date(),
      }
      petRepo.findById.mockResolvedValueOnce(MOCK_PET)
      personRepo.findByCpf.mockResolvedValueOnce({ ...MOCK_PERSON, id: 'person-2', cpf: '07493124050' })
      petRepo.addCoTutor.mockResolvedValueOnce(coTutor)

      const result = await service.addCoTutor('pet-1', { tutorType: 'PERSON', personCpf: '07493124050' })

      expect(result).toEqual(coTutor)
      expect(personRepo.findByCpf).toHaveBeenCalledWith('07493124050')
      expect(petRepo.addCoTutor).toHaveBeenCalledWith('pet-1', expect.objectContaining({
        personTutorId: 'person-2',
      }))
    })
  })

  // ── findByUser ────────────────────────────────────────────────────────────

  describe('findByUser', () => {
    it('should throw NOT_FOUND when user has no person profile', async () => {
      personRepo.findByUserId.mockResolvedValueOnce(null)

      await expect(service.findByUser('user-1')).rejects.toMatchObject({
        statusCode: 404,
        code: 'NOT_FOUND',
      })
    })

    it('should return list of pets for the user', async () => {
      personRepo.findByUserId.mockResolvedValueOnce(MOCK_PERSON)
      petRepo.findByPersonId.mockResolvedValueOnce([MOCK_PET])

      const result = await service.findByUser('user-1')

      expect(result).toEqual([MOCK_PET])
      expect(petRepo.findByPersonId).toHaveBeenCalledWith('person-1')
    })

    it('should return empty list when user has no pets', async () => {
      personRepo.findByUserId.mockResolvedValueOnce(MOCK_PERSON)
      petRepo.findByPersonId.mockResolvedValueOnce([])

      const result = await service.findByUser('user-1')

      expect(result).toEqual([])
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

  // ── findByOrg ─────────────────────────────────────────────────────────────

  describe('findByOrg', () => {
    it('should throw NOT_FOUND when user has no person profile', async () => {
      personRepo.findByUserId.mockResolvedValueOnce(null)

      await expect(service.findByOrg('org-1', 'user-1')).rejects.toMatchObject({
        statusCode: 404,
        code: 'NOT_FOUND',
      })
    })

    it('should throw INSUFFICIENT_PERMISSION when user is not a member of the org', async () => {
      personRepo.findByUserId.mockResolvedValueOnce(MOCK_PERSON)
      orgRepo.getRole.mockResolvedValueOnce(null)

      await expect(service.findByOrg('org-1', 'user-1')).rejects.toMatchObject({
        statusCode: 403,
        code: 'INSUFFICIENT_PERMISSION',
      })
    })

    it('should return pets when user is a MEMBER', async () => {
      personRepo.findByUserId.mockResolvedValueOnce(MOCK_PERSON)
      orgRepo.getRole.mockResolvedValueOnce('MEMBER' as any)
      petRepo.findByOrgId.mockResolvedValueOnce([MOCK_PET])

      const result = await service.findByOrg('org-1', 'user-1')

      expect(result).toEqual([MOCK_PET])
      expect(petRepo.findByOrgId).toHaveBeenCalledWith('org-1')
    })

    it('should return pets when user is OWNER', async () => {
      personRepo.findByUserId.mockResolvedValueOnce(MOCK_PERSON)
      orgRepo.getRole.mockResolvedValueOnce('OWNER' as any)
      petRepo.findByOrgId.mockResolvedValueOnce([MOCK_PET])

      const result = await service.findByOrg('org-1', 'user-1')

      expect(result).toHaveLength(1)
    })

    it('should return empty list when org has no pets', async () => {
      personRepo.findByUserId.mockResolvedValueOnce(MOCK_PERSON)
      orgRepo.getRole.mockResolvedValueOnce('MANAGER' as any)
      petRepo.findByOrgId.mockResolvedValueOnce([])

      const result = await service.findByOrg('org-1', 'user-1')

      expect(result).toEqual([])
    })
  })

  // ── uploadPhoto ───────────────────────────────────────────────────────────

  describe('uploadPhoto', () => {
    const FILE = Buffer.from('fake-jpeg')
    const MIME = 'image/jpeg'
    const PHOTO_URL = 'https://storage.example.com/pet-images/pet-1/123.jpg'

    beforeEach(() => {
      jest.clearAllMocks()
    })

    it('should throw NOT_FOUND when pet does not exist', async () => {
      petRepo.findById.mockResolvedValueOnce(null)

      await expect(service.uploadPhoto('nonexistent', FILE, MIME)).rejects.toMatchObject({
        statusCode: 404,
        code: 'NOT_FOUND',
      })
    })

    it('should upload file and update photoUrl', async () => {
      petRepo.findById
        .mockResolvedValueOnce(MOCK_PET)
        .mockResolvedValueOnce({ ...MOCK_PET, photoUrl: PHOTO_URL })
      ;(storage.uploadFile as jest.Mock).mockResolvedValueOnce(PHOTO_URL)
      petRepo.updatePhotoUrl.mockResolvedValueOnce(undefined)

      const result = await service.uploadPhoto('pet-1', FILE, MIME)

      expect(storage.uploadFile).toHaveBeenCalledWith(
        'pet-images',
        expect.stringMatching(/^pet-1\/\d+\.jpg$/),
        FILE,
        MIME,
      )
      expect(petRepo.updatePhotoUrl).toHaveBeenCalledWith('pet-1', PHOTO_URL)
      expect(result.photoUrl).toBe(PHOTO_URL)
    })

    it('should delete old photo before uploading new one', async () => {
      const petWithPhoto = { ...MOCK_PET, photoUrl: 'https://storage.example.com/pet-images/pet-1/old.jpg' }
      petRepo.findById
        .mockResolvedValueOnce(petWithPhoto)
        .mockResolvedValueOnce({ ...MOCK_PET, photoUrl: PHOTO_URL })
      ;(storage.extractPathFromUrl as jest.Mock).mockReturnValueOnce('pet-1/old.jpg')
      ;(storage.deleteFile as jest.Mock).mockResolvedValueOnce(undefined)
      ;(storage.uploadFile as jest.Mock).mockResolvedValueOnce(PHOTO_URL)
      petRepo.updatePhotoUrl.mockResolvedValueOnce(undefined)

      await service.uploadPhoto('pet-1', FILE, MIME)

      expect(storage.extractPathFromUrl).toHaveBeenCalledWith(petWithPhoto.photoUrl, 'pet-images')
      expect(storage.deleteFile).toHaveBeenCalledWith('pet-images', 'pet-1/old.jpg')
    })

    it('should continue upload even if old photo deletion fails', async () => {
      const petWithPhoto = { ...MOCK_PET, photoUrl: 'https://storage.example.com/pet-images/pet-1/old.jpg' }
      petRepo.findById
        .mockResolvedValueOnce(petWithPhoto)
        .mockResolvedValueOnce({ ...MOCK_PET, photoUrl: PHOTO_URL })
      ;(storage.extractPathFromUrl as jest.Mock).mockReturnValueOnce('pet-1/old.jpg')
      ;(storage.deleteFile as jest.Mock).mockRejectedValueOnce(new Error('Storage error'))
      ;(storage.uploadFile as jest.Mock).mockResolvedValueOnce(PHOTO_URL)
      petRepo.updatePhotoUrl.mockResolvedValueOnce(undefined)

      await expect(service.uploadPhoto('pet-1', FILE, MIME)).resolves.toBeDefined()
      expect(storage.uploadFile).toHaveBeenCalled()
    })

    it('should use correct extension for png files', async () => {
      petRepo.findById
        .mockResolvedValueOnce(MOCK_PET)
        .mockResolvedValueOnce({ ...MOCK_PET, photoUrl: PHOTO_URL })
      ;(storage.uploadFile as jest.Mock).mockResolvedValueOnce(PHOTO_URL)
      petRepo.updatePhotoUrl.mockResolvedValueOnce(undefined)

      await service.uploadPhoto('pet-1', FILE, 'image/png')

      expect(storage.uploadFile).toHaveBeenCalledWith(
        'pet-images',
        expect.stringMatching(/^pet-1\/\d+\.png$/),
        FILE,
        'image/png',
      )
    })
  })
})
