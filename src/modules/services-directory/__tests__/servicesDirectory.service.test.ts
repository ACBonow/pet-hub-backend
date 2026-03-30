/**
 * @module services-directory
 * @file servicesDirectory.service.test.ts
 * @description Unit tests for ServicesDirectoryService — repository is mocked.
 */

import type { IServicesDirectoryRepository, IServiceTypeRepository } from '../servicesDirectory.repository'
import type { ServiceListing, ServiceTypeRecord, PaginatedServiceListings } from '../servicesDirectory.types'
import { ServicesDirectoryService } from '../servicesDirectory.service'
import type { IPersonRepository } from '../../person'
import type { IOrganizationRepository } from '../../organization'

jest.mock('../../../shared/utils/storage', () => ({
  uploadFile: jest.fn().mockResolvedValue('https://cdn.example.com/service-images/svc-1/123.jpg'),
  deleteFile: jest.fn().mockResolvedValue(undefined),
  extractPathFromUrl: jest.fn().mockReturnValue('svc-1/old.jpg'),
}))

// ─── Fixtures ────────────────────────────────────────────────────────────────

const MOCK_SERVICE_TYPE: ServiceTypeRecord = {
  id: 'type-1',
  code: 'CLINIC',
  label: 'Clínica',
  color: 'bg-green-100 text-green-800',
  active: true,
  sortOrder: 2,
}

const MOCK_LISTING: ServiceListing = {
  id: 'svc-1',
  name: 'Clínica VetCare',
  serviceTypeId: 'type-1',
  serviceType: MOCK_SERVICE_TYPE,
  description: 'Atendimento 24h',
  zipCode: null,
  street: null,
  number: null,
  complement: null,
  neighborhood: null,
  city: null,
  state: null,
  phone: '11999999999',
  whatsapp: null,
  email: 'contato@vetcare.com',
  website: 'https://vetcare.com',
  instagram: null,
  facebook: null,
  tiktok: null,
  youtube: null,
  googleMapsUrl: null,
  googleBusinessUrl: null,
  organizationId: null,
  photoUrl: null,
  createdByUserId: 'user-1',
  createdAt: new Date('2026-01-01'),
  updatedAt: new Date('2026-01-01'),
}

const MOCK_PERSON = { id: 'person-1', userId: 'user-1', name: 'Test', cpf: '00000000000', phone: null, createdAt: new Date(), updatedAt: new Date() }

const MOCK_PAGINATED: PaginatedServiceListings = {
  data: [MOCK_LISTING],
  total: 1,
  page: 1,
  pageSize: 20,
}

// ─── Repo factories ───────────────────────────────────────────────────────────

function makeRepo(
  overrides: Partial<IServicesDirectoryRepository> = {},
): jest.Mocked<IServicesDirectoryRepository> {
  return {
    create: jest.fn(),
    findById: jest.fn(),
    findAll: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    updatePhotoUrl: jest.fn(),
    ...overrides,
  } as jest.Mocked<IServicesDirectoryRepository>
}

function makePersonRepo(
  overrides: Partial<IPersonRepository> = {},
): jest.Mocked<IPersonRepository> {
  return {
    create: jest.fn(),
    findById: jest.fn(),
    findByCpf: jest.fn(),
    findByUserId: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    ...overrides,
  } as jest.Mocked<IPersonRepository>
}

function makeOrgRepo(
  overrides: Partial<IOrganizationRepository> = {},
): jest.Mocked<IOrganizationRepository> {
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
    updatePhotoUrl: jest.fn(),
    ...overrides,
  } as jest.Mocked<IOrganizationRepository>
}

function makeTypeRepo(
  overrides: Partial<IServiceTypeRepository> = {},
): jest.Mocked<IServiceTypeRepository> {
  return {
    findAll: jest.fn(),
    findByCode: jest.fn(),
    ...overrides,
  } as jest.Mocked<IServiceTypeRepository>
}

// ─── Tests ───────────────────────────────────────────────────────────────────

describe('ServicesDirectoryService', () => {
  let service: ServicesDirectoryService
  let repo: jest.Mocked<IServicesDirectoryRepository>
  let typeRepo: jest.Mocked<IServiceTypeRepository>

  beforeEach(() => {
    jest.clearAllMocks()
    repo = makeRepo()
    typeRepo = makeTypeRepo()
    service = new ServicesDirectoryService(repo, typeRepo)
  })

  // ── listTypes ─────────────────────────────────────────────────────────────

  describe('listTypes', () => {
    it('should return all active service types', async () => {
      typeRepo.findAll.mockResolvedValueOnce([MOCK_SERVICE_TYPE])

      const result = await service.listTypes()

      expect(result).toHaveLength(1)
      expect(result[0].code).toBe('CLINIC')
      expect(typeRepo.findAll).toHaveBeenCalledTimes(1)
    })
  })

  // ── create ────────────────────────────────────────────────────────────────

  describe('create', () => {
    it('should throw VALIDATION_ERROR when type code is not found', async () => {
      typeRepo.findByCode.mockResolvedValueOnce(null)

      await expect(
        service.create({ name: 'Test', type: 'INVALID' }),
      ).rejects.toMatchObject({ statusCode: 400, code: 'VALIDATION_ERROR' })
    })

    it('should create and return a ServiceListing', async () => {
      typeRepo.findByCode.mockResolvedValueOnce(MOCK_SERVICE_TYPE)
      repo.create.mockResolvedValueOnce(MOCK_LISTING)

      const result = await service.create({
        name: 'Clínica VetCare',
        type: 'CLINIC',
        description: 'Atendimento 24h',
      })

      expect(result).toEqual(MOCK_LISTING)
      expect(typeRepo.findByCode).toHaveBeenCalledWith('CLINIC')
      expect(repo.create).toHaveBeenCalledWith(
        expect.objectContaining({ name: 'Clínica VetCare', serviceTypeId: 'type-1' }),
      )
    })
  })

  // ── findAll ───────────────────────────────────────────────────────────────

  describe('findAll', () => {
    it('should return paginated listings filtered by type', async () => {
      repo.findAll.mockResolvedValueOnce(MOCK_PAGINATED)

      const result = await service.findAll({ type: 'CLINIC', page: 1, pageSize: 20 })

      expect(result.data).toHaveLength(1)
      expect(result.total).toBe(1)
      expect(repo.findAll).toHaveBeenCalledWith(
        expect.objectContaining({ type: 'CLINIC' }),
      )
    })

    it('should return paginated listings filtered by name', async () => {
      repo.findAll.mockResolvedValueOnce(MOCK_PAGINATED)

      const result = await service.findAll({ name: 'VetCare' })

      expect(result.data[0].name).toBe('Clínica VetCare')
      expect(repo.findAll).toHaveBeenCalledWith(
        expect.objectContaining({ name: 'VetCare' }),
      )
    })
  })

  // ── findById ──────────────────────────────────────────────────────────────

  describe('findById', () => {
    it('should return the listing when found', async () => {
      repo.findById.mockResolvedValueOnce(MOCK_LISTING)

      const result = await service.findById('svc-1')

      expect(result).toEqual(MOCK_LISTING)
    })

    it('should throw NOT_FOUND when listing does not exist', async () => {
      repo.findById.mockResolvedValueOnce(null)

      await expect(service.findById('nonexistent')).rejects.toMatchObject({
        statusCode: 404,
        code: 'NOT_FOUND',
      })
    })
  })

  // ── update ────────────────────────────────────────────────────────────────

  describe('update', () => {
    it('should throw NOT_FOUND when listing does not exist', async () => {
      repo.findById.mockResolvedValueOnce(null)

      await expect(service.update('nonexistent', { name: 'Novo Nome' })).rejects.toMatchObject({
        statusCode: 404,
        code: 'NOT_FOUND',
      })
    })

    it('should update and return the updated listing', async () => {
      const updated = { ...MOCK_LISTING, name: 'VetCare Plus' }
      repo.findById.mockResolvedValueOnce(MOCK_LISTING)
      repo.update.mockResolvedValueOnce(updated)

      const result = await service.update('svc-1', { name: 'VetCare Plus' })

      expect(result.name).toBe('VetCare Plus')
      expect(repo.update).toHaveBeenCalledWith('svc-1', expect.objectContaining({ name: 'VetCare Plus' }))
    })

    it('should throw VALIDATION_ERROR when updating to invalid type', async () => {
      repo.findById.mockResolvedValueOnce(MOCK_LISTING)
      typeRepo.findByCode.mockResolvedValueOnce(null)

      await expect(service.update('svc-1', { type: 'INVALID' })).rejects.toMatchObject({
        statusCode: 400,
        code: 'VALIDATION_ERROR',
      })
    })
  })

  // ── delete ────────────────────────────────────────────────────────────────

  describe('delete', () => {
    it('should throw NOT_FOUND when listing does not exist', async () => {
      repo.findById.mockResolvedValueOnce(null)

      await expect(service.delete('nonexistent')).rejects.toMatchObject({
        statusCode: 404,
        code: 'NOT_FOUND',
      })
    })

    it('should delete the listing', async () => {
      repo.findById.mockResolvedValueOnce(MOCK_LISTING)
      repo.delete.mockResolvedValueOnce(undefined)

      await service.delete('svc-1')

      expect(repo.delete).toHaveBeenCalledWith('svc-1')
    })
  })
})

// ─── uploadPhoto tests ────────────────────────────────────────────────────────

describe('ServicesDirectoryService.uploadPhoto', () => {
  const fakeBuffer = Buffer.from('fake-image')
  const fakeMime = 'image/jpeg'

  it('should throw NOT_FOUND when service does not exist', async () => {
    const repo = makeRepo({ findById: jest.fn().mockResolvedValueOnce(null) })
    const typeRepo = makeTypeRepo()
    const service = new ServicesDirectoryService(repo, typeRepo)

    await expect(service.uploadPhoto('nonexistent', 'user-1', fakeBuffer, fakeMime)).rejects.toMatchObject({
      statusCode: 404,
      code: 'NOT_FOUND',
    })
  })

  it('should throw INSUFFICIENT_PERMISSION when personal service creator mismatch', async () => {
    const personalService = { ...MOCK_LISTING, organizationId: null, createdByUserId: 'other-user' }
    const repo = makeRepo({ findById: jest.fn().mockResolvedValueOnce(personalService) })
    const typeRepo = makeTypeRepo()
    const service = new ServicesDirectoryService(repo, typeRepo)

    await expect(service.uploadPhoto('svc-1', 'user-1', fakeBuffer, fakeMime)).rejects.toMatchObject({
      statusCode: 403,
      code: 'INSUFFICIENT_PERMISSION',
    })
  })

  it('should upload photo for creator of personal service', async () => {
    const personalService = { ...MOCK_LISTING, organizationId: null, createdByUserId: 'user-1', photoUrl: null }
    const updatedService = { ...personalService, photoUrl: 'https://cdn.example.com/service-images/svc-1/123.jpg' }
    const repo = makeRepo({
      findById: jest.fn()
        .mockResolvedValueOnce(personalService)
        .mockResolvedValueOnce(updatedService),
      updatePhotoUrl: jest.fn().mockResolvedValueOnce(undefined),
    })
    const typeRepo = makeTypeRepo()
    const service = new ServicesDirectoryService(repo, typeRepo)

    const result = await service.uploadPhoto('svc-1', 'user-1', fakeBuffer, fakeMime)

    expect(result.photoUrl).toBe('https://cdn.example.com/service-images/svc-1/123.jpg')
    expect(repo.updatePhotoUrl).toHaveBeenCalledWith('svc-1', expect.any(String))
  })

  it('should delete old photo before uploading new one for personal service', async () => {
    const personalService = { ...MOCK_LISTING, organizationId: null, createdByUserId: 'user-1', photoUrl: 'https://cdn.example.com/service-images/svc-1/old.jpg' }
    const updatedService = { ...personalService, photoUrl: 'https://cdn.example.com/service-images/svc-1/123.jpg' }
    const { deleteFile } = require('../../../shared/utils/storage')
    const repo = makeRepo({
      findById: jest.fn()
        .mockResolvedValueOnce(personalService)
        .mockResolvedValueOnce(updatedService),
      updatePhotoUrl: jest.fn().mockResolvedValueOnce(undefined),
    })
    const typeRepo = makeTypeRepo()
    const service = new ServicesDirectoryService(repo, typeRepo)

    await service.uploadPhoto('svc-1', 'user-1', fakeBuffer, fakeMime)

    expect(deleteFile).toHaveBeenCalledWith('service-images', expect.any(String))
  })

  it('should throw INSUFFICIENT_PERMISSION when org service user is MEMBER', async () => {
    const orgService = { ...MOCK_LISTING, organizationId: 'org-1', createdByUserId: 'user-1' }
    const repo = makeRepo({ findById: jest.fn().mockResolvedValueOnce(orgService) })
    const typeRepo = makeTypeRepo()
    const personRepo = makePersonRepo({ findByUserId: jest.fn().mockResolvedValueOnce(MOCK_PERSON) })
    const orgRepo = makeOrgRepo({ getRole: jest.fn().mockResolvedValueOnce('MEMBER') })
    const service = new ServicesDirectoryService(repo, typeRepo, personRepo, orgRepo)

    await expect(service.uploadPhoto('svc-1', 'user-1', fakeBuffer, fakeMime)).rejects.toMatchObject({
      statusCode: 403,
      code: 'INSUFFICIENT_PERMISSION',
    })
  })

  it('should upload photo for OWNER of org service', async () => {
    const orgService = { ...MOCK_LISTING, organizationId: 'org-1', createdByUserId: 'user-1', photoUrl: null }
    const updatedService = { ...orgService, photoUrl: 'https://cdn.example.com/service-images/svc-1/123.jpg' }
    const repo = makeRepo({
      findById: jest.fn()
        .mockResolvedValueOnce(orgService)
        .mockResolvedValueOnce(updatedService),
      updatePhotoUrl: jest.fn().mockResolvedValueOnce(undefined),
    })
    const typeRepo = makeTypeRepo()
    const personRepo = makePersonRepo({ findByUserId: jest.fn().mockResolvedValueOnce(MOCK_PERSON) })
    const orgRepo = makeOrgRepo({ getRole: jest.fn().mockResolvedValueOnce('OWNER') })
    const service = new ServicesDirectoryService(repo, typeRepo, personRepo, orgRepo)

    const result = await service.uploadPhoto('svc-1', 'user-1', fakeBuffer, fakeMime)

    expect(result.photoUrl).toBe('https://cdn.example.com/service-images/svc-1/123.jpg')
  })
})
