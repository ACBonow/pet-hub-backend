/**
 * @module services-directory
 * @file servicesDirectory.repository.test.ts
 * @description Unit tests for PrismaServicesDirectoryRepository — verifies soft-delete behavior.
 */

jest.mock('../../../shared/config/database', () => ({
  prisma: {
    serviceListing: {
      create: jest.fn(),
      findFirst: jest.fn(),
      findUnique: jest.fn(),
      findMany: jest.fn(),
      count: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    serviceType: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
    },
  },
}))

import { prisma } from '../../../shared/config/database'
import { PrismaServicesDirectoryRepository } from '../servicesDirectory.repository'

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('PrismaServicesDirectoryRepository (soft-delete)', () => {
  let repo: PrismaServicesDirectoryRepository

  const mockListing = prisma.serviceListing as jest.Mocked<typeof prisma.serviceListing>

  beforeEach(() => {
    jest.clearAllMocks()
    repo = new PrismaServicesDirectoryRepository()
  })

  describe('delete', () => {
    it('should soft-delete by setting deletedAt instead of calling prisma.delete', async () => {
      mockListing.update.mockResolvedValueOnce({} as any)

      await repo.delete('listing-1')

      expect(mockListing.update).toHaveBeenCalledWith({
        where: { id: 'listing-1' },
        data: { deletedAt: expect.any(Date) },
      })
      expect(mockListing.delete).not.toHaveBeenCalled()
    })
  })

  describe('findById', () => {
    it('should exclude soft-deleted records by filtering deletedAt: null', async () => {
      mockListing.findFirst.mockResolvedValueOnce(null)

      await repo.findById('listing-1')

      expect(mockListing.findFirst).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ id: 'listing-1', deletedAt: null }),
        }),
      )
    })
  })

  describe('findAll', () => {
    it('should exclude soft-deleted records in listing queries', async () => {
      mockListing.findMany.mockResolvedValueOnce([])
      mockListing.count.mockResolvedValueOnce(0)

      await repo.findAll({})

      expect(mockListing.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ deletedAt: null }),
        }),
      )
    })
  })
})
