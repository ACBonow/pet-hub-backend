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
  petName: z.string().max(100, 'Nome do pet deve ter no máximo 100 caracteres.').optional(),
  species: z.string().max(100, 'Espécie deve ter no máximo 100 caracteres.').optional(),
  description: z.string().min(1, 'Descrição é obrigatória.').max(2000, 'Descrição deve ter no máximo 2000 caracteres.'),
  location: z.string().max(300, 'Localização deve ter no máximo 300 caracteres.').optional(),
  addressStreet: z.string().max(300, 'Endereço deve ter no máximo 300 caracteres.').optional(),
  addressNeighborhood: z.string().max(100, 'Bairro deve ter no máximo 100 caracteres.').optional(),
  addressNumber: z.string().max(20, 'Número deve ter no máximo 20 caracteres.').optional(),
  addressCep: z.string().max(10, 'CEP deve ter no máximo 10 caracteres.').optional(),
  addressCity: z.string().max(100, 'Cidade deve ter no máximo 100 caracteres.').optional(),
  addressState: z.string().max(2, 'Estado deve ter no máximo 2 caracteres.').optional(),
  addressNotes: z.string().max(300, 'Observações de endereço devem ter no máximo 300 caracteres.').optional(),
  contactEmail: z.string().email('Email de contato inválido.').max(254, 'E-mail deve ter no máximo 254 caracteres.'),
  contactPhone: z.string().max(20, 'Telefone deve ter no máximo 20 caracteres.').optional().nullable(),
  organizationId: z.string().uuid('ID da organização inválido.').optional(),
})

export const UpdateLostFoundSchema = z.object({
  petName: z.string().max(100, 'Nome do pet deve ter no máximo 100 caracteres.').nullable().optional(),
  species: z.string().max(100, 'Espécie deve ter no máximo 100 caracteres.').nullable().optional(),
  description: z.string().min(1, 'Descrição não pode ser vazia.').max(2000, 'Descrição deve ter no máximo 2000 caracteres.').optional(),
  location: z.string().max(300, 'Localização deve ter no máximo 300 caracteres.').nullable().optional(),
  addressStreet: z.string().max(300, 'Endereço deve ter no máximo 300 caracteres.').nullable().optional(),
  addressNeighborhood: z.string().max(100, 'Bairro deve ter no máximo 100 caracteres.').nullable().optional(),
  addressNumber: z.string().max(20, 'Número deve ter no máximo 20 caracteres.').nullable().optional(),
  addressCep: z.string().max(10, 'CEP deve ter no máximo 10 caracteres.').nullable().optional(),
  addressCity: z.string().max(100, 'Cidade deve ter no máximo 100 caracteres.').nullable().optional(),
  addressState: z.string().max(2, 'Estado deve ter no máximo 2 caracteres.').nullable().optional(),
  addressNotes: z.string().max(300, 'Observações de endereço devem ter no máximo 300 caracteres.').nullable().optional(),
  contactEmail: z.string().email('Email de contato inválido.').max(254, 'E-mail deve ter no máximo 254 caracteres.').optional(),
  contactPhone: z.string().max(20, 'Telefone deve ter no máximo 20 caracteres.').nullable().optional(),
})

export const UpdateLostFoundStatusSchema = z.object({
  status: LostFoundStatusEnum,
})

export const LostFoundListQuerySchema = z.object({
  type: LostFoundTypeEnum.optional(),
  status: LostFoundStatusEnum.optional(),
  organizationId: z.string().uuid('ID da organização inválido.').optional(),
  page: z.coerce.number().int().positive().optional().default(1),
  pageSize: z.coerce.number().int().positive().max(100).optional().default(20),
})

export type CreateLostFoundBody = z.infer<typeof CreateLostFoundSchema>
export type UpdateLostFoundBody = z.infer<typeof UpdateLostFoundSchema>
export type UpdateLostFoundStatusBody = z.infer<typeof UpdateLostFoundStatusSchema>
export type LostFoundListQuery = z.infer<typeof LostFoundListQuerySchema>
