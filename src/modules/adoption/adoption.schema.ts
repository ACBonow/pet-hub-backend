/**
 * @module adoption
 * @file adoption.schema.ts
 * @description Zod validation schemas for adoption endpoints.
 */

import { z } from 'zod'

const ListerTypeEnum = z.enum(['PERSON', 'ORGANIZATION'], {
  message: 'Tipo de listante deve ser PERSON ou ORGANIZATION.',
})

const AdoptionStatusEnum = z.enum(['AVAILABLE', 'RESERVED', 'ADOPTED'], {
  message: 'Status deve ser AVAILABLE, RESERVED ou ADOPTED.',
})

export const CreateAdoptionSchema = z
  .object({
    petId: z.string().uuid('ID do pet inválido.'),
    listerType: ListerTypeEnum,
    personId: z.string().uuid('ID da pessoa inválido.').optional(),
    organizationId: z.string().uuid('ID da organização inválido.').optional(),
    description: z.string().optional(),
  })
  .refine(
    (data) => {
      if (data.listerType === 'PERSON') return !!data.personId
      if (data.listerType === 'ORGANIZATION') return !!data.organizationId
      return false
    },
    { message: 'ID do listante correspondente ao tipo é obrigatório.' },
  )

export const UpdateAdoptionStatusSchema = z.object({
  status: AdoptionStatusEnum,
})

export const AdoptionListQuerySchema = z.object({
  status: AdoptionStatusEnum.optional(),
  page: z.coerce.number().int().positive().optional().default(1),
  pageSize: z.coerce.number().int().positive().max(100).optional().default(20),
})

export type CreateAdoptionBody = z.infer<typeof CreateAdoptionSchema>
export type UpdateAdoptionStatusBody = z.infer<typeof UpdateAdoptionStatusSchema>
export type AdoptionListQuery = z.infer<typeof AdoptionListQuerySchema>
