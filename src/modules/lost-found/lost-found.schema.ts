/**
 * @module lost-found
 * @file lost-found.schema.ts
 * @description Zod validation schemas for lost-found endpoints.
 */

import { z } from 'zod'

const LostFoundTypeEnum = z.enum(['LOST', 'FOUND'], {
  message: 'Tipo deve ser LOST ou FOUND.',
})

const LostFoundStatusEnum = z.enum(['OPEN', 'RESOLVED'], {
  message: 'Status deve ser OPEN ou RESOLVED.',
})

export const CreateLostFoundSchema = z.object({
  type: LostFoundTypeEnum,
  petId: z.string().uuid('ID do pet inválido.').optional(),
  reporterId: z.string().uuid('ID do relator inválido.'),
  description: z.string().min(1, 'Descrição é obrigatória.'),
  location: z.string().optional(),
  photoUrl: z.string().url('URL da foto inválida.').optional(),
  contactInfo: z.string().min(1, 'Informações de contato são obrigatórias.'),
})

export const UpdateLostFoundStatusSchema = z.object({
  status: LostFoundStatusEnum,
})

export const LostFoundListQuerySchema = z.object({
  type: LostFoundTypeEnum.optional(),
  status: LostFoundStatusEnum.optional(),
  page: z.coerce.number().int().positive().optional().default(1),
  pageSize: z.coerce.number().int().positive().max(100).optional().default(20),
})

export type CreateLostFoundBody = z.infer<typeof CreateLostFoundSchema>
export type UpdateLostFoundStatusBody = z.infer<typeof UpdateLostFoundStatusSchema>
export type LostFoundListQuery = z.infer<typeof LostFoundListQuerySchema>
