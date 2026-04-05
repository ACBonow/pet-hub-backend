/**
 * @module shared
 * @file org-permission-cache.test.ts
 * @description Unit tests for org-permission in-memory role cache (TECH-BE-016).
 */

jest.mock('../config/database', () => ({
  prisma: {
    person: { findUnique: jest.fn() },
    organizationPerson: { findUnique: jest.fn() },
  },
}))

import { prisma } from '../config/database'
import { hasOrgPermission, clearOrgRoleCache } from '../utils/org-permission'

const mockPerson = prisma.person as jest.Mocked<typeof prisma.person>
const mockOrgPerson = prisma.organizationPerson as jest.Mocked<typeof prisma.organizationPerson>

const USER_ID = 'user-1'
const ORG_ID = 'org-1'
const PERSON_ID = 'person-1'

function setupOwnerMocks() {
  mockPerson.findUnique.mockResolvedValue({ id: PERSON_ID } as any)
  mockOrgPerson.findUnique.mockResolvedValue({ role: 'OWNER' } as any)
}

describe('hasOrgPermission — in-memory cache', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    clearOrgRoleCache()
  })

  it('queries DB on cache miss and returns correct permission', async () => {
    setupOwnerMocks()

    const result = await hasOrgPermission(USER_ID, ORG_ID, 'OWNER')

    expect(result).toBe(true)
    expect(mockPerson.findUnique).toHaveBeenCalledTimes(1)
    expect(mockOrgPerson.findUnique).toHaveBeenCalledTimes(1)
  })

  it('returns cached result on second call without hitting DB again', async () => {
    setupOwnerMocks()

    await hasOrgPermission(USER_ID, ORG_ID, 'OWNER')
    jest.clearAllMocks()

    const result = await hasOrgPermission(USER_ID, ORG_ID, 'MANAGER')

    expect(result).toBe(true)
    expect(mockPerson.findUnique).not.toHaveBeenCalled()
    expect(mockOrgPerson.findUnique).not.toHaveBeenCalled()
  })

  it('uses different cache entries for different (userId, orgId) pairs', async () => {
    mockPerson.findUnique
      .mockResolvedValueOnce({ id: PERSON_ID } as any)
      .mockResolvedValueOnce({ id: 'person-2' } as any)
    mockOrgPerson.findUnique
      .mockResolvedValueOnce({ role: 'OWNER' } as any)
      .mockResolvedValueOnce({ role: 'MEMBER' } as any)

    const res1 = await hasOrgPermission(USER_ID, ORG_ID, 'OWNER')
    const res2 = await hasOrgPermission('user-2', ORG_ID, 'OWNER')

    expect(res1).toBe(true)
    expect(res2).toBe(false)
    expect(mockPerson.findUnique).toHaveBeenCalledTimes(2)
  })

  it('re-queries DB after cache entry expires (TTL elapsed)', async () => {
    const realDateNow = Date.now
    let fakeNow = 1_000_000

    Date.now = () => fakeNow

    setupOwnerMocks()
    await hasOrgPermission(USER_ID, ORG_ID, 'OWNER')

    jest.clearAllMocks()

    // Advance time by 31 seconds (past the 30s TTL)
    fakeNow += 31_000
    setupOwnerMocks()

    const result = await hasOrgPermission(USER_ID, ORG_ID, 'OWNER')

    expect(result).toBe(true)
    expect(mockPerson.findUnique).toHaveBeenCalledTimes(1)

    Date.now = realDateNow
  })

  it('caches null role (no membership) and avoids DB on repeat', async () => {
    mockPerson.findUnique.mockResolvedValue({ id: PERSON_ID } as any)
    mockOrgPerson.findUnique.mockResolvedValue(null)

    const res1 = await hasOrgPermission(USER_ID, ORG_ID, 'MEMBER')
    jest.clearAllMocks()
    const res2 = await hasOrgPermission(USER_ID, ORG_ID, 'MEMBER')

    expect(res1).toBe(false)
    expect(res2).toBe(false)
    expect(mockPerson.findUnique).not.toHaveBeenCalled()
  })

  it('caches null when person not found', async () => {
    mockPerson.findUnique.mockResolvedValue(null)

    const res1 = await hasOrgPermission(USER_ID, ORG_ID, 'MEMBER')
    jest.clearAllMocks()
    const res2 = await hasOrgPermission(USER_ID, ORG_ID, 'MEMBER')

    expect(res1).toBe(false)
    expect(res2).toBe(false)
    expect(mockPerson.findUnique).not.toHaveBeenCalled()
  })

  it('clearOrgRoleCache forces DB query on next call', async () => {
    setupOwnerMocks()
    await hasOrgPermission(USER_ID, ORG_ID, 'OWNER')

    clearOrgRoleCache()
    jest.clearAllMocks()
    setupOwnerMocks()

    await hasOrgPermission(USER_ID, ORG_ID, 'OWNER')

    expect(mockPerson.findUnique).toHaveBeenCalledTimes(1)
  })
})
