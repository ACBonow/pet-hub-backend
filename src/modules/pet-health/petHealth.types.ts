/**
 * @module pet-health
 * @file petHealth.types.ts
 * @description TypeScript interfaces for the pet-health module.
 */

export interface VaccinationRecord {
  id: string
  petId: string
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
