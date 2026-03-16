/**
 * @module pet
 * @file pet.controller.test.ts
 * @description HTTP-layer tests for pet routes using Fastify inject — service is mocked.
 */

import jwt from 'jsonwebtoken'
import { buildApp } from '../../../app'
import { PetService } from '../pet.service'

jest.mock('../pet.service')
const MockedPetService = PetService as jest.MockedClass<typeof PetService>

// ─── Fixtures ─────────────────────────────────────────────────────────────────

const MOCK_TUTORSHIP = {
  id: 'tutorship-1',
  petId: 'pet-1',
  tutorType: 'PERSON',
  personTutorId: 'person-1',
  orgTutorId: null,
  type: 'OWNER',
  active: true,
  startDate: new Date('2026-01-01').toISOString(),
  endDate: null,
  transferNotes: null,
  createdAt: new Date('2026-01-01').toISOString(),
}

const MOCK_PET = {
  id: 'pet-1',
  name: 'Rex',
  species: 'Cão',
  breed: 'Labrador',
  gender: 'M',
  birthDate: new Date('2022-01-01').toISOString(),
  photoUrl: null,
  microchip: null,
  notes: null,
  createdAt: new Date('2026-01-01').toISOString(),
  updatedAt: new Date('2026-01-01').toISOString(),
  activeTutorship: MOCK_TUTORSHIP,
  coTutors: [],
}

const MOCK_CO_TUTOR = {
  id: 'co-1',
  petId: 'pet-1',
  tutorType: 'PERSON',
  personTutorId: 'person-2',
  orgTutorId: null,
  assignedAt: new Date('2026-01-01').toISOString(),
}

const VALID_UUID = 'a1b2c3d4-e5f6-7890-abcd-ef1234567890'

function makeAuthToken(userId = 'user-1'): string {
  return jwt.sign({ sub: userId }, process.env.JWT_SECRET ?? 'test-secret', { expiresIn: '15m' })
}

async function buildTestApp() {
  MockedPetService.mockClear()
  const app = buildApp()
  await app.ready()
  const service = MockedPetService.mock.instances[0]
  return { app, service }
}

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('Pet routes', () => {
  // ── POST /api/v1/pets ─────────────────────────────────────────────────────

  describe('POST /api/v1/pets', () => {
    it('returns 201 with pet on successful creation', async () => {
      const { app, service } = await buildTestApp()
      jest.mocked(service.create).mockResolvedValueOnce(MOCK_PET as any)

      const response = await app.inject({
        method: 'POST',
        url: '/api/v1/pets',
        headers: { authorization: `Bearer ${makeAuthToken()}` },
        payload: {
          name: 'Rex',
          species: 'Cão',
          tutorType: 'PERSON',
          personTutorId: VALID_UUID,
          tutorshipType: 'OWNER',
        },
      })

      expect(response.statusCode).toBe(201)
      const body = response.json()
      expect(body.success).toBe(true)
      expect(body.data).toHaveProperty('id')

      await app.close()
    })

    it('returns 400 when name is missing', async () => {
      const { app } = await buildTestApp()

      const response = await app.inject({
        method: 'POST',
        url: '/api/v1/pets',
        headers: { authorization: `Bearer ${makeAuthToken()}` },
        payload: {
          species: 'Cão',
          tutorType: 'PERSON',
          personTutorId: VALID_UUID,
          tutorshipType: 'OWNER',
        },
      })

      expect(response.statusCode).toBe(400)
      await app.close()
    })

    it('returns 400 when tutorType is invalid', async () => {
      const { app } = await buildTestApp()

      const response = await app.inject({
        method: 'POST',
        url: '/api/v1/pets',
        headers: { authorization: `Bearer ${makeAuthToken()}` },
        payload: {
          name: 'Rex',
          species: 'Cão',
          tutorType: 'INVALID',
          personTutorId: VALID_UUID,
          tutorshipType: 'OWNER',
        },
      })

      expect(response.statusCode).toBe(400)
      await app.close()
    })

    it('returns 400 when PERSON tutor has no personTutorId', async () => {
      const { app } = await buildTestApp()

      const response = await app.inject({
        method: 'POST',
        url: '/api/v1/pets',
        headers: { authorization: `Bearer ${makeAuthToken()}` },
        payload: {
          name: 'Rex',
          species: 'Cão',
          tutorType: 'PERSON',
          tutorshipType: 'OWNER',
        },
      })

      expect(response.statusCode).toBe(400)
      await app.close()
    })

    it('returns 404 when tutor does not exist', async () => {
      const { app, service } = await buildTestApp()
      const { HttpError } = await import('../../../shared/errors/HttpError')
      jest.mocked(service.create).mockRejectedValueOnce(HttpError.notFound('Tutor'))

      const response = await app.inject({
        method: 'POST',
        url: '/api/v1/pets',
        headers: { authorization: `Bearer ${makeAuthToken()}` },
        payload: {
          name: 'Rex',
          species: 'Cão',
          tutorType: 'PERSON',
          personTutorId: VALID_UUID,
          tutorshipType: 'OWNER',
        },
      })

      expect(response.statusCode).toBe(404)
      await app.close()
    })

    it('returns 401 when not authenticated', async () => {
      const { app } = await buildTestApp()

      const response = await app.inject({
        method: 'POST',
        url: '/api/v1/pets',
        payload: { name: 'Rex', species: 'Cão', tutorType: 'PERSON', personTutorId: VALID_UUID, tutorshipType: 'OWNER' },
      })

      expect(response.statusCode).toBe(401)
      await app.close()
    })
  })

  // ── GET /api/v1/pets/:id ──────────────────────────────────────────────────

  describe('GET /api/v1/pets/:id', () => {
    it('returns 200 with pet data', async () => {
      const { app, service } = await buildTestApp()
      jest.mocked(service.findById).mockResolvedValueOnce(MOCK_PET as any)

      const response = await app.inject({
        method: 'GET',
        url: '/api/v1/pets/pet-1',
        headers: { authorization: `Bearer ${makeAuthToken()}` },
      })

      expect(response.statusCode).toBe(200)
      const body = response.json()
      expect(body.success).toBe(true)
      expect(body.data.id).toBe('pet-1')

      await app.close()
    })

    it('returns 404 when pet not found', async () => {
      const { app, service } = await buildTestApp()
      const { HttpError } = await import('../../../shared/errors/HttpError')
      jest.mocked(service.findById).mockRejectedValueOnce(HttpError.notFound('Pet'))

      const response = await app.inject({
        method: 'GET',
        url: '/api/v1/pets/nonexistent',
        headers: { authorization: `Bearer ${makeAuthToken()}` },
      })

      expect(response.statusCode).toBe(404)
      await app.close()
    })

    it('returns 401 when not authenticated', async () => {
      const { app } = await buildTestApp()

      const response = await app.inject({
        method: 'GET',
        url: '/api/v1/pets/pet-1',
      })

      expect(response.statusCode).toBe(401)
      await app.close()
    })
  })

  // ── PATCH /api/v1/pets/:id ────────────────────────────────────────────────

  describe('PATCH /api/v1/pets/:id', () => {
    it('returns 200 with updated pet', async () => {
      const { app, service } = await buildTestApp()
      const updated = { ...MOCK_PET, name: 'Rex II' }
      jest.mocked(service.update).mockResolvedValueOnce(updated as any)

      const response = await app.inject({
        method: 'PATCH',
        url: '/api/v1/pets/pet-1',
        headers: { authorization: `Bearer ${makeAuthToken()}` },
        payload: { name: 'Rex II' },
      })

      expect(response.statusCode).toBe(200)
      const body = response.json()
      expect(body.success).toBe(true)
      expect(body.data.name).toBe('Rex II')

      await app.close()
    })

    it('returns 404 when pet not found', async () => {
      const { app, service } = await buildTestApp()
      const { HttpError } = await import('../../../shared/errors/HttpError')
      jest.mocked(service.update).mockRejectedValueOnce(HttpError.notFound('Pet'))

      const response = await app.inject({
        method: 'PATCH',
        url: '/api/v1/pets/nonexistent',
        headers: { authorization: `Bearer ${makeAuthToken()}` },
        payload: { name: 'Rex II' },
      })

      expect(response.statusCode).toBe(404)
      await app.close()
    })

    it('returns 401 when not authenticated', async () => {
      const { app } = await buildTestApp()

      const response = await app.inject({
        method: 'PATCH',
        url: '/api/v1/pets/pet-1',
        payload: { name: 'Rex II' },
      })

      expect(response.statusCode).toBe(401)
      await app.close()
    })
  })

  // ── DELETE /api/v1/pets/:id ───────────────────────────────────────────────

  describe('DELETE /api/v1/pets/:id', () => {
    it('returns 204 on successful deletion', async () => {
      const { app, service } = await buildTestApp()
      jest.mocked(service.delete).mockResolvedValueOnce(undefined)

      const response = await app.inject({
        method: 'DELETE',
        url: '/api/v1/pets/pet-1',
        headers: { authorization: `Bearer ${makeAuthToken()}` },
      })

      expect(response.statusCode).toBe(204)
      await app.close()
    })

    it('returns 404 when pet not found', async () => {
      const { app, service } = await buildTestApp()
      const { HttpError } = await import('../../../shared/errors/HttpError')
      jest.mocked(service.delete).mockRejectedValueOnce(HttpError.notFound('Pet'))

      const response = await app.inject({
        method: 'DELETE',
        url: '/api/v1/pets/nonexistent',
        headers: { authorization: `Bearer ${makeAuthToken()}` },
      })

      expect(response.statusCode).toBe(404)
      await app.close()
    })

    it('returns 401 when not authenticated', async () => {
      const { app } = await buildTestApp()

      const response = await app.inject({
        method: 'DELETE',
        url: '/api/v1/pets/pet-1',
      })

      expect(response.statusCode).toBe(401)
      await app.close()
    })
  })

  // ── POST /api/v1/pets/:id/transfer-tutorship ──────────────────────────────

  describe('POST /api/v1/pets/:id/transfer-tutorship', () => {
    it('returns 200 with new tutorship on transfer', async () => {
      const { app, service } = await buildTestApp()
      jest.mocked(service.transferTutorship).mockResolvedValueOnce(MOCK_TUTORSHIP as any)

      const response = await app.inject({
        method: 'POST',
        url: '/api/v1/pets/pet-1/transfer-tutorship',
        headers: { authorization: `Bearer ${makeAuthToken()}` },
        payload: {
          tutorType: 'PERSON',
          personTutorId: VALID_UUID,
          tutorshipType: 'TUTOR',
        },
      })

      expect(response.statusCode).toBe(200)
      const body = response.json()
      expect(body.success).toBe(true)
      expect(body.data).toHaveProperty('id')

      await app.close()
    })

    it('returns 400 when payload is invalid', async () => {
      const { app } = await buildTestApp()

      const response = await app.inject({
        method: 'POST',
        url: '/api/v1/pets/pet-1/transfer-tutorship',
        headers: { authorization: `Bearer ${makeAuthToken()}` },
        payload: { tutorType: 'PERSON', tutorshipType: 'OWNER' }, // missing personTutorId
      })

      expect(response.statusCode).toBe(400)
      await app.close()
    })

    it('returns 404 when pet not found', async () => {
      const { app, service } = await buildTestApp()
      const { HttpError } = await import('../../../shared/errors/HttpError')
      jest.mocked(service.transferTutorship).mockRejectedValueOnce(HttpError.notFound('Pet'))

      const response = await app.inject({
        method: 'POST',
        url: '/api/v1/pets/nonexistent/transfer-tutorship',
        headers: { authorization: `Bearer ${makeAuthToken()}` },
        payload: { tutorType: 'PERSON', personTutorId: VALID_UUID, tutorshipType: 'OWNER' },
      })

      expect(response.statusCode).toBe(404)
      await app.close()
    })

    it('returns 401 when not authenticated', async () => {
      const { app } = await buildTestApp()

      const response = await app.inject({
        method: 'POST',
        url: '/api/v1/pets/pet-1/transfer-tutorship',
        payload: { tutorType: 'PERSON', personTutorId: VALID_UUID, tutorshipType: 'OWNER' },
      })

      expect(response.statusCode).toBe(401)
      await app.close()
    })
  })

  // ── GET /api/v1/pets/:id/tutorship-history ────────────────────────────────

  describe('GET /api/v1/pets/:id/tutorship-history', () => {
    it('returns 200 with tutorship history', async () => {
      const { app, service } = await buildTestApp()
      jest.mocked(service.getTutorshipHistory).mockResolvedValueOnce([MOCK_TUTORSHIP] as any)

      const response = await app.inject({
        method: 'GET',
        url: '/api/v1/pets/pet-1/tutorship-history',
        headers: { authorization: `Bearer ${makeAuthToken()}` },
      })

      expect(response.statusCode).toBe(200)
      const body = response.json()
      expect(body.success).toBe(true)
      expect(Array.isArray(body.data)).toBe(true)

      await app.close()
    })

    it('returns 404 when pet not found', async () => {
      const { app, service } = await buildTestApp()
      const { HttpError } = await import('../../../shared/errors/HttpError')
      jest.mocked(service.getTutorshipHistory).mockRejectedValueOnce(HttpError.notFound('Pet'))

      const response = await app.inject({
        method: 'GET',
        url: '/api/v1/pets/nonexistent/tutorship-history',
        headers: { authorization: `Bearer ${makeAuthToken()}` },
      })

      expect(response.statusCode).toBe(404)
      await app.close()
    })

    it('returns 401 when not authenticated', async () => {
      const { app } = await buildTestApp()

      const response = await app.inject({
        method: 'GET',
        url: '/api/v1/pets/pet-1/tutorship-history',
      })

      expect(response.statusCode).toBe(401)
      await app.close()
    })
  })

  // ── POST /api/v1/pets/:id/co-tutors ──────────────────────────────────────

  describe('POST /api/v1/pets/:id/co-tutors', () => {
    it('returns 201 with co-tutor on successful addition', async () => {
      const { app, service } = await buildTestApp()
      jest.mocked(service.addCoTutor).mockResolvedValueOnce(MOCK_CO_TUTOR as any)

      const response = await app.inject({
        method: 'POST',
        url: '/api/v1/pets/pet-1/co-tutors',
        headers: { authorization: `Bearer ${makeAuthToken()}` },
        payload: { tutorType: 'PERSON', personTutorId: VALID_UUID },
      })

      expect(response.statusCode).toBe(201)
      const body = response.json()
      expect(body.success).toBe(true)
      expect(body.data).toHaveProperty('id')

      await app.close()
    })

    it('returns 409 when co-tutor is same as primary tutor', async () => {
      const { app, service } = await buildTestApp()
      const { HttpError } = await import('../../../shared/errors/HttpError')
      jest.mocked(service.addCoTutor).mockRejectedValueOnce(
        HttpError.conflict('TUTOR_CONFLICT', 'O co-tutor não pode ser o mesmo que o tutor primário.'),
      )

      const response = await app.inject({
        method: 'POST',
        url: '/api/v1/pets/pet-1/co-tutors',
        headers: { authorization: `Bearer ${makeAuthToken()}` },
        payload: { tutorType: 'PERSON', personTutorId: VALID_UUID },
      })

      expect(response.statusCode).toBe(409)
      const body = response.json()
      expect(body.error.code).toBe('TUTOR_CONFLICT')

      await app.close()
    })

    it('returns 400 when payload is invalid', async () => {
      const { app } = await buildTestApp()

      const response = await app.inject({
        method: 'POST',
        url: '/api/v1/pets/pet-1/co-tutors',
        headers: { authorization: `Bearer ${makeAuthToken()}` },
        payload: { tutorType: 'PERSON' }, // missing personTutorId
      })

      expect(response.statusCode).toBe(400)
      await app.close()
    })

    it('returns 401 when not authenticated', async () => {
      const { app } = await buildTestApp()

      const response = await app.inject({
        method: 'POST',
        url: '/api/v1/pets/pet-1/co-tutors',
        payload: { tutorType: 'PERSON', personTutorId: VALID_UUID },
      })

      expect(response.statusCode).toBe(401)
      await app.close()
    })
  })

  // ── DELETE /api/v1/pets/:id/co-tutors/:coTutorId ─────────────────────────

  describe('DELETE /api/v1/pets/:id/co-tutors/:coTutorId', () => {
    it('returns 204 on successful co-tutor removal', async () => {
      const { app, service } = await buildTestApp()
      jest.mocked(service.removeCoTutor).mockResolvedValueOnce(undefined)

      const response = await app.inject({
        method: 'DELETE',
        url: '/api/v1/pets/pet-1/co-tutors/co-1',
        headers: { authorization: `Bearer ${makeAuthToken()}` },
      })

      expect(response.statusCode).toBe(204)
      await app.close()
    })

    it('returns 404 when pet not found', async () => {
      const { app, service } = await buildTestApp()
      const { HttpError } = await import('../../../shared/errors/HttpError')
      jest.mocked(service.removeCoTutor).mockRejectedValueOnce(HttpError.notFound('Pet'))

      const response = await app.inject({
        method: 'DELETE',
        url: '/api/v1/pets/nonexistent/co-tutors/co-1',
        headers: { authorization: `Bearer ${makeAuthToken()}` },
      })

      expect(response.statusCode).toBe(404)
      await app.close()
    })

    it('returns 401 when not authenticated', async () => {
      const { app } = await buildTestApp()

      const response = await app.inject({
        method: 'DELETE',
        url: '/api/v1/pets/pet-1/co-tutors/co-1',
      })

      expect(response.statusCode).toBe(401)
      await app.close()
    })
  })
})
