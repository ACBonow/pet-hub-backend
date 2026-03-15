/**
 * @module shared
 * @file HttpError.ts
 * @description Factory functions for common HTTP errors.
 */

import { AppError } from './AppError'

export const HttpError = {
  badRequest: (code: string, message: string) =>
    new AppError(400, code, message),

  unauthorized: (message = 'Não autenticado.') =>
    new AppError(401, 'UNAUTHORIZED', message),

  forbidden: (message = 'Acesso negado.') =>
    new AppError(403, 'FORBIDDEN', message),

  notFound: (entity = 'Recurso') =>
    new AppError(404, 'NOT_FOUND', `${entity} não encontrado.`),

  conflict: (code: string, message: string) =>
    new AppError(409, code, message),

  internal: (message = 'Erro interno do servidor.') =>
    new AppError(500, 'INTERNAL_ERROR', message),
}
