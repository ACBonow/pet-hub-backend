/**
 * @module auth
 * @file index.ts
 * @description Public surface of the auth module.
 */

export { AuthService, generateTokens } from './auth.service'
export { PrismaAuthRepository } from './auth.repository'
export type { IAuthRepository } from './auth.repository'
export { registerAuthRoutes } from './auth.routes'
export type { AuthTokens, AuthUser, LoginInput, RefreshInput, RegisterInput } from './auth.types'
