/**
 * @module auth
 * @file auth.service.test.ts
 * @description Unit tests for AuthService — repository and bcrypt are mocked.
 */

import bcrypt from 'bcrypt'
import jwt from 'jsonwebtoken'
import type { IAuthRepository } from '../auth.repository'
import type { UserRecord } from '../auth.types'
import { AuthService } from '../auth.service'

jest.mock('bcrypt')
const mockedBcrypt = bcrypt as jest.Mocked<typeof bcrypt>

// ─── Fixtures ────────────────────────────────────────────────────────────────

const MOCK_USER: UserRecord = {
  id: 'user-1',
  email: 'test@example.com',
  passwordHash: '$2b$10$hashedpassword',
  refreshToken: null,
}

function makeRepo(overrides: Partial<IAuthRepository> = {}): jest.Mocked<IAuthRepository> {
  return {
    findUserByEmail: jest.fn(),
    findUserById: jest.fn(),
    createUser: jest.fn(),
    setRefreshToken: jest.fn(),
    findUserByRefreshToken: jest.fn(),
    ...overrides,
  } as jest.Mocked<IAuthRepository>
}

// ─── Tests ───────────────────────────────────────────────────────────────────

describe('AuthService', () => {
  let service: AuthService
  let repo: jest.Mocked<IAuthRepository>

  beforeEach(() => {
    repo = makeRepo()
    service = new AuthService(repo)
  })

  // ── register ──────────────────────────────────────────────────────────────

  describe('register', () => {
    it('throws ConflictError if email already in use', async () => {
      repo.findUserByEmail.mockResolvedValueOnce(MOCK_USER)

      await expect(
        service.register({ email: 'test@example.com', password: 'password123' }),
      ).rejects.toMatchObject({ statusCode: 409, code: 'EMAIL_ALREADY_IN_USE' })
    })

    it('creates user with hashed password and returns tokens', async () => {
      repo.findUserByEmail.mockResolvedValueOnce(null)
      repo.createUser.mockResolvedValueOnce({ ...MOCK_USER })
      repo.setRefreshToken.mockResolvedValueOnce(undefined)
      mockedBcrypt.hash.mockResolvedValueOnce('$2b$10$hashed' as never)

      const result = await service.register({ email: 'new@example.com', password: 'password123' })

      expect(result).toHaveProperty('accessToken')
      expect(result).toHaveProperty('refreshToken')
      expect(repo.createUser).toHaveBeenCalledWith('new@example.com', '$2b$10$hashed')
      // Password must not be stored in plain text
      expect(repo.createUser.mock.calls[0][1]).not.toBe('password123')
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

    it('returns tokens on valid credentials', async () => {
      repo.findUserByEmail.mockResolvedValueOnce(MOCK_USER)
      repo.setRefreshToken.mockResolvedValueOnce(undefined)
      mockedBcrypt.compare.mockResolvedValueOnce(true as never)

      const result = await service.login({ email: 'test@example.com', password: 'correctpassword' })

      expect(result).toHaveProperty('accessToken')
      expect(result).toHaveProperty('refreshToken')
      expect(repo.setRefreshToken).toHaveBeenCalledWith('user-1', expect.any(String))
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
      // Token found in DB but JWT is malformed
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
})
