/**
 * @module pet-health
 * @file petHealth.service.ts
 * @description Business logic for pet health management — vaccinations and exam files.
 * Access is restricted to primary tutors and co-tutors of the pet.
 */

import { HttpError } from '../../shared/errors/HttpError'
import { AppError } from '../../shared/errors/AppError'
import { extractPathFromUrl } from '../../shared/storage/IFileStorage'
import type { IFileStorage } from '../../shared/storage/IFileStorage'
import type { IPetHealthRepository } from './petHealth.repository'
import type { IVaccineCatalogRepository } from '../vaccine-catalog/vaccineCatalog.repository'
import type { IPetRepository } from '../pet'
import type { IPersonRepository } from '../person'
import type {
  AddPreventiveInput,
  AddVaccinationInput,
  ExamFileRecord,
  PreventiveRecord,
  UploadExamFileInput,
  VaccinationRecord,
  VaccineStatusEntry,
} from './petHealth.types'

export class PetHealthService {
  constructor(
    private repository: IPetHealthRepository,
    private petRepository: IPetRepository,
    private personRepository: IPersonRepository,
    private fileStorage: IFileStorage,
    private vaccineCatalogRepository?: IVaccineCatalogRepository,
  ) {}

  private async checkTutorAccess(petId: string, userId: string): Promise<void> {
    const pet = await this.petRepository.findById(petId)
    if (!pet) throw HttpError.notFound('Pet')

    const person = await this.personRepository.findByUserId(userId)
    if (!person) throw HttpError.forbidden()

    const { activeTutorship, coTutors } = pet
    const isPrimaryTutor =
      activeTutorship?.tutorType === 'PERSON' && activeTutorship.personTutorId === person.id
    const isCoTutor = coTutors.some(
      (ct) => ct.tutorType === 'PERSON' && ct.personTutorId === person.id,
    )

    if (!isPrimaryTutor && !isCoTutor) {
      throw HttpError.forbidden()
    }
  }

  async addVaccination(
    petId: string,
    userId: string,
    input: AddVaccinationInput,
  ): Promise<VaccinationRecord> {
    await this.checkTutorAccess(petId, userId)

    let doseNumber: number | undefined
    let nextDueDate = input.nextDueDate

    if (input.templateId) {
      const template = this.vaccineCatalogRepository
        ? await this.vaccineCatalogRepository.findById(input.templateId)
        : null

      if (!template) {
        throw new AppError(404, 'VACCINE_TEMPLATE_NOT_FOUND', 'Template de vacina não encontrado.')
      }

      const existingCount = await this.repository.countVaccinationsForTemplate(petId, input.templateId)
      doseNumber = existingCount + 1

      if (!nextDueDate) {
        const appDate = input.applicationDate
        const intervalDays =
          doseNumber < template.initialDosesCount
            ? template.initialIntervalDays
            : template.boosterIntervalDays
        nextDueDate = new Date(appDate.getTime() + intervalDays * 24 * 60 * 60 * 1000)
      }
    }

    return this.repository.addVaccination({ petId, ...input, doseNumber, nextDueDate })
  }

  async getVaccinationCard(petId: string, userId: string): Promise<VaccinationRecord[]> {
    await this.checkTutorAccess(petId, userId)
    return this.repository.getVaccinationCard(petId)
  }

  async deleteVaccination(petId: string, vaccinationId: string, userId: string): Promise<void> {
    await this.checkTutorAccess(petId, userId)

    const vaccination = await this.repository.findVaccination(vaccinationId)
    if (!vaccination) throw HttpError.notFound('Vacina')

    await this.repository.deleteVaccination(vaccinationId)
  }

  async uploadExamFile(
    petId: string,
    userId: string,
    input: UploadExamFileInput,
  ): Promise<ExamFileRecord> {
    await this.checkTutorAccess(petId, userId)

    const ext = input.filename.split('.').pop() ?? 'bin'
    const path = `pets/${petId}/${Date.now()}-${input.filename.replace(/[^a-zA-Z0-9._-]/g, '_')}.${ext}`
    const fileUrl = await this.fileStorage.upload('exam-files', path, input.file, input.contentType)

    return this.repository.createExamFile({
      petId,
      examType: input.examType,
      fileUrl,
      examDate: input.examDate,
      labName: input.labName,
      notes: input.notes,
    })
  }

  async listExamFiles(petId: string, userId: string): Promise<ExamFileRecord[]> {
    await this.checkTutorAccess(petId, userId)
    return this.repository.listExamFiles(petId)
  }

  async deleteExamFile(petId: string, examId: string, userId: string): Promise<void> {
    await this.checkTutorAccess(petId, userId)

    const exam = await this.repository.findExamFile(examId)
    if (!exam) throw HttpError.notFound('Arquivo de exame')

    const storagePath = extractPathFromUrl(exam.fileUrl, 'exam-files')
    await this.fileStorage.delete('exam-files', storagePath)
    await this.repository.deleteExamFile(examId)
  }

  // ── Vaccine status ──────────────────────────────────────────────────────────

  async getVaccineStatus(petId: string, userId: string): Promise<VaccineStatusEntry[]> {
    await this.checkTutorAccess(petId, userId)

    const pet = await this.petRepository.findById(petId)
    if (!pet) throw HttpError.notFound('Pet')

    if (!this.vaccineCatalogRepository) return []

    // Infer species from free-text pet.species → PetSpecies enum
    const speciesMap: Record<string, string> = {
      cão: 'DOG', cao: 'DOG', cachorro: 'DOG', dog: 'DOG',
      gato: 'CAT', cat: 'CAT',
      ave: 'BIRD', bird: 'BIRD', pássaro: 'BIRD', passaro: 'BIRD',
      coelho: 'RABBIT', rabbit: 'RABBIT',
    }
    const petSpecies = speciesMap[pet.species.toLowerCase()] as any

    const templates = petSpecies
      ? await this.vaccineCatalogRepository.findAll({ species: petSpecies, type: 'VACCINE' })
      : []

    const vaccinations = await this.repository.getVaccinationCard(petId)
    const now = Date.now()
    const DUE_SOON_DAYS = 30

    return templates.map((tmpl) => {
      const doses = vaccinations.filter((v) => v.templateId === tmpl.id)
        .sort((a, b) => b.applicationDate.getTime() - a.applicationDate.getTime())
      const lastDose = doses[0] ?? null
      const nextDueDate = lastDose?.nextDueDate ?? null

      let status: VaccineStatusEntry['status']
      let daysOverdue: number | null = null

      if (!lastDose) {
        status = 'NOT_GIVEN'
      } else if (!nextDueDate) {
        status = 'UP_TO_DATE'
      } else {
        const diffMs = now - nextDueDate.getTime()
        const diffDays = Math.ceil(diffMs / (24 * 60 * 60 * 1000))
        daysOverdue = diffDays
        if (diffDays > 0) {
          status = 'OVERDUE'
        } else if (diffDays >= -DUE_SOON_DAYS) {
          status = 'DUE_SOON'
        } else {
          status = 'UP_TO_DATE'
        }
      }

      return {
        templateId: tmpl.id,
        templateName: tmpl.name,
        slug: tmpl.slug,
        category: tmpl.category,
        preventiveType: tmpl.preventiveType,
        isRequiredByLaw: tmpl.isRequiredByLaw,
        status,
        daysOverdue,
        lastDoseDate: lastDose?.applicationDate ?? null,
        nextDueDate,
        totalDosesGiven: doses.length,
      }
    })
  }

  // ── Preventive records ──────────────────────────────────────────────────────

  async addPreventive(petId: string, userId: string, input: AddPreventiveInput): Promise<PreventiveRecord> {
    await this.checkTutorAccess(petId, userId)

    let nextDueDate = input.nextDueDate

    if (input.templateId && !nextDueDate && this.vaccineCatalogRepository) {
      const template = await this.vaccineCatalogRepository.findById(input.templateId)
      if (template) {
        nextDueDate = new Date(input.appliedAt.getTime() + template.boosterIntervalDays * 24 * 60 * 60 * 1000)
      }
    }

    return this.repository.addPreventive({ petId, ...input, nextDueDate })
  }

  async listPreventives(petId: string, userId: string): Promise<PreventiveRecord[]> {
    await this.checkTutorAccess(petId, userId)
    return this.repository.listPreventives(petId)
  }

  async deletePreventive(petId: string, preventiveId: string, userId: string): Promise<void> {
    await this.checkTutorAccess(petId, userId)

    const record = await this.repository.findPreventive(preventiveId)
    if (!record) throw HttpError.notFound('Registro de preventivo')

    await this.repository.deletePreventive(preventiveId)
  }
}
