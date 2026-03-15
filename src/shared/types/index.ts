/**
 * @module shared
 * @file types/index.ts
 * @description Shared TypeScript interfaces and types used across all modules.
 */

export interface PaginationMeta {
  page: number
  pageSize: number
  total: number
}

export interface ApiResponse<T> {
  success: true
  data: T
  meta?: PaginationMeta
}

export interface ApiErrorBody {
  success: false
  error: {
    code: string
    message: string
    details?: unknown[]
  }
}

export interface PaginationQuery {
  page?: number
  pageSize?: number
}
