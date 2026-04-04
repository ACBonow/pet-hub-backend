/**
 * @module organization
 * @file organization.schema.ts
 * @description Zod validation schemas for organization endpoints.
 */

import { z } from 'zod'
import { sanitizeCnpj } from '../../shared/validators/cnpj.validator'
import { sanitizeCpf } from '../../shared/validators/cpf.validator'

export const CreateOrganizationSchema = z.object({
  name: z.string().min(2, 'Nome deve ter pelo menos 2 caracteres.').max(100, 'Nome deve ter no máximo 100 caracteres.'),
  type: z.enum(['COMPANY', 'NGO'], { message: 'Tipo deve ser COMPANY ou NGO.' }),
  cnpj: z
    .string()
    .nullable()
    .optional()
    .transform(v => (v != null ? sanitizeCnpj(v) : v)),
  description: z.string().max(2000, 'Descrição deve ter no máximo 2000 caracteres.').nullable().optional(),
  phone: z.string().max(20, 'Telefone deve ter no máximo 20 caracteres.').nullable().optional(),
  email: z.string().email('E-mail inválido.').max(254, 'E-mail deve ter no máximo 254 caracteres.').nullable().optional(),
  website: z.string().max(500, 'Website deve ter no máximo 500 caracteres.').nullable().optional(),
  instagram: z.string().max(100, 'Instagram deve ter no máximo 100 caracteres.').nullable().optional(),
  addressStreet: z.string().max(300, 'Endereço deve ter no máximo 300 caracteres.').nullable().optional(),
  addressNeighborhood: z.string().max(100, 'Bairro deve ter no máximo 100 caracteres.').nullable().optional(),
  addressNumber: z.string().max(20, 'Número deve ter no máximo 20 caracteres.').nullable().optional(),
  addressCep: z.string().max(10, 'CEP deve ter no máximo 10 caracteres.').nullable().optional(),
  addressCity: z.string().max(100, 'Cidade deve ter no máximo 100 caracteres.').nullable().optional(),
  addressState: z.string().max(2, 'Estado deve ter no máximo 2 caracteres.').nullable().optional(),
  responsiblePersonId: z.string().uuid('ID da pessoa responsável inválido.').nullable().optional(),
})

export const UpdateOrganizationSchema = z.object({
  name: z.string().min(2, 'Nome deve ter pelo menos 2 caracteres.').max(100, 'Nome deve ter no máximo 100 caracteres.').optional(),
  description: z.string().max(2000, 'Descrição deve ter no máximo 2000 caracteres.').nullable().optional(),
  phone: z.string().max(20, 'Telefone deve ter no máximo 20 caracteres.').nullable().optional(),
  email: z.string().email('E-mail inválido.').max(254, 'E-mail deve ter no máximo 254 caracteres.').nullable().optional(),
  website: z.string().max(500, 'Website deve ter no máximo 500 caracteres.').nullable().optional(),
  instagram: z.string().max(100, 'Instagram deve ter no máximo 100 caracteres.').nullable().optional(),
  addressStreet: z.string().max(300, 'Endereço deve ter no máximo 300 caracteres.').nullable().optional(),
  addressNeighborhood: z.string().max(100, 'Bairro deve ter no máximo 100 caracteres.').nullable().optional(),
  addressNumber: z.string().max(20, 'Número deve ter no máximo 20 caracteres.').nullable().optional(),
  addressCep: z.string().max(10, 'CEP deve ter no máximo 10 caracteres.').nullable().optional(),
  addressCity: z.string().max(100, 'Cidade deve ter no máximo 100 caracteres.').nullable().optional(),
  addressState: z.string().max(2, 'Estado deve ter no máximo 2 caracteres.').nullable().optional(),
})

export const AddMemberSchema = z.object({
  cpf: z.string().min(11, 'CPF inválido.').transform(v => sanitizeCpf(v)),
  role: z.enum(['OWNER', 'MANAGER', 'MEMBER']).default('MEMBER'),
})

export const ChangeRoleSchema = z.object({
  role: z.enum(['OWNER', 'MANAGER', 'MEMBER'], { message: 'Papel deve ser OWNER, MANAGER ou MEMBER.' }),
})

export type CreateOrganizationBody = z.infer<typeof CreateOrganizationSchema>
export type UpdateOrganizationBody = z.infer<typeof UpdateOrganizationSchema>
export type AddMemberBody = z.infer<typeof AddMemberSchema>
// AddMemberBody.cpf is already sanitized (digits only) by the transform
export type ChangeRoleBody = z.infer<typeof ChangeRoleSchema>
