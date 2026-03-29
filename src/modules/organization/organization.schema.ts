/**
 * @module organization
 * @file organization.schema.ts
 * @description Zod validation schemas for organization endpoints.
 */

import { z } from 'zod'
import { sanitizeCnpj } from '../../shared/validators/cnpj.validator'

export const CreateOrganizationSchema = z.object({
  name: z.string().min(2, 'Nome deve ter pelo menos 2 caracteres.'),
  type: z.enum(['COMPANY', 'NGO'], { message: 'Tipo deve ser COMPANY ou NGO.' }),
  cnpj: z
    .string()
    .nullable()
    .optional()
    .transform(v => (v != null ? sanitizeCnpj(v) : v)),
  description: z.string().nullable().optional(),
  phone: z.string().nullable().optional(),
  email: z.string().email('E-mail inválido.').nullable().optional(),
  website: z.string().nullable().optional(),
  instagram: z.string().nullable().optional(),
  addressStreet: z.string().nullable().optional(),
  addressNeighborhood: z.string().nullable().optional(),
  addressNumber: z.string().nullable().optional(),
  addressCep: z.string().nullable().optional(),
  addressCity: z.string().nullable().optional(),
  addressState: z.string().nullable().optional(),
  responsiblePersonId: z.string().uuid('ID da pessoa responsável inválido.').nullable().optional(),
})

export const UpdateOrganizationSchema = z.object({
  name: z.string().min(2, 'Nome deve ter pelo menos 2 caracteres.').optional(),
  description: z.string().nullable().optional(),
  phone: z.string().nullable().optional(),
  email: z.string().email('E-mail inválido.').nullable().optional(),
  website: z.string().nullable().optional(),
  instagram: z.string().nullable().optional(),
  addressStreet: z.string().nullable().optional(),
  addressNeighborhood: z.string().nullable().optional(),
  addressNumber: z.string().nullable().optional(),
  addressCep: z.string().nullable().optional(),
  addressCity: z.string().nullable().optional(),
  addressState: z.string().nullable().optional(),
})

export type CreateOrganizationBody = z.infer<typeof CreateOrganizationSchema>
export type UpdateOrganizationBody = z.infer<typeof UpdateOrganizationSchema>
