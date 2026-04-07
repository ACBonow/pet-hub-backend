/**
 * @module lost-found
 * @file lost-found.service.test.ts
 * @description Unit tests for LostFoundService — repositories are mocked.
 */

import type { ILostFoundRepository } from '../lost-found.repository'
import type { IPetRepository } from '../../pet'
import type { IPersonRepository } from '../../person'
import type { IOrganizationRepository } from '../../organization'
import type { IFileStorage } from '../../../shared/storage/IFileStorage'
import { extractPathFromUrl } from '../../../shared/storage/IFileStorage'
import type { LostFoundReport } from '../lost-found.types'
import { LostFoundService } from '../lost-found.service'

// ─── Fixtures ────────────────────────────────────────────────────────────────

const MOCK_REPORT: LostFoundReport = {
  id: 'report-1',
  type: 'LOST',
  petId: 'pet-1',
  reporterId: 'person-1',
  petName: 'Rex',
  species: 'dog',
  description: 'Cachorro perdido no parque.',
  location: 'Parque Ibirapuera, São Paulo',
  addressStreet: null,
  addressNeighborhood: null,
  addressNumber: null,
  addressCep: null,
  addressCity: null,
  addressState: null,
  addressNotes: null,
  photoUrl: null,
  contactEmail: 'joao@example.com',
  contactPhone: '11 99999-0000',
  status: 'OPEN',
  organizationId: null,
  organization: null,
  createdAt: new Date('2026-03-01'),
  updatedAt: new Date('2026-03-01'),
}

const MOCK_PET = {
  id: 'pet-1',
  name: 'Rex',
  species: 'Cão',
  breed: null,
  gender: null,
  castrated: null,
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

const MOCK_ORG_REPORT: LostFoundReport = {
  ...MOCK_REPORT,
  organizationId: 'org-1',
  organization: { id: 'org-1', name: 'ONG Amigos dos Pets', photoUrl: null },
}

function makeLostFoundRepo(overrides: Partial<ILostFoundRepository> = {}): jest.Mocked<ILostFoundRepository> {
  return {
    create: jest.fn(),
    findById: jest.fn(),
    findAll: jest.fn(),
    update: jest.fn(),
    updateStatus: jest.fn(),
    updatePhotoUrl: jest.fn(),
    delete: jest.fn(),
    ...overrides,
  } as jest.Mocked<ILostFoundRepository>
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

const MOCK_ORG = {
  id: 'org-1',
  name: 'ONG Amigos dos Pets',
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
}

function makeOrgRepo(overrides: Partial<IOrganizationRepository> = {}): jest.Mocked<IOrganizationRepository> {
  return {
    create: jest.fn(),
    findById: jest.fn(),
    findByCnpj: jest.fn(),
    findByPersonId: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    addPerson: jest.fn(),
    removePerson: jest.fn(),
    personCount: jest.fn(),
    hasPerson: jest.fn(),
    getRole: jest.fn(),
    setRole: jest.fn(),
    countByRole: jest.fn(),
    findMembers: jest.fn(),
    findMembersWithNames: jest.fn(),
    updatePhotoUrl: jest.fn(),
    ...overrides,
  } as jest.Mocked<IOrganizationRepository>
}

// ─── Tests ───────────────────────────────────────────────────────────────────

describe('LostFoundService', () => {
  let service: LostFoundService
  let lostFoundRepo: jest.Mocked<ILostFoundRepository>
  let petRepo: jest.Mocked<IPetRepository>
  let personRepo: jest.Mocked<IPersonRepository>
  let orgRepo: jest.Mocked<IOrganizationRepository>
  let mockFileStorage: jest.Mocked<IFileStorage>

  beforeEach(() => {
    lostFoundRepo = makeLostFoundRepo()
    petRepo = makePetRepo()
    personRepo = makePersonRepo()
    orgRepo = makeOrgRepo()
    mockFileStorage = {
      upload: jest.fn(),
      delete: jest.fn(),
    }
    service = new LostFoundService(lostFoundRepo, petRepo, personRepo, orgRepo, mockFileStorage)
  })

  // ── createForUser ─────────────────────────────────────────────────────────

  describe('createForUser', () => {
    it('should throw NOT_FOUND when user has no person profile', async () => {
      personRepo.findByUserId.mockResolvedValueOnce(null)

      await expect(
        service.createForUser('user-1', {
          type: 'LOST',
          description: 'Cachorro perdido.',
          contactEmail: 'joao@example.com',
        }),
      ).rejects.toMatchObject({ statusCode: 404, code: 'NOT_FOUND' })
    })

    it('should throw NOT_FOUND when petId provided but pet does not exist', async () => {
      personRepo.findByUserId.mockResolvedValueOnce(MOCK_PERSON)
      petRepo.findById.mockResolvedValueOnce(null)

      await expect(
        service.createForUser('user-1', {
          type: 'LOST',
          petId: 'nonexistent',
          description: 'Cachorro perdido.',
          contactEmail: 'joao@example.com',
        }),
      ).rejects.toMatchObject({ statusCode: 404, code: 'NOT_FOUND' })
    })

    it('should create report without petId (unknown pet)', async () => {
      personRepo.findByUserId.mockResolvedValueOnce(MOCK_PERSON)
      const reportWithoutPet: LostFoundReport = { ...MOCK_REPORT, petId: null }
      lostFoundRepo.create.mockResolvedValueOnce(reportWithoutPet)

      const result = await service.createForUser('user-1', {
        type: 'FOUND',
        description: 'Encontrei um gato.',
        contactEmail: 'joao@example.com',
      })

      expect(result).toEqual(reportWithoutPet)
      expect(petRepo.findById).not.toHaveBeenCalled()
      expect(lostFoundRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({ reporterId: 'person-1', contactEmail: 'joao@example.com' }),
      )
    })

    it('should create report with petName, species, and phone', async () => {
      personRepo.findByUserId.mockResolvedValueOnce(MOCK_PERSON)
      petRepo.findById.mockResolvedValueOnce(MOCK_PET)
      lostFoundRepo.create.mockResolvedValueOnce(MOCK_REPORT)

      const result = await service.createForUser('user-1', {
        type: 'LOST',
        petId: 'pet-1',
        petName: 'Rex',
        species: 'dog',
        description: 'Cachorro perdido no parque.',
        contactEmail: 'joao@example.com',
        contactPhone: '11 99999-0000',
      })

      expect(result).toEqual(MOCK_REPORT)
      expect(lostFoundRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({
          reporterId: 'person-1',
          petName: 'Rex',
          species: 'dog',
          contactEmail: 'joao@example.com',
          contactPhone: '11 99999-0000',
        }),
      )
    })

    it('should create report without organizationId using personId as reporterId (existing behavior)', async () => {
      personRepo.findByUserId.mockResolvedValueOnce(MOCK_PERSON)
      lostFoundRepo.create.mockResolvedValueOnce({ ...MOCK_REPORT, reporterId: 'person-1' })

      const result = await service.createForUser('user-1', {
        type: 'FOUND',
        description: 'Encontrei um gato.',
        contactEmail: 'joao@example.com',
      })

      expect(orgRepo.findById).not.toHaveBeenCalled()
      expect(lostFoundRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({ reporterId: 'person-1', organizationId: undefined }),
      )
    })

    it('should create report with organizationId when user is OWNER', async () => {
      personRepo.findByUserId.mockResolvedValueOnce(MOCK_PERSON)
      orgRepo.findById.mockResolvedValueOnce(MOCK_ORG as any)
      orgRepo.getRole.mockResolvedValueOnce('OWNER')
      const reportWithOrg = { ...MOCK_REPORT, organizationId: 'org-1', organization: { id: 'org-1', name: 'ONG Amigos dos Pets', photoUrl: null } }
      lostFoundRepo.create.mockResolvedValueOnce(reportWithOrg)

      const result = await service.createForUser('user-1', {
        type: 'FOUND',
        description: 'Animal encontrado.',
        contactEmail: 'ong@example.com',
        organizationId: 'org-1',
      })

      expect(orgRepo.findById).toHaveBeenCalledWith('org-1')
      expect(orgRepo.getRole).toHaveBeenCalledWith('org-1', 'person-1')
      expect(lostFoundRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({ organizationId: 'org-1', reporterId: 'person-1' }),
      )
      expect(result.organizationId).toBe('org-1')
    })

    it('should create report with organizationId when user is MANAGER', async () => {
      personRepo.findByUserId.mockResolvedValueOnce(MOCK_PERSON)
      orgRepo.findById.mockResolvedValueOnce(MOCK_ORG as any)
      orgRepo.getRole.mockResolvedValueOnce('MANAGER')
      lostFoundRepo.create.mockResolvedValueOnce({ ...MOCK_REPORT, organizationId: 'org-1', organization: { id: 'org-1', name: 'ONG Amigos dos Pets', photoUrl: null } })

      await service.createForUser('user-1', {
        type: 'FOUND',
        description: 'Animal encontrado.',
        contactEmail: 'ong@example.com',
        organizationId: 'org-1',
      })

      expect(lostFoundRepo.create).toHaveBeenCalled()
    })

    it('should throw INSUFFICIENT_PERMISSION when user is MEMBER', async () => {
      personRepo.findByUserId.mockResolvedValueOnce(MOCK_PERSON)
      orgRepo.findById.mockResolvedValueOnce(MOCK_ORG as any)
      orgRepo.getRole.mockResolvedValueOnce('MEMBER')

      await expect(
        service.createForUser('user-1', {
          type: 'FOUND',
          description: 'Animal encontrado.',
          contactEmail: 'ong@example.com',
          organizationId: 'org-1',
        }),
      ).rejects.toMatchObject({ statusCode: 403, code: 'INSUFFICIENT_PERMISSION' })
    })

    it('should throw INSUFFICIENT_PERMISSION when user is not a member', async () => {
      personRepo.findByUserId.mockResolvedValueOnce(MOCK_PERSON)
      orgRepo.findById.mockResolvedValueOnce(MOCK_ORG as any)
      orgRepo.getRole.mockResolvedValueOnce(null)

      await expect(
        service.createForUser('user-1', {
          type: 'FOUND',
          description: 'Animal encontrado.',
          contactEmail: 'ong@example.com',
          organizationId: 'org-1',
        }),
      ).rejects.toMatchObject({ statusCode: 403, code: 'INSUFFICIENT_PERMISSION' })
    })

    it('should throw NOT_FOUND when organizationId does not exist', async () => {
      personRepo.findByUserId.mockResolvedValueOnce(MOCK_PERSON)
      orgRepo.findById.mockResolvedValueOnce(null)

      await expect(
        service.createForUser('user-1', {
          type: 'FOUND',
          description: 'Animal encontrado.',
          contactEmail: 'ong@example.com',
          organizationId: 'nonexistent-org',
        }),
      ).rejects.toMatchObject({ statusCode: 404, code: 'NOT_FOUND' })
    })
  })

  // ── findAll ───────────────────────────────────────────────────────────────

  describe('findAll', () => {
    it('should return reports with pagination metadata', async () => {
      lostFoundRepo.findAll.mockResolvedValueOnce({ reports: [MOCK_REPORT], total: 1 })

      const result = await service.findAll({ type: 'LOST', status: 'OPEN', page: 1, pageSize: 20 })

      expect(result.data).toHaveLength(1)
      expect(result.meta.total).toBe(1)
      expect(result.meta.page).toBe(1)
      expect(result.meta.pageSize).toBe(20)
      expect(result.meta.totalPages).toBe(1)
    })

    it('should apply default pagination when not provided', async () => {
      lostFoundRepo.findAll.mockResolvedValueOnce({ reports: [], total: 0 })

      const result = await service.findAll({})

      expect(result.meta.page).toBe(1)
      expect(result.meta.pageSize).toBe(20)
      expect(lostFoundRepo.findAll).toHaveBeenCalledWith(expect.objectContaining({ page: 1, pageSize: 20 }))
    })

    it('should pass organizationId filter to repository', async () => {
      lostFoundRepo.findAll.mockResolvedValueOnce({ reports: [], total: 0 })

      await service.findAll({ organizationId: 'org-1' })

      expect(lostFoundRepo.findAll).toHaveBeenCalledWith(expect.objectContaining({ organizationId: 'org-1' }))
    })
  })

  // ── findById ──────────────────────────────────────────────────────────────

  describe('findById', () => {
    it('should return report when found', async () => {
      lostFoundRepo.findById.mockResolvedValueOnce(MOCK_REPORT)

      const result = await service.findById('report-1')

      expect(result).toEqual(MOCK_REPORT)
    })

    it('should throw NOT_FOUND when report does not exist', async () => {
      lostFoundRepo.findById.mockResolvedValueOnce(null)

      await expect(service.findById('nonexistent')).rejects.toMatchObject({
        statusCode: 404,
        code: 'NOT_FOUND',
      })
    })
  })

  // ── updateStatus ──────────────────────────────────────────────────────────

  describe('updateStatus', () => {
    it('should throw NOT_FOUND when report does not exist', async () => {
      lostFoundRepo.findById.mockResolvedValueOnce(null)

      await expect(service.updateStatus('nonexistent', 'RESOLVED', 'user-1')).rejects.toMatchObject({
        statusCode: 404,
        code: 'NOT_FOUND',
      })
    })

    it('should throw INSUFFICIENT_PERMISSION when user has no person profile', async () => {
      lostFoundRepo.findById.mockResolvedValueOnce(MOCK_REPORT)
      personRepo.findByUserId.mockResolvedValueOnce(null)

      await expect(service.updateStatus('report-1', 'RESOLVED', 'user-x')).rejects.toMatchObject({
        statusCode: 403,
        code: 'INSUFFICIENT_PERMISSION',
      })
    })

    it('should throw INSUFFICIENT_PERMISSION when user is not the reporter', async () => {
      lostFoundRepo.findById.mockResolvedValueOnce(MOCK_REPORT) // reporterId: 'person-1'
      personRepo.findByUserId.mockResolvedValueOnce({ ...MOCK_PERSON, id: 'person-2' })

      await expect(service.updateStatus('report-1', 'RESOLVED', 'user-2')).rejects.toMatchObject({
        statusCode: 403,
        code: 'INSUFFICIENT_PERMISSION',
      })
    })

    it('should update status when user is the reporter', async () => {
      const updated: LostFoundReport = { ...MOCK_REPORT, status: 'RESOLVED' }
      lostFoundRepo.findById.mockResolvedValueOnce(MOCK_REPORT)
      personRepo.findByUserId.mockResolvedValueOnce(MOCK_PERSON)
      lostFoundRepo.updateStatus.mockResolvedValueOnce(updated)

      const result = await service.updateStatus('report-1', 'RESOLVED', 'user-1')

      expect(result.status).toBe('RESOLVED')
      expect(lostFoundRepo.updateStatus).toHaveBeenCalledWith('report-1', 'RESOLVED')
    })

    it('should update status when user is OWNER of the org that owns the report', async () => {
      const updated: LostFoundReport = { ...MOCK_ORG_REPORT, status: 'RESOLVED' }
      lostFoundRepo.findById.mockResolvedValueOnce(MOCK_ORG_REPORT)
      personRepo.findByUserId.mockResolvedValueOnce(MOCK_PERSON)
      orgRepo.getRole.mockResolvedValueOnce('OWNER')
      lostFoundRepo.updateStatus.mockResolvedValueOnce(updated)

      const result = await service.updateStatus('report-1', 'RESOLVED', 'user-1')

      expect(orgRepo.getRole).toHaveBeenCalledWith('org-1', 'person-1')
      expect(result.status).toBe('RESOLVED')
    })

    it('should update status when user is MANAGER of the org that owns the report', async () => {
      const updated: LostFoundReport = { ...MOCK_ORG_REPORT, status: 'RESOLVED' }
      lostFoundRepo.findById.mockResolvedValueOnce(MOCK_ORG_REPORT)
      personRepo.findByUserId.mockResolvedValueOnce(MOCK_PERSON)
      orgRepo.getRole.mockResolvedValueOnce('MANAGER')
      lostFoundRepo.updateStatus.mockResolvedValueOnce(updated)

      await service.updateStatus('report-1', 'RESOLVED', 'user-1')

      expect(lostFoundRepo.updateStatus).toHaveBeenCalled()
    })

    it('should throw INSUFFICIENT_PERMISSION when user is MEMBER of the org that owns the report', async () => {
      lostFoundRepo.findById.mockResolvedValueOnce(MOCK_ORG_REPORT)
      personRepo.findByUserId.mockResolvedValueOnce(MOCK_PERSON)
      orgRepo.getRole.mockResolvedValueOnce('MEMBER')

      await expect(service.updateStatus('report-1', 'RESOLVED', 'user-1')).rejects.toMatchObject({
        statusCode: 403,
        code: 'INSUFFICIENT_PERMISSION',
      })
    })

    it('should throw INSUFFICIENT_PERMISSION when user is not a member of the org that owns the report', async () => {
      lostFoundRepo.findById.mockResolvedValueOnce(MOCK_ORG_REPORT)
      personRepo.findByUserId.mockResolvedValueOnce(MOCK_PERSON)
      orgRepo.getRole.mockResolvedValueOnce(null)

      await expect(service.updateStatus('report-1', 'RESOLVED', 'user-1')).rejects.toMatchObject({
        statusCode: 403,
        code: 'INSUFFICIENT_PERMISSION',
      })
    })
  })

  // ── delete ────────────────────────────────────────────────────────────────

  describe('delete', () => {
    it('should throw NOT_FOUND when report does not exist', async () => {
      lostFoundRepo.findById.mockResolvedValueOnce(null)

      await expect(service.delete('nonexistent', 'user-1')).rejects.toMatchObject({
        statusCode: 404,
        code: 'NOT_FOUND',
      })
    })

    it('should throw INSUFFICIENT_PERMISSION when user has no person profile', async () => {
      lostFoundRepo.findById.mockResolvedValueOnce(MOCK_REPORT)
      personRepo.findByUserId.mockResolvedValueOnce(null)

      await expect(service.delete('report-1', 'user-x')).rejects.toMatchObject({
        statusCode: 403,
        code: 'INSUFFICIENT_PERMISSION',
      })
    })

    it('should throw INSUFFICIENT_PERMISSION when user is not the reporter', async () => {
      lostFoundRepo.findById.mockResolvedValueOnce(MOCK_REPORT)
      personRepo.findByUserId.mockResolvedValueOnce({ ...MOCK_PERSON, id: 'person-2' })

      await expect(service.delete('report-1', 'user-2')).rejects.toMatchObject({
        statusCode: 403,
        code: 'INSUFFICIENT_PERMISSION',
      })
    })

    it('should delete report when user is the reporter', async () => {
      lostFoundRepo.findById.mockResolvedValueOnce(MOCK_REPORT)
      personRepo.findByUserId.mockResolvedValueOnce(MOCK_PERSON)
      lostFoundRepo.delete.mockResolvedValueOnce(undefined)

      await service.delete('report-1', 'user-1')

      expect(lostFoundRepo.delete).toHaveBeenCalledWith('report-1')
    })

    it('should delete report when user is OWNER of the org that owns the report', async () => {
      lostFoundRepo.findById.mockResolvedValueOnce(MOCK_ORG_REPORT)
      personRepo.findByUserId.mockResolvedValueOnce(MOCK_PERSON)
      orgRepo.getRole.mockResolvedValueOnce('OWNER')
      lostFoundRepo.delete.mockResolvedValueOnce(undefined)

      await service.delete('report-1', 'user-1')

      expect(orgRepo.getRole).toHaveBeenCalledWith('org-1', 'person-1')
      expect(lostFoundRepo.delete).toHaveBeenCalledWith('report-1')
    })

    it('should delete report when user is MANAGER of the org that owns the report', async () => {
      lostFoundRepo.findById.mockResolvedValueOnce(MOCK_ORG_REPORT)
      personRepo.findByUserId.mockResolvedValueOnce(MOCK_PERSON)
      orgRepo.getRole.mockResolvedValueOnce('MANAGER')
      lostFoundRepo.delete.mockResolvedValueOnce(undefined)

      await service.delete('report-1', 'user-1')

      expect(lostFoundRepo.delete).toHaveBeenCalledWith('report-1')
    })

    it('should throw INSUFFICIENT_PERMISSION when user is MEMBER of the org that owns the report', async () => {
      lostFoundRepo.findById.mockResolvedValueOnce(MOCK_ORG_REPORT)
      personRepo.findByUserId.mockResolvedValueOnce(MOCK_PERSON)
      orgRepo.getRole.mockResolvedValueOnce('MEMBER')

      await expect(service.delete('report-1', 'user-1')).rejects.toMatchObject({
        statusCode: 403,
        code: 'INSUFFICIENT_PERMISSION',
      })
    })

    it('should throw INSUFFICIENT_PERMISSION when user is not a member of the org that owns the report', async () => {
      lostFoundRepo.findById.mockResolvedValueOnce(MOCK_ORG_REPORT)
      personRepo.findByUserId.mockResolvedValueOnce(MOCK_PERSON)
      orgRepo.getRole.mockResolvedValueOnce(null)

      await expect(service.delete('report-1', 'user-1')).rejects.toMatchObject({
        statusCode: 403,
        code: 'INSUFFICIENT_PERMISSION',
      })
    })
  })

  // ── uploadPhoto ───────────────────────────────────────────────────────────

  describe('uploadPhoto', () => {
    const FILE = Buffer.from('fake-jpeg')
    const MIME = 'image/jpeg'
    const PHOTO_URL = 'https://storage.example.com/lost-found-images/report-1/123.jpg'

    beforeEach(() => {
      jest.clearAllMocks()
    })

    it('should throw NOT_FOUND when report does not exist', async () => {
      lostFoundRepo.findById.mockResolvedValueOnce(null)

      await expect(service.uploadPhoto('nonexistent', FILE, MIME)).rejects.toMatchObject({
        statusCode: 404,
        code: 'NOT_FOUND',
      })
    })

    it('should upload file and update photoUrl', async () => {
      lostFoundRepo.findById
        .mockResolvedValueOnce(MOCK_REPORT)
        .mockResolvedValueOnce({ ...MOCK_REPORT, photoUrl: PHOTO_URL })
      mockFileStorage.upload.mockResolvedValueOnce(PHOTO_URL)
      lostFoundRepo.updatePhotoUrl.mockResolvedValueOnce(undefined)

      const result = await service.uploadPhoto('report-1', FILE, MIME)

      expect(mockFileStorage.upload).toHaveBeenCalledWith(
        'lost-found-images',
        expect.stringMatching(/^report-1\/\d+\.jpg$/),
        FILE,
        MIME,
      )
      expect(lostFoundRepo.updatePhotoUrl).toHaveBeenCalledWith('report-1', PHOTO_URL)
      expect(result.photoUrl).toBe(PHOTO_URL)
    })

    it('should delete old photo before uploading new one', async () => {
      const reportWithPhoto = { ...MOCK_REPORT, photoUrl: 'https://storage.example.com/lost-found-images/report-1/old.jpg' }
      lostFoundRepo.findById
        .mockResolvedValueOnce(reportWithPhoto)
        .mockResolvedValueOnce({ ...MOCK_REPORT, photoUrl: PHOTO_URL })
      mockFileStorage.delete.mockResolvedValueOnce(undefined)
      mockFileStorage.upload.mockResolvedValueOnce(PHOTO_URL)
      lostFoundRepo.updatePhotoUrl.mockResolvedValueOnce(undefined)

      await service.uploadPhoto('report-1', FILE, MIME)

      expect(mockFileStorage.delete).toHaveBeenCalledWith(
        'lost-found-images',
        extractPathFromUrl(reportWithPhoto.photoUrl, 'lost-found-images'),
      )
    })

    it('should continue upload even if old photo deletion fails', async () => {
      const reportWithPhoto = { ...MOCK_REPORT, photoUrl: 'https://storage.example.com/lost-found-images/report-1/old.jpg' }
      lostFoundRepo.findById
        .mockResolvedValueOnce(reportWithPhoto)
        .mockResolvedValueOnce({ ...MOCK_REPORT, photoUrl: PHOTO_URL })
      mockFileStorage.delete.mockRejectedValueOnce(new Error('Storage error'))
      mockFileStorage.upload.mockResolvedValueOnce(PHOTO_URL)
      lostFoundRepo.updatePhotoUrl.mockResolvedValueOnce(undefined)

      await expect(service.uploadPhoto('report-1', FILE, MIME)).resolves.toBeDefined()
      expect(mockFileStorage.upload).toHaveBeenCalled()
    })
  })

  // ── update ───────────────────────────────────────────────────────────────

  describe('update', () => {
    it('should throw NOT_FOUND when report does not exist', async () => {
      lostFoundRepo.findById.mockResolvedValueOnce(null)

      await expect(service.update('nonexistent', { description: 'novo' }, 'user-1')).rejects.toMatchObject({
        statusCode: 404,
        code: 'NOT_FOUND',
      })
    })

    it('should throw INSUFFICIENT_PERMISSION when user has no person profile', async () => {
      lostFoundRepo.findById.mockResolvedValueOnce(MOCK_REPORT)
      personRepo.findByUserId.mockResolvedValueOnce(null)

      await expect(service.update('report-1', { description: 'novo' }, 'user-x')).rejects.toMatchObject({
        statusCode: 403,
        code: 'INSUFFICIENT_PERMISSION',
      })
    })

    it('should throw INSUFFICIENT_PERMISSION when user is not the reporter', async () => {
      lostFoundRepo.findById.mockResolvedValueOnce(MOCK_REPORT)
      personRepo.findByUserId.mockResolvedValueOnce({ ...MOCK_PERSON, id: 'person-2' })

      await expect(service.update('report-1', { description: 'novo' }, 'user-2')).rejects.toMatchObject({
        statusCode: 403,
        code: 'INSUFFICIENT_PERMISSION',
      })
    })

    it('should throw INSUFFICIENT_PERMISSION when user is MEMBER of report org', async () => {
      lostFoundRepo.findById.mockResolvedValueOnce(MOCK_ORG_REPORT)
      personRepo.findByUserId.mockResolvedValueOnce(MOCK_PERSON)
      orgRepo.getRole.mockResolvedValueOnce('MEMBER')

      await expect(service.update('report-1', { description: 'novo' }, 'user-1')).rejects.toMatchObject({
        statusCode: 403,
        code: 'INSUFFICIENT_PERMISSION',
      })
    })

    it('should update report when user is the reporter', async () => {
      const updated: LostFoundReport = { ...MOCK_REPORT, description: 'Descrição atualizada', contactPhone: '11 98888-0000' }
      lostFoundRepo.findById.mockResolvedValueOnce(MOCK_REPORT)
      personRepo.findByUserId.mockResolvedValueOnce(MOCK_PERSON)
      lostFoundRepo.update.mockResolvedValueOnce(updated)

      const result = await service.update('report-1', { description: 'Descrição atualizada', contactPhone: '11 98888-0000' }, 'user-1')

      expect(result.description).toBe('Descrição atualizada')
      expect(result.contactPhone).toBe('11 98888-0000')
      expect(lostFoundRepo.update).toHaveBeenCalledWith('report-1', { description: 'Descrição atualizada', contactPhone: '11 98888-0000' })
    })

    it('should update report when user is MANAGER of report org', async () => {
      const updated: LostFoundReport = { ...MOCK_ORG_REPORT, petName: 'Novo nome' }
      lostFoundRepo.findById.mockResolvedValueOnce(MOCK_ORG_REPORT)
      personRepo.findByUserId.mockResolvedValueOnce(MOCK_PERSON)
      orgRepo.getRole.mockResolvedValueOnce('MANAGER')
      lostFoundRepo.update.mockResolvedValueOnce(updated)

      const result = await service.update('report-1', { petName: 'Novo nome' }, 'user-1')

      expect(result.petName).toBe('Novo nome')
    })
  })
})
