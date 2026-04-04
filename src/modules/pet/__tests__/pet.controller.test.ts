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
  castrated: null,
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
  name: 'Maria Santos',
  assignedAt: new Date('2026-01-01').toISOString(),
}

function makeAuthToken(userId = 'user-1'): string {
  return jwt.sign({ sub: userId }, process.env.JWT_SECRET ?? 'test-secret', { expiresIn: '15m' })
}

function makeMultipartBody(
  fileContent: Buffer,
  filename: string,
  mimeType: string,
): { payload: Buffer; headers: Record<string, string> } {
  const boundary = 'test-boundary-abc123'
  const payload = Buffer.concat([
    Buffer.from(`--${boundary}\r\nContent-Disposition: form-data; name="file"; filename="${filename}"\r\nContent-Type: ${mimeType}\r\n\r\n`),
    fileContent,
    Buffer.from(`\r\n--${boundary}--\r\n`),
  ])
  return { payload, headers: { 'content-type': `multipart/form-data; boundary=${boundary}` } }
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
  // ── GET /api/v1/pets ──────────────────────────────────────────────────────

  describe('GET /api/v1/pets', () => {
    it('returns 200 with list of pets', async () => {
      const { app, service } = await buildTestApp()
      jest.mocked(service.findByUser).mockResolvedValueOnce([MOCK_PET] as any)

      const response = await app.inject({
        method: 'GET',
        url: '/api/v1/pets',
        headers: { authorization: `Bearer ${makeAuthToken()}` },
      })

      expect(response.statusCode).toBe(200)
      const body = response.json()
      expect(body.success).toBe(true)
      expect(Array.isArray(body.data)).toBe(true)
      expect(body.data).toHaveLength(1)
      expect(body.data[0].id).toBe('pet-1')

      await app.close()
    })

    it('returns 200 with empty array when user has no pets', async () => {
      const { app, service } = await buildTestApp()
      jest.mocked(service.findByUser).mockResolvedValueOnce([])

      const response = await app.inject({
        method: 'GET',
        url: '/api/v1/pets',
        headers: { authorization: `Bearer ${makeAuthToken()}` },
      })

      expect(response.statusCode).toBe(200)
      const body = response.json()
      expect(body.data).toEqual([])

      await app.close()
    })

    it('returns 404 when user has no person profile', async () => {
      const { app, service } = await buildTestApp()
      const { HttpError } = await import('../../../shared/errors/HttpError')
      jest.mocked(service.findByUser).mockRejectedValueOnce(HttpError.notFound('Perfil de pessoa do usuário'))

      const response = await app.inject({
        method: 'GET',
        url: '/api/v1/pets',
        headers: { authorization: `Bearer ${makeAuthToken()}` },
      })

      expect(response.statusCode).toBe(404)
      await app.close()
    })

    it('returns 401 when not authenticated', async () => {
      const { app } = await buildTestApp()

      const response = await app.inject({
        method: 'GET',
        url: '/api/v1/pets',
      })

      expect(response.statusCode).toBe(401)
      await app.close()
    })
  })

  // ── POST /api/v1/pets ─────────────────────────────────────────────────────

  describe('POST /api/v1/pets', () => {
    it('returns 201 with pet on successful creation', async () => {
      const { app, service } = await buildTestApp()
      jest.mocked(service.createForUser).mockResolvedValueOnce(MOCK_PET as any)

      const response = await app.inject({
        method: 'POST',
        url: '/api/v1/pets',
        headers: { authorization: `Bearer ${makeAuthToken()}` },
        payload: { name: 'Rex', species: 'Cão', tutorshipType: 'OWNER' },
      })

      expect(response.statusCode).toBe(201)
      const body = response.json()
      expect(body.success).toBe(true)
      expect(body.data).toHaveProperty('id')

      await app.close()
    })

    it('returns 201 with default tutorshipType OWNER when not provided', async () => {
      const { app, service } = await buildTestApp()
      jest.mocked(service.createForUser).mockResolvedValueOnce(MOCK_PET as any)

      const response = await app.inject({
        method: 'POST',
        url: '/api/v1/pets',
        headers: { authorization: `Bearer ${makeAuthToken()}` },
        payload: { name: 'Rex', species: 'Cão' },
      })

      expect(response.statusCode).toBe(201)
      await app.close()
    })

    it('returns 400 when name is missing', async () => {
      const { app } = await buildTestApp()

      const response = await app.inject({
        method: 'POST',
        url: '/api/v1/pets',
        headers: { authorization: `Bearer ${makeAuthToken()}` },
        payload: { species: 'Cão' },
      })

      expect(response.statusCode).toBe(400)
      await app.close()
    })

    it('returns 400 when species is missing', async () => {
      const { app } = await buildTestApp()

      const response = await app.inject({
        method: 'POST',
        url: '/api/v1/pets',
        headers: { authorization: `Bearer ${makeAuthToken()}` },
        payload: { name: 'Rex' },
      })

      expect(response.statusCode).toBe(400)
      await app.close()
    })

    it('returns 404 when user has no person profile', async () => {
      const { app, service } = await buildTestApp()
      const { HttpError } = await import('../../../shared/errors/HttpError')
      jest.mocked(service.createForUser).mockRejectedValueOnce(HttpError.notFound('Perfil de pessoa do usuário'))

      const response = await app.inject({
        method: 'POST',
        url: '/api/v1/pets',
        headers: { authorization: `Bearer ${makeAuthToken()}` },
        payload: { name: 'Rex', species: 'Cão' },
      })

      expect(response.statusCode).toBe(404)
      await app.close()
    })

    it('returns 401 when not authenticated', async () => {
      const { app } = await buildTestApp()

      const response = await app.inject({
        method: 'POST',
        url: '/api/v1/pets',
        payload: { name: 'Rex', species: 'Cão' },
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

    it('returns 403 when user is not primary tutor', async () => {
      const { app, service } = await buildTestApp()
      const { AppError } = await import('../../../shared/errors/AppError')
      jest.mocked(service.update).mockRejectedValueOnce(new AppError(403, 'INSUFFICIENT_PERMISSION', 'Sem permissão.'))

      const response = await app.inject({
        method: 'PATCH',
        url: '/api/v1/pets/pet-1',
        headers: { authorization: `Bearer ${makeAuthToken()}` },
        payload: { name: 'Rex II' },
      })

      expect(response.statusCode).toBe(403)
      await app.close()
    })

    it('passes userId to service.update', async () => {
      const { app, service } = await buildTestApp()
      const updated = { ...MOCK_PET, name: 'Rex II' }
      jest.mocked(service.update).mockResolvedValueOnce(updated as any)

      await app.inject({
        method: 'PATCH',
        url: '/api/v1/pets/pet-1',
        headers: { authorization: `Bearer ${makeAuthToken('user-42')}` },
        payload: { name: 'Rex II' },
      })

      expect(service.update).toHaveBeenCalledWith('pet-1', expect.anything(), 'user-42')
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

    it('returns 403 when user is not primary tutor', async () => {
      const { app, service } = await buildTestApp()
      const { AppError } = await import('../../../shared/errors/AppError')
      jest.mocked(service.delete).mockRejectedValueOnce(new AppError(403, 'INSUFFICIENT_PERMISSION', 'Sem permissão.'))

      const response = await app.inject({
        method: 'DELETE',
        url: '/api/v1/pets/pet-1',
        headers: { authorization: `Bearer ${makeAuthToken()}` },
      })

      expect(response.statusCode).toBe(403)
      await app.close()
    })

    it('passes userId to service.delete', async () => {
      const { app, service } = await buildTestApp()
      jest.mocked(service.delete).mockResolvedValueOnce(undefined)

      await app.inject({
        method: 'DELETE',
        url: '/api/v1/pets/pet-1',
        headers: { authorization: `Bearer ${makeAuthToken('user-42')}` },
      })

      expect(service.delete).toHaveBeenCalledWith('pet-1', 'user-42')
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
        payload: { tutorType: 'PERSON', personCpf: '52998224725', tutorshipType: 'TUTOR' },
      })

      expect(response.statusCode).toBe(200)
      const body = response.json()
      expect(body.success).toBe(true)
      expect(body.data).toHaveProperty('id')

      await app.close()
    })

    it('returns 400 when PERSON transfer has no personCpf', async () => {
      const { app } = await buildTestApp()

      const response = await app.inject({
        method: 'POST',
        url: '/api/v1/pets/pet-1/transfer-tutorship',
        headers: { authorization: `Bearer ${makeAuthToken()}` },
        payload: { tutorType: 'PERSON', tutorshipType: 'OWNER' }, // missing personCpf
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
        payload: { tutorType: 'PERSON', personCpf: '52998224725', tutorshipType: 'OWNER' },
      })

      expect(response.statusCode).toBe(404)
      await app.close()
    })

    it('returns 401 when not authenticated', async () => {
      const { app } = await buildTestApp()

      const response = await app.inject({
        method: 'POST',
        url: '/api/v1/pets/pet-1/transfer-tutorship',
        payload: { tutorType: 'PERSON', personCpf: '52998224725', tutorshipType: 'OWNER' },
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
        payload: { tutorType: 'PERSON', personCpf: '52998224725' },
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
        payload: { tutorType: 'PERSON', personCpf: '52998224725' },
      })

      expect(response.statusCode).toBe(409)
      const body = response.json()
      expect(body.error.code).toBe('TUTOR_CONFLICT')

      await app.close()
    })

    it('returns 400 when PERSON co-tutor has no personCpf', async () => {
      const { app } = await buildTestApp()

      const response = await app.inject({
        method: 'POST',
        url: '/api/v1/pets/pet-1/co-tutors',
        headers: { authorization: `Bearer ${makeAuthToken()}` },
        payload: { tutorType: 'PERSON' }, // missing personCpf
      })

      expect(response.statusCode).toBe(400)
      await app.close()
    })

    it('returns 401 when not authenticated', async () => {
      const { app } = await buildTestApp()

      const response = await app.inject({
        method: 'POST',
        url: '/api/v1/pets/pet-1/co-tutors',
        payload: { tutorType: 'PERSON', personCpf: '52998224725' },
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

  // ── GET /api/v1/organizations/:orgId/pets ────────────────────────────────

  describe('GET /api/v1/organizations/:orgId/pets', () => {
    it('returns 200 with list of org pets', async () => {
      const { app, service } = await buildTestApp()
      jest.mocked(service.findByOrg).mockResolvedValueOnce([MOCK_PET] as any)

      const response = await app.inject({
        method: 'GET',
        url: '/api/v1/organizations/org-1/pets',
        headers: { authorization: `Bearer ${makeAuthToken()}` },
      })

      expect(response.statusCode).toBe(200)
      const body = response.json()
      expect(body.success).toBe(true)
      expect(Array.isArray(body.data)).toBe(true)
      expect(body.data).toHaveLength(1)
      expect(body.data[0].id).toBe('pet-1')

      await app.close()
    })

    it('returns 200 with empty array when org has no pets', async () => {
      const { app, service } = await buildTestApp()
      jest.mocked(service.findByOrg).mockResolvedValueOnce([])

      const response = await app.inject({
        method: 'GET',
        url: '/api/v1/organizations/org-1/pets',
        headers: { authorization: `Bearer ${makeAuthToken()}` },
      })

      expect(response.statusCode).toBe(200)
      const body = response.json()
      expect(body.data).toEqual([])

      await app.close()
    })

    it('returns 403 when user is not a member of the org', async () => {
      const { app, service } = await buildTestApp()
      const { AppError } = await import('../../../shared/errors/AppError')
      jest.mocked(service.findByOrg).mockRejectedValueOnce(
        new AppError(403, 'INSUFFICIENT_PERMISSION', 'Você não é membro desta organização.'),
      )

      const response = await app.inject({
        method: 'GET',
        url: '/api/v1/organizations/org-1/pets',
        headers: { authorization: `Bearer ${makeAuthToken()}` },
      })

      expect(response.statusCode).toBe(403)
      const body = response.json()
      expect(body.error.code).toBe('INSUFFICIENT_PERMISSION')

      await app.close()
    })

    it('returns 401 when not authenticated', async () => {
      const { app } = await buildTestApp()

      const response = await app.inject({
        method: 'GET',
        url: '/api/v1/organizations/org-1/pets',
      })

      expect(response.statusCode).toBe(401)
      await app.close()
    })
  })

  // ── POST /api/v1/pets/:id/photo ───────────────────────────────────────────

  describe('POST /api/v1/pets/:id/photo', () => {
    it('returns 200 with updated pet on valid upload', async () => {
      const { app, service } = await buildTestApp()
      const petWithPhoto = { ...MOCK_PET, photoUrl: 'https://storage.example.com/pet-images/pet-1/123.jpg' }
      jest.mocked(service.uploadPhoto).mockResolvedValueOnce(petWithPhoto as any)

      const { payload, headers } = makeMultipartBody(Buffer.from([0xff, 0xd8, 0xff, 0xe0]), 'photo.jpg', 'image/jpeg')

      const response = await app.inject({
        method: 'POST',
        url: '/api/v1/pets/pet-1/photo',
        headers: { ...headers, authorization: `Bearer ${makeAuthToken()}` },
        payload,
      })

      expect(response.statusCode).toBe(200)
      const body = response.json()
      expect(body.success).toBe(true)
      expect(body.data.photoUrl).toBe(petWithPhoto.photoUrl)
      expect(jest.mocked(service.uploadPhoto)).toHaveBeenCalledWith(
        'pet-1',
        expect.any(Buffer),
        'image/jpeg',
      )

      await app.close()
    })

    it('returns 400 when multipart has no file field', async () => {
      const { app } = await buildTestApp()

      // Valid multipart boundary but no file part
      const boundary = 'test-boundary-empty'
      const payload = Buffer.from(`--${boundary}--\r\n`)

      const response = await app.inject({
        method: 'POST',
        url: '/api/v1/pets/pet-1/photo',
        headers: {
          authorization: `Bearer ${makeAuthToken()}`,
          'content-type': `multipart/form-data; boundary=${boundary}`,
        },
        payload,
      })

      expect(response.statusCode).toBe(400)
      const body = response.json()
      expect(body.error.code).toBe('NO_FILE')

      await app.close()
    })

    it('returns 400 when file type is not an image', async () => {
      const { app } = await buildTestApp()

      const { payload, headers } = makeMultipartBody(Buffer.from('pdf-content'), 'doc.pdf', 'application/pdf')

      const response = await app.inject({
        method: 'POST',
        url: '/api/v1/pets/pet-1/photo',
        headers: { ...headers, authorization: `Bearer ${makeAuthToken()}` },
        payload,
      })

      expect(response.statusCode).toBe(400)
      const body = response.json()
      expect(body.error.code).toBe('INVALID_FILE_TYPE')

      await app.close()
    })

    it('returns 404 when pet not found', async () => {
      const { app, service } = await buildTestApp()
      const { HttpError } = await import('../../../shared/errors/HttpError')
      jest.mocked(service.uploadPhoto).mockRejectedValueOnce(HttpError.notFound('Pet'))

      const { payload, headers } = makeMultipartBody(Buffer.from([0xff, 0xd8, 0xff, 0xe0]), 'photo.jpg', 'image/jpeg')

      const response = await app.inject({
        method: 'POST',
        url: '/api/v1/pets/nonexistent/photo',
        headers: { ...headers, authorization: `Bearer ${makeAuthToken()}` },
        payload,
      })

      expect(response.statusCode).toBe(404)
      await app.close()
    })

    it('returns 401 when not authenticated', async () => {
      const { app } = await buildTestApp()

      const response = await app.inject({
        method: 'POST',
        url: '/api/v1/pets/pet-1/photo',
      })

      expect(response.statusCode).toBe(401)
      await app.close()
    })
  })
})
