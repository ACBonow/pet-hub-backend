/**
 * @module pet-health
 * @file petHealth.service.ts
 * @description Business logic for pet health management — vaccinations and exam files.
 * Access is restricted to primary tutors and co-tutors of the pet.
 */

import { HttpError } from '../../shared/errors/HttpError'
import { uploadFile, deleteFile, extractPathFromUrl } from '../../shared/utils/storage'
import type { IPetHealthRepository } from './petHealth.repository'
import type { IPetRepository } from '../pet'
import type { IPersonRepository } from '../person'
import type {
  AddVaccinationInput,
  ExamFileRecord,
  UploadExamFileInput,
  VaccinationRecord,
} from './petHealth.types'

export class PetHealthService {
  constructor(
    private repository: IPetHealthRepository,
    private petRepository: IPetRepository,
    private personRepository: IPersonRepository,
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
    return this.repository.addVaccination({ petId, ...input })
  }

  async getVaccinationCard(petId: string, userId: string): Promise<VaccinationRecord[]> {
    await this.checkTutorAccess(petId, userId)
    return this.repository.getVaccinationCard(petId)
  }

  async uploadExamFile(
    petId: string,
    userId: string,
    input: UploadExamFileInput,
  ): Promise<ExamFileRecord> {
    await this.checkTutorAccess(petId, userId)

    const ext = input.filename.split('.').pop() ?? 'bin'
    const path = `pets/${petId}/${Date.now()}-${input.filename.replace(/[^a-zA-Z0-9._-]/g, '_')}.${ext}`
    const fileUrl = await uploadFile('exam-files', path, input.file, input.contentType)

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
    await deleteFile('exam-files', storagePath)
    await this.repository.deleteExamFile(examId)
  }
}
