/**
 * @module pet-health
 * @file petHealth.controller.test.ts
 * @description HTTP-layer tests for pet-health routes using Fastify inject — service is mocked.
 */

import jwt from 'jsonwebtoken'
import { buildApp } from '../../../app'
import { PetHealthService } from '../petHealth.service'
import { HttpError } from '../../../shared/errors/HttpError'

jest.mock('../petHealth.service')
const MockedPetHealthService = PetHealthService as jest.MockedClass<typeof PetHealthService>

// ─── Fixtures ─────────────────────────────────────────────────────────────────

const PET_ID = 'pet-uuid-0001'
const EXAM_ID = 'exam-uuid-0001'
const VACC_ID = 'vacc-uuid-0001'
const USER_ID = 'user-uuid-0001'

const MOCK_VACCINATION = {
  id: 'vacc-1',
  petId: PET_ID,
  vaccineName: 'V10',
  manufacturer: null,
  batchNumber: null,
  applicationDate: new Date('2026-01-15').toISOString(),
  nextDueDate: new Date('2027-01-15').toISOString(),
  veterinarianName: null,
  clinicName: null,
  fileUrl: null,
  notes: null,
  createdAt: new Date('2026-01-15').toISOString(),
}

const MOCK_EXAM = {
  id: EXAM_ID,
  petId: PET_ID,
  examType: 'Hemograma',
  fileUrl: 'https://supabase.example.com/storage/v1/object/public/exam-files/pets/pet-1/exam-1.pdf',
  examDate: new Date('2026-02-01').toISOString(),
  labName: null,
  notes: null,
  createdAt: new Date('2026-02-01').toISOString(),
}

function makeAuthToken(userId = USER_ID): string {
  return jwt.sign({ sub: userId }, process.env.JWT_SECRET ?? 'test-secret', { expiresIn: '15m' })
}

async function buildTestApp() {
  MockedPetHealthService.mockClear()
  const app = buildApp()
  await app.ready()
  const service = MockedPetHealthService.mock.instances[0]
  return { app, service }
}

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('PetHealth routes', () => {
  // ── GET /api/v1/pet-health/:petId/vaccination-card ────────────────────────

  describe('GET /api/v1/pet-health/:petId/vaccination-card', () => {
    it('returns 200 with vaccination list', async () => {
      const { app, service } = await buildTestApp()
      jest.mocked(service.getVaccinationCard).mockResolvedValueOnce([MOCK_VACCINATION] as any)

      const response = await app.inject({
        method: 'GET',
        url: `/api/v1/pet-health/${PET_ID}/vaccination-card`,
        headers: { authorization: `Bearer ${makeAuthToken()}` },
      })

      expect(response.statusCode).toBe(200)
      const body = response.json()
      expect(body.success).toBe(true)
      expect(body.data).toHaveLength(1)
      expect(body.data[0].vaccineName).toBe('V10')
    })

    it('returns 401 when not authenticated', async () => {
      const { app } = await buildTestApp()

      const response = await app.inject({
        method: 'GET',
        url: `/api/v1/pet-health/${PET_ID}/vaccination-card`,
      })

      expect(response.statusCode).toBe(401)
    })

    it('returns 403 when user has no tutorship', async () => {
      const { app, service } = await buildTestApp()
      jest.mocked(service.getVaccinationCard).mockRejectedValueOnce(HttpError.forbidden())

      const response = await app.inject({
        method: 'GET',
        url: `/api/v1/pet-health/${PET_ID}/vaccination-card`,
        headers: { authorization: `Bearer ${makeAuthToken()}` },
      })

      expect(response.statusCode).toBe(403)
    })

    it('returns 404 when pet not found', async () => {
      const { app, service } = await buildTestApp()
      jest.mocked(service.getVaccinationCard).mockRejectedValueOnce(HttpError.notFound('Pet'))

      const response = await app.inject({
        method: 'GET',
        url: `/api/v1/pet-health/${PET_ID}/vaccination-card`,
        headers: { authorization: `Bearer ${makeAuthToken()}` },
      })

      expect(response.statusCode).toBe(404)
    })
  })

  // ── POST /api/v1/pet-health/:petId/vaccinations ───────────────────────────

  describe('POST /api/v1/pet-health/:petId/vaccinations', () => {
    it('returns 201 with created vaccination', async () => {
      const { app, service } = await buildTestApp()
      jest.mocked(service.addVaccination).mockResolvedValueOnce(MOCK_VACCINATION as any)

      const response = await app.inject({
        method: 'POST',
        url: `/api/v1/pet-health/${PET_ID}/vaccinations`,
        headers: { authorization: `Bearer ${makeAuthToken()}` },
        body: {
          vaccineName: 'V10',
          applicationDate: '2026-01-15',
        },
      })

      expect(response.statusCode).toBe(201)
      const body = response.json()
      expect(body.success).toBe(true)
      expect(body.data.vaccineName).toBe('V10')
    })

    it('returns 400 on missing required field', async () => {
      const { app } = await buildTestApp()

      const response = await app.inject({
        method: 'POST',
        url: `/api/v1/pet-health/${PET_ID}/vaccinations`,
        headers: { authorization: `Bearer ${makeAuthToken()}` },
        body: { manufacturer: 'Lab X' },
      })

      expect(response.statusCode).toBe(400)
      expect(response.json().success).toBe(false)
    })

    it('returns 401 when not authenticated', async () => {
      const { app } = await buildTestApp()

      const response = await app.inject({
        method: 'POST',
        url: `/api/v1/pet-health/${PET_ID}/vaccinations`,
        body: { vaccineName: 'V10', applicationDate: '2026-01-15' },
      })

      expect(response.statusCode).toBe(401)
    })

    it('returns 403 when user has no tutorship', async () => {
      const { app, service } = await buildTestApp()
      jest.mocked(service.addVaccination).mockRejectedValueOnce(HttpError.forbidden())

      const response = await app.inject({
        method: 'POST',
        url: `/api/v1/pet-health/${PET_ID}/vaccinations`,
        headers: { authorization: `Bearer ${makeAuthToken()}` },
        body: { vaccineName: 'V10', applicationDate: '2026-01-15' },
      })

      expect(response.statusCode).toBe(403)
    })
  })

  // ── GET /api/v1/pet-health/:petId/exams ──────────────────────────────────

  describe('GET /api/v1/pet-health/:petId/exams', () => {
    it('returns 200 with exam files list', async () => {
      const { app, service } = await buildTestApp()
      jest.mocked(service.listExamFiles).mockResolvedValueOnce([MOCK_EXAM] as any)

      const response = await app.inject({
        method: 'GET',
        url: `/api/v1/pet-health/${PET_ID}/exams`,
        headers: { authorization: `Bearer ${makeAuthToken()}` },
      })

      expect(response.statusCode).toBe(200)
      const body = response.json()
      expect(body.success).toBe(true)
      expect(body.data).toHaveLength(1)
      expect(body.data[0].examType).toBe('Hemograma')
    })

    it('returns 401 when not authenticated', async () => {
      const { app } = await buildTestApp()

      const response = await app.inject({
        method: 'GET',
        url: `/api/v1/pet-health/${PET_ID}/exams`,
      })

      expect(response.statusCode).toBe(401)
    })
  })

  // ── POST /api/v1/pet-health/:petId/exams (multipart) ─────────────────────

  describe('POST /api/v1/pet-health/:petId/exams', () => {
    it('returns 201 with created exam file (multipart)', async () => {
      const { app, service } = await buildTestApp()
      jest.mocked(service.uploadExamFile).mockResolvedValueOnce(MOCK_EXAM as any)

      const boundary = '----TestBoundary1234'
      const body = [
        `--${boundary}`,
        'Content-Disposition: form-data; name="file"; filename="blood-test.pdf"',
        'Content-Type: application/pdf',
        '',
        'fake-pdf-binary-content',
        `--${boundary}`,
        'Content-Disposition: form-data; name="examType"',
        '',
        'Hemograma',
        `--${boundary}`,
        'Content-Disposition: form-data; name="examDate"',
        '',
        '2026-02-01',
        `--${boundary}--`,
      ].join('\r\n')

      const response = await app.inject({
        method: 'POST',
        url: `/api/v1/pet-health/${PET_ID}/exams`,
        headers: {
          authorization: `Bearer ${makeAuthToken()}`,
          'content-type': `multipart/form-data; boundary=${boundary}`,
        },
        payload: body,
      })

      expect(response.statusCode).toBe(201)
      const parsed = response.json()
      expect(parsed.success).toBe(true)
      expect(parsed.data.examType).toBe('Hemograma')
    })

    it('returns 400 when required fields are missing', async () => {
      const { app } = await buildTestApp()

      const boundary = '----TestBoundary5678'
      const body = [
        `--${boundary}`,
        'Content-Disposition: form-data; name="file"; filename="test.pdf"',
        'Content-Type: application/pdf',
        '',
        'content',
        `--${boundary}--`,
      ].join('\r\n')

      const response = await app.inject({
        method: 'POST',
        url: `/api/v1/pet-health/${PET_ID}/exams`,
        headers: {
          authorization: `Bearer ${makeAuthToken()}`,
          'content-type': `multipart/form-data; boundary=${boundary}`,
        },
        payload: body,
      })

      expect(response.statusCode).toBe(400)
    })

    it('returns 401 when not authenticated', async () => {
      const { app } = await buildTestApp()

      const response = await app.inject({
        method: 'POST',
        url: `/api/v1/pet-health/${PET_ID}/exams`,
        headers: { 'content-type': 'multipart/form-data; boundary=----x' },
        payload: '----x--',
      })

      expect(response.statusCode).toBe(401)
    })
  })

  // ── DELETE /api/v1/pet-health/:petId/vaccinations/:vaccinationId ─────────

  describe('DELETE /api/v1/pet-health/:petId/vaccinations/:vaccinationId', () => {
    it('returns 204 on successful deletion', async () => {
      const { app, service } = await buildTestApp()
      jest.mocked(service.deleteVaccination).mockResolvedValueOnce(undefined)

      const response = await app.inject({
        method: 'DELETE',
        url: `/api/v1/pet-health/${PET_ID}/vaccinations/${VACC_ID}`,
        headers: { authorization: `Bearer ${makeAuthToken()}` },
      })

      expect(response.statusCode).toBe(204)
    })

    it('returns 404 when vaccination not found', async () => {
      const { app, service } = await buildTestApp()
      jest.mocked(service.deleteVaccination).mockRejectedValueOnce(HttpError.notFound('Vacina'))

      const response = await app.inject({
        method: 'DELETE',
        url: `/api/v1/pet-health/${PET_ID}/vaccinations/${VACC_ID}`,
        headers: { authorization: `Bearer ${makeAuthToken()}` },
      })

      expect(response.statusCode).toBe(404)
    })

    it('returns 401 when not authenticated', async () => {
      const { app } = await buildTestApp()

      const response = await app.inject({
        method: 'DELETE',
        url: `/api/v1/pet-health/${PET_ID}/vaccinations/${VACC_ID}`,
      })

      expect(response.statusCode).toBe(401)
    })

    it('returns 403 when user has no tutorship', async () => {
      const { app, service } = await buildTestApp()
      jest.mocked(service.deleteVaccination).mockRejectedValueOnce(HttpError.forbidden())

      const response = await app.inject({
        method: 'DELETE',
        url: `/api/v1/pet-health/${PET_ID}/vaccinations/${VACC_ID}`,
        headers: { authorization: `Bearer ${makeAuthToken()}` },
      })

      expect(response.statusCode).toBe(403)
    })
  })

  // ── DELETE /api/v1/pet-health/:petId/exams/:examId ────────────────────────

  describe('DELETE /api/v1/pet-health/:petId/exams/:examId', () => {
    it('returns 204 on successful deletion', async () => {
      const { app, service } = await buildTestApp()
      jest.mocked(service.deleteExamFile).mockResolvedValueOnce(undefined)

      const response = await app.inject({
        method: 'DELETE',
        url: `/api/v1/pet-health/${PET_ID}/exams/${EXAM_ID}`,
        headers: { authorization: `Bearer ${makeAuthToken()}` },
      })

      expect(response.statusCode).toBe(204)
    })

    it('returns 404 when exam file not found', async () => {
      const { app, service } = await buildTestApp()
      jest.mocked(service.deleteExamFile).mockRejectedValueOnce(HttpError.notFound('Arquivo de exame'))

      const response = await app.inject({
        method: 'DELETE',
        url: `/api/v1/pet-health/${PET_ID}/exams/${EXAM_ID}`,
        headers: { authorization: `Bearer ${makeAuthToken()}` },
      })

      expect(response.statusCode).toBe(404)
    })

    it('returns 401 when not authenticated', async () => {
      const { app } = await buildTestApp()

      const response = await app.inject({
        method: 'DELETE',
        url: `/api/v1/pet-health/${PET_ID}/exams/${EXAM_ID}`,
      })

      expect(response.statusCode).toBe(401)
    })

    it('returns 403 when user has no tutorship', async () => {
      const { app, service } = await buildTestApp()
      jest.mocked(service.deleteExamFile).mockRejectedValueOnce(HttpError.forbidden())

      const response = await app.inject({
        method: 'DELETE',
        url: `/api/v1/pet-health/${PET_ID}/exams/${EXAM_ID}`,
        headers: { authorization: `Bearer ${makeAuthToken()}` },
      })

      expect(response.statusCode).toBe(403)
    })
  })
})
