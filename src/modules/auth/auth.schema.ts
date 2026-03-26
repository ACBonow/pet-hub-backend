/**
 * @module auth
 * @file auth.schema.ts
 * @description Zod validation schemas for auth endpoints.
 */

import { z } from 'zod'
import { sanitizeCpf } from '../../shared/validators/cpf.validator'

export const RegisterSchema = z.object({
  email: z.string().email('E-mail inválido.'),
  password: z.string().min(8, 'A senha deve ter pelo menos 8 caracteres.'),
  name: z.string().min(2, 'Nome deve ter pelo menos 2 caracteres.'),
  cpf: z.string().min(1, 'CPF é obrigatório.').transform(sanitizeCpf),
  phone: z.string().optional(),
})

export const LoginSchema = z.object({
  email: z.string().email('E-mail inválido.'),
  password: z.string().min(1, 'Senha é obrigatória.'),
})

export const RefreshSchema = z.object({
  refreshToken: z.string().min(1, 'Refresh token é obrigatório.'),
})

export const VerifyEmailSchema = z.object({
  token: z.string().min(1, 'Token é obrigatório.'),
})

export const ResendVerificationSchema = z.object({
  email: z.string().email('E-mail inválido.'),
})

export const ForgotPasswordSchema = z.object({
  email: z.string().email('E-mail inválido.'),
})

export const ResetPasswordSchema = z.object({
  token: z.string().min(1, 'Token é obrigatório.'),
  newPassword: z.string().min(8, 'A senha deve ter pelo menos 8 caracteres.'),
})

export type RegisterBody = z.infer<typeof RegisterSchema>
export type LoginBody = z.infer<typeof LoginSchema>
export type RefreshBody = z.infer<typeof RefreshSchema>
export type VerifyEmailBody = z.infer<typeof VerifyEmailSchema>
export type ResendVerificationBody = z.infer<typeof ResendVerificationSchema>
export type ForgotPasswordBody = z.infer<typeof ForgotPasswordSchema>
export type ResetPasswordBody = z.infer<typeof ResetPasswordSchema>
