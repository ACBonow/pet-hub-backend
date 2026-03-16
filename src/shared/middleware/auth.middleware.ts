/**
 * @module shared
 * @file auth.middleware.ts
 * @description JWT authentication guard. Verifies Bearer token and populates request.user.
 */

import type { FastifyReply, FastifyRequest } from 'fastify'
import jwt, { type JwtPayload } from 'jsonwebtoken'
import { env } from '../config/env'
import { HttpError } from '../errors/HttpError'

declare module 'fastify' {
  interface FastifyRequest {
    user?: { id: string }
  }
}

export async function authMiddleware(
  request: FastifyRequest,
  _reply: FastifyReply,
): Promise<void> {
  const authHeader = request.headers.authorization

  if (!authHeader?.startsWith('Bearer ')) {
    throw HttpError.unauthorized()
  }

  const token = authHeader.slice(7)

  try {
    const payload = jwt.verify(token, env.JWT_SECRET) as JwtPayload
    if (!payload.sub) {
      throw HttpError.unauthorized()
    }
    request.user = { id: payload.sub }
  } catch (error) {
    if (error instanceof Error && error.name === 'AppError') throw error
    throw HttpError.unauthorized()
  }
}
