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
  name: z.string().min(1, 'Nome é obrigatório.'),
  species: z.string().min(1, 'Espécie é obrigatória.'),
  breed: z.string().optional(),
  gender: z.string().optional(),
  castrated: z.boolean().optional(),
  birthDate: z.coerce.date().optional(),
  microchip: z.string().optional(),
  notes: z.string().optional(),
  tutorshipType: TutorshipTypeEnum.default('OWNER'),
})

export const UpdatePetSchema = z.object({
  name: z.string().min(1, 'Nome é obrigatório.').optional(),
  species: z.string().min(1, 'Espécie é obrigatória.').optional(),
  breed: z.string().nullable().optional(),
  gender: z.string().nullable().optional(),
  castrated: z.boolean().nullable().optional(),
  birthDate: z.coerce.date().nullable().optional(),
  microchip: z.string().nullable().optional(),
  notes: z.string().nullable().optional(),
})

export const TransferTutorshipSchema = z
  .object({
    tutorType: TutorTypeEnum,
    personCpf: z.string().optional(),
    orgTutorId: z.string().uuid('ID da organização tutora inválido.').optional(),
    tutorshipType: TutorshipTypeEnum,
    transferNotes: z.string().optional(),
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
