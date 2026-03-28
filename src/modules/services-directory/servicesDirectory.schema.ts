/**
 * @module services-directory
 * @file servicesDirectory.schema.ts
 * @description Zod validation schemas for the services-directory module.
 */

import { z } from 'zod'

export const CreateServiceListingSchema = z.object({
  name: z.string().min(1, 'Nome é obrigatório.'),
  type: z.string().min(1, 'Tipo é obrigatório.'),
  description: z.string().optional(),
  zipCode: z.string().optional(),
  street: z.string().optional(),
  number: z.string().optional(),
  complement: z.string().optional(),
  neighborhood: z.string().optional(),
  city: z.string().optional(),
  state: z.string().max(2).optional(),
  phone: z.string().optional(),
  whatsapp: z.string().optional(),
  email: z.string().email('E-mail inválido.').optional(),
  website: z.string().url('URL inválida.').optional(),
  instagram: z.string().optional(),
  facebook: z.string().optional(),
  tiktok: z.string().optional(),
  youtube: z.string().optional(),
  googleMapsUrl: z.string().url('URL inválida.').optional(),
  googleBusinessUrl: z.string().url('URL inválida.').optional(),
  organizationId: z.string().uuid('organizationId deve ser um UUID válido.').optional(),
})

export const UpdateServiceListingSchema = z.object({
  name: z.string().min(1).optional(),
  type: z.string().min(1).optional(),
  description: z.string().optional(),
  zipCode: z.string().optional(),
  street: z.string().optional(),
  number: z.string().optional(),
  complement: z.string().optional(),
  neighborhood: z.string().optional(),
  city: z.string().optional(),
  state: z.string().max(2).optional(),
  phone: z.string().optional(),
  whatsapp: z.string().optional(),
  email: z.string().email('E-mail inválido.').optional(),
  website: z.string().url('URL inválida.').optional(),
  instagram: z.string().optional(),
  facebook: z.string().optional(),
  tiktok: z.string().optional(),
  youtube: z.string().optional(),
  googleMapsUrl: z.string().url('URL inválida.').optional(),
  googleBusinessUrl: z.string().url('URL inválida.').optional(),
  organizationId: z.string().uuid('organizationId deve ser um UUID válido.').optional(),
})

export const ListServicesQuerySchema = z.object({
  type: z.string().optional(),
  name: z.string().optional(),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
})

export type CreateServiceListingDto = z.infer<typeof CreateServiceListingSchema>
export type UpdateServiceListingDto = z.infer<typeof UpdateServiceListingSchema>
export type ListServicesQueryDto = z.infer<typeof ListServicesQuerySchema>
