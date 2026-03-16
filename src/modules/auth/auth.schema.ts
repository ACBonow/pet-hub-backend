/**
 * @module auth
 * @file auth.schema.ts
 * @description Zod validation schemas for auth endpoints.
 */

import { z } from 'zod'

export const RegisterSchema = z.object({
  email: z.string().email('E-mail inválido.'),
  password: z.string().min(8, 'A senha deve ter pelo menos 8 caracteres.'),
})

export const LoginSchema = z.object({
  email: z.string().email('E-mail inválido.'),
  password: z.string().min(1, 'Senha é obrigatória.'),
})

export const RefreshSchema = z.object({
  refreshToken: z.string().min(1, 'Refresh token é obrigatório.'),
})

export type RegisterBody = z.infer<typeof RegisterSchema>
export type LoginBody = z.infer<typeof LoginSchema>
export type RefreshBody = z.infer<typeof RefreshSchema>
