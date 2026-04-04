/**
 * @module pet
 * @file pet.schema.ts
 * @description Zod validation schemas for pet endpoints.
 */

import { z } from 'zod'

const TutorTypeEnum = z.enum(['PERSON', 'ORGANIZATION'], {
  message: 'Tipo de tutor deve ser PERSON ou ORGANIZATION.',
})

const TutorshipTypeEnum = z.enum(['OWNER', 'TUTOR', 'TEMPORARY_HOME'], {
  message: 'Tipo de tutoria deve ser OWNER, TUTOR ou TEMPORARY_HOME.',
})

export const CreatePetSchema = z.object({
  name: z.string().min(1, 'Nome é obrigatório.').max(100, 'Nome deve ter no máximo 100 caracteres.'),
  species: z.string().min(1, 'Espécie é obrigatória.').max(100, 'Espécie deve ter no máximo 100 caracteres.'),
  breed: z.string().max(100, 'Raça deve ter no máximo 100 caracteres.').optional(),
  gender: z.string().max(20, 'Gênero deve ter no máximo 20 caracteres.').optional(),
  castrated: z.boolean().optional(),
  birthDate: z.coerce.date().optional(),
  microchip: z.string().max(50, 'Microchip deve ter no máximo 50 caracteres.').optional(),
  notes: z.string().max(2000, 'Observações devem ter no máximo 2000 caracteres.').optional(),
  tutorshipType: TutorshipTypeEnum.default('OWNER'),
})

export const UpdatePetSchema = z.object({
  name: z.string().min(1, 'Nome é obrigatório.').max(100, 'Nome deve ter no máximo 100 caracteres.').optional(),
  species: z.string().min(1, 'Espécie é obrigatória.').max(100, 'Espécie deve ter no máximo 100 caracteres.').optional(),
  breed: z.string().max(100, 'Raça deve ter no máximo 100 caracteres.').nullable().optional(),
  gender: z.string().max(20, 'Gênero deve ter no máximo 20 caracteres.').nullable().optional(),
  castrated: z.boolean().nullable().optional(),
  birthDate: z.coerce.date().nullable().optional(),
  microchip: z.string().max(50, 'Microchip deve ter no máximo 50 caracteres.').nullable().optional(),
  notes: z.string().max(2000, 'Observações devem ter no máximo 2000 caracteres.').nullable().optional(),
})

export const TransferTutorshipSchema = z
  .object({
    tutorType: TutorTypeEnum,
    personCpf: z.string().optional(),
    orgTutorId: z.string().uuid('ID da organização tutora inválido.').optional(),
    tutorshipType: TutorshipTypeEnum,
    transferNotes: z.string().max(2000, 'Observações devem ter no máximo 2000 caracteres.').optional(),
  })
  .refine(
    (data) => {
      if (data.tutorType === 'PERSON') return !!data.personCpf
      if (data.tutorType === 'ORGANIZATION') return !!data.orgTutorId
      return false
    },
    { message: 'CPF do tutor ou ID da organização é obrigatório.' },
  )

export const AddCoTutorSchema = z
  .object({
    tutorType: TutorTypeEnum,
    personCpf: z.string().optional(),
    orgTutorId: z.string().uuid('ID da organização tutora inválido.').optional(),
  })
  .refine(
    (data) => {
      if (data.tutorType === 'PERSON') return !!data.personCpf
      if (data.tutorType === 'ORGANIZATION') return !!data.orgTutorId
      return false
    },
    { message: 'CPF do tutor ou ID da organização é obrigatório.' },
  )

export type CreatePetBody = z.infer<typeof CreatePetSchema>
export type UpdatePetBody = z.infer<typeof UpdatePetSchema>
export type TransferTutorshipBody = z.infer<typeof TransferTutorshipSchema>
export type AddCoTutorBody = z.infer<typeof AddCoTutorSchema>
