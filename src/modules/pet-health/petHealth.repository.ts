/**
 * @module pet-health
 * @file petHealth.repository.ts
 * @description Repository interface and Prisma implementation for pet-health persistence.
 */

import { prisma } from '../../shared/config/database'
import type {
  ExamFileCreateInput,
  ExamFileRecord,
  PreventiveCreateInput,
  PreventiveRecord,
  VaccinationCreateInput,
  VaccinationRecord,
} from './petHealth.types'

export interface IPetHealthRepository {
  addVaccination(data: VaccinationCreateInput): Promise<VaccinationRecord>
  getVaccinationCard(petId: string): Promise<VaccinationRecord[]>
  findVaccination(vaccinationId: string): Promise<VaccinationRecord | null>
  deleteVaccination(vaccinationId: string): Promise<void>
  countVaccinationsForTemplate(petId: string, templateId: string): Promise<number>
  createExamFile(data: ExamFileCreateInput): Promise<ExamFileRecord>
  listExamFiles(petId: string): Promise<ExamFileRecord[]>
  findExamFile(examId: string): Promise<ExamFileRecord | null>
  deleteExamFile(examId: string): Promise<void>
  addPreventive(data: PreventiveCreateInput): Promise<PreventiveRecord>
  listPreventives(petId: string): Promise<PreventiveRecord[]>
  findPreventive(id: string): Promise<PreventiveRecord | null>
  deletePreventive(id: string): Promise<void>
}

export class PrismaPetHealthRepository implements IPetHealthRepository {
  async addVaccination(data: VaccinationCreateInput): Promise<VaccinationRecord> {
    return prisma.vaccination.create({
      data: {
        petId: data.petId,
        templateId: data.templateId ?? null,
        doseNumber: data.doseNumber ?? null,
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

  async countVaccinationsForTemplate(petId: string, templateId: string): Promise<number> {
    return prisma.vaccination.count({ where: { petId, templateId } })
  }

  async getVaccinationCard(petId: string): Promise<VaccinationRecord[]> {
    return prisma.vaccination.findMany({
      where: { petId },
      orderBy: { applicationDate: 'desc' },
    })
  }

  async findVaccination(vaccinationId: string): Promise<VaccinationRecord | null> {
    return prisma.vaccination.findUnique({ where: { id: vaccinationId } })
  }

  async deleteVaccination(vaccinationId: string): Promise<void> {
    await prisma.vaccination.delete({ where: { id: vaccinationId } })
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

  async addPreventive(data: PreventiveCreateInput): Promise<PreventiveRecord> {
    return prisma.preventiveRecord.create({
      data: {
        petId: data.petId,
        templateId: data.templateId ?? null,
        productName: data.productName,
        appliedAt: data.appliedAt,
        nextDueDate: data.nextDueDate ?? null,
        brand: data.brand ?? null,
        batchNumber: data.batchNumber ?? null,
        notes: data.notes ?? null,
      },
    })
  }

  async listPreventives(petId: string): Promise<PreventiveRecord[]> {
    return prisma.preventiveRecord.findMany({
      where: { petId },
      orderBy: { appliedAt: 'desc' },
    })
  }

  async findPreventive(id: string): Promise<PreventiveRecord | null> {
    return prisma.preventiveRecord.findUnique({ where: { id } })
  }

  async deletePreventive(id: string): Promise<void> {
    await prisma.preventiveRecord.delete({ where: { id } })
  }
}
