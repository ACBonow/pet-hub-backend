/**
 * @module shared
 * @file error.middleware.ts
 * @description Global error handler for Fastify. Converts AppError to standard response envelope.
 */

import { FastifyError, FastifyInstance, FastifyReply, FastifyRequest } from 'fastify'
import { AppError } from '../errors/AppError'
import { logger } from '../utils/logger'

export function registerErrorHandler(app: FastifyInstance): void {
  app.setErrorHandler(
    (error: FastifyError | AppError | Error, _request: FastifyRequest, reply: FastifyReply) => {
      if (error instanceof AppError) {
        return reply.status(error.statusCode).send({
          success: false,
          error: {
            code: error.code,
            message: error.message,
          },
        })
      }

      // Fastify validation errors
      if ('validation' in error && error.validation) {
        return reply.status(400).send({
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Dados inválidos na requisição.',
            details: error.validation,
          },
        })
      }

      logger.error('Unhandled error', { message: error.message, stack: error.stack })

      return reply.status(500).send({
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Erro interno do servidor.',
        },
      })
    },
  )
}
