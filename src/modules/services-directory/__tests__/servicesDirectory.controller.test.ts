/**
 * @module services-directory
 * @file servicesDirectory.controller.test.ts
 * @description HTTP-layer tests for services-directory routes using Fastify inject — service is mocked.
 */

import jwt from 'jsonwebtoken'
import { buildApp } from '../../../app'
import { ServicesDirectoryService } from '../servicesDirectory.service'
import { HttpError } from '../../../shared/errors/HttpError'
import { AppError } from '../../../shared/errors/AppError'

jest.mock('../servicesDirectory.service')
const MockedService = ServicesDirectoryService as jest.MockedClass<typeof ServicesDirectoryService>

// ─── Fixtures ─────────────────────────────────────────────────────────────────

const MOCK_SERVICE_TYPE = {
  id: 'type-1',
  code: 'CLINIC',
  label: 'Clínica',
  color: 'bg-green-100 text-green-800',
  active: true,
  sortOrder: 2,
}

const MOCK_LISTING = {
  id: 'svc-1',
  name: 'Clínica VetCare',
  serviceTypeId: 'type-1',
  serviceType: MOCK_SERVICE_TYPE,
  description: 'Atendimento 24h',
  zipCode: null,
  street: null,
  number: null,
  complement: null,
  neighborhood: null,
  city: null,
  state: null,
  phone: '11999999999',
  whatsapp: null,
  email: 'contato@vetcare.com',
  website: 'https://vetcare.com',
  instagram: null,
  facebook: null,
  tiktok: null,
  youtube: null,
  googleMapsUrl: null,
  googleBusinessUrl: null,
  organizationId: null,
  photoUrl: null,
  createdByUserId: 'user-1',
  createdAt: new Date('2026-01-01').toISOString(),
  updatedAt: new Date('2026-01-01').toISOString(),
}

function makeMultipartBody(fileBuffer: Buffer, filename: string, mimeType: string) {
  const boundary = 'boundary123'
  const payload = Buffer.concat([
    Buffer.from(`--${boundary}\r\nContent-Disposition: form-data; name="file"; filename="${filename}"\r\nContent-Type: ${mimeType}\r\n\r\n`),
    fileBuffer,
    Buffer.from(`\r\n--${boundary}--`),
  ])
  return { payload, headers: { 'content-type': `multipart/form-data; boundary=${boundary}` } }
}

function makeAuthToken(userId = 'user-1'): string {
  return jwt.sign({ sub: userId }, process.env.JWT_SECRET ?? 'test-secret', { expiresIn: '15m' })
}

async function buildTestApp() {
  MockedService.mockClear()
  const app = buildApp()
  await app.ready()
  const service = MockedService.mock.instances[0]
  return { app, service }
}

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('ServicesDirectory routes', () => {
  // ── GET /api/v1/services-directory/types ──────────────────────────────────

  describe('GET /api/v1/services-directory/types', () => {
    it('returns 200 with list of service types (public route)', async () => {
      const { app, service } = await buildTestApp()
      jest.mocked(service.listTypes).mockResolvedValueOnce([MOCK_SERVICE_TYPE])

      const response = await app.inject({
        method: 'GET',
        url: '/api/v1/services-directory/types',
      })

      expect(response.statusCode).toBe(200)
      const body = response.json()
      expect(body.success).toBe(true)
      expect(body.data).toHaveLength(1)
      expect(body.data[0].code).toBe('CLINIC')
    })
  })

  // ── GET /api/v1/services-directory ────────────────────────────────────────

  describe('GET /api/v1/services-directory', () => {
    it('returns 200 with paginated listings (public route)', async () => {
      const { app, service } = await buildTestApp()
      jest.mocked(service.findAll).mockResolvedValueOnce({
        data: [MOCK_LISTING as any],
        total: 1,
        page: 1,
        pageSize: 20,
      })

      const response = await app.inject({
        method: 'GET',
        url: '/api/v1/services-directory',
      })

      expect(response.statusCode).toBe(200)
      const body = response.json()
      expect(body.success).toBe(true)
      expect(body.data).toHaveLength(1)
      expect(body.meta.total).toBe(1)
    })

    it('filters by type when provided', async () => {
      const { app, service } = await buildTestApp()
      jest.mocked(service.findAll).mockResolvedValueOnce({
        data: [],
        total: 0,
        page: 1,
        pageSize: 20,
      })

      const response = await app.inject({
        method: 'GET',
        url: '/api/v1/services-directory?type=CLINIC',
      })

      expect(response.statusCode).toBe(200)
      expect(service.findAll).toHaveBeenCalledWith(expect.objectContaining({ type: 'CLINIC' }))
    })

    it('filters by name when provided', async () => {
      const { app, service } = await buildTestApp()
      jest.mocked(service.findAll).mockResolvedValueOnce({
        data: [MOCK_LISTING as any],
        total: 1,
        page: 1,
        pageSize: 20,
      })

      const response = await app.inject({
        method: 'GET',
        url: '/api/v1/services-directory?name=VetCare',
      })

      expect(response.statusCode).toBe(200)
      expect(service.findAll).toHaveBeenCalledWith(expect.objectContaining({ name: 'VetCare' }))
    })

    it('filters by organizationId when provided', async () => {
      const { app, service } = await buildTestApp()
      jest.mocked(service.findAll).mockResolvedValueOnce({ data: [], total: 0, page: 1, pageSize: 20 })
      const VALID_ORG_UUID = 'c1d2e3f4-a5b6-7890-abcd-ef1234567892'

      const response = await app.inject({
        method: 'GET',
        url: `/api/v1/services-directory?organizationId=${VALID_ORG_UUID}`,
      })

      expect(response.statusCode).toBe(200)
      expect(service.findAll).toHaveBeenCalledWith(expect.objectContaining({ organizationId: VALID_ORG_UUID }))
    })
  })

  // ── GET /api/v1/services-directory/:id ────────────────────────────────────

  describe('GET /api/v1/services-directory/:id', () => {
    it('returns 200 with listing when found (public route)', async () => {
      const { app, service } = await buildTestApp()
      jest.mocked(service.findById).mockResolvedValueOnce(MOCK_LISTING as any)

      const response = await app.inject({
        method: 'GET',
        url: '/api/v1/services-directory/svc-1',
      })

      expect(response.statusCode).toBe(200)
      const body = response.json()
      expect(body.success).toBe(true)
      expect(body.data.id).toBe('svc-1')
      expect(body.data.serviceType.code).toBe('CLINIC')
    })

    it('returns 404 when listing not found', async () => {
      const { app, service } = await buildTestApp()
      jest.mocked(service.findById).mockRejectedValueOnce(HttpError.notFound('Serviço'))

      const response = await app.inject({
        method: 'GET',
        url: '/api/v1/services-directory/nonexistent',
      })

      expect(response.statusCode).toBe(404)
    })
  })

  // ── POST /api/v1/services-directory ───────────────────────────────────────

  describe('POST /api/v1/services-directory', () => {
    it('returns 201 with created listing (authenticated)', async () => {
      const { app, service } = await buildTestApp()
      jest.mocked(service.create).mockResolvedValueOnce(MOCK_LISTING as any)

      const response = await app.inject({
        method: 'POST',
        url: '/api/v1/services-directory',
        headers: { authorization: `Bearer ${makeAuthToken()}` },
        body: { name: 'Clínica VetCare', type: 'CLINIC' },
      })

      expect(response.statusCode).toBe(201)
      const body = response.json()
      expect(body.success).toBe(true)
      expect(body.data.id).toBe('svc-1')
    })

    it('returns 400 on missing required fields', async () => {
      const { app } = await buildTestApp()

      const response = await app.inject({
        method: 'POST',
        url: '/api/v1/services-directory',
        headers: { authorization: `Bearer ${makeAuthToken()}` },
        body: { type: 'CLINIC' }, // missing name
      })

      expect(response.statusCode).toBe(400)
    })

    it('returns 400 on invalid type (service throws VALIDATION_ERROR)', async () => {
      const { app, service } = await buildTestApp()
      jest.mocked(service.create).mockRejectedValueOnce(
        new AppError(400, 'VALIDATION_ERROR', 'Tipo de serviço não encontrado.'),
      )

      const response = await app.inject({
        method: 'POST',
        url: '/api/v1/services-directory',
        headers: { authorization: `Bearer ${makeAuthToken()}` },
        body: { name: 'Test', type: 'INVALID' },
      })

      expect(response.statusCode).toBe(400)
    })

    it('returns 401 when not authenticated', async () => {
      const { app } = await buildTestApp()

      const response = await app.inject({
        method: 'POST',
        url: '/api/v1/services-directory',
        body: { name: 'Clínica VetCare', type: 'CLINIC' },
      })

      expect(response.statusCode).toBe(401)
    })
  })

  // ── PATCH /api/v1/services-directory/:id ──────────────────────────────────

  describe('PATCH /api/v1/services-directory/:id', () => {
    it('returns 200 with updated listing (authenticated)', async () => {
      const updated = { ...MOCK_LISTING, name: 'VetCare Plus' }
      const { app, service } = await buildTestApp()
      jest.mocked(service.update).mockResolvedValueOnce(updated as any)

      const response = await app.inject({
        method: 'PATCH',
        url: '/api/v1/services-directory/svc-1',
        headers: { authorization: `Bearer ${makeAuthToken()}` },
        body: { name: 'VetCare Plus' },
      })

      expect(response.statusCode).toBe(200)
      const body = response.json()
      expect(body.success).toBe(true)
      expect(body.data.name).toBe('VetCare Plus')
    })

    it('returns 404 when listing not found', async () => {
      const { app, service } = await buildTestApp()
      jest.mocked(service.update).mockRejectedValueOnce(HttpError.notFound('Serviço'))

      const response = await app.inject({
        method: 'PATCH',
        url: '/api/v1/services-directory/nonexistent',
        headers: { authorization: `Bearer ${makeAuthToken()}` },
        body: { name: 'Novo Nome' },
      })

      expect(response.statusCode).toBe(404)
    })

    it('returns 401 when not authenticated', async () => {
      const { app } = await buildTestApp()

      const response = await app.inject({
        method: 'PATCH',
        url: '/api/v1/services-directory/svc-1',
        body: { name: 'Novo Nome' },
      })

      expect(response.statusCode).toBe(401)
    })

    it('returns 403 when service throws INSUFFICIENT_PERMISSION', async () => {
      const { app, service } = await buildTestApp()
      jest.mocked(service.update).mockRejectedValueOnce(
        new AppError(403, 'INSUFFICIENT_PERMISSION', 'Sem permissão.'),
      )

      const response = await app.inject({
        method: 'PATCH',
        url: '/api/v1/services-directory/svc-1',
        headers: { authorization: `Bearer ${makeAuthToken()}` },
        body: { name: 'Novo Nome' },
      })

      expect(response.statusCode).toBe(403)
      expect(response.json().error.code).toBe('INSUFFICIENT_PERMISSION')
    })
  })

  // ── DELETE /api/v1/services-directory/:id ─────────────────────────────────

  describe('DELETE /api/v1/services-directory/:id', () => {
    it('returns 204 on successful deletion (authenticated)', async () => {
      const { app, service } = await buildTestApp()
      jest.mocked(service.delete).mockResolvedValueOnce(undefined)

      const response = await app.inject({
        method: 'DELETE',
        url: '/api/v1/services-directory/svc-1',
        headers: { authorization: `Bearer ${makeAuthToken()}` },
      })

      expect(response.statusCode).toBe(204)
    })

    it('returns 404 when listing not found', async () => {
      const { app, service } = await buildTestApp()
      jest.mocked(service.delete).mockRejectedValueOnce(HttpError.notFound('Serviço'))

      const response = await app.inject({
        method: 'DELETE',
        url: '/api/v1/services-directory/nonexistent',
        headers: { authorization: `Bearer ${makeAuthToken()}` },
      })

      expect(response.statusCode).toBe(404)
    })

    it('returns 401 when not authenticated', async () => {
      const { app } = await buildTestApp()

      const response = await app.inject({
        method: 'DELETE',
        url: '/api/v1/services-directory/svc-1',
      })

      expect(response.statusCode).toBe(401)
    })

    it('returns 403 when service throws INSUFFICIENT_PERMISSION', async () => {
      const { app, service } = await buildTestApp()
      jest.mocked(service.delete).mockRejectedValueOnce(
        new AppError(403, 'INSUFFICIENT_PERMISSION', 'Sem permissão.'),
      )

      const response = await app.inject({
        method: 'DELETE',
        url: '/api/v1/services-directory/svc-1',
        headers: { authorization: `Bearer ${makeAuthToken()}` },
      })

      expect(response.statusCode).toBe(403)
      expect(response.json().error.code).toBe('INSUFFICIENT_PERMISSION')
    })
  })

  // ── PATCH /api/v1/services-directory/:id/photo ────────────────────────────

  describe('PATCH /api/v1/services-directory/:id/photo', () => {
    it('returns 401 when not authenticated', async () => {
      const { app } = await buildTestApp()
      const { payload, headers } = makeMultipartBody(Buffer.from([0xff, 0xd8, 0xff, 0xe0]), 'photo.jpg', 'image/jpeg')

      const response = await app.inject({
        method: 'PATCH',
        url: '/api/v1/services-directory/svc-1/photo',
        payload,
        headers,
      })

      expect(response.statusCode).toBe(401)
    })

    it('returns 400 when content-type is not multipart', async () => {
      const { app } = await buildTestApp()

      const response = await app.inject({
        method: 'PATCH',
        url: '/api/v1/services-directory/svc-1/photo',
        headers: { authorization: `Bearer ${makeAuthToken()}`, 'content-type': 'application/json' },
        body: {},
      })

      expect(response.statusCode).toBe(400)
      const body = response.json()
      expect(body.error.code).toBe('NO_FILE')
    })

    it('returns 200 with updated service when upload succeeds', async () => {
      const updated = { ...MOCK_LISTING, photoUrl: 'https://cdn.example.com/service-images/svc-1/123.jpg' }
      const { app, service } = await buildTestApp()
      jest.mocked(service.uploadPhoto).mockResolvedValueOnce(updated as any)

      const { payload, headers } = makeMultipartBody(Buffer.from([0xff, 0xd8, 0xff, 0xe0]), 'photo.jpg', 'image/jpeg')

      const response = await app.inject({
        method: 'PATCH',
        url: '/api/v1/services-directory/svc-1/photo',
        payload,
        headers: { ...headers, authorization: `Bearer ${makeAuthToken()}` },
      })

      expect(response.statusCode).toBe(200)
      const body = response.json()
      expect(body.success).toBe(true)
      expect(body.data.photoUrl).toBe('https://cdn.example.com/service-images/svc-1/123.jpg')
      expect(jest.mocked(service.uploadPhoto)).toHaveBeenCalled()
    })

    it('returns 403 when user has no permission', async () => {
      const { app, service } = await buildTestApp()
      jest.mocked(service.uploadPhoto).mockRejectedValueOnce(
        new AppError(403, 'INSUFFICIENT_PERMISSION', 'Sem permissão.')
      )

      const { payload, headers } = makeMultipartBody(Buffer.from([0xff, 0xd8, 0xff, 0xe0]), 'photo.jpg', 'image/jpeg')

      const response = await app.inject({
        method: 'PATCH',
        url: '/api/v1/services-directory/svc-1/photo',
        payload,
        headers: { ...headers, authorization: `Bearer ${makeAuthToken()}` },
      })

      expect(response.statusCode).toBe(403)
      expect(response.json().error.code).toBe('INSUFFICIENT_PERMISSION')
    })

    it('returns 404 when service not found', async () => {
      const { app, service } = await buildTestApp()
      jest.mocked(service.uploadPhoto).mockRejectedValueOnce(HttpError.notFound('Serviço'))

      const { payload, headers } = makeMultipartBody(Buffer.from([0xff, 0xd8, 0xff, 0xe0]), 'photo.jpg', 'image/jpeg')

      const response = await app.inject({
        method: 'PATCH',
        url: '/api/v1/services-directory/nonexistent/photo',
        payload,
        headers: { ...headers, authorization: `Bearer ${makeAuthToken()}` },
      })

      expect(response.statusCode).toBe(404)
    })
  })
})
