/**
 * @module person
 * @file person.service.test.ts
 * @description Unit tests for PersonService — repository is mocked.
 */

import type { IPersonRepository } from '../person.repository'
import type { PersonRecord } from '../person.types'
import { PersonService } from '../person.service'

// ─── Fixtures ────────────────────────────────────────────────────────────────

const MOCK_PERSON: PersonRecord = {
  id: 'person-1',
  userId: 'user-1',
  name: 'João Silva',
  cpf: '52998224725',
  phone: null,
  createdAt: new Date('2026-01-01'),
  updatedAt: new Date('2026-01-01'),
}

function makeRepo(overrides: Partial<IPersonRepository> = {}): jest.Mocked<IPersonRepository> {
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

// ─── Tests ───────────────────────────────────────────────────────────────────

describe('PersonService', () => {
  let service: PersonService
  let repo: jest.Mocked<IPersonRepository>

  beforeEach(() => {
    repo = makeRepo()
    service = new PersonService(repo)
  })

  // ── create ────────────────────────────────────────────────────────────────

  describe('create', () => {
    it('should throw INVALID_CPF if CPF fails check-digit', async () => {
      await expect(
        service.create({ userId: 'user-1', name: 'João', cpf: '12345678900' }),
      ).rejects.toMatchObject({ statusCode: 400, code: 'INVALID_CPF' })
    })

    it('should throw INVALID_CPF for all-same-digit CPF (e.g. 11111111111)', async () => {
      await expect(
        service.create({ userId: 'user-1', name: 'João', cpf: '11111111111' }),
      ).rejects.toMatchObject({ statusCode: 400, code: 'INVALID_CPF' })
    })

    it('should throw CPF_ALREADY_IN_USE if CPF is already registered', async () => {
      repo.findByCpf.mockResolvedValueOnce(MOCK_PERSON)

      await expect(
        service.create({ userId: 'user-2', name: 'Maria', cpf: '52998224725' }),
      ).rejects.toMatchObject({ statusCode: 409, code: 'CPF_ALREADY_IN_USE' })
    })

    it('should throw PROFILE_ALREADY_EXISTS if userId already has a person', async () => {
      repo.findByCpf.mockResolvedValueOnce(null)
      repo.findByUserId.mockResolvedValueOnce(MOCK_PERSON)

      await expect(
        service.create({ userId: 'user-1', name: 'João', cpf: '52998224725' }),
      ).rejects.toMatchObject({ statusCode: 409, code: 'PROFILE_ALREADY_EXISTS' })
    })

    it('should store CPF as digits only (no formatting)', async () => {
      repo.findByCpf.mockResolvedValueOnce(null)
      repo.findByUserId.mockResolvedValueOnce(null)
      repo.create.mockResolvedValueOnce({ ...MOCK_PERSON })

      await service.create({ userId: 'user-1', name: 'João', cpf: '529.982.247-25' })

      expect(repo.create).toHaveBeenCalledWith(
        expect.objectContaining({ cpf: '52998224725' }),
      )
    })

    it('should create person and return record on valid input', async () => {
      repo.findByCpf.mockResolvedValueOnce(null)
      repo.findByUserId.mockResolvedValueOnce(null)
      repo.create.mockResolvedValueOnce({ ...MOCK_PERSON })

      const result = await service.create({
        userId: 'user-1',
        name: 'João Silva',
        cpf: '52998224725',
        phone: '11999999999',
      })

      expect(result).toEqual(MOCK_PERSON)
      expect(repo.create).toHaveBeenCalledTimes(1)
    })
  })

  // ── findById ──────────────────────────────────────────────────────────────

  describe('findById', () => {
    it('should return person when found', async () => {
      repo.findById.mockResolvedValueOnce(MOCK_PERSON)

      const result = await service.findById('person-1')

      expect(result).toEqual(MOCK_PERSON)
    })

    it('should throw NOT_FOUND when person does not exist', async () => {
      repo.findById.mockResolvedValueOnce(null)

      await expect(service.findById('unknown-id')).rejects.toMatchObject({
        statusCode: 404,
        code: 'NOT_FOUND',
      })
    })
  })

  // ── getProfile ────────────────────────────────────────────────────────────

  describe('getProfile', () => {
    it('should return person profile for given userId', async () => {
      repo.findByUserId.mockResolvedValueOnce(MOCK_PERSON)

      const result = await service.getProfile('user-1')

      expect(result).toEqual(MOCK_PERSON)
    })

    it('should throw NOT_FOUND when user has no person profile', async () => {
      repo.findByUserId.mockResolvedValueOnce(null)

      await expect(service.getProfile('user-without-profile')).rejects.toMatchObject({
        statusCode: 404,
        code: 'NOT_FOUND',
      })
    })
  })

  // ── update ────────────────────────────────────────────────────────────────

  describe('update', () => {
    it('should throw NOT_FOUND when person does not exist', async () => {
      repo.findById.mockResolvedValueOnce(null)

      await expect(
        service.update('unknown-id', { name: 'Novo Nome' }, 'user-1'),
      ).rejects.toMatchObject({ statusCode: 404, code: 'NOT_FOUND' })
    })

    it('should throw INSUFFICIENT_PERMISSION when userId does not match', async () => {
      repo.findById.mockResolvedValueOnce(MOCK_PERSON)

      await expect(
        service.update('person-1', { name: 'Novo Nome' }, 'other-user'),
      ).rejects.toMatchObject({ statusCode: 403, code: 'INSUFFICIENT_PERMISSION' })
    })

    it('should update and return updated person', async () => {
      const updated = { ...MOCK_PERSON, name: 'Novo Nome' }
      repo.findById.mockResolvedValueOnce(MOCK_PERSON)
      repo.update.mockResolvedValueOnce(updated)

      const result = await service.update('person-1', { name: 'Novo Nome' }, 'user-1')

      expect(result.name).toBe('Novo Nome')
      expect(repo.update).toHaveBeenCalledWith('person-1', { name: 'Novo Nome' })
    })
  })

  // ── delete ────────────────────────────────────────────────────────────────

  describe('delete', () => {
    it('should throw NOT_FOUND when person does not exist', async () => {
      repo.findById.mockResolvedValueOnce(null)

      await expect(service.delete('unknown-id', 'user-1')).rejects.toMatchObject({
        statusCode: 404,
        code: 'NOT_FOUND',
      })
    })

    it('should throw INSUFFICIENT_PERMISSION when userId does not match', async () => {
      repo.findById.mockResolvedValueOnce(MOCK_PERSON)

      await expect(service.delete('person-1', 'other-user')).rejects.toMatchObject({
        statusCode: 403,
        code: 'INSUFFICIENT_PERMISSION',
      })
    })

    it('should delete person when found', async () => {
      repo.findById.mockResolvedValueOnce(MOCK_PERSON)
      repo.delete.mockResolvedValueOnce(undefined)

      await service.delete('person-1', 'user-1')

      expect(repo.delete).toHaveBeenCalledWith('person-1')
    })
  })
})
