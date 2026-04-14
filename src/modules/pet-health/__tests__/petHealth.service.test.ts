/**
 * @module pet-health
 * @file petHealth.service.test.ts
 * @description Unit tests for PetHealthService — repositories and storage are mocked.
 */

import type { IPetHealthRepository } from '../petHealth.repository'
import type { IVaccineCatalogRepository } from '../../vaccine-catalog/vaccineCatalog.repository'
import type { IPetRepository } from '../../pet'
import type { IPersonRepository } from '../../person'
import type { IFileStorage } from '../../../shared/storage/IFileStorage'
import { extractPathFromUrl } from '../../../shared/storage/IFileStorage'
import type { VaccinationRecord, ExamFileRecord, PreventiveRecord } from '../petHealth.types'
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
  templateId: null,
  doseNumber: null,
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
    countVaccinationsForTemplate: jest.fn().mockResolvedValue(0),
    createExamFile: jest.fn(),
    listExamFiles: jest.fn(),
    findExamFile: jest.fn(),
    deleteExamFile: jest.fn(),
    addPreventive: jest.fn(),
    listPreventives: jest.fn(),
    findPreventive: jest.fn(),
    deletePreventive: jest.fn(),
    ...overrides,
  } as jest.Mocked<IPetHealthRepository>
}

const MOCK_TEMPLATE = {
  id: 'tmpl-1',
  name: 'V10 Múltipla',
  slug: 'multipla-canina',
  type: 'VACCINE' as const,
  species: ['DOG' as const],
  category: 'CORE' as const,
  preventiveType: null,
  targetConditions: null,
  minimumAgeWeeks: 6,
  initialDosesCount: 3,
  initialIntervalDays: 21,
  boosterIntervalDays: 365,
  isRequiredByLaw: false,
  notes: null,
  brands: [],
}

function makeCatalogRepo(overrides: Partial<IVaccineCatalogRepository> = {}): jest.Mocked<IVaccineCatalogRepository> {
  return {
    findAll: jest.fn(),
    findBySlug: jest.fn(),
    findById: jest.fn().mockResolvedValue(MOCK_TEMPLATE),
    ...overrides,
  } as jest.Mocked<IVaccineCatalogRepository>
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
  let catalogRepo: jest.Mocked<IVaccineCatalogRepository>
  let mockFileStorage: jest.Mocked<IFileStorage>

  beforeEach(() => {
    jest.clearAllMocks()
    healthRepo = makeHealthRepo()
    petRepo = makePetRepo()
    personRepo = makePersonRepo()
    catalogRepo = makeCatalogRepo()
    mockFileStorage = {
      upload: jest.fn(),
      delete: jest.fn(),
    }
    service = new PetHealthService(healthRepo, petRepo, personRepo, mockFileStorage, catalogRepo)
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

    it('auto-fills doseNumber=1 when templateId is provided and no prior doses', async () => {
      petRepo.findById.mockResolvedValueOnce(MOCK_PET)
      personRepo.findByUserId.mockResolvedValueOnce(MOCK_PERSON)
      healthRepo.countVaccinationsForTemplate.mockResolvedValueOnce(0)
      healthRepo.addVaccination.mockResolvedValueOnce({ ...MOCK_VACCINATION, templateId: 'tmpl-1', doseNumber: 1 })

      await service.addVaccination('pet-1', 'user-1', {
        templateId: 'tmpl-1',
        vaccineName: 'V10 Múltipla',
        applicationDate: new Date('2026-01-15'),
      })

      expect(healthRepo.addVaccination).toHaveBeenCalledWith(
        expect.objectContaining({ doseNumber: 1, templateId: 'tmpl-1' }),
      )
    })

    it('auto-fills doseNumber=2 when one prior dose exists', async () => {
      petRepo.findById.mockResolvedValueOnce(MOCK_PET)
      personRepo.findByUserId.mockResolvedValueOnce(MOCK_PERSON)
      healthRepo.countVaccinationsForTemplate.mockResolvedValueOnce(1)
      healthRepo.addVaccination.mockResolvedValueOnce({ ...MOCK_VACCINATION, templateId: 'tmpl-1', doseNumber: 2 })

      await service.addVaccination('pet-1', 'user-1', {
        templateId: 'tmpl-1',
        vaccineName: 'V10 Múltipla',
        applicationDate: new Date('2026-02-05'),
      })

      expect(healthRepo.addVaccination).toHaveBeenCalledWith(
        expect.objectContaining({ doseNumber: 2 }),
      )
    })

    it('auto-fills nextDueDate using initialIntervalDays for initial doses', async () => {
      const appDate = new Date('2026-01-15')
      petRepo.findById.mockResolvedValueOnce(MOCK_PET)
      personRepo.findByUserId.mockResolvedValueOnce(MOCK_PERSON)
      healthRepo.countVaccinationsForTemplate.mockResolvedValueOnce(0) // dose 1 of 3
      healthRepo.addVaccination.mockResolvedValueOnce(MOCK_VACCINATION)

      await service.addVaccination('pet-1', 'user-1', {
        templateId: 'tmpl-1',
        vaccineName: 'V10 Múltipla',
        applicationDate: appDate,
      })

      const expectedNext = new Date(appDate.getTime() + 21 * 24 * 60 * 60 * 1000) // initialIntervalDays=21
      expect(healthRepo.addVaccination).toHaveBeenCalledWith(
        expect.objectContaining({ nextDueDate: expectedNext }),
      )
    })

    it('auto-fills nextDueDate using boosterIntervalDays after initial series', async () => {
      const appDate = new Date('2026-04-01')
      petRepo.findById.mockResolvedValueOnce(MOCK_PET)
      personRepo.findByUserId.mockResolvedValueOnce(MOCK_PERSON)
      healthRepo.countVaccinationsForTemplate.mockResolvedValueOnce(3) // dose 4 (booster)
      healthRepo.addVaccination.mockResolvedValueOnce(MOCK_VACCINATION)

      await service.addVaccination('pet-1', 'user-1', {
        templateId: 'tmpl-1',
        vaccineName: 'V10 Múltipla',
        applicationDate: appDate,
      })

      const expectedNext = new Date(appDate.getTime() + 365 * 24 * 60 * 60 * 1000) // boosterIntervalDays=365
      expect(healthRepo.addVaccination).toHaveBeenCalledWith(
        expect.objectContaining({ nextDueDate: expectedNext }),
      )
    })

    it('throws 404 when templateId references non-existent template', async () => {
      petRepo.findById.mockResolvedValueOnce(MOCK_PET)
      personRepo.findByUserId.mockResolvedValueOnce(MOCK_PERSON)
      catalogRepo.findById.mockResolvedValueOnce(null)

      await expect(
        service.addVaccination('pet-1', 'user-1', {
          templateId: 'nonexistent-tmpl',
          vaccineName: 'V10',
          applicationDate: new Date('2026-01-15'),
        }),
      ).rejects.toMatchObject({ statusCode: 404, code: 'VACCINE_TEMPLATE_NOT_FOUND' })
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

  // ── getVaccineStatus ──────────────────────────────────────────────────────

  describe('getVaccineStatus', () => {
    it('returns NOT_GIVEN status for templates with no doses', async () => {
      petRepo.findById.mockResolvedValue(MOCK_PET)
      personRepo.findByUserId.mockResolvedValue(MOCK_PERSON)
      healthRepo.getVaccinationCard.mockResolvedValue([])
      catalogRepo.findAll.mockResolvedValue([MOCK_TEMPLATE])

      const result = await service.getVaccineStatus('pet-1', 'user-1')

      expect(result).toHaveLength(1)
      expect(result[0].status).toBe('NOT_GIVEN')
      expect(result[0].totalDosesGiven).toBe(0)
    })

    it('returns OVERDUE when nextDueDate is in the past', async () => {
      const pastDate = new Date(Date.now() - 10 * 24 * 60 * 60 * 1000)
      petRepo.findById.mockResolvedValue(MOCK_PET)
      personRepo.findByUserId.mockResolvedValue(MOCK_PERSON)
      healthRepo.getVaccinationCard.mockResolvedValue([
        { ...MOCK_VACCINATION, templateId: 'tmpl-1', nextDueDate: pastDate },
      ])
      catalogRepo.findAll.mockResolvedValue([MOCK_TEMPLATE])

      const result = await service.getVaccineStatus('pet-1', 'user-1')

      expect(result[0].status).toBe('OVERDUE')
      expect(result[0].daysOverdue).toBeGreaterThan(0)
    })

    it('returns UP_TO_DATE when nextDueDate is far in the future', async () => {
      const futureDate = new Date(Date.now() + 200 * 24 * 60 * 60 * 1000)
      petRepo.findById.mockResolvedValue(MOCK_PET)
      personRepo.findByUserId.mockResolvedValue(MOCK_PERSON)
      healthRepo.getVaccinationCard.mockResolvedValue([
        { ...MOCK_VACCINATION, templateId: 'tmpl-1', nextDueDate: futureDate },
      ])
      catalogRepo.findAll.mockResolvedValue([MOCK_TEMPLATE])

      const result = await service.getVaccineStatus('pet-1', 'user-1')

      expect(result[0].status).toBe('UP_TO_DATE')
    })

    it('returns DUE_SOON when nextDueDate is within 30 days', async () => {
      const soonDate = new Date(Date.now() + 15 * 24 * 60 * 60 * 1000)
      petRepo.findById.mockResolvedValue(MOCK_PET)
      personRepo.findByUserId.mockResolvedValue(MOCK_PERSON)
      healthRepo.getVaccinationCard.mockResolvedValue([
        { ...MOCK_VACCINATION, templateId: 'tmpl-1', nextDueDate: soonDate },
      ])
      catalogRepo.findAll.mockResolvedValue([MOCK_TEMPLATE])

      const result = await service.getVaccineStatus('pet-1', 'user-1')

      expect(result[0].status).toBe('DUE_SOON')
    })
  })

  // ── preventive records ────────────────────────────────────────────────────

  const MOCK_PREVENTIVE: PreventiveRecord = {
    id: 'prev-1',
    petId: 'pet-1',
    templateId: null,
    productName: 'Frontline Plus',
    appliedAt: new Date('2026-03-01'),
    nextDueDate: new Date('2026-04-01'),
    brand: 'Boehringer Ingelheim',
    batchNumber: null,
    notes: null,
    createdAt: new Date('2026-03-01'),
  }

  describe('addPreventive', () => {
    it('creates a preventive record and returns it', async () => {
      petRepo.findById.mockResolvedValueOnce(MOCK_PET)
      personRepo.findByUserId.mockResolvedValueOnce(MOCK_PERSON)
      healthRepo.addPreventive.mockResolvedValueOnce(MOCK_PREVENTIVE)

      const result = await service.addPreventive('pet-1', 'user-1', {
        productName: 'Frontline Plus',
        appliedAt: new Date('2026-03-01'),
      })

      expect(result).toEqual(MOCK_PREVENTIVE)
      expect(healthRepo.addPreventive).toHaveBeenCalledWith(
        expect.objectContaining({ petId: 'pet-1', productName: 'Frontline Plus' }),
      )
    })

    it('auto-fills nextDueDate from template boosterIntervalDays when templateId given', async () => {
      const appDate = new Date('2026-03-01')
      petRepo.findById.mockResolvedValueOnce(MOCK_PET)
      personRepo.findByUserId.mockResolvedValueOnce(MOCK_PERSON)
      catalogRepo.findById.mockResolvedValueOnce({ ...MOCK_TEMPLATE, boosterIntervalDays: 30 })
      healthRepo.addPreventive.mockResolvedValueOnce(MOCK_PREVENTIVE)

      await service.addPreventive('pet-1', 'user-1', {
        templateId: 'tmpl-1',
        productName: 'Frontline Plus',
        appliedAt: appDate,
      })

      const expectedNext = new Date(appDate.getTime() + 30 * 24 * 60 * 60 * 1000)
      expect(healthRepo.addPreventive).toHaveBeenCalledWith(
        expect.objectContaining({ nextDueDate: expectedNext }),
      )
    })

    it('throws FORBIDDEN when user has no tutorship', async () => {
      petRepo.findById.mockResolvedValueOnce(MOCK_PET)
      personRepo.findByUserId.mockResolvedValueOnce({ ...MOCK_PERSON, id: 'other-person' })

      await expect(
        service.addPreventive('pet-1', 'user-99', { productName: 'Frontline', appliedAt: new Date() }),
      ).rejects.toMatchObject({ statusCode: 403 })
    })
  })

  describe('listPreventives', () => {
    it('returns preventive records for the pet', async () => {
      petRepo.findById.mockResolvedValueOnce(MOCK_PET)
      personRepo.findByUserId.mockResolvedValueOnce(MOCK_PERSON)
      healthRepo.listPreventives.mockResolvedValueOnce([MOCK_PREVENTIVE])

      const result = await service.listPreventives('pet-1', 'user-1')

      expect(result).toHaveLength(1)
      expect(result[0].productName).toBe('Frontline Plus')
    })
  })

  describe('deletePreventive', () => {
    it('deletes preventive record', async () => {
      petRepo.findById.mockResolvedValueOnce(MOCK_PET)
      personRepo.findByUserId.mockResolvedValueOnce(MOCK_PERSON)
      healthRepo.findPreventive.mockResolvedValueOnce(MOCK_PREVENTIVE)
      healthRepo.deletePreventive.mockResolvedValueOnce(undefined)

      await service.deletePreventive('pet-1', 'prev-1', 'user-1')

      expect(healthRepo.deletePreventive).toHaveBeenCalledWith('prev-1')
    })

    it('throws NOT_FOUND when preventive does not exist', async () => {
      petRepo.findById.mockResolvedValueOnce(MOCK_PET)
      personRepo.findByUserId.mockResolvedValueOnce(MOCK_PERSON)
      healthRepo.findPreventive.mockResolvedValueOnce(null)

      await expect(service.deletePreventive('pet-1', 'nonexistent', 'user-1')).rejects.toMatchObject({
        statusCode: 404,
      })
    })
  })
})
