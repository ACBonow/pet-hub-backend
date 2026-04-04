/**
 * @module pet-health
 * @file petHealth.schema.ts
 * @description Zod validation schemas for the pet-health module.
 */

import { z } from 'zod'

export const AddVaccinationSchema = z.object({
  vaccineName: z.string().min(1, 'Nome da vacina é obrigatório.').max(100, 'Nome da vacina deve ter no máximo 100 caracteres.'),
  manufacturer: z.string().max(100, 'Fabricante deve ter no máximo 100 caracteres.').optional(),
  batchNumber: z.string().max(50, 'Número do lote deve ter no máximo 50 caracteres.').optional(),
  applicationDate: z.coerce.date(),
  nextDueDate: z.coerce.date().optional(),
  veterinarianName: z.string().max(100, 'Nome do veterinário deve ter no máximo 100 caracteres.').optional(),
  clinicName: z.string().max(100, 'Nome da clínica deve ter no máximo 100 caracteres.').optional(),
  notes: z.string().max(2000, 'Observações devem ter no máximo 2000 caracteres.').optional(),
})

export type AddVaccinationDto = z.infer<typeof AddVaccinationSchema>
