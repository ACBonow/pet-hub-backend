/**
 * @module auth
 * @file auth.service.ts
 * @description Business logic for authentication: register, login, token refresh and logout.
 */

import bcrypt from 'bcrypt'
import jwt, { type SignOptions } from 'jsonwebtoken'
import { env } from '../../shared/config/env'
import { HttpError } from '../../shared/errors/HttpError'
import type { IAuthRepository } from './auth.repository'
import type { AuthTokens, LoginInput, RefreshInput, RegisterInput } from './auth.types'

const BCRYPT_ROUNDS = 10

export function generateTokens(userId: string): AuthTokens {
  const accessOptions = { expiresIn: env.JWT_EXPIRES_IN } as SignOptions
  const refreshOptions = { expiresIn: env.JWT_REFRESH_EXPIRES_IN } as SignOptions

  const accessToken = jwt.sign({ sub: userId }, env.JWT_SECRET, accessOptions)
  const refreshToken = jwt.sign({ sub: userId }, env.JWT_REFRESH_SECRET, refreshOptions)
  return { accessToken, refreshToken }
}

export class AuthService {
  constructor(private repository: IAuthRepository) {}

  async register(input: RegisterInput): Promise<AuthTokens> {
    const existing = await this.repository.findUserByEmail(input.email)
    if (existing) {
      throw HttpError.conflict('EMAIL_ALREADY_IN_USE', 'E-mail já está em uso.')
    }

    const passwordHash = await bcrypt.hash(input.password, BCRYPT_ROUNDS)
    const user = await this.repository.createUser(input.email, passwordHash)

    const tokens = generateTokens(user.id)
    await this.repository.setRefreshToken(user.id, tokens.refreshToken)

    return tokens
  }

  async login(input: LoginInput): Promise<AuthTokens> {
    const user = await this.repository.findUserByEmail(input.email)
    if (!user) {
      throw HttpError.unauthorized('E-mail ou senha inválidos.')
    }

    const passwordMatch = await bcrypt.compare(input.password, user.passwordHash)
    if (!passwordMatch) {
      throw HttpError.unauthorized('E-mail ou senha inválidos.')
    }

    const tokens = generateTokens(user.id)
    await this.repository.setRefreshToken(user.id, tokens.refreshToken)

    return tokens
  }

  async refresh(input: RefreshInput): Promise<{ accessToken: string }> {
    const user = await this.repository.findUserByRefreshToken(input.refreshToken)
    if (!user) {
      throw HttpError.unauthorized('Refresh token inválido.')
    }

    try {
      jwt.verify(input.refreshToken, env.JWT_REFRESH_SECRET)
    } catch {
      throw HttpError.unauthorized('Refresh token expirado ou inválido.')
    }

    const tokens = generateTokens(user.id)
    await this.repository.setRefreshToken(user.id, tokens.refreshToken)

    return { accessToken: tokens.accessToken }
  }

  async logout(userId: string): Promise<void> {
    await this.repository.setRefreshToken(userId, null)
  }
}
