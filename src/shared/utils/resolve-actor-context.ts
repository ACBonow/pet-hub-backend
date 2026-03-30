/**
 * @module shared
 * @file resolve-actor-context.ts
 * @description Validates that a user has at least MANAGER role in an organization.
 *              Call this on any endpoint that accepts organizationId in the body.
 */

import { AppError } from '../errors/AppError'
import { hasOrgPermission } from './org-permission'

/**
 * Throws INSUFFICIENT_PERMISSION (403) if userId does not have MANAGER or OWNER
 * role in the given organization.
 */
export async function resolveActorContext(
  userId: string,
  orgId: string,
): Promise<void> {
  const allowed = await hasOrgPermission(userId, orgId, 'MANAGER')
  if (!allowed) {
    throw new AppError(
      403,
      'INSUFFICIENT_PERMISSION',
      'Você não tem permissão para realizar esta ação na organização.',
    )
  }
}
