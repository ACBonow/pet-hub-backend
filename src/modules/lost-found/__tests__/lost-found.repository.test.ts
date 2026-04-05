/**
 * @module lost-found
 * @file lost-found.repository.test.ts
 * @description Unit tests for PrismaLostFoundRepository — verifies soft-delete behavior.
 */

jest.mock('../../../shared/config/database', () => ({
  prisma: {
    lostFoundReport: {
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
import { PrismaLostFoundRepository } from '../lost-found.repository'

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('PrismaLostFoundRepository (soft-delete)', () => {
  let repo: PrismaLostFoundRepository

  const mockReport = prisma.lostFoundReport as jest.Mocked<typeof prisma.lostFoundReport>

  beforeEach(() => {
    jest.clearAllMocks()
    repo = new PrismaLostFoundRepository()
  })

  describe('delete', () => {
    it('should soft-delete by setting deletedAt instead of calling prisma.delete', async () => {
      mockReport.update.mockResolvedValueOnce({} as any)

      await repo.delete('report-1')

      expect(mockReport.update).toHaveBeenCalledWith({
        where: { id: 'report-1' },
        data: { deletedAt: expect.any(Date) },
      })
      expect(mockReport.delete).not.toHaveBeenCalled()
    })
  })

  describe('findById', () => {
    it('should exclude soft-deleted records by filtering deletedAt: null', async () => {
      mockReport.findFirst.mockResolvedValueOnce(null)

      await repo.findById('report-1')

      expect(mockReport.findFirst).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ id: 'report-1', deletedAt: null }),
        }),
      )
    })
  })

  describe('findAll', () => {
    it('should exclude soft-deleted records in listing queries', async () => {
      ;(prisma.$transaction as jest.Mock).mockResolvedValueOnce([[], 0])

      await repo.findAll({})

      expect(mockReport.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ deletedAt: null }),
        }),
      )
    })
  })
})
