/**
 * @module vaccine-catalog
 * @file vaccineCatalog.types.ts
 * @description TypeScript interfaces for the vaccine-catalog module.
 */

export type VaccineTemplateType = 'VACCINE' | 'PREVENTIVE'
export type VaccineCategory = 'CORE' | 'NON_CORE' | 'LIFESTYLE'
export type PetSpecies = 'DOG' | 'CAT' | 'BIRD' | 'RABBIT' | 'OTHER'
export type PreventiveType = 'FLEA' | 'TICK' | 'FLEA_TICK' | 'DEWORMER' | 'HEARTWORM' | 'OTHER'

export interface VaccineBrandRecord {
  id: string
  brandName: string
  manufacturer: string
  presentation: string | null
}

export interface VaccineTemplateRecord {
  id: string
  name: string
  slug: string
  type: VaccineTemplateType
  species: PetSpecies[]
  category: VaccineCategory
  preventiveType: PreventiveType | null
  targetConditions: string | null
  minimumAgeWeeks: number
  initialDosesCount: number
  initialIntervalDays: number
  boosterIntervalDays: number
  isRequiredByLaw: boolean
  notes: string | null
  brands: VaccineBrandRecord[]
}

export interface ListVaccineCatalogFilter {
  type?: VaccineTemplateType
  species?: PetSpecies
  category?: VaccineCategory
}
