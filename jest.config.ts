import type { Config } from 'jest'

const config: Config = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  rootDir: '.',
  setupFiles: ['dotenv/config'],
  testMatch: ['**/__tests__/**/*.test.ts'],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
  },
  collectCoverageFrom: [
    'src/**/*.ts',
    // Exclude test files and entry points
    '!src/**/__tests__/**',
    '!src/server.ts',
    '!src/app.ts',
    // Exclude Prisma repository implementations — they require a real DB connection
    // and are covered by integration tests, not unit tests
    '!src/**/*.repository.ts',
    // Exclude mappers — they are exercised only when repositories run against a real DB
    '!src/**/*.mapper.ts',
    // Exclude external service wrappers — these require live credentials (Supabase, Resend)
    '!src/shared/storage/SupabaseFileStorage.ts',
    '!src/shared/utils/email.ts',
    // Exclude thin infrastructure wrappers with no meaningful branch logic to unit test
    '!src/shared/utils/logger.ts',
    '!src/shared/plugins/rate-limit.ts',
  ],
  coverageThreshold: {
    global: {
      statements: 80,
      branches: 75,
      functions: 85,
      lines: 80,
    },
  },
  clearMocks: true,
}

export default config
