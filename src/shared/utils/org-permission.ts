/**
 * @module shared
 * @file org-permission.ts
 * @description Utility for checking organization member permissions.
 *              Always use this — never implement role checks inline.
 */

import { prisma } from '../config/database'
import type { OrgRole } from '../../modules/organization/organization.types'

const ROLE_RANK: Record<OrgRole, number> = {
  OWNER: 3,
  MANAGER: 2,
  MEMBER: 1,
}

/**
 * Returns true if the user has at least `minRole` in the given organization.
 * Resolves the user's personId internally.
 */
export async function hasOrgPermission(
  userId: string,
  orgId: string,
  minRole: OrgRole,
): Promise<boolean> {
  const person = await prisma.person.findUnique({ where: { userId } })
  if (!person) return false

  const membership = await prisma.organizationPerson.findUnique({
    where: { organizationId_personId: { organizationId: orgId, personId: person.id } },
  })
  if (!membership) return false

  return ROLE_RANK[membership.role as OrgRole] >= ROLE_RANK[minRole]
}
