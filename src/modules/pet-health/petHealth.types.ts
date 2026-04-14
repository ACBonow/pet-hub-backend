/**
 * @module pet-health
 * @file petHealth.types.ts
 * @description TypeScript interfaces for the pet-health module.
 */

export interface VaccinationRecord {
  id: string
  petId: string
  templateId: string | null
  doseNumber: number | null
  vaccineName: string
  manufacturer: string | null
  batchNumber: string | null
  applicationDate: Date
  nextDueDate: Date | null
  veterinarianName: string | null
  clinicName: string | null
  fileUrl: string | null
  notes: string | null
  createdAt: Date
}

export interface VaccinationCreateInput {
  petId: string
  templateId?: string
  doseNumber?: number
  vaccineName: string
  manufacturer?: string
  batchNumber?: string
  applicationDate: Date
  nextDueDate?: Date
  veterinarianName?: string
  clinicName?: string
  fileUrl?: string
  notes?: string
}

export interface AddVaccinationInput {
  templateId?: string
  vaccineName: string
  manufacturer?: string
  batchNumber?: string
  applicationDate: Date
  nextDueDate?: Date
  veterinarianName?: string
  clinicName?: string
  notes?: string
}

export interface ExamFileRecord {
  id: string
  petId: string
  examType: string
  fileUrl: string
  examDate: Date
  labName: string | null
  notes: string | null
  createdAt: Date
}

export interface ExamFileCreateInput {
  petId: string
  examType: string
  fileUrl: string
  examDate: Date
  labName?: string
  notes?: string
}

export interface UploadExamFileInput {
  file: Buffer
  contentType: string
  filename: string
  examType: string
  examDate: Date
  labName?: string
  notes?: string
}

// ─── Vaccine Status ───────────────────────────────────────────────────────────

export type VaccineStatusValue = 'UP_TO_DATE' | 'DUE_SOON' | 'OVERDUE' | 'NOT_GIVEN'

export interface VaccineStatusEntry {
  templateId: string
  templateName: string
  slug: string
  category: string
  preventiveType: string | null
  isRequiredByLaw: boolean
  status: VaccineStatusValue
  daysOverdue: number | null   // positive = overdue; negative = days until due
  lastDoseDate: Date | null
  nextDueDate: Date | null
  totalDosesGiven: number
}

// ─── Preventive Records ───────────────────────────────────────────────────────

export interface PreventiveRecord {
  id: string
  petId: string
  templateId: string | null
  productName: string
  appliedAt: Date
  nextDueDate: Date | null
  brand: string | null
  batchNumber: string | null
  notes: string | null
  createdAt: Date
}

export interface AddPreventiveInput {
  templateId?: string
  productName: string
  appliedAt: Date
  nextDueDate?: Date
  brand?: string
  batchNumber?: string
  notes?: string
}

export interface PreventiveCreateInput extends AddPreventiveInput {
  petId: string
}
