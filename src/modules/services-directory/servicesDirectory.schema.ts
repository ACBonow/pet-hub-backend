/**
 * @module services-directory
 * @file servicesDirectory.schema.ts
 * @description Zod validation schemas for the services-directory module.
 */

import { z } from 'zod'

export const CreateServiceListingSchema = z.object({
  name: z.string().min(1, 'Nome é obrigatório.').max(100, 'Nome deve ter no máximo 100 caracteres.'),
  type: z.string().min(1, 'Tipo é obrigatório.').max(100, 'Tipo deve ter no máximo 100 caracteres.'),
  description: z.string().max(2000, 'Descrição deve ter no máximo 2000 caracteres.').optional(),
  zipCode: z.string().max(10, 'CEP deve ter no máximo 10 caracteres.').optional(),
  street: z.string().max(300, 'Endereço deve ter no máximo 300 caracteres.').optional(),
  number: z.string().max(20, 'Número deve ter no máximo 20 caracteres.').optional(),
  complement: z.string().max(100, 'Complemento deve ter no máximo 100 caracteres.').optional(),
  neighborhood: z.string().max(100, 'Bairro deve ter no máximo 100 caracteres.').optional(),
  city: z.string().max(100, 'Cidade deve ter no máximo 100 caracteres.').optional(),
  state: z.string().max(2, 'Estado deve ter no máximo 2 caracteres.').optional(),
  phone: z.string().max(20, 'Telefone deve ter no máximo 20 caracteres.').optional(),
  whatsapp: z.string().max(20, 'WhatsApp deve ter no máximo 20 caracteres.').optional(),
  email: z.string().email('E-mail inválido.').max(254, 'E-mail deve ter no máximo 254 caracteres.').optional(),
  website: z.string().url('URL inválida.').max(500, 'Website deve ter no máximo 500 caracteres.').optional(),
  instagram: z.string().max(100, 'Instagram deve ter no máximo 100 caracteres.').optional(),
  facebook: z.string().max(100, 'Facebook deve ter no máximo 100 caracteres.').optional(),
  tiktok: z.string().max(100, 'TikTok deve ter no máximo 100 caracteres.').optional(),
  youtube: z.string().max(100, 'YouTube deve ter no máximo 100 caracteres.').optional(),
  googleMapsUrl: z.string().url('URL inválida.').max(500, 'URL do Google Maps deve ter no máximo 500 caracteres.').optional(),
  googleBusinessUrl: z.string().url('URL inválida.').max(500, 'URL do Google Business deve ter no máximo 500 caracteres.').optional(),
  organizationId: z.string().uuid('organizationId deve ser um UUID válido.').optional(),
})

export const UpdateServiceListingSchema = z.object({
  name: z.string().min(1).max(100, 'Nome deve ter no máximo 100 caracteres.').optional(),
  type: z.string().min(1).max(100, 'Tipo deve ter no máximo 100 caracteres.').optional(),
  description: z.string().max(2000, 'Descrição deve ter no máximo 2000 caracteres.').optional(),
  zipCode: z.string().max(10, 'CEP deve ter no máximo 10 caracteres.').optional(),
  street: z.string().max(300, 'Endereço deve ter no máximo 300 caracteres.').optional(),
  number: z.string().max(20, 'Número deve ter no máximo 20 caracteres.').optional(),
  complement: z.string().max(100, 'Complemento deve ter no máximo 100 caracteres.').optional(),
  neighborhood: z.string().max(100, 'Bairro deve ter no máximo 100 caracteres.').optional(),
  city: z.string().max(100, 'Cidade deve ter no máximo 100 caracteres.').optional(),
  state: z.string().max(2, 'Estado deve ter no máximo 2 caracteres.').optional(),
  phone: z.string().max(20, 'Telefone deve ter no máximo 20 caracteres.').optional(),
  whatsapp: z.string().max(20, 'WhatsApp deve ter no máximo 20 caracteres.').optional(),
  email: z.string().email('E-mail inválido.').max(254, 'E-mail deve ter no máximo 254 caracteres.').optional(),
  website: z.string().url('URL inválida.').max(500, 'Website deve ter no máximo 500 caracteres.').optional(),
  instagram: z.string().max(100, 'Instagram deve ter no máximo 100 caracteres.').optional(),
  facebook: z.string().max(100, 'Facebook deve ter no máximo 100 caracteres.').optional(),
  tiktok: z.string().max(100, 'TikTok deve ter no máximo 100 caracteres.').optional(),
  youtube: z.string().max(100, 'YouTube deve ter no máximo 100 caracteres.').optional(),
  googleMapsUrl: z.string().url('URL inválida.').max(500, 'URL do Google Maps deve ter no máximo 500 caracteres.').optional(),
  googleBusinessUrl: z.string().url('URL inválida.').max(500, 'URL do Google Business deve ter no máximo 500 caracteres.').optional(),
  organizationId: z.string().uuid('organizationId deve ser um UUID válido.').optional(),
})

export const ListServicesQuerySchema = z.object({
  type: z.string().optional(),
  name: z.string().optional(),
  organizationId: z.string().uuid('ID da organização inválido.').optional(),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
})

export type CreateServiceListingDto = z.infer<typeof CreateServiceListingSchema>
export type UpdateServiceListingDto = z.infer<typeof UpdateServiceListingSchema>
export type ListServicesQueryDto = z.infer<typeof ListServicesQuerySchema>
