/**
 * @module auth
 * @file auth.repository.ts
 * @description Repository interface and Prisma implementation for user persistence.
 */

import { prisma } from '../../shared/config/database'
import type { UserRecord } from './auth.types'

export interface IAuthRepository {
  findUserByEmail(email: string): Promise<UserRecord | null>
  findUserById(id: string): Promise<UserRecord | null>
  createUser(email: string, passwordHash: string): Promise<UserRecord>
  setRefreshToken(userId: string, token: string | null): Promise<void>
  findUserByRefreshToken(token: string): Promise<UserRecord | null>
  setVerificationToken(userId: string, token: string, expiresAt: Date): Promise<void>
  findUserByVerificationToken(token: string): Promise<UserRecord | null>
  markEmailVerified(userId: string): Promise<void>
  setResetPasswordToken(userId: string, token: string, expiresAt: Date): Promise<void>
  findUserByResetPasswordToken(token: string): Promise<UserRecord | null>
  updatePassword(userId: string, passwordHash: string): Promise<void>
  clearResetPasswordToken(userId: string): Promise<void>
}

export class PrismaAuthRepository implements IAuthRepository {
  async findUserByEmail(email: string): Promise<UserRecord | null> {
    return prisma.user.findUnique({ where: { email } })
  }

  async findUserById(id: string): Promise<UserRecord | null> {
    return prisma.user.findUnique({ where: { id } })
  }

  async createUser(email: string, passwordHash: string): Promise<UserRecord> {
    return prisma.user.create({ data: { email, passwordHash } })
  }

  async setRefreshToken(userId: string, token: string | null): Promise<void> {
    await prisma.user.update({ where: { id: userId }, data: { refreshToken: token } })
  }

  async findUserByRefreshToken(token: string): Promise<UserRecord | null> {
    return prisma.user.findFirst({ where: { refreshToken: token } })
  }

  async setVerificationToken(userId: string, token: string, expiresAt: Date): Promise<void> {
    await prisma.user.update({
      where: { id: userId },
      data: { verificationToken: token, verificationTokenExpiresAt: expiresAt },
    })
  }

  async findUserByVerificationToken(token: string): Promise<UserRecord | null> {
    return prisma.user.findFirst({ where: { verificationToken: token } })
  }

  async markEmailVerified(userId: string): Promise<void> {
    await prisma.user.update({
      where: { id: userId },
      data: { emailVerified: true, verificationToken: null, verificationTokenExpiresAt: null },
    })
  }

  async setResetPasswordToken(userId: string, token: string, expiresAt: Date): Promise<void> {
    await prisma.user.update({
      where: { id: userId },
      data: { resetPasswordToken: token, resetPasswordTokenExpiresAt: expiresAt },
    })
  }

  async findUserByResetPasswordToken(token: string): Promise<UserRecord | null> {
    return prisma.user.findFirst({ where: { resetPasswordToken: token } })
  }

  async updatePassword(userId: string, passwordHash: string): Promise<void> {
    await prisma.user.update({ where: { id: userId }, data: { passwordHash } })
  }

  async clearResetPasswordToken(userId: string): Promise<void> {
    await prisma.user.update({
      where: { id: userId },
      data: { resetPasswordToken: null, resetPasswordTokenExpiresAt: null },
    })
  }
}
