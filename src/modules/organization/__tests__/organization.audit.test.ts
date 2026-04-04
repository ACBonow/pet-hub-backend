/**
 * @module organization
 * @file organization.audit.test.ts
 * @description Verifies that OrganizationService emits structured audit log entries
 *              for every sensitive mutation (TECH-BE-008).
 */

import type { IOrganizationRepository } from '../organization.repository'
import type { IPersonRepository } from '../../person'
import type { OrganizationRecord } from '../organization.types'
import { OrganizationService } from '../organization.service'
import * as loggerModule from '../../../shared/utils/logger'
import * as storage from '../../../shared/utils/storage'

jest.mock('../../../shared/utils/storage', () => ({
  uploadFile: jest.fn().mockResolvedValue('https://cdn.example.com/org-images/org-1/123.jpg'),
  deleteFile: jest.fn().mockResolvedValue(undefined),
  extractPathFromUrl: jest.requireActual('../../../shared/utils/storage').extractPathFromUrl,
}))

const loggerInfoSpy = jest.spyOn(loggerModule.logger, 'info').mockImplementation(() => {})

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

const MOCK_PERSON = {
  id: 'person-1',
  name: 'Alice',
  cpf: '52998224725',
  phone: null,
  userId: 'user-1',
  createdAt: new Date(),
  updatedAt: new Date(),
}

const MOCK_TARGET_PERSON = {
  id: 'person-2',
  name: 'Bob',
  cpf: '11144477735',
  phone: null,
  userId: 'user-2',
  createdAt: new Date(),
  updatedAt: new Date(),
}

function makeOrgRepo(overrides: Partial<IOrganizationRepository> = {}): jest.Mocked<IOrganizationRepository> {
  return {
    create: jest.fn().mockResolvedValue(MOCK_ORG),
    findById: jest.fn().mockResolvedValue(MOCK_ORG),
    findByCnpj: jest.fn().mockResolvedValue(null),
    findByPersonId: jest.fn().mockResolvedValue([]),
    update: jest.fn().mockResolvedValue(MOCK_ORG),
    delete: jest.fn().mockResolvedValue(undefined),
    addPerson: jest.fn().mockResolvedValue(undefined),
    removePerson: jest.fn().mockResolvedValue(undefined),
    hasPerson: jest.fn().mockResolvedValue(false),
    getRole: jest.fn().mockResolvedValue('OWNER'),
    setRole: jest.fn().mockResolvedValue(undefined),
    countByRole: jest.fn().mockResolvedValue(2),
    findMembersWithNames: jest.fn().mockResolvedValue([]),
    updatePhotoUrl: jest.fn().mockResolvedValue(undefined),
    ...overrides,
  } as jest.Mocked<IOrganizationRepository>
}

function makePersonRepo(overrides: Partial<IPersonRepository> = {}): jest.Mocked<IPersonRepository> {
  return {
    create: jest.fn(),
    findById: jest.fn().mockResolvedValue(MOCK_PERSON),
    findByCpf: jest.fn().mockResolvedValue(MOCK_TARGET_PERSON),
    findByUserId: jest.fn().mockResolvedValue(MOCK_PERSON),
    update: jest.fn(),
    delete: jest.fn(),
    ...overrides,
  } as jest.Mocked<IPersonRepository>
}

beforeEach(() => {
  loggerInfoSpy.mockClear()
})

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('OrganizationService — audit log', () => {
  describe('create', () => {
    it('logs org.created after successful creation', async () => {
      const orgRepo = makeOrgRepo()
      const personRepo = makePersonRepo()
      const service = new OrganizationService(orgRepo, personRepo)

      await service.create({ name: 'Test Org', type: 'NGO' }, 'user-1')

      expect(loggerInfoSpy).toHaveBeenCalledWith(
        'org.created',
        expect.objectContaining({ orgId: 'org-1', actorUserId: 'user-1', action: 'org.created' }),
      )
    })
  })

  describe('update', () => {
    it('logs org.updated after successful update', async () => {
      const orgRepo = makeOrgRepo()
      const personRepo = makePersonRepo()
      const service = new OrganizationService(orgRepo, personRepo)

      await service.update('org-1', { name: 'New Name' }, 'user-1')

      expect(loggerInfoSpy).toHaveBeenCalledWith(
        'org.updated',
        expect.objectContaining({ orgId: 'org-1', actorUserId: 'user-1', action: 'org.updated' }),
      )
    })
  })

  describe('delete', () => {
    it('logs org.deleted after successful deletion', async () => {
      const orgRepo = makeOrgRepo()
      const personRepo = makePersonRepo()
      const service = new OrganizationService(orgRepo, personRepo)

      await service.delete('org-1', 'user-1')

      expect(loggerInfoSpy).toHaveBeenCalledWith(
        'org.deleted',
        expect.objectContaining({ orgId: 'org-1', actorUserId: 'user-1', action: 'org.deleted' }),
      )
    })
  })

  describe('addMember', () => {
    it('logs org.member.added after successful member addition', async () => {
      const orgRepo = makeOrgRepo({ hasPerson: jest.fn().mockResolvedValue(false) })
      const personRepo = makePersonRepo()
      const service = new OrganizationService(orgRepo, personRepo)

      await service.addMember('org-1', '11144477735', 'MEMBER', 'user-1')

      expect(loggerInfoSpy).toHaveBeenCalledWith(
        'org.member.added',
        expect.objectContaining({
          orgId: 'org-1',
          actorUserId: 'user-1',
          action: 'org.member.added',
          payload: expect.objectContaining({ personId: 'person-2', role: 'MEMBER' }),
        }),
      )
    })
  })

  describe('removePerson', () => {
    it('logs org.member.removed after successful member removal', async () => {
      const orgRepo = makeOrgRepo({ getRole: jest.fn().mockResolvedValue('MEMBER') })
      const personRepo = makePersonRepo()
      const service = new OrganizationService(orgRepo, personRepo)

      await service.removePerson('org-1', 'person-2')

      expect(loggerInfoSpy).toHaveBeenCalledWith(
        'org.member.removed',
        expect.objectContaining({
          orgId: 'org-1',
          action: 'org.member.removed',
          payload: expect.objectContaining({ personId: 'person-2' }),
        }),
      )
    })
  })

  describe('changeRole', () => {
    it('logs org.member.role.changed after successful role change', async () => {
      const orgRepo = makeOrgRepo({ hasPerson: jest.fn().mockResolvedValue(true) })
      const personRepo = makePersonRepo()
      const service = new OrganizationService(orgRepo, personRepo)

      await service.changeRole('org-1', 'person-2', 'MANAGER')

      expect(loggerInfoSpy).toHaveBeenCalledWith(
        'org.member.role.changed',
        expect.objectContaining({
          orgId: 'org-1',
          action: 'org.member.role.changed',
          payload: expect.objectContaining({ personId: 'person-2', newRole: 'MANAGER' }),
        }),
      )
    })
  })

  describe('uploadPhoto', () => {
    it('logs org.photo.updated after successful photo upload', async () => {
      const orgRepo = makeOrgRepo()
      const personRepo = makePersonRepo()
      const service = new OrganizationService(orgRepo, personRepo)

      await service.uploadPhoto('org-1', 'user-1', Buffer.from([0xff, 0xd8, 0xff]), 'image/jpeg')

      expect(loggerInfoSpy).toHaveBeenCalledWith(
        'org.photo.updated',
        expect.objectContaining({ orgId: 'org-1', actorUserId: 'user-1', action: 'org.photo.updated' }),
      )
    })
  })
})
