/**
 * @module auth
 * @file auth.service.test.ts
 * @description Unit tests for AuthService — repository, bcrypt and email service are mocked.
 */

import bcrypt from 'bcrypt'
import jwt from 'jsonwebtoken'
import type { IAuthRepository } from '../auth.repository'
import type { IEmailService } from '../../../shared/utils/email'
import type { IPersonRepository } from '../../person'
import type { PersonSnapshot, UserRecord } from '../auth.types'
import { AuthService } from '../auth.service'

jest.mock('bcrypt')
const mockedBcrypt = bcrypt as jest.Mocked<typeof bcrypt>

// ─── Fixtures ────────────────────────────────────────────────────────────────

const MOCK_USER: UserRecord = {
  id: 'user-1',
  email: 'test@example.com',
  passwordHash: '$2b$10$hashedpassword',
  refreshToken: null,
  emailVerified: true,
  verificationToken: null,
  verificationTokenExpiresAt: null,
  resetPasswordToken: null,
  resetPasswordTokenExpiresAt: null,
}

const UNVERIFIED_USER: UserRecord = {
  ...MOCK_USER,
  emailVerified: false,
  verificationToken: 'verify-token-abc',
  verificationTokenExpiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
}

const MOCK_PERSON_RECORD = {
  id: 'person-1',
  userId: 'user-1',
  name: 'João Silva',
  cpf: '52998224725',
  phone: null,
  createdAt: new Date(),
  updatedAt: new Date(),
}

const MOCK_PERSON_SNAPSHOT: PersonSnapshot = {
  id: 'person-1',
  userId: 'user-1',
  name: 'João Silva',
  cpf: '52998224725',
  phone: null,
}

function makeRepo(overrides: Partial<IAuthRepository> = {}): jest.Mocked<IAuthRepository> {
  return {
    findUserByEmail: jest.fn(),
    findUserById: jest.fn(),
    createUserWithPerson: jest.fn(),
    setRefreshToken: jest.fn(),
    findUserByRefreshToken: jest.fn(),
    setVerificationToken: jest.fn(),
    findUserByVerificationToken: jest.fn(),
    markEmailVerified: jest.fn(),
    setResetPasswordToken: jest.fn(),
    findUserByResetPasswordToken: jest.fn(),
    updatePassword: jest.fn(),
    clearResetPasswordToken: jest.fn(),
    ...overrides,
  } as jest.Mocked<IAuthRepository>
}

function makeEmail(overrides: Partial<IEmailService> = {}): jest.Mocked<IEmailService> {
  return {
    sendVerificationEmail: jest.fn().mockResolvedValue(undefined),
    sendPasswordResetEmail: jest.fn().mockResolvedValue(undefined),
    ...overrides,
  } as jest.Mocked<IEmailService>
}

function makePersonRepo(overrides: Partial<IPersonRepository> = {}): jest.Mocked<IPersonRepository> {
  return {
    create: jest.fn(),
    findById: jest.fn(),
    findByUserId: jest.fn(),
    findByCpf: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    ...overrides,
  } as jest.Mocked<IPersonRepository>
}

// ─── Tests ───────────────────────────────────────────────────────────────────

describe('AuthService', () => {
  let service: AuthService
  let repo: jest.Mocked<IAuthRepository>
  let email: jest.Mocked<IEmailService>
  let personRepo: jest.Mocked<IPersonRepository>

  beforeEach(() => {
    repo = makeRepo()
    email = makeEmail()
    personRepo = makePersonRepo()
    service = new AuthService(repo, email, personRepo)
  })

  // ── register ──────────────────────────────────────────────────────────────

  describe('register', () => {
    const VALID_INPUT = {
      email: 'new@example.com',
      password: 'password123',
      name: 'João Silva',
      cpf: '52998224725',
    }

    it('throws ConflictError if email already in use', async () => {
      repo.findUserByEmail.mockResolvedValueOnce(MOCK_USER)

      await expect(
        service.register({ ...VALID_INPUT, email: 'test@example.com' }),
      ).rejects.toMatchObject({ statusCode: 409, code: 'EMAIL_ALREADY_IN_USE' })
    })

    it('throws INVALID_CPF when CPF fails check-digit', async () => {
      repo.findUserByEmail.mockResolvedValueOnce(null)

      await expect(
        service.register({ ...VALID_INPUT, cpf: '11111111111' }),
      ).rejects.toMatchObject({ statusCode: 400, code: 'INVALID_CPF' })
    })

    it('throws CPF_ALREADY_IN_USE when CPF is already registered', async () => {
      repo.findUserByEmail.mockResolvedValueOnce(null)
      personRepo.findByCpf.mockResolvedValueOnce(MOCK_PERSON_RECORD)

      await expect(
        service.register(VALID_INPUT),
      ).rejects.toMatchObject({ statusCode: 409, code: 'CPF_ALREADY_IN_USE' })
    })

    it('creates user and person atomically via createUserWithPerson, sends verification email and returns tokens + person', async () => {
      repo.findUserByEmail.mockResolvedValueOnce(null)
      personRepo.findByCpf.mockResolvedValueOnce(null)
      repo.createUserWithPerson.mockResolvedValueOnce({
        user: { ...UNVERIFIED_USER },
        person: MOCK_PERSON_SNAPSHOT,
      })
      repo.setRefreshToken.mockResolvedValueOnce(undefined)
      repo.setVerificationToken.mockResolvedValueOnce(undefined)
      mockedBcrypt.hash.mockResolvedValueOnce('$2b$10$hashed' as never)

      const result = await service.register(VALID_INPUT)

      expect(result).toHaveProperty('accessToken')
      expect(result).toHaveProperty('refreshToken')
      expect(result.person?.name).toBe('João Silva')
      expect(result.person?.id).toBe('person-1')
      expect(repo.createUserWithPerson).toHaveBeenCalledWith(
        'new@example.com',
        '$2b$10$hashed',
        expect.objectContaining({ name: 'João Silva', cpf: '52998224725' }),
      )
      expect(personRepo.create).not.toHaveBeenCalled()
      expect(repo.setVerificationToken).toHaveBeenCalledWith(
        UNVERIFIED_USER.id,
        expect.any(String),
        expect.any(Date),
      )
      expect(email.sendVerificationEmail).toHaveBeenCalledWith(
        UNVERIFIED_USER.email,
        expect.any(String),
      )
    })

    it('userId da Person criada é igual ao id do User', async () => {
      repo.findUserByEmail.mockResolvedValueOnce(null)
      personRepo.findByCpf.mockResolvedValueOnce(null)
      repo.createUserWithPerson.mockResolvedValueOnce({
        user: { ...UNVERIFIED_USER, id: 'user-abc' },
        person: { ...MOCK_PERSON_SNAPSHOT, userId: 'user-abc' },
      })
      repo.setRefreshToken.mockResolvedValueOnce(undefined)
      repo.setVerificationToken.mockResolvedValueOnce(undefined)
      mockedBcrypt.hash.mockResolvedValueOnce('$2b$10$hashed' as never)

      const result = await service.register(VALID_INPUT)

      expect(result.user.id).toBe('user-abc')
      expect(result.person?.id).toBe('person-1')
    })

    it('nenhuma entidade persiste se createUserWithPerson lança erro (rollback atômico)', async () => {
      repo.findUserByEmail.mockResolvedValueOnce(null)
      personRepo.findByCpf.mockResolvedValueOnce(null)
      repo.createUserWithPerson.mockRejectedValueOnce(
        new Error('Unique constraint failed on cpf'),
      )
      mockedBcrypt.hash.mockResolvedValueOnce('$2b$10$hashed' as never)

      await expect(service.register(VALID_INPUT)).rejects.toThrow()
      expect(repo.setRefreshToken).not.toHaveBeenCalled()
      expect(email.sendVerificationEmail).not.toHaveBeenCalled()
    })
  })

  // ── login ─────────────────────────────────────────────────────────────────

  describe('login', () => {
    it('throws UnauthorizedError if user not found', async () => {
      repo.findUserByEmail.mockResolvedValueOnce(null)

      await expect(
        service.login({ email: 'ghost@example.com', password: 'any' }),
      ).rejects.toMatchObject({ statusCode: 401 })
    })

    it('throws UnauthorizedError if password is wrong', async () => {
      repo.findUserByEmail.mockResolvedValueOnce(MOCK_USER)
      mockedBcrypt.compare.mockResolvedValueOnce(false as never)

      await expect(
        service.login({ email: 'test@example.com', password: 'wrongpassword' }),
      ).rejects.toMatchObject({ statusCode: 401 })
    })

    it('throws ForbiddenError EMAIL_NOT_VERIFIED if email is not verified', async () => {
      repo.findUserByEmail.mockResolvedValueOnce(UNVERIFIED_USER)
      mockedBcrypt.compare.mockResolvedValueOnce(true as never)

      await expect(
        service.login({ email: 'test@example.com', password: 'correctpassword' }),
      ).rejects.toMatchObject({ statusCode: 403, code: 'EMAIL_NOT_VERIFIED' })
    })

    it('returns tokens and person on valid credentials with verified email', async () => {
      repo.findUserByEmail.mockResolvedValueOnce(MOCK_USER)
      repo.setRefreshToken.mockResolvedValueOnce(undefined)
      personRepo.findByUserId.mockResolvedValueOnce(MOCK_PERSON_RECORD)
      mockedBcrypt.compare.mockResolvedValueOnce(true as never)

      const result = await service.login({ email: 'test@example.com', password: 'correctpassword' })

      expect(result).toHaveProperty('accessToken')
      expect(result).toHaveProperty('refreshToken')
      expect(result.person?.id).toBe('person-1')
      expect(repo.setRefreshToken).toHaveBeenCalledWith('user-1', expect.any(String))
    })

    it('returns person as null when user has no person profile', async () => {
      repo.findUserByEmail.mockResolvedValueOnce(MOCK_USER)
      repo.setRefreshToken.mockResolvedValueOnce(undefined)
      personRepo.findByUserId.mockResolvedValueOnce(null)
      mockedBcrypt.compare.mockResolvedValueOnce(true as never)

      const result = await service.login({ email: 'test@example.com', password: 'correctpassword' })

      expect(result.person).toBeNull()
    })
  })

  // ── refresh ───────────────────────────────────────────────────────────────

  describe('refresh', () => {
    it('throws UnauthorizedError if token not found in DB', async () => {
      repo.findUserByRefreshToken.mockResolvedValueOnce(null)

      await expect(
        service.refresh({ refreshToken: 'unknown-token' }),
      ).rejects.toMatchObject({ statusCode: 401 })
    })

    it('throws UnauthorizedError if JWT is invalid', async () => {
      repo.findUserByRefreshToken.mockResolvedValueOnce(MOCK_USER)

      await expect(
        service.refresh({ refreshToken: 'not-a-valid-jwt' }),
      ).rejects.toMatchObject({ statusCode: 401 })
    })

    it('returns new accessToken for valid refresh token', async () => {
      const validRefreshToken = jwt.sign(
        { sub: 'user-1' },
        process.env.JWT_REFRESH_SECRET ?? 'test-refresh-secret-min-32-chars!!',
        { expiresIn: '7d' },
      )
      const userWithToken: UserRecord = { ...MOCK_USER, refreshToken: validRefreshToken }

      repo.findUserByRefreshToken.mockResolvedValueOnce(userWithToken)
      repo.setRefreshToken.mockResolvedValueOnce(undefined)

      const result = await service.refresh({ refreshToken: validRefreshToken })

      expect(result).toHaveProperty('accessToken')
      expect(repo.setRefreshToken).toHaveBeenCalledWith('user-1', expect.any(String))
    })
  })

  // ── logout ────────────────────────────────────────────────────────────────

  describe('logout', () => {
    it('clears the refresh token in the database', async () => {
      repo.setRefreshToken.mockResolvedValueOnce(undefined)

      await service.logout('user-1')

      expect(repo.setRefreshToken).toHaveBeenCalledWith('user-1', null)
    })
  })

  // ── verifyEmail ───────────────────────────────────────────────────────────

  describe('verifyEmail', () => {
    it('throws BadRequestError if token not found', async () => {
      repo.findUserByVerificationToken.mockResolvedValueOnce(null)

      await expect(
        service.verifyEmail({ token: 'invalid-token' }),
      ).rejects.toMatchObject({ statusCode: 400, code: 'INVALID_VERIFICATION_TOKEN' })
    })

    it('throws BadRequestError if token is expired', async () => {
      const expiredUser: UserRecord = {
        ...UNVERIFIED_USER,
        verificationTokenExpiresAt: new Date(Date.now() - 1000),
      }
      repo.findUserByVerificationToken.mockResolvedValueOnce(expiredUser)

      await expect(
        service.verifyEmail({ token: 'expired-token' }),
      ).rejects.toMatchObject({ statusCode: 400, code: 'VERIFICATION_TOKEN_EXPIRED' })
    })

    it('marks email as verified on valid token', async () => {
      repo.findUserByVerificationToken.mockResolvedValueOnce(UNVERIFIED_USER)
      repo.markEmailVerified.mockResolvedValueOnce(undefined)

      await service.verifyEmail({ token: 'verify-token-abc' })

      expect(repo.markEmailVerified).toHaveBeenCalledWith(UNVERIFIED_USER.id)
    })
  })

  // ── resendVerification ────────────────────────────────────────────────────

  describe('resendVerification', () => {
    it('does nothing if user not found (no info leak)', async () => {
      repo.findUserByEmail.mockResolvedValueOnce(null)

      await service.resendVerification({ email: 'ghost@example.com' })

      expect(email.sendVerificationEmail).not.toHaveBeenCalled()
    })

    it('does nothing if email is already verified', async () => {
      repo.findUserByEmail.mockResolvedValueOnce(MOCK_USER)

      await service.resendVerification({ email: MOCK_USER.email })

      expect(email.sendVerificationEmail).not.toHaveBeenCalled()
    })

    it('sends new verification email to unverified user', async () => {
      repo.findUserByEmail.mockResolvedValueOnce(UNVERIFIED_USER)
      repo.setVerificationToken.mockResolvedValueOnce(undefined)

      await service.resendVerification({ email: UNVERIFIED_USER.email })

      expect(repo.setVerificationToken).toHaveBeenCalledWith(
        UNVERIFIED_USER.id,
        expect.any(String),
        expect.any(Date),
      )
      expect(email.sendVerificationEmail).toHaveBeenCalledWith(
        UNVERIFIED_USER.email,
        expect.any(String),
      )
    })
  })

  // ── forgotPassword ────────────────────────────────────────────────────────

  describe('forgotPassword', () => {
    it('does nothing if user not found (no info leak)', async () => {
      repo.findUserByEmail.mockResolvedValueOnce(null)

      await service.forgotPassword({ email: 'ghost@example.com' })

      expect(email.sendPasswordResetEmail).not.toHaveBeenCalled()
    })

    it('generates reset token and sends email', async () => {
      repo.findUserByEmail.mockResolvedValueOnce(MOCK_USER)
      repo.setResetPasswordToken.mockResolvedValueOnce(undefined)

      await service.forgotPassword({ email: MOCK_USER.email })

      expect(repo.setResetPasswordToken).toHaveBeenCalledWith(
        MOCK_USER.id,
        expect.any(String),
        expect.any(Date),
      )
      expect(email.sendPasswordResetEmail).toHaveBeenCalledWith(
        MOCK_USER.email,
        expect.any(String),
      )
    })
  })

  // ── resetPassword ─────────────────────────────────────────────────────────

  describe('resetPassword', () => {
    it('throws BadRequestError if token not found', async () => {
      repo.findUserByResetPasswordToken.mockResolvedValueOnce(null)

      await expect(
        service.resetPassword({ token: 'invalid-token', newPassword: 'newpass123' }),
      ).rejects.toMatchObject({ statusCode: 400, code: 'INVALID_RESET_TOKEN' })
    })

    it('throws BadRequestError if token is expired', async () => {
      const userWithExpiredToken: UserRecord = {
        ...MOCK_USER,
        resetPasswordToken: 'some-token',
        resetPasswordTokenExpiresAt: new Date(Date.now() - 1000),
      }
      repo.findUserByResetPasswordToken.mockResolvedValueOnce(userWithExpiredToken)

      await expect(
        service.resetPassword({ token: 'some-token', newPassword: 'newpass123' }),
      ).rejects.toMatchObject({ statusCode: 400, code: 'RESET_TOKEN_EXPIRED' })
    })

    it('updates password and clears token on valid token', async () => {
      const userWithToken: UserRecord = {
        ...MOCK_USER,
        resetPasswordToken: 'valid-token',
        resetPasswordTokenExpiresAt: new Date(Date.now() + 60 * 60 * 1000),
      }
      repo.findUserByResetPasswordToken.mockResolvedValueOnce(userWithToken)
      repo.updatePassword.mockResolvedValueOnce(undefined)
      repo.clearResetPasswordToken.mockResolvedValueOnce(undefined)
      mockedBcrypt.hash.mockResolvedValueOnce('$2b$10$newhashed' as never)

      await service.resetPassword({ token: 'valid-token', newPassword: 'newpass123' })

      expect(repo.updatePassword).toHaveBeenCalledWith(MOCK_USER.id, '$2b$10$newhashed')
      expect(repo.clearResetPasswordToken).toHaveBeenCalledWith(MOCK_USER.id)
    })
  })
})
