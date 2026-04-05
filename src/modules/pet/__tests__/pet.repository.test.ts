/**
 * @module pet
 * @file pet.repository.test.ts
 * @description Unit tests for PrismaPetRepository — verifies soft-delete behavior.
 */

jest.mock('../../../shared/config/database', () => ({
  prisma: {
    pet: {
      create: jest.fn(),
      findFirst: jest.fn(),
      findUnique: jest.fn(),
      findMany: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    tutorship: {
      create: jest.fn(),
      updateMany: jest.fn(),
      findMany: jest.fn(),
      findFirst: jest.fn(),
    },
    coTutor: {
      create: jest.fn(),
      delete: jest.fn(),
    },
    $transaction: jest.fn(),
  },
}))

import { prisma } from '../../../shared/config/database'
import { PrismaPetRepository } from '../pet.repository'

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('PrismaPetRepository (soft-delete)', () => {
  let repo: PrismaPetRepository

  const mockPet = prisma.pet as jest.Mocked<typeof prisma.pet>

  beforeEach(() => {
    jest.clearAllMocks()
    repo = new PrismaPetRepository()
  })

  describe('delete', () => {
    it('should soft-delete by setting deletedAt instead of calling prisma.delete', async () => {
      mockPet.update.mockResolvedValueOnce({} as any)

      await repo.delete('pet-1')

      expect(mockPet.update).toHaveBeenCalledWith({
        where: { id: 'pet-1' },
        data: { deletedAt: expect.any(Date) },
      })
      expect(mockPet.delete).not.toHaveBeenCalled()
    })
  })

  describe('findById', () => {
    it('should exclude soft-deleted records by filtering deletedAt: null', async () => {
      mockPet.findFirst.mockResolvedValueOnce(null)

      await repo.findById('pet-1')

      expect(mockPet.findFirst).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ id: 'pet-1', deletedAt: null }),
        }),
      )
    })
  })

  describe('findByPersonId', () => {
    it('should exclude soft-deleted pets', async () => {
      mockPet.findMany.mockResolvedValueOnce([])

      await repo.findByPersonId('person-1')

      expect(mockPet.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ deletedAt: null }),
        }),
      )
    })
  })

  describe('findByOrgId', () => {
    it('should exclude soft-deleted pets', async () => {
      mockPet.findMany.mockResolvedValueOnce([])

      await repo.findByOrgId('org-1')

      expect(mockPet.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ deletedAt: null }),
        }),
      )
    })
  })
})
