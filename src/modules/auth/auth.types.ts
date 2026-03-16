/**
 * @module auth
 * @file auth.types.ts
 * @description TypeScript interfaces for the auth module.
 */

export interface RegisterInput {
  email: string
  password: string
}

export interface LoginInput {
  email: string
  password: string
}

export interface RefreshInput {
  refreshToken: string
}

export interface AuthTokens {
  accessToken: string
  refreshToken: string
}

export interface AuthUser {
  id: string
  email: string
}

export interface UserRecord {
  id: string
  email: string
  passwordHash: string
  refreshToken: string | null
}
