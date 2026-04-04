/**
 * @module adoption
 * @file adoption.schema.ts
 * @description Zod validation schemas for adoption endpoints.
 */

import { z } from 'zod'

const AdoptionStatusEnum = z.enum(['AVAILABLE', 'RESERVED', 'ADOPTED'], {
  message: 'Status deve ser AVAILABLE, RESERVED ou ADOPTED.',
})

/** Used by POST /adoptions — listerType and personId are resolved from JWT by the service */
export const CreateAdoptionForUserSchema = z.object({
  petId: z.string().uuid('ID do pet inválido.'),
  description: z.string().max(2000, 'Descrição deve ter no máximo 2000 caracteres.').nullable().optional(),
  contactEmail: z
    .string()
    .email('E-mail inválido.')
    .max(254, 'E-mail deve ter no máximo 254 caracteres.')
    .nullable()
    .optional()
    .or(z.literal(''))
    .transform((v) => v || null),
  contactPhone: z.string().max(20, 'Telefone deve ter no máximo 20 caracteres.').nullable().optional(),
  contactWhatsapp: z.string().max(20, 'WhatsApp deve ter no máximo 20 caracteres.').nullable().optional(),
  organizationId: z.string().uuid('ID da organização inválido.').nullable().optional(),
})

export const UpdateAdoptionStatusSchema = z.object({
  status: AdoptionStatusEnum,
})

export const AdoptionListQuerySchema = z.object({
  status: AdoptionStatusEnum.optional(),
  organizationId: z.string().uuid('ID da organização inválido.').optional(),
  page: z.coerce.number().int().positive().optional().default(1),
  pageSize: z.coerce.number().int().positive().max(100).optional().default(20),
})

export type CreateAdoptionForUserBody = z.infer<typeof CreateAdoptionForUserSchema>
export type UpdateAdoptionStatusBody = z.infer<typeof UpdateAdoptionStatusSchema>
export type AdoptionListQuery = z.infer<typeof AdoptionListQuerySchema>
