/**
 * @module vaccine-catalog
 * @file vaccineCatalog.schema.ts
 * @description Zod schemas for vaccine-catalog query params.
 */

import { z } from 'zod'

const PetSpeciesEnum = z.enum(['DOG', 'CAT', 'BIRD', 'RABBIT', 'OTHER'])
const VaccineTypeEnum = z.enum(['VACCINE', 'PREVENTIVE'])
const VaccineCategoryEnum = z.enum(['CORE', 'NON_CORE', 'LIFESTYLE'])

export const listCatalogQuerySchema = z.object({
  type: VaccineTypeEnum.optional(),
  species: PetSpeciesEnum.optional(),
  category: VaccineCategoryEnum.optional(),
})

export type ListCatalogQuery = z.infer<typeof listCatalogQuerySchema>
