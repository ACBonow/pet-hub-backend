/**
 * @module shared
 * @file database.ts
 * @description Singleton PrismaClient instance for use across all modules.
 */

import { PrismaClient } from '@prisma/client'

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient }

/**
 * Ensures the DATABASE_URL always has pgbouncer=true for Supabase transaction pooler.
 * Without this, Prisma uses prepared statements that conflict across pooled connections
 * in serverless environments (PostgreSQL error 42P05).
 */
function buildDatasourceUrl(): string {
  const url = process.env.DATABASE_URL ?? ''
  if (!url || url.includes('pgbouncer=true')) return url
  const separator = url.includes('?') ? '&' : '?'
  return `${url}${separator}pgbouncer=true`
}

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    datasourceUrl: buildDatasourceUrl(),
    log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
  })

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma
}
