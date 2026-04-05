/**
 * @module adoption
 * @file adoption.repository.test.ts
 * @description Unit tests for PrismaAdoptionRepository — verifies soft-delete behavior.
 */

jest.mock('../../../shared/config/database', () => ({
  prisma: {
    adoptionListing: {
      create: jest.fn(),
      findFirst: jest.fn(),
      findMany: jest.fn(),
      count: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    $transaction: jest.fn(),
  },
}))

import { prisma } from '../../../shared/config/database'
import { PrismaAdoptionRepository } from '../adoption.repository'

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('PrismaAdoptionRepository (soft-delete)', () => {
  let repo: PrismaAdoptionRepository

  const mockListing = prisma.adoptionListing as jest.Mocked<typeof prisma.adoptionListing>

  beforeEach(() => {
    jest.clearAllMocks()
    repo = new PrismaAdoptionRepository()
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

  describe('findByPetId', () => {
    it('should exclude soft-deleted records by filtering deletedAt: null', async () => {
      mockListing.findFirst.mockResolvedValueOnce(null)

      await repo.findByPetId('pet-1')

      expect(mockListing.findFirst).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ petId: 'pet-1', deletedAt: null }),
        }),
      )
    })
  })

  describe('findAll', () => {
    it('should exclude soft-deleted records in listing queries', async () => {
      ;(prisma.$transaction as jest.Mock).mockResolvedValueOnce([[], 0])

      await repo.findAll({})

      expect(mockListing.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ deletedAt: null }),
        }),
      )
    })
  })
})
