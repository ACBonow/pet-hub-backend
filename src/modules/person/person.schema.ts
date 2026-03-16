/**
 * @module person
 * @file person.schema.ts
 * @description Zod validation schemas for person endpoints.
 */

import { z } from 'zod'
import { sanitizeCpf } from '../../shared/validators/cpf.validator'

export const CreatePersonSchema = z.object({
  name: z.string().min(2, 'Nome deve ter pelo menos 2 caracteres.'),
  cpf: z
    .string()
    .min(1, 'CPF é obrigatório.')
    .transform(sanitizeCpf),
  phone: z.string().optional(),
})

export const UpdatePersonSchema = z.object({
  name: z.string().min(2, 'Nome deve ter pelo menos 2 caracteres.').optional(),
  phone: z.string().nullable().optional(),
})

export type CreatePersonBody = z.infer<typeof CreatePersonSchema>
export type UpdatePersonBody = z.infer<typeof UpdatePersonSchema>
