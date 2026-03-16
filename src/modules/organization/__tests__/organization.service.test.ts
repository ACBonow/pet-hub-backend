/**
 * @module organization
 * @file organization.service.test.ts
 * @description Unit tests for OrganizationService — repositories are mocked.
 */

import type { IOrganizationRepository } from '../organization.repository'
import type { IPersonRepository } from '../../person'
import type { OrganizationRecord } from '../organization.types'
import { OrganizationService } from '../organization.service'

// ─── Fixtures ────────────────────────────────────────────────────────────────

const MOCK_ORG: OrganizationRecord = {
  id: 'org-1',
  name: 'Pet Rescue ONG',
  type: 'NGO',
  cnpj: null,
  description: null,
  phone: null,
  email: null,
  address: null,
  createdAt: new Date('2026-01-01'),
  updatedAt: new Date('2026-01-01'),
  responsiblePersons: [{ organizationId: 'org-1', personId: 'person-1', assignedAt: new Date('2026-01-01') }],
}

const MOCK_COMPANY: OrganizationRecord = {
  ...MOCK_ORG,
  id: 'org-2',
  name: 'PetShop LTDA',
  type: 'COMPANY',
  cnpj: '11222333000181',
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

const MOCK_PERSON = {
  id: 'person-1',
  userId: 'user-1',
  name: 'João Silva',
  cpf: '52998224725',
  phone: null,
  createdAt: new Date('2026-01-01'),
  updatedAt: new Date('2026-01-01'),
}

// ─── Tests ───────────────────────────────────────────────────────────────────

describe('OrganizationService', () => {
  let service: OrganizationService
  let orgRepo: jest.Mocked<IOrganizationRepository>
  let personRepo: jest.Mocked<IPersonRepository>

  beforeEach(() => {
    orgRepo = makeOrgRepo()
    personRepo = makePersonRepo()
    service = new OrganizationService(orgRepo, personRepo)
  })

  // ── create ────────────────────────────────────────────────────────────────

  describe('create', () => {
    it('should throw CNPJ_REQUIRED when type is COMPANY and cnpj is missing', async () => {
      personRepo.findById.mockResolvedValueOnce(MOCK_PERSON)

      await expect(
        service.create({ name: 'PetShop', type: 'COMPANY', responsiblePersonId: 'person-1' }),
      ).rejects.toMatchObject({ statusCode: 400, code: 'CNPJ_REQUIRED' })
    })

    it('should throw INVALID_CNPJ when type is COMPANY and cnpj fails check-digit', async () => {
      personRepo.findById.mockResolvedValueOnce(MOCK_PERSON)

      await expect(
        service.create({ name: 'PetShop', type: 'COMPANY', cnpj: '11111111111111', responsiblePersonId: 'person-1' }),
      ).rejects.toMatchObject({ statusCode: 400, code: 'INVALID_CNPJ' })
    })

    it('should throw INVALID_CNPJ when type is NGO and cnpj is provided but invalid', async () => {
      personRepo.findById.mockResolvedValueOnce(MOCK_PERSON)

      await expect(
        service.create({ name: 'Pet Rescue', type: 'NGO', cnpj: '12345678000100', responsiblePersonId: 'person-1' }),
      ).rejects.toMatchObject({ statusCode: 400, code: 'INVALID_CNPJ' })
    })

    it('should create NGO without cnpj', async () => {
      personRepo.findById.mockResolvedValueOnce(MOCK_PERSON)
      orgRepo.findByCnpj.mockResolvedValueOnce(null)
      orgRepo.create.mockResolvedValueOnce(MOCK_ORG)

      const result = await service.create({
        name: 'Pet Rescue ONG',
        type: 'NGO',
        responsiblePersonId: 'person-1',
      })

      expect(result).toEqual(MOCK_ORG)
      expect(orgRepo.create).toHaveBeenCalledTimes(1)
    })

    it('should throw CNPJ_ALREADY_IN_USE when cnpj is already registered', async () => {
      personRepo.findById.mockResolvedValueOnce(MOCK_PERSON)
      orgRepo.findByCnpj.mockResolvedValueOnce(MOCK_COMPANY)

      await expect(
        service.create({ name: 'Outra Empresa', type: 'COMPANY', cnpj: '11222333000181', responsiblePersonId: 'person-1' }),
      ).rejects.toMatchObject({ statusCode: 409, code: 'CNPJ_ALREADY_IN_USE' })
    })

    it('should throw NOT_FOUND when responsiblePersonId does not exist', async () => {
      personRepo.findById.mockResolvedValueOnce(null)

      await expect(
        service.create({ name: 'PetShop', type: 'COMPANY', cnpj: '11222333000181', responsiblePersonId: 'nonexistent' }),
      ).rejects.toMatchObject({ statusCode: 404, code: 'NOT_FOUND' })
    })

    it('should store cnpj as digits only (no formatting)', async () => {
      personRepo.findById.mockResolvedValueOnce(MOCK_PERSON)
      orgRepo.findByCnpj.mockResolvedValueOnce(null)
      orgRepo.create.mockResolvedValueOnce(MOCK_COMPANY)

      await service.create({
        name: 'PetShop LTDA',
        type: 'COMPANY',
        cnpj: '11.222.333/0001-81',
        responsiblePersonId: 'person-1',
      })

      expect(orgRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({ cnpj: '11222333000181' }),
      )
    })

    it('should create company and return record on valid input', async () => {
      personRepo.findById.mockResolvedValueOnce(MOCK_PERSON)
      orgRepo.findByCnpj.mockResolvedValueOnce(null)
      orgRepo.create.mockResolvedValueOnce(MOCK_COMPANY)

      const result = await service.create({
        name: 'PetShop LTDA',
        type: 'COMPANY',
        cnpj: '11222333000181',
        responsiblePersonId: 'person-1',
      })

      expect(result).toEqual(MOCK_COMPANY)
      expect(orgRepo.create).toHaveBeenCalledTimes(1)
    })
  })

  // ── findById ──────────────────────────────────────────────────────────────

  describe('findById', () => {
    it('should return organization when found', async () => {
      orgRepo.findById.mockResolvedValueOnce(MOCK_ORG)

      const result = await service.findById('org-1')

      expect(result).toEqual(MOCK_ORG)
    })

    it('should throw NOT_FOUND when organization does not exist', async () => {
      orgRepo.findById.mockResolvedValueOnce(null)

      await expect(service.findById('unknown')).rejects.toMatchObject({
        statusCode: 404,
        code: 'NOT_FOUND',
      })
    })
  })

  // ── update ────────────────────────────────────────────────────────────────

  describe('update', () => {
    it('should throw NOT_FOUND when organization does not exist', async () => {
      orgRepo.findById.mockResolvedValueOnce(null)

      await expect(
        service.update('unknown', { name: 'Novo Nome' }),
      ).rejects.toMatchObject({ statusCode: 404, code: 'NOT_FOUND' })
    })

    it('should update and return updated organization', async () => {
      const updated = { ...MOCK_ORG, name: 'Novo Nome' }
      orgRepo.findById.mockResolvedValueOnce(MOCK_ORG)
      orgRepo.update.mockResolvedValueOnce(updated)

      const result = await service.update('org-1', { name: 'Novo Nome' })

      expect(result.name).toBe('Novo Nome')
      expect(orgRepo.update).toHaveBeenCalledWith('org-1', { name: 'Novo Nome' })
    })
  })

  // ── delete ────────────────────────────────────────────────────────────────

  describe('delete', () => {
    it('should throw NOT_FOUND when organization does not exist', async () => {
      orgRepo.findById.mockResolvedValueOnce(null)

      await expect(service.delete('unknown')).rejects.toMatchObject({
        statusCode: 404,
        code: 'NOT_FOUND',
      })
    })

    it('should delete organization when found', async () => {
      orgRepo.findById.mockResolvedValueOnce(MOCK_ORG)
      orgRepo.delete.mockResolvedValueOnce(undefined)

      await service.delete('org-1')

      expect(orgRepo.delete).toHaveBeenCalledWith('org-1')
    })
  })

  // ── addPerson ─────────────────────────────────────────────────────────────

  describe('addPerson', () => {
    it('should throw NOT_FOUND when organization does not exist', async () => {
      orgRepo.findById.mockResolvedValueOnce(null)

      await expect(service.addPerson('unknown', 'person-1')).rejects.toMatchObject({
        statusCode: 404,
        code: 'NOT_FOUND',
      })
    })

    it('should throw NOT_FOUND when person does not exist', async () => {
      orgRepo.findById.mockResolvedValueOnce(MOCK_ORG)
      personRepo.findById.mockResolvedValueOnce(null)

      await expect(service.addPerson('org-1', 'unknown-person')).rejects.toMatchObject({
        statusCode: 404,
        code: 'NOT_FOUND',
      })
    })

    it('should add person to organization', async () => {
      orgRepo.findById.mockResolvedValueOnce(MOCK_ORG)
      personRepo.findById.mockResolvedValueOnce(MOCK_PERSON)
      orgRepo.addPerson.mockResolvedValueOnce(undefined)

      await service.addPerson('org-1', 'person-1')

      expect(orgRepo.addPerson).toHaveBeenCalledWith('org-1', 'person-1')
    })
  })

  // ── removePerson ──────────────────────────────────────────────────────────

  describe('removePerson', () => {
    it('should throw NOT_FOUND when organization does not exist', async () => {
      orgRepo.findById.mockResolvedValueOnce(null)

      await expect(service.removePerson('unknown', 'person-1')).rejects.toMatchObject({
        statusCode: 404,
        code: 'NOT_FOUND',
      })
    })

    it('should throw CANNOT_REMOVE_LAST_PERSON when only one person remains', async () => {
      orgRepo.findById.mockResolvedValueOnce(MOCK_ORG)
      orgRepo.personCount.mockResolvedValueOnce(1)

      await expect(service.removePerson('org-1', 'person-1')).rejects.toMatchObject({
        statusCode: 409,
        code: 'CANNOT_REMOVE_LAST_PERSON',
      })
    })

    it('should remove person from organization when more than one exists', async () => {
      orgRepo.findById.mockResolvedValueOnce(MOCK_ORG)
      orgRepo.personCount.mockResolvedValueOnce(2)
      orgRepo.removePerson.mockResolvedValueOnce(undefined)

      await service.removePerson('org-1', 'person-2')

      expect(orgRepo.removePerson).toHaveBeenCalledWith('org-1', 'person-2')
    })
  })
})
