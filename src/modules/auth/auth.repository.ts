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
}
