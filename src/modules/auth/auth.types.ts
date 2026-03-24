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

export interface VerifyEmailInput {
  token: string
}

export interface ResendVerificationInput {
  email: string
}

export interface ForgotPasswordInput {
  email: string
}

export interface ResetPasswordInput {
  token: string
  newPassword: string
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
  emailVerified: boolean
  verificationToken: string | null
  verificationTokenExpiresAt: Date | null
  resetPasswordToken: string | null
  resetPasswordTokenExpiresAt: Date | null
}
