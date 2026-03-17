/**
 * @module pet-health
 * @file petHealth.repository.ts
 * @description Repository interface and Prisma implementation for pet-health persistence.
 */

import { prisma } from '../../shared/config/database'
import type {
  ExamFileCreateInput,
  ExamFileRecord,
  VaccinationCreateInput,
  VaccinationRecord,
} from './petHealth.types'

export interface IPetHealthRepository {
  addVaccination(data: VaccinationCreateInput): Promise<VaccinationRecord>
  getVaccinationCard(petId: string): Promise<VaccinationRecord[]>
  createExamFile(data: ExamFileCreateInput): Promise<ExamFileRecord>
  listExamFiles(petId: string): Promise<ExamFileRecord[]>
  findExamFile(examId: string): Promise<ExamFileRecord | null>
  deleteExamFile(examId: string): Promise<void>
}

export class PrismaPetHealthRepository implements IPetHealthRepository {
  async addVaccination(data: VaccinationCreateInput): Promise<VaccinationRecord> {
    return prisma.vaccination.create({
      data: {
        petId: data.petId,
        vaccineName: data.vaccineName,
        manufacturer: data.manufacturer ?? null,
        batchNumber: data.batchNumber ?? null,
        applicationDate: data.applicationDate,
        nextDueDate: data.nextDueDate ?? null,
        veterinarianName: data.veterinarianName ?? null,
        clinicName: data.clinicName ?? null,
        fileUrl: data.fileUrl ?? null,
        notes: data.notes ?? null,
      },
    })
  }

  async getVaccinationCard(petId: string): Promise<VaccinationRecord[]> {
    return prisma.vaccination.findMany({
      where: { petId },
      orderBy: { applicationDate: 'desc' },
    })
  }

  async createExamFile(data: ExamFileCreateInput): Promise<ExamFileRecord> {
    return prisma.examFile.create({
      data: {
        petId: data.petId,
        examType: data.examType,
        fileUrl: data.fileUrl,
        examDate: data.examDate,
        labName: data.labName ?? null,
        notes: data.notes ?? null,
      },
    })
  }

  async listExamFiles(petId: string): Promise<ExamFileRecord[]> {
    return prisma.examFile.findMany({
      where: { petId },
      orderBy: { examDate: 'desc' },
    })
  }

  async findExamFile(examId: string): Promise<ExamFileRecord | null> {
    return prisma.examFile.findUnique({ where: { id: examId } })
  }

  async deleteExamFile(examId: string): Promise<void> {
    await prisma.examFile.delete({ where: { id: examId } })
  }
}
