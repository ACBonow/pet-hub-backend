/**
 * @module auth
 * @file auth.service.ts
 * @description Business logic for authentication: register, login, token refresh, logout,
 *              email verification and password recovery.
 *              Register creates both User and Person atomically — every user has a profile.
 */

import bcrypt from 'bcrypt'
import crypto from 'crypto'
import jwt, { type SignOptions } from 'jsonwebtoken'
import { AppError } from '../../shared/errors/AppError'
import { env } from '../../shared/config/env'
import { HttpError } from '../../shared/errors/HttpError'
import { sanitizeCpf, validateCpf } from '../../shared/validators/cpf.validator'
import type { IEmailService } from '../../shared/utils/email'
import type { IPersonRepository } from '../person'
import type { IAuthRepository } from './auth.repository'
import type {
  AuthLoginResponse,
  AuthTokens,
  ForgotPasswordInput,
  LoginInput,
  RefreshInput,
  RegisterInput,
  ResendVerificationInput,
  ResetPasswordInput,
  VerifyEmailInput,
} from './auth.types'

const BCRYPT_ROUNDS = 10
const VERIFICATION_TOKEN_TTL_MS = 24 * 60 * 60 * 1000 // 24 hours
const RESET_TOKEN_TTL_MS = 60 * 60 * 1000 // 1 hour

function generateSecureToken(): string {
  return crypto.randomBytes(32).toString('hex')
}

export function generateTokens(userId: string): AuthTokens {
  const accessOptions = { expiresIn: env.JWT_EXPIRES_IN } as SignOptions
  const refreshOptions = { expiresIn: env.JWT_REFRESH_EXPIRES_IN } as SignOptions

  const accessToken = jwt.sign({ sub: userId }, env.JWT_SECRET, accessOptions)
  const refreshToken = jwt.sign({ sub: userId }, env.JWT_REFRESH_SECRET, refreshOptions)
  return { accessToken, refreshToken }
}

export class AuthService {
  constructor(
    private repository: IAuthRepository,
    private emailService: IEmailService,
    private personRepository: IPersonRepository,
  ) {}

  async register(input: RegisterInput): Promise<AuthLoginResponse> {
    const existing = await this.repository.findUserByEmail(input.email)
    if (existing) {
      throw HttpError.conflict('EMAIL_ALREADY_IN_USE', 'E-mail já está em uso.')
    }

    const cpf = sanitizeCpf(input.cpf)
    if (!validateCpf(cpf)) {
      throw HttpError.badRequest('INVALID_CPF', 'O CPF informado não é válido.')
    }

    const existingPerson = await this.personRepository.findByCpf(cpf)
    if (existingPerson) {
      throw HttpError.conflict('CPF_ALREADY_IN_USE', 'Este CPF já está cadastrado.')
    }

    const passwordHash = await bcrypt.hash(input.password, BCRYPT_ROUNDS)
    const user = await this.repository.createUser(input.email, passwordHash)

    const person = await this.personRepository.create({
      userId: user.id,
      name: input.name,
      cpf,
      phone: input.phone,
    })

    const verificationToken = generateSecureToken()
    const verificationTokenExpiresAt = new Date(Date.now() + VERIFICATION_TOKEN_TTL_MS)
    await this.repository.setVerificationToken(user.id, verificationToken, verificationTokenExpiresAt)
    await this.emailService.sendVerificationEmail(user.email, verificationToken)

    const tokens = generateTokens(user.id)
    await this.repository.setRefreshToken(user.id, tokens.refreshToken)

    return {
      ...tokens,
      user: { id: user.id, email: user.email },
      person: { id: person.id, name: person.name, cpf: person.cpf },
    }
  }

  async login(input: LoginInput): Promise<AuthLoginResponse> {
    const user = await this.repository.findUserByEmail(input.email)
    if (!user) {
      throw HttpError.unauthorized('E-mail ou senha inválidos.')
    }

    const passwordMatch = await bcrypt.compare(input.password, user.passwordHash)
    if (!passwordMatch) {
      throw HttpError.unauthorized('E-mail ou senha inválidos.')
    }

    if (!user.emailVerified) {
      throw new AppError(403, 'EMAIL_NOT_VERIFIED', 'Confirme seu e-mail antes de fazer login.')
    }

    const tokens = generateTokens(user.id)
    await this.repository.setRefreshToken(user.id, tokens.refreshToken)

    const personRecord = await this.personRepository.findByUserId(user.id)
    const person = personRecord
      ? { id: personRecord.id, name: personRecord.name, cpf: personRecord.cpf }
      : null

    return { ...tokens, user: { id: user.id, email: user.email }, person }
  }

  async refresh(input: RefreshInput): Promise<AuthTokens> {
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

    return tokens
  }

  async logout(userId: string): Promise<void> {
    await this.repository.setRefreshToken(userId, null)
  }

  async verifyEmail(input: VerifyEmailInput): Promise<void> {
    const user = await this.repository.findUserByVerificationToken(input.token)
    if (!user) {
      throw new AppError(400, 'INVALID_VERIFICATION_TOKEN', 'Token de verificação inválido.')
    }

    if (!user.verificationTokenExpiresAt || user.verificationTokenExpiresAt < new Date()) {
      throw new AppError(400, 'VERIFICATION_TOKEN_EXPIRED', 'Token de verificação expirado.')
    }

    await this.repository.markEmailVerified(user.id)
  }

  async resendVerification(input: ResendVerificationInput): Promise<void> {
    const user = await this.repository.findUserByEmail(input.email)
    if (!user || user.emailVerified) {
      return
    }

    const verificationToken = generateSecureToken()
    const verificationTokenExpiresAt = new Date(Date.now() + VERIFICATION_TOKEN_TTL_MS)
    await this.repository.setVerificationToken(user.id, verificationToken, verificationTokenExpiresAt)
    await this.emailService.sendVerificationEmail(user.email, verificationToken)
  }

  async forgotPassword(input: ForgotPasswordInput): Promise<void> {
    const user = await this.repository.findUserByEmail(input.email)
    if (!user) {
      return
    }

    const resetToken = generateSecureToken()
    const resetTokenExpiresAt = new Date(Date.now() + RESET_TOKEN_TTL_MS)
    await this.repository.setResetPasswordToken(user.id, resetToken, resetTokenExpiresAt)
    await this.emailService.sendPasswordResetEmail(user.email, resetToken)
  }

  async resetPassword(input: ResetPasswordInput): Promise<void> {
    const user = await this.repository.findUserByResetPasswordToken(input.token)
    if (!user) {
      throw new AppError(400, 'INVALID_RESET_TOKEN', 'Token de redefinição inválido.')
    }

    if (!user.resetPasswordTokenExpiresAt || user.resetPasswordTokenExpiresAt < new Date()) {
      throw new AppError(400, 'RESET_TOKEN_EXPIRED', 'Token de redefinição expirado.')
    }

    const passwordHash = await bcrypt.hash(input.newPassword, BCRYPT_ROUNDS)
    await this.repository.updatePassword(user.id, passwordHash)
    await this.repository.clearResetPasswordToken(user.id)
  }
}
