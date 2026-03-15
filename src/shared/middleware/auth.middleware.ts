/**
 * @module shared
 * @file auth.middleware.ts
 * @description JWT authentication guard. Completed in TASK-BE-006.
 */

import { FastifyReply, FastifyRequest } from 'fastify'
import { HttpError } from '../errors/HttpError'

export async function authMiddleware(
  request: FastifyRequest,
  _reply: FastifyReply,
): Promise<void> {
  const authHeader = request.headers.authorization

  if (!authHeader?.startsWith('Bearer ')) {
    throw HttpError.unauthorized()
  }

  // JWT verification is implemented in TASK-BE-006 (auth module)
  // Stub: just check header presence for now
  const token = authHeader.slice(7)

  if (!token) {
    throw HttpError.unauthorized()
  }

  // request.user will be set here after TASK-BE-006
}
