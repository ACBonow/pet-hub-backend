/**
 * @module services-directory
 * @file servicesDirectory.service.test.ts
 * @description Unit tests for ServicesDirectoryService — repository is mocked.
 */

import type { IServicesDirectoryRepository } from '../servicesDirectory.repository'
import type { ServiceListing, PaginatedServiceListings } from '../servicesDirectory.types'
import { ServicesDirectoryService } from '../servicesDirectory.service'

// ─── Fixtures ────────────────────────────────────────────────────────────────

const MOCK_LISTING: ServiceListing = {
  id: 'svc-1',
  name: 'Clínica VetCare',
  type: 'CLINIC',
  description: 'Atendimento 24h',
  address: 'Rua das Flores, 100',
  phone: '11999999999',
  email: 'contato@vetcare.com',
  website: 'https://vetcare.com',
  organizationId: null,
  createdAt: new Date('2026-01-01'),
  updatedAt: new Date('2026-01-01'),
}

const MOCK_PAGINATED: PaginatedServiceListings = {
  data: [MOCK_LISTING],
  total: 1,
  page: 1,
  pageSize: 20,
}

// ─── Repo factory ─────────────────────────────────────────────────────────────

function makeRepo(
  overrides: Partial<IServicesDirectoryRepository> = {},
): jest.Mocked<IServicesDirectoryRepository> {
  return {
    create: jest.fn(),
    findById: jest.fn(),
    findAll: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    ...overrides,
  } as jest.Mocked<IServicesDirectoryRepository>
}

// ─── Tests ───────────────────────────────────────────────────────────────────

describe('ServicesDirectoryService', () => {
  let service: ServicesDirectoryService
  let repo: jest.Mocked<IServicesDirectoryRepository>

  beforeEach(() => {
    jest.clearAllMocks()
    repo = makeRepo()
    service = new ServicesDirectoryService(repo)
  })

  // ── create ────────────────────────────────────────────────────────────────

  describe('create', () => {
    it('should throw VALIDATION_ERROR when type is invalid', async () => {
      await expect(
        service.create({ name: 'Test', type: 'INVALID' as any }),
      ).rejects.toMatchObject({ statusCode: 400, code: 'VALIDATION_ERROR' })
    })

    it('should create and return a ServiceListing', async () => {
      repo.create.mockResolvedValueOnce(MOCK_LISTING)

      const result = await service.create({
        name: 'Clínica VetCare',
        type: 'CLINIC',
        description: 'Atendimento 24h',
      })

      expect(result).toEqual(MOCK_LISTING)
      expect(repo.create).toHaveBeenCalledWith(
        expect.objectContaining({ name: 'Clínica VetCare', type: 'CLINIC' }),
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
