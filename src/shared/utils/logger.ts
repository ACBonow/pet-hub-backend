/**
 * @module shared
 * @file logger.ts
 * @description Structured logger wrapper. Use this instead of console.log in production code.
 */

type LogLevel = 'info' | 'warn' | 'error' | 'debug'

interface LogEntry {
  level: LogLevel
  message: string
  data?: unknown
  timestamp: string
}

function log(level: LogLevel, message: string, data?: unknown): void {
  if (process.env.NODE_ENV === 'test') return

  const entry: LogEntry = {
    level,
    message,
    timestamp: new Date().toISOString(),
    ...(data !== undefined && { data }),
  }

  if (level === 'error') {
    process.stderr.write(JSON.stringify(entry) + '\n')
  } else {
    process.stdout.write(JSON.stringify(entry) + '\n')
  }
}

export const logger = {
  info: (message: string, data?: unknown) => log('info', message, data),
  warn: (message: string, data?: unknown) => log('warn', message, data),
  error: (message: string, data?: unknown) => log('error', message, data),
  debug: (message: string, data?: unknown) => log('debug', message, data),
}
