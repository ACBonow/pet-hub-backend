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
  petName: z.string().optional(),
  species: z.string().optional(),
  description: z.string().min(1, 'Descrição é obrigatória.'),
  location: z.string().optional(),
  addressStreet: z.string().optional(),
  addressNeighborhood: z.string().optional(),
  addressNumber: z.string().optional(),
  addressCep: z.string().optional(),
  addressCity: z.string().optional(),
  addressState: z.string().optional(),
  addressNotes: z.string().optional(),
  contactEmail: z.string().email('Email de contato inválido.'),
  contactPhone: z.string().optional().nullable(),
  organizationId: z.string().uuid('ID da organização inválido.').optional(),
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
