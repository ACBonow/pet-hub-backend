/**
 * @module shared
 * @file org-permission.ts
 * @description Utility for checking organization member permissions.
 *              Always use this — never implement role checks inline.
 *              Includes an in-memory role cache (TTL: 30s) to avoid
 *              redundant DB queries on repeated requests (TECH-BE-016).
 */

import { prisma } from '../config/database'
import type { OrgRole } from '../../modules/organization/organization.types'

const ROLE_RANK: Record<OrgRole, number> = {
  OWNER: 3,
  MANAGER: 2,
  MEMBER: 1,
}

const CACHE_TTL_MS = 30_000

interface CacheEntry {
  role: OrgRole | null
  expiresAt: number
}

const roleCache = new Map<string, CacheEntry>()

/** Clears the entire role cache. Exported for use in tests. */
export function clearOrgRoleCache(): void {
  roleCache.clear()
}

/**
 * Returns true if the user has at least `minRole` in the given organization.
 * Resolves the user's personId internally.
 * Results are cached per (userId, orgId) for CACHE_TTL_MS milliseconds.
 */
export async function hasOrgPermission(
  userId: string,
  orgId: string,
  minRole: OrgRole,
): Promise<boolean> {
  const cacheKey = `${userId}:${orgId}`
  const cached = roleCache.get(cacheKey)

  let role: OrgRole | null

  if (cached && Date.now() < cached.expiresAt) {
    role = cached.role
  } else {
    const person = await prisma.person.findUnique({ where: { userId } })
    if (!person) {
      roleCache.set(cacheKey, { role: null, expiresAt: Date.now() + CACHE_TTL_MS })
      return false
    }

    const membership = await prisma.organizationPerson.findUnique({
      where: { organizationId_personId: { organizationId: orgId, personId: person.id } },
    })

    role = membership ? (membership.role as OrgRole) : null
    roleCache.set(cacheKey, { role, expiresAt: Date.now() + CACHE_TTL_MS })
  }

  if (!role) return false
  return ROLE_RANK[role] >= ROLE_RANK[minRole]
}
