/**
 * @module services-directory
 * @file servicesDirectory.schema.ts
 * @description Zod validation schemas for the services-directory module.
 */

import { z } from 'zod'

const ServiceTypeEnum = z.enum([
  'VETERINARIAN',
  'CLINIC',
  'EXAM',
  'PHARMACY',
  'GROOMING',
  'BOARDING',
  'TRANSPORT',
  'OTHER',
])

export const CreateServiceListingSchema = z.object({
  name: z.string().min(1, 'Nome é obrigatório.'),
  type: ServiceTypeEnum,
  description: z.string().optional(),
  address: z.string().optional(),
  phone: z.string().optional(),
  email: z.string().email('E-mail inválido.').optional(),
  website: z.string().url('URL inválida.').optional(),
  organizationId: z.string().uuid('organizationId deve ser um UUID válido.').optional(),
})

export const UpdateServiceListingSchema = z.object({
  name: z.string().min(1).optional(),
  type: ServiceTypeEnum.optional(),
  description: z.string().optional(),
  address: z.string().optional(),
  phone: z.string().optional(),
  email: z.string().email('E-mail inválido.').optional(),
  website: z.string().url('URL inválida.').optional(),
  organizationId: z.string().uuid('organizationId deve ser um UUID válido.').optional(),
})

export const ListServicesQuerySchema = z.object({
  type: ServiceTypeEnum.optional(),
  name: z.string().optional(),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
})

export type CreateServiceListingDto = z.infer<typeof CreateServiceListingSchema>
export type UpdateServiceListingDto = z.infer<typeof UpdateServiceListingSchema>
export type ListServicesQueryDto = z.infer<typeof ListServicesQuerySchema>
