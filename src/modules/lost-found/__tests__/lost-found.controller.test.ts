/**
 * @module lost-found
 * @file lost-found.controller.test.ts
 * @description HTTP-layer tests for lost-found routes using Fastify inject — service is mocked.
 */

import jwt from 'jsonwebtoken'
import { buildApp } from '../../../app'
import { LostFoundService } from '../lost-found.service'
import { HttpError } from '../../../shared/errors/HttpError'

jest.mock('../lost-found.service')
const MockedLostFoundService = LostFoundService as jest.MockedClass<typeof LostFoundService>

// ─── Fixtures ─────────────────────────────────────────────────────────────────

const VALID_PET_UUID = 'b1c2d3e4-f5a6-7890-abcd-ef1234567891'

const MOCK_REPORT = {
  id: 'report-1',
  type: 'LOST',
  petId: VALID_PET_UUID,
  reporterId: 'person-1',
  petName: 'Rex',
  species: 'dog',
  description: 'Cachorro perdido no parque.',
  location: 'Parque Ibirapuera',
  photoUrl: null,
  contactEmail: 'joao@example.com',
  contactPhone: '11 99999-0000',
  status: 'OPEN',
  createdAt: new Date('2026-03-01').toISOString(),
  updatedAt: new Date('2026-03-01').toISOString(),
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
  MockedLostFoundService.mockClear()
  const app = buildApp()
  await app.ready()
  const service = MockedLostFoundService.mock.instances[0]
  return { app, service }
}

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('LostFound routes', () => {
  // ── POST /api/v1/lost-found ───────────────────────────────────────────────

  describe('POST /api/v1/lost-found', () => {
    it('returns 201 with report on successful creation', async () => {
      const { app, service } = await buildTestApp()
      jest.mocked(service.createForUser).mockResolvedValueOnce(MOCK_REPORT as any)

      const response = await app.inject({
        method: 'POST',
        url: '/api/v1/lost-found',
        headers: { authorization: `Bearer ${makeAuthToken()}` },
        body: {
          type: 'LOST',
          petId: VALID_PET_UUID,
          petName: 'Rex',
          species: 'dog',
          description: 'Cachorro perdido no parque.',
          contactEmail: 'joao@example.com',
        },
      })

      expect(response.statusCode).toBe(201)
      const body = response.json()
      expect(body.success).toBe(true)
      expect(body.data.id).toBe('report-1')
      expect(service.createForUser).toHaveBeenCalledWith('user-1', expect.objectContaining({ contactEmail: 'joao@example.com' }))
    })

    it('returns 201 without petId (unknown pet)', async () => {
      const reportWithoutPet = { ...MOCK_REPORT, petId: null, petName: null, species: null }
      const { app, service } = await buildTestApp()
      jest.mocked(service.createForUser).mockResolvedValueOnce(reportWithoutPet as any)

      const response = await app.inject({
        method: 'POST',
        url: '/api/v1/lost-found',
        headers: { authorization: `Bearer ${makeAuthToken()}` },
        body: {
          type: 'FOUND',
          description: 'Encontrei um gato na rua.',
          contactEmail: 'joao@example.com',
        },
      })

      expect(response.statusCode).toBe(201)
      expect(response.json().success).toBe(true)
    })

    it('returns 400 on invalid body (missing description)', async () => {
      const { app } = await buildTestApp()

      const response = await app.inject({
        method: 'POST',
        url: '/api/v1/lost-found',
        headers: { authorization: `Bearer ${makeAuthToken()}` },
        body: {
          type: 'LOST',
          contactEmail: 'joao@example.com',
        },
      })

      expect(response.statusCode).toBe(400)
      expect(response.json().success).toBe(false)
    })

    it('returns 400 on missing contactEmail', async () => {
      const { app } = await buildTestApp()

      const response = await app.inject({
        method: 'POST',
        url: '/api/v1/lost-found',
        headers: { authorization: `Bearer ${makeAuthToken()}` },
        body: {
          type: 'LOST',
          description: 'Cachorro perdido.',
        },
      })

      expect(response.statusCode).toBe(400)
      expect(response.json().success).toBe(false)
    })

    it('returns 400 on invalid type', async () => {
      const { app } = await buildTestApp()

      const response = await app.inject({
        method: 'POST',
        url: '/api/v1/lost-found',
        headers: { authorization: `Bearer ${makeAuthToken()}` },
        body: {
          type: 'INVALID',
          description: 'Cachorro perdido.',
          contactEmail: 'joao@example.com',
        },
      })

      expect(response.statusCode).toBe(400)
      expect(response.json().success).toBe(false)
    })

    it('returns 401 when not authenticated', async () => {
      const { app } = await buildTestApp()

      const response = await app.inject({
        method: 'POST',
        url: '/api/v1/lost-found',
        body: {
          type: 'LOST',
          description: 'Cachorro perdido.',
          contactEmail: 'joao@example.com',
        },
      })

      expect(response.statusCode).toBe(401)
    })

    it('returns 404 when user has no person profile', async () => {
      const { app, service } = await buildTestApp()
      jest.mocked(service.createForUser).mockRejectedValueOnce(HttpError.notFound('Perfil de pessoa do usuário'))

      const response = await app.inject({
        method: 'POST',
        url: '/api/v1/lost-found',
        headers: { authorization: `Bearer ${makeAuthToken()}` },
        body: {
          type: 'LOST',
          description: 'Cachorro perdido.',
          contactEmail: 'joao@example.com',
        },
      })

      expect(response.statusCode).toBe(404)
    })
  })

  // ── GET /api/v1/lost-found ────────────────────────────────────────────────

  describe('GET /api/v1/lost-found', () => {
    it('returns 200 with reports list (public route)', async () => {
      const { app, service } = await buildTestApp()
      jest.mocked(service.findAll).mockResolvedValueOnce({
        data: [MOCK_REPORT as any],
        total: 1,
        page: 1,
        pageSize: 20,
      })

      const response = await app.inject({
        method: 'GET',
        url: '/api/v1/lost-found',
      })

      expect(response.statusCode).toBe(200)
      const body = response.json()
      expect(body.success).toBe(true)
      expect(body.data).toHaveLength(1)
      expect(body.meta.total).toBe(1)
    })

    it('filters by type when provided', async () => {
      const { app, service } = await buildTestApp()
      jest.mocked(service.findAll).mockResolvedValueOnce({ data: [], total: 0, page: 1, pageSize: 20 })

      const response = await app.inject({
        method: 'GET',
        url: '/api/v1/lost-found?type=LOST',
      })

      expect(response.statusCode).toBe(200)
      expect(service.findAll).toHaveBeenCalledWith(expect.objectContaining({ type: 'LOST' }))
    })

    it('filters by status when provided', async () => {
      const { app, service } = await buildTestApp()
      jest.mocked(service.findAll).mockResolvedValueOnce({ data: [], total: 0, page: 1, pageSize: 20 })

      const response = await app.inject({
        method: 'GET',
        url: '/api/v1/lost-found?status=RESOLVED',
      })

      expect(response.statusCode).toBe(200)
      expect(service.findAll).toHaveBeenCalledWith(expect.objectContaining({ status: 'RESOLVED' }))
    })

    it('returns 400 for invalid type query param', async () => {
      const { app } = await buildTestApp()

      const response = await app.inject({
        method: 'GET',
        url: '/api/v1/lost-found?type=INVALID',
      })

      expect(response.statusCode).toBe(400)
    })
  })

  // ── GET /api/v1/lost-found/:id ────────────────────────────────────────────

  describe('GET /api/v1/lost-found/:id', () => {
    it('returns 200 with report when found (public route)', async () => {
      const { app, service } = await buildTestApp()
      jest.mocked(service.findById).mockResolvedValueOnce(MOCK_REPORT as any)

      const response = await app.inject({
        method: 'GET',
        url: '/api/v1/lost-found/report-1',
      })

      expect(response.statusCode).toBe(200)
      const body = response.json()
      expect(body.success).toBe(true)
      expect(body.data.id).toBe('report-1')
    })

    it('returns 404 when report not found', async () => {
      const { app, service } = await buildTestApp()
      jest.mocked(service.findById).mockRejectedValueOnce(HttpError.notFound('Relatório de achado/perdido'))

      const response = await app.inject({
        method: 'GET',
        url: '/api/v1/lost-found/nonexistent',
      })

      expect(response.statusCode).toBe(404)
    })
  })

  // ── PATCH /api/v1/lost-found/:id/status ──────────────────────────────────

  describe('PATCH /api/v1/lost-found/:id/status', () => {
    it('returns 200 with updated report', async () => {
      const updated = { ...MOCK_REPORT, status: 'RESOLVED' }
      const { app, service } = await buildTestApp()
      jest.mocked(service.updateStatus).mockResolvedValueOnce(updated as any)

      const response = await app.inject({
        method: 'PATCH',
        url: '/api/v1/lost-found/report-1/status',
        headers: { authorization: `Bearer ${makeAuthToken()}` },
        body: { status: 'RESOLVED' },
      })

      expect(response.statusCode).toBe(200)
      const body = response.json()
      expect(body.success).toBe(true)
      expect(body.data.status).toBe('RESOLVED')
    })

    it('returns 400 on invalid status', async () => {
      const { app } = await buildTestApp()

      const response = await app.inject({
        method: 'PATCH',
        url: '/api/v1/lost-found/report-1/status',
        headers: { authorization: `Bearer ${makeAuthToken()}` },
        body: { status: 'INVALID_STATUS' },
      })

      expect(response.statusCode).toBe(400)
    })

    it('returns 401 when not authenticated', async () => {
      const { app } = await buildTestApp()

      const response = await app.inject({
        method: 'PATCH',
        url: '/api/v1/lost-found/report-1/status',
        body: { status: 'RESOLVED' },
      })

      expect(response.statusCode).toBe(401)
    })

    it('returns 404 when report not found', async () => {
      const { app, service } = await buildTestApp()
      jest.mocked(service.updateStatus).mockRejectedValueOnce(HttpError.notFound('Relatório de achado/perdido'))

      const response = await app.inject({
        method: 'PATCH',
        url: '/api/v1/lost-found/report-1/status',
        headers: { authorization: `Bearer ${makeAuthToken()}` },
        body: { status: 'RESOLVED' },
      })

      expect(response.statusCode).toBe(404)
    })
  })

  // ── DELETE /api/v1/lost-found/:id ─────────────────────────────────────────

  describe('DELETE /api/v1/lost-found/:id', () => {
    it('returns 204 on successful deletion', async () => {
      const { app, service } = await buildTestApp()
      jest.mocked(service.delete).mockResolvedValueOnce(undefined)

      const response = await app.inject({
        method: 'DELETE',
        url: '/api/v1/lost-found/report-1',
        headers: { authorization: `Bearer ${makeAuthToken()}` },
      })

      expect(response.statusCode).toBe(204)
    })

    it('returns 404 when report not found', async () => {
      const { app, service } = await buildTestApp()
      jest.mocked(service.delete).mockRejectedValueOnce(HttpError.notFound('Relatório de achado/perdido'))

      const response = await app.inject({
        method: 'DELETE',
        url: '/api/v1/lost-found/report-1',
        headers: { authorization: `Bearer ${makeAuthToken()}` },
      })

      expect(response.statusCode).toBe(404)
    })

    it('returns 401 when not authenticated', async () => {
      const { app } = await buildTestApp()

      const response = await app.inject({
        method: 'DELETE',
        url: '/api/v1/lost-found/report-1',
      })

      expect(response.statusCode).toBe(401)
    })
  })

  // ── POST /api/v1/lost-found/:id/photo ────────────────────────────────────

  describe('POST /api/v1/lost-found/:id/photo', () => {
    it('returns 200 with updated report on valid upload', async () => {
      const { app, service } = await buildTestApp()
      const reportWithPhoto = { ...MOCK_REPORT, photoUrl: 'https://storage.example.com/lost-found-images/report-1/123.jpg' }
      jest.mocked(service.uploadPhoto).mockResolvedValueOnce(reportWithPhoto as any)

      const { payload, headers } = makeMultipartBody(Buffer.from('fake-jpeg'), 'photo.jpg', 'image/jpeg')

      const response = await app.inject({
        method: 'POST',
        url: '/api/v1/lost-found/report-1/photo',
        headers: { ...headers, authorization: `Bearer ${makeAuthToken()}` },
        payload,
      })

      expect(response.statusCode).toBe(200)
      const body = response.json()
      expect(body.success).toBe(true)
      expect(body.data.photoUrl).toBe(reportWithPhoto.photoUrl)
      expect(jest.mocked(service.uploadPhoto)).toHaveBeenCalledWith(
        'report-1',
        expect.any(Buffer),
        'image/jpeg',
      )
    })

    it('returns 400 when no file sent', async () => {
      const { app } = await buildTestApp()

      const boundary = 'test-boundary-empty'
      const payload = Buffer.from(`--${boundary}--\r\n`)

      const response = await app.inject({
        method: 'POST',
        url: '/api/v1/lost-found/report-1/photo',
        headers: {
          authorization: `Bearer ${makeAuthToken()}`,
          'content-type': `multipart/form-data; boundary=${boundary}`,
        },
        payload,
      })

      expect(response.statusCode).toBe(400)
      expect(response.json().error.code).toBe('NO_FILE')
    })

    it('returns 400 on invalid file type', async () => {
      const { app } = await buildTestApp()

      const { payload, headers } = makeMultipartBody(Buffer.from('pdf-content'), 'doc.pdf', 'application/pdf')

      const response = await app.inject({
        method: 'POST',
        url: '/api/v1/lost-found/report-1/photo',
        headers: { ...headers, authorization: `Bearer ${makeAuthToken()}` },
        payload,
      })

      expect(response.statusCode).toBe(400)
      expect(response.json().error.code).toBe('INVALID_FILE_TYPE')
    })

    it('returns 404 when report not found', async () => {
      const { app, service } = await buildTestApp()
      jest.mocked(service.uploadPhoto).mockRejectedValueOnce(HttpError.notFound('Relatório de achado/perdido'))

      const { payload, headers } = makeMultipartBody(Buffer.from('fake-jpeg'), 'photo.jpg', 'image/jpeg')

      const response = await app.inject({
        method: 'POST',
        url: '/api/v1/lost-found/nonexistent/photo',
        headers: { ...headers, authorization: `Bearer ${makeAuthToken()}` },
        payload,
      })

      expect(response.statusCode).toBe(404)
    })

    it('returns 401 when not authenticated', async () => {
      const { app } = await buildTestApp()

      const response = await app.inject({
        method: 'POST',
        url: '/api/v1/lost-found/report-1/photo',
      })

      expect(response.statusCode).toBe(401)
    })
  })
})
