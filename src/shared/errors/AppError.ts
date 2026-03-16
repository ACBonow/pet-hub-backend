/**
 * @module shared
 * @file AppError.ts
 * @description Base class for all application errors. Carries HTTP status code and machine-readable error code.
 */

export class AppError extends Error {
  public readonly statusCode: number
  public readonly code: string

  constructor(statusCode: number, code: string, message: string) {
    super(message)
    this.name = 'AppError'
    this.statusCode = statusCode
    this.code = code
    Error.captureStackTrace(this, this.constructor)
  }
}
