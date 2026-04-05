/**
 * @module pet-health
 * @file petHealth.service.test.ts
 * @description Unit tests for PetHealthService — repositories and storage are mocked.
 */

import type { IPetHealthRepository } from '../petHealth.repository'
import type { IPetRepository } from '../../pet'
import type { IPersonRepository } from '../../person'
import type { IFileStorage } from '../../../shared/storage/IFileStorage'
import { extractPathFromUrl } from '../../../shared/storage/IFileStorage'
import type { VaccinationRecord, ExamFileRecord } from '../petHealth.types'
import { PetHealthService } from '../petHealth.service'

// ─── Fixtures ────────────────────────────────────────────────────────────────

const MOCK_PET = {
  id: 'pet-1',
  name: 'Rex',
  species: 'Cão',
  breed: null,
  gender: null,
  castrated: null,
  birthDate: null,
  photoUrl: null,
  microchip: null,
  notes: null,
  createdAt: new Date('2026-01-01'),
  updatedAt: new Date('2026-01-01'),
  activeTutorship: {
    id: 'tut-1',
    petId: 'pet-1',
    tutorType: 'PERSON' as const,
    personTutorId: 'person-1',
    orgTutorId: null,
    type: 'OWNER' as const,
    active: true,
    startDate: new Date('2026-01-01'),
    endDate: null,
    transferNotes: null,
    createdAt: new Date('2026-01-01'),
  },
  coTutors: [],
}

const MOCK_PERSON = {
  id: 'person-1',
  userId: 'user-1',
  name: 'João Silva',
  cpf: '52998224725',
  phone: null,
  createdAt: new Date('2026-01-01'),
  updatedAt: new Date('2026-01-01'),
}

const MOCK_VACCINATION: VaccinationRecord = {
  id: 'vacc-1',
  petId: 'pet-1',
  vaccineName: 'V10',
  manufacturer: null,
  batchNumber: null,
  applicationDate: new Date('2026-01-15'),
  nextDueDate: new Date('2027-01-15'),
  veterinarianName: null,
  clinicName: null,
  fileUrl: null,
  notes: null,
  createdAt: new Date('2026-01-15'),
}

const EXAM_FILE_URL =
  'https://syxpyrpxlsenlpdwgybf.supabase.co/storage/v1/object/public/exam-files/pets/pet-1/exam-1.pdf'

const MOCK_EXAM: ExamFileRecord = {
  id: 'exam-1',
  petId: 'pet-1',
  examType: 'Hemograma',
  fileUrl: EXAM_FILE_URL,
  examDate: new Date('2026-02-01'),
  labName: null,
  notes: null,
  createdAt: new Date('2026-02-01'),
}

// ─── Repo factories ───────────────────────────────────────────────────────────

function makeHealthRepo(overrides: Partial<IPetHealthRepository> = {}): jest.Mocked<IPetHealthRepository> {
  return {
    addVaccination: jest.fn(),
    getVaccinationCard: jest.fn(),
    findVaccination: jest.fn(),
    deleteVaccination: jest.fn(),
    createExamFile: jest.fn(),
    listExamFiles: jest.fn(),
    findExamFile: jest.fn(),
    deleteExamFile: jest.fn(),
    ...overrides,
  } as jest.Mocked<IPetHealthRepository>
}

function makePetRepo(overrides: Partial<IPetRepository> = {}): jest.Mocked<IPetRepository> {
  return {
    create: jest.fn(),
    findById: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    updatePhotoUrl: jest.fn(),
    transferTutorship: jest.fn(),
    getTutorshipHistory: jest.fn(),
    findActiveTutorship: jest.fn(),
    addCoTutor: jest.fn(),
    removeCoTutor: jest.fn(),
    ...overrides,
  } as jest.Mocked<IPetRepository>
}

function makePersonRepo(overrides: Partial<IPersonRepository> = {}): jest.Mocked<IPersonRepository> {
  return {
    create: jest.fn(),
    findById: jest.fn(),
    findByUserId: jest.fn(),
    findByCpf: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    ...overrides,
  } as jest.Mocked<IPersonRepository>
}

// ─── Tests ───────────────────────────────────────────────────────────────────

describe('PetHealthService', () => {
  let service: PetHealthService
  let healthRepo: jest.Mocked<IPetHealthRepository>
  let petRepo: jest.Mocked<IPetRepository>
  let personRepo: jest.Mocked<IPersonRepository>
  let mockFileStorage: jest.Mocked<IFileStorage>

  beforeEach(() => {
    jest.clearAllMocks()
    healthRepo = makeHealthRepo()
    petRepo = makePetRepo()
    personRepo = makePersonRepo()
    mockFileStorage = {
      upload: jest.fn(),
      delete: jest.fn(),
    }
    service = new PetHealthService(healthRepo, petRepo, personRepo, mockFileStorage)
  })

  // ── addVaccination ────────────────────────────────────────────────────────

  describe('addVaccination', () => {
    it('should throw NOT_FOUND when pet does not exist', async () => {
      petRepo.findById.mockResolvedValueOnce(null)

      await expect(
        service.addVaccination('nonexistent', 'user-1', {
          vaccineName: 'V10',
          applicationDate: new Date('2026-01-15'),
        }),
      ).rejects.toMatchObject({ statusCode: 404, code: 'NOT_FOUND' })
    })

    it('should throw FORBIDDEN when user has no tutorship over the pet', async () => {
      petRepo.findById.mockResolvedValueOnce(MOCK_PET)
      personRepo.findByUserId.mockResolvedValueOnce({ ...MOCK_PERSON, id: 'other-person' })

      await expect(
        service.addVaccination('pet-1', 'user-99', {
          vaccineName: 'V10',
          applicationDate: new Date('2026-01-15'),
        }),
      ).rejects.toMatchObject({ statusCode: 403, code: 'FORBIDDEN' })
    })

    it('should add vaccination and return the created record', async () => {
      petRepo.findById.mockResolvedValueOnce(MOCK_PET)
      personRepo.findByUserId.mockResolvedValueOnce(MOCK_PERSON)
      healthRepo.addVaccination.mockResolvedValueOnce(MOCK_VACCINATION)

      const result = await service.addVaccination('pet-1', 'user-1', {
        vaccineName: 'V10',
        applicationDate: new Date('2026-01-15'),
        nextDueDate: new Date('2027-01-15'),
      })

      expect(result).toEqual(MOCK_VACCINATION)
      expect(healthRepo.addVaccination).toHaveBeenCalledWith(
        expect.objectContaining({ petId: 'pet-1', vaccineName: 'V10' }),
      )
    })
  })

  // ── getVaccinationCard ────────────────────────────────────────────────────

  describe('getVaccinationCard', () => {
    it('should return vaccination history ordered by date', async () => {
      petRepo.findById.mockResolvedValueOnce(MOCK_PET)
      personRepo.findByUserId.mockResolvedValueOnce(MOCK_PERSON)
      healthRepo.getVaccinationCard.mockResolvedValueOnce([MOCK_VACCINATION])

      const result = await service.getVaccinationCard('pet-1', 'user-1')

      expect(result).toHaveLength(1)
      expect(result[0].vaccineName).toBe('V10')
      expect(healthRepo.getVaccinationCard).toHaveBeenCalledWith('pet-1')
    })

    it('should throw FORBIDDEN when user has no tutorship', async () => {
      petRepo.findById.mockResolvedValueOnce(MOCK_PET)
      personRepo.findByUserId.mockResolvedValueOnce({ ...MOCK_PERSON, id: 'other-person' })

      await expect(service.getVaccinationCard('pet-1', 'user-99')).rejects.toMatchObject({
        statusCode: 403,
        code: 'FORBIDDEN',
      })
    })
  })

  // ── deleteVaccination ─────────────────────────────────────────────────────

  describe('deleteVaccination', () => {
    it('should throw NOT_FOUND when pet does not exist', async () => {
      petRepo.findById.mockResolvedValueOnce(null)

      await expect(service.deleteVaccination('nonexistent', 'vacc-1', 'user-1')).rejects.toMatchObject({
        statusCode: 404,
        code: 'NOT_FOUND',
      })
    })

    it('should throw FORBIDDEN when user has no tutorship', async () => {
      petRepo.findById.mockResolvedValueOnce(MOCK_PET)
      personRepo.findByUserId.mockResolvedValueOnce({ ...MOCK_PERSON, id: 'other-person' })

      await expect(service.deleteVaccination('pet-1', 'vacc-1', 'user-99')).rejects.toMatchObject({
        statusCode: 403,
        code: 'FORBIDDEN',
      })
    })

    it('should throw NOT_FOUND when vaccination does not exist', async () => {
      petRepo.findById.mockResolvedValueOnce(MOCK_PET)
      personRepo.findByUserId.mockResolvedValueOnce(MOCK_PERSON)
      healthRepo.findVaccination.mockResolvedValueOnce(null)

      await expect(service.deleteVaccination('pet-1', 'nonexistent', 'user-1')).rejects.toMatchObject({
        statusCode: 404,
        code: 'NOT_FOUND',
      })
    })

    it('should delete vaccination when found and user has access', async () => {
      petRepo.findById.mockResolvedValueOnce(MOCK_PET)
      personRepo.findByUserId.mockResolvedValueOnce(MOCK_PERSON)
      healthRepo.findVaccination.mockResolvedValueOnce(MOCK_VACCINATION)
      healthRepo.deleteVaccination.mockResolvedValueOnce(undefined)

      await service.deleteVaccination('pet-1', 'vacc-1', 'user-1')

      expect(healthRepo.deleteVaccination).toHaveBeenCalledWith('vacc-1')
    })
  })

  // ── uploadExamFile ────────────────────────────────────────────────────────

  describe('uploadExamFile', () => {
    it('should upload file to storage and return exam record', async () => {
      petRepo.findById.mockResolvedValueOnce(MOCK_PET)
      personRepo.findByUserId.mockResolvedValueOnce(MOCK_PERSON)
      mockFileStorage.upload.mockResolvedValueOnce(EXAM_FILE_URL)
      healthRepo.createExamFile.mockResolvedValueOnce(MOCK_EXAM)

      const result = await service.uploadExamFile('pet-1', 'user-1', {
        file: Buffer.from('pdf-content'),
        contentType: 'application/pdf',
        filename: 'exam.pdf',
        examType: 'Hemograma',
        examDate: new Date('2026-02-01'),
      })

      expect(result.fileUrl).toBe(EXAM_FILE_URL)
      expect(mockFileStorage.upload).toHaveBeenCalledWith(
        'exam-files',
        expect.any(String),
        expect.any(Buffer),
        'application/pdf',
      )
      expect(healthRepo.createExamFile).toHaveBeenCalledWith(
        expect.objectContaining({ petId: 'pet-1', examType: 'Hemograma', fileUrl: EXAM_FILE_URL }),
      )
    })
  })

  // ── listExamFiles ─────────────────────────────────────────────────────────

  describe('listExamFiles', () => {
    it('should return exam files for the pet', async () => {
      petRepo.findById.mockResolvedValueOnce(MOCK_PET)
      personRepo.findByUserId.mockResolvedValueOnce(MOCK_PERSON)
      healthRepo.listExamFiles.mockResolvedValueOnce([MOCK_EXAM])

      const result = await service.listExamFiles('pet-1', 'user-1')

      expect(result).toHaveLength(1)
      expect(result[0].examType).toBe('Hemograma')
    })
  })

  // ── deleteExamFile ────────────────────────────────────────────────────────

  describe('deleteExamFile', () => {
    it('should delete exam file from storage and database', async () => {
      petRepo.findById.mockResolvedValueOnce(MOCK_PET)
      personRepo.findByUserId.mockResolvedValueOnce(MOCK_PERSON)
      healthRepo.findExamFile.mockResolvedValueOnce(MOCK_EXAM)
      mockFileStorage.delete.mockResolvedValueOnce(undefined)
      healthRepo.deleteExamFile.mockResolvedValueOnce(undefined)

      await service.deleteExamFile('pet-1', 'exam-1', 'user-1')

      expect(mockFileStorage.delete).toHaveBeenCalledWith(
        'exam-files',
        extractPathFromUrl(MOCK_EXAM.fileUrl, 'exam-files'),
      )
      expect(healthRepo.deleteExamFile).toHaveBeenCalledWith('exam-1')
    })

    it('should throw NOT_FOUND when exam file does not exist', async () => {
      petRepo.findById.mockResolvedValueOnce(MOCK_PET)
      personRepo.findByUserId.mockResolvedValueOnce(MOCK_PERSON)
      healthRepo.findExamFile.mockResolvedValueOnce(null)

      await expect(service.deleteExamFile('pet-1', 'nonexistent', 'user-1')).rejects.toMatchObject({
        statusCode: 404,
        code: 'NOT_FOUND',
      })
    })
  })
})
