/**
 * @module pet-health
 * @file petHealth.schema.ts
 * @description Zod validation schemas for the pet-health module.
 */

import { z } from 'zod'

export const AddVaccinationSchema = z.object({
  vaccineName: z.string().min(1, 'Nome da vacina é obrigatório.'),
  manufacturer: z.string().optional(),
  batchNumber: z.string().optional(),
  applicationDate: z.coerce.date(),
  nextDueDate: z.coerce.date().optional(),
  veterinarianName: z.string().optional(),
  clinicName: z.string().optional(),
  notes: z.string().optional(),
})

export type AddVaccinationDto = z.infer<typeof AddVaccinationSchema>
