/**
 * @module organization
 * @file organization.service.test.ts
 * @description Unit tests for OrganizationService — repositories are mocked.
 */

import type { IOrganizationRepository } from '../organization.repository'
import type { IPersonRepository } from '../../person'
import type { OrganizationRecord } from '../organization.types'
import { OrganizationService } from '../organization.service'
import * as storage from '../../../shared/utils/storage'

jest.mock('../../../shared/utils/storage', () => ({
  uploadFile: jest.fn(),
  deleteFile: jest.fn(),
  extractPathFromUrl: jest.requireActual('../../../shared/utils/storage').extractPathFromUrl,
}))

// ─── Fixtures ────────────────────────────────────────────────────────────────

const MOCK_ORG: OrganizationRecord = {
  id: 'org-1',
  name: 'Pet Rescue ONG',
  type: 'NGO',
  cnpj: null,
  description: null,
  phone: null,
  email: null,
  website: null,
  instagram: null,
  photoUrl: null,
  addressStreet: null,
  addressNeighborhood: null,
  addressNumber: null,
  addressCep: null,
  addressCity: null,
  addressState: null,
  createdAt: new Date('2026-01-01'),
  updatedAt: new Date('2026-01-01'),
  responsiblePersons: [{ organizationId: 'org-1', personId: 'person-1', role: 'OWNER', assignedAt: new Date('2026-01-01') }],
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
        service.create({ name: 'PetShop', type: 'COMPANY', responsiblePersonId: 'person-1' }, 'user-1'),
      ).rejects.toMatchObject({ statusCode: 400, code: 'CNPJ_REQUIRED' })
    })

    it('should throw INVALID_CNPJ when type is COMPANY and cnpj fails check-digit', async () => {
      personRepo.findById.mockResolvedValueOnce(MOCK_PERSON)

      await expect(
        service.create({ name: 'PetShop', type: 'COMPANY', cnpj: '11111111111111', responsiblePersonId: 'person-1' }, 'user-1'),
      ).rejects.toMatchObject({ statusCode: 400, code: 'INVALID_CNPJ' })
    })

    it('should throw INVALID_CNPJ when type is NGO and cnpj is provided but invalid', async () => {
      personRepo.findById.mockResolvedValueOnce(MOCK_PERSON)

      await expect(
        service.create({ name: 'Pet Rescue', type: 'NGO', cnpj: '12345678000100', responsiblePersonId: 'person-1' }, 'user-1'),
      ).rejects.toMatchObject({ statusCode: 400, code: 'INVALID_CNPJ' })
    })

    it('should create NGO without cnpj when responsiblePersonId is provided', async () => {
      personRepo.findById.mockResolvedValueOnce(MOCK_PERSON)
      orgRepo.findByCnpj.mockResolvedValueOnce(null)
      orgRepo.create.mockResolvedValueOnce(MOCK_ORG)

      const result = await service.create({
        name: 'Pet Rescue ONG',
        type: 'NGO',
        responsiblePersonId: 'person-1',
      }, 'user-1')

      expect(result).toEqual(MOCK_ORG)
      expect(orgRepo.create).toHaveBeenCalledTimes(1)
    })

    it('should use creator person when responsiblePersonId is not provided', async () => {
      personRepo.findByUserId.mockResolvedValueOnce(MOCK_PERSON)
      orgRepo.findByCnpj.mockResolvedValueOnce(null)
      orgRepo.create.mockResolvedValueOnce(MOCK_ORG)

      const result = await service.create({ name: 'Pet Rescue ONG', type: 'NGO' }, 'user-1')

      expect(result).toEqual(MOCK_ORG)
      expect(personRepo.findByUserId).toHaveBeenCalledWith('user-1')
      expect(orgRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({ responsiblePersonId: MOCK_PERSON.id }),
      )
    })

    it('should throw NOT_FOUND when responsiblePersonId not provided and creator has no person profile', async () => {
      personRepo.findByUserId.mockResolvedValueOnce(null)

      await expect(
        service.create({ name: 'ONG', type: 'NGO' }, 'user-1'),
      ).rejects.toMatchObject({ statusCode: 404 })
    })

    it('should throw CNPJ_ALREADY_IN_USE when cnpj is already registered', async () => {
      personRepo.findById.mockResolvedValueOnce(MOCK_PERSON)
      orgRepo.findByCnpj.mockResolvedValueOnce(MOCK_COMPANY)

      await expect(
        service.create({ name: 'Outra Empresa', type: 'COMPANY', cnpj: '11222333000181', responsiblePersonId: 'person-1' }, 'user-1'),
      ).rejects.toMatchObject({ statusCode: 409, code: 'CNPJ_ALREADY_IN_USE' })
    })

    it('should throw NOT_FOUND when explicit responsiblePersonId does not exist', async () => {
      personRepo.findById.mockResolvedValueOnce(null)

      await expect(
        service.create({ name: 'PetShop', type: 'COMPANY', cnpj: '11222333000181', responsiblePersonId: 'nonexistent' }, 'user-1'),
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
      }, 'user-1')

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
      }, 'user-1')

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

    it('should add person with MEMBER role by default', async () => {
      orgRepo.findById.mockResolvedValueOnce(MOCK_ORG)
      personRepo.findById.mockResolvedValueOnce(MOCK_PERSON)
      orgRepo.addPerson.mockResolvedValueOnce(undefined)

      await service.addPerson('org-1', 'person-1')

      expect(orgRepo.addPerson).toHaveBeenCalledWith('org-1', 'person-1', 'MEMBER')
    })

    it('should add person with explicit role when provided', async () => {
      orgRepo.findById.mockResolvedValueOnce(MOCK_ORG)
      personRepo.findById.mockResolvedValueOnce(MOCK_PERSON)
      orgRepo.addPerson.mockResolvedValueOnce(undefined)

      await service.addPerson('org-1', 'person-1', 'MANAGER')

      expect(orgRepo.addPerson).toHaveBeenCalledWith('org-1', 'person-1', 'MANAGER')
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

    it('should throw LAST_OWNER when removing the only OWNER', async () => {
      orgRepo.findById.mockResolvedValueOnce(MOCK_ORG)
      orgRepo.getRole.mockResolvedValueOnce('OWNER')
      orgRepo.countByRole.mockResolvedValueOnce(1)

      await expect(service.removePerson('org-1', 'person-1')).rejects.toMatchObject({
        statusCode: 409,
        code: 'LAST_OWNER',
      })
    })

    it('should remove an OWNER when there are multiple owners', async () => {
      orgRepo.findById.mockResolvedValueOnce(MOCK_ORG)
      orgRepo.getRole.mockResolvedValueOnce('OWNER')
      orgRepo.countByRole.mockResolvedValueOnce(2)
      orgRepo.removePerson.mockResolvedValueOnce(undefined)

      await service.removePerson('org-1', 'person-2')

      expect(orgRepo.removePerson).toHaveBeenCalledWith('org-1', 'person-2')
    })

    it('should remove a non-owner member freely', async () => {
      orgRepo.findById.mockResolvedValueOnce(MOCK_ORG)
      orgRepo.getRole.mockResolvedValueOnce('MEMBER')
      orgRepo.removePerson.mockResolvedValueOnce(undefined)

      await service.removePerson('org-1', 'person-2')

      expect(orgRepo.removePerson).toHaveBeenCalledWith('org-1', 'person-2')
      expect(orgRepo.countByRole).not.toHaveBeenCalled()
    })
  })

  // ── changeRole ────────────────────────────────────────────────────────────

  describe('changeRole', () => {
    it('should throw NOT_FOUND when organization does not exist', async () => {
      orgRepo.findById.mockResolvedValueOnce(null)

      await expect(service.changeRole('unknown', 'person-1', 'MANAGER')).rejects.toMatchObject({
        statusCode: 404,
        code: 'NOT_FOUND',
      })
    })

    it('should throw NOT_FOUND when member does not belong to org', async () => {
      orgRepo.findById.mockResolvedValueOnce(MOCK_ORG)
      orgRepo.hasPerson.mockResolvedValueOnce(false)

      await expect(service.changeRole('org-1', 'person-99', 'MANAGER')).rejects.toMatchObject({
        statusCode: 404,
        code: 'NOT_FOUND',
      })
    })

    it('should throw LAST_OWNER when demoting the only OWNER', async () => {
      orgRepo.findById.mockResolvedValueOnce(MOCK_ORG)
      orgRepo.hasPerson.mockResolvedValueOnce(true)
      orgRepo.getRole.mockResolvedValueOnce('OWNER')
      orgRepo.countByRole.mockResolvedValueOnce(1)

      await expect(service.changeRole('org-1', 'person-1', 'MANAGER')).rejects.toMatchObject({
        statusCode: 409,
        code: 'LAST_OWNER',
      })
    })

    it('should change role when there are multiple owners', async () => {
      orgRepo.findById.mockResolvedValueOnce(MOCK_ORG)
      orgRepo.hasPerson.mockResolvedValueOnce(true)
      orgRepo.getRole.mockResolvedValueOnce('OWNER')
      orgRepo.countByRole.mockResolvedValueOnce(2)
      orgRepo.setRole.mockResolvedValueOnce(undefined)

      await service.changeRole('org-1', 'person-2', 'MANAGER')

      expect(orgRepo.setRole).toHaveBeenCalledWith('org-1', 'person-2', 'MANAGER')
    })

    it('should change role without LAST_OWNER check when new role is OWNER', async () => {
      orgRepo.findById.mockResolvedValueOnce(MOCK_ORG)
      orgRepo.hasPerson.mockResolvedValueOnce(true)
      orgRepo.setRole.mockResolvedValueOnce(undefined)

      await service.changeRole('org-1', 'person-2', 'OWNER')

      expect(orgRepo.setRole).toHaveBeenCalledWith('org-1', 'person-2', 'OWNER')
      expect(orgRepo.getRole).not.toHaveBeenCalled()
    })
  })

  // ── getMembers ────────────────────────────────────────────────────────────

  describe('getMembers', () => {
    it('should throw NOT_FOUND when organization does not exist', async () => {
      orgRepo.findById.mockResolvedValueOnce(null)

      await expect(service.getMembers('unknown')).rejects.toMatchObject({
        statusCode: 404,
        code: 'NOT_FOUND',
      })
    })

    it('should return members of the organization', async () => {
      const members = [
        { organizationId: 'org-1', personId: 'person-1', role: 'OWNER' as const, assignedAt: new Date() },
        { organizationId: 'org-1', personId: 'person-2', role: 'MEMBER' as const, assignedAt: new Date() },
      ]
      orgRepo.findById.mockResolvedValueOnce(MOCK_ORG)
      orgRepo.findMembers.mockResolvedValueOnce(members)

      const result = await service.getMembers('org-1')

      expect(result).toEqual(members)
    })
  })

  // ── findMyOrganizations ────────────────────────────────────────────────────

  describe('findMyOrganizations', () => {
    it('should return organizations where user is a member', async () => {
      personRepo.findByUserId.mockResolvedValueOnce(MOCK_PERSON)
      orgRepo.findByPersonId.mockResolvedValueOnce([MOCK_ORG])

      const result = await service.findMyOrganizations('user-1')

      expect(result[0]).toMatchObject({ id: 'org-1' })
      expect(orgRepo.findByPersonId).toHaveBeenCalledWith('person-1')
    })

    it('should include myRole derived from responsiblePersons', async () => {
      personRepo.findByUserId.mockResolvedValueOnce(MOCK_PERSON)
      orgRepo.findByPersonId.mockResolvedValueOnce([MOCK_ORG])

      const result = await service.findMyOrganizations('user-1')

      // MOCK_ORG has person-1 as OWNER in responsiblePersons
      expect(result[0].myRole).toBe('OWNER')
    })

    it('should return empty array when user has no person profile', async () => {
      personRepo.findByUserId.mockResolvedValueOnce(null)

      const result = await service.findMyOrganizations('user-no-profile')

      expect(result).toEqual([])
      expect(orgRepo.findByPersonId).not.toHaveBeenCalled()
    })

    it('should return empty array when user has no organizations', async () => {
      personRepo.findByUserId.mockResolvedValueOnce(MOCK_PERSON)
      orgRepo.findByPersonId.mockResolvedValueOnce([])

      const result = await service.findMyOrganizations('user-1')

      expect(result).toEqual([])
    })
  })

  // ── findById with myRole ──────────────────────────────────────────────────

  describe('findById with userId', () => {
    it('should include myRole when userId is provided and user is a member', async () => {
      personRepo.findByUserId.mockResolvedValueOnce(MOCK_PERSON)
      orgRepo.findById.mockResolvedValueOnce(MOCK_ORG)

      const result = await service.findById('org-1', 'user-1')

      expect(result.myRole).toBe('OWNER')
    })

    it('should not include myRole when userId is not provided', async () => {
      orgRepo.findById.mockResolvedValueOnce(MOCK_ORG)

      const result = await service.findById('org-1')

      expect(result.myRole).toBeUndefined()
    })

    it('should not include myRole when user is not a member', async () => {
      const orgWithDifferentPerson = {
        ...MOCK_ORG,
        responsiblePersons: [{ organizationId: 'org-1', personId: 'person-99', role: 'OWNER' as const, assignedAt: new Date() }],
      }
      personRepo.findByUserId.mockResolvedValueOnce(MOCK_PERSON)
      orgRepo.findById.mockResolvedValueOnce(orgWithDifferentPerson)

      const result = await service.findById('org-1', 'user-1')

      expect(result.myRole).toBeUndefined()
    })
  })

  // ── uploadPhoto ───────────────────────────────────────────────────────────

  describe('uploadPhoto', () => {
    const FILE = Buffer.from('fake-image')
    const MIME = 'image/jpeg'

    beforeEach(() => {
      jest.mocked(storage.uploadFile).mockResolvedValue('https://cdn.example.com/org-images/org-1/123.jpg')
      jest.mocked(storage.deleteFile).mockResolvedValue(undefined)
    })

    it('should upload photo and return updated org', async () => {
      const updatedOrg = { ...MOCK_ORG, photoUrl: 'https://cdn.example.com/org-images/org-1/123.jpg' }
      orgRepo.findById
        .mockResolvedValueOnce(MOCK_ORG)   // initial check
        .mockResolvedValueOnce(updatedOrg)  // after update
      personRepo.findByUserId.mockResolvedValueOnce(MOCK_PERSON)
      orgRepo.getRole.mockResolvedValueOnce('OWNER')
      orgRepo.updatePhotoUrl.mockResolvedValueOnce(undefined)

      const result = await service.uploadPhoto('org-1', 'user-1', FILE, MIME)

      expect(storage.uploadFile).toHaveBeenCalledWith('org-images', expect.stringContaining('org-1/'), FILE, MIME)
      expect(orgRepo.updatePhotoUrl).toHaveBeenCalledWith('org-1', expect.any(String))
      expect(result.photoUrl).toBe('https://cdn.example.com/org-images/org-1/123.jpg')
    })

    it('should delete old photo before uploading new one', async () => {
      const orgWithPhoto = { ...MOCK_ORG, photoUrl: 'https://cdn.example.com/org-images/org-1/old.jpg' }
      const updatedOrg = { ...MOCK_ORG, photoUrl: 'https://cdn.example.com/org-images/org-1/new.jpg' }
      orgRepo.findById
        .mockResolvedValueOnce(orgWithPhoto)
        .mockResolvedValueOnce(updatedOrg)
      personRepo.findByUserId.mockResolvedValueOnce(MOCK_PERSON)
      orgRepo.getRole.mockResolvedValueOnce('MANAGER')
      orgRepo.updatePhotoUrl.mockResolvedValueOnce(undefined)

      await service.uploadPhoto('org-1', 'user-1', FILE, MIME)

      expect(storage.deleteFile).toHaveBeenCalledWith('org-images', expect.any(String))
    })

    it('should throw NOT_FOUND when org does not exist', async () => {
      orgRepo.findById.mockResolvedValueOnce(null)

      await expect(service.uploadPhoto('nonexistent', 'user-1', FILE, MIME))
        .rejects.toMatchObject({ statusCode: 404 })
    })

    it('should throw INSUFFICIENT_PERMISSION when user is not a member', async () => {
      orgRepo.findById.mockResolvedValueOnce(MOCK_ORG)
      personRepo.findByUserId.mockResolvedValueOnce(MOCK_PERSON)
      orgRepo.getRole.mockResolvedValueOnce(null)

      await expect(service.uploadPhoto('org-1', 'user-1', FILE, MIME))
        .rejects.toMatchObject({ statusCode: 403, code: 'INSUFFICIENT_PERMISSION' })
    })

    it('should throw INSUFFICIENT_PERMISSION when user is MEMBER', async () => {
      orgRepo.findById.mockResolvedValueOnce(MOCK_ORG)
      personRepo.findByUserId.mockResolvedValueOnce(MOCK_PERSON)
      orgRepo.getRole.mockResolvedValueOnce('MEMBER')

      await expect(service.uploadPhoto('org-1', 'user-1', FILE, MIME))
        .rejects.toMatchObject({ statusCode: 403, code: 'INSUFFICIENT_PERMISSION' })
    })
  })
})
