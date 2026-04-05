/**
 * @module adoption
 * @file adoption.controller.test.ts
 * @description HTTP-layer tests for adoption routes using Fastify inject — service is mocked.
 */

import jwt from 'jsonwebtoken'
import { buildApp } from '../../../app'
import { AdoptionService } from '../adoption.service'
import { HttpError } from '../../../shared/errors/HttpError'

jest.mock('../adoption.service')
const MockedAdoptionService = AdoptionService as jest.MockedClass<typeof AdoptionService>

// ─── Fixtures ─────────────────────────────────────────────────────────────────

const MOCK_LISTING = {
  id: 'listing-1',
  petId: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
  listerType: 'PERSON',
  personId: 'b1c2d3e4-f5a6-7890-abcd-ef1234567891',
  organizationId: null,
  description: 'Cachorro amigável procura lar.',
  contactEmail: null,
  contactPhone: null,
  contactWhatsapp: null,
  status: 'AVAILABLE',
  createdAt: new Date('2026-03-01').toISOString(),
  updatedAt: new Date('2026-03-01').toISOString(),
}

const VALID_PET_UUID = 'a1b2c3d4-e5f6-7890-abcd-ef1234567890'
const VALID_ORG_UUID = 'c1d2e3f4-a5b6-7890-abcd-ef1234567892'

function makeAuthToken(userId = 'user-1'): string {
  return jwt.sign({ sub: userId }, process.env.JWT_SECRET ?? 'test-secret', { expiresIn: '15m' })
}

async function buildTestApp() {
  MockedAdoptionService.mockClear()
  const app = buildApp()
  await app.ready()
  const service = MockedAdoptionService.mock.instances[0]
  return { app, service }
}

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('Adoption routes', () => {
  // ── POST /api/v1/adoptions ────────────────────────────────────────────────

  describe('POST /api/v1/adoptions', () => {
    it('returns 201 with listing on successful creation', async () => {
      const { app, service } = await buildTestApp()
      jest.mocked(service.createForUser).mockResolvedValueOnce(MOCK_LISTING as any)

      const response = await app.inject({
        method: 'POST',
        url: '/api/v1/adoptions',
        headers: { authorization: `Bearer ${makeAuthToken()}` },
        body: {
          petId: VALID_PET_UUID,
          description: 'Cachorro amigável procura lar.',
        },
      })

      expect(response.statusCode).toBe(201)
      const body = response.json()
      expect(body.success).toBe(true)
      expect(body.data.id).toBe('listing-1')
    })

    it('returns 400 on invalid body (missing petId)', async () => {
      const { app } = await buildTestApp()

      const response = await app.inject({
        method: 'POST',
        url: '/api/v1/adoptions',
        headers: { authorization: `Bearer ${makeAuthToken()}` },
        body: { description: 'Faltando petId' },
      })

      expect(response.statusCode).toBe(400)
      expect(response.json().success).toBe(false)
    })

    it('returns 201 when contactWhatsapp is provided', async () => {
      const listingWithWhatsapp = { ...MOCK_LISTING, contactWhatsapp: '51999999999' }
      const { app, service } = await buildTestApp()
      jest.mocked(service.createForUser).mockResolvedValueOnce(listingWithWhatsapp as any)

      const response = await app.inject({
        method: 'POST',
        url: '/api/v1/adoptions',
        headers: { authorization: `Bearer ${makeAuthToken()}` },
        body: { petId: VALID_PET_UUID, contactWhatsapp: '51999999999' },
      })

      expect(response.statusCode).toBe(201)
      expect(response.json().data.contactWhatsapp).toBe('51999999999')
    })

    it('returns 201 when organizationId is provided', async () => {
      const orgListing = {
        ...MOCK_LISTING,
        listerType: 'ORGANIZATION',
        personId: null,
        organizationId: VALID_ORG_UUID,
      }
      const { app, service } = await buildTestApp()
      jest.mocked(service.createForUser).mockResolvedValueOnce(orgListing as any)

      const response = await app.inject({
        method: 'POST',
        url: '/api/v1/adoptions',
        headers: { authorization: `Bearer ${makeAuthToken()}` },
        body: { petId: VALID_PET_UUID, organizationId: VALID_ORG_UUID },
      })

      expect(response.statusCode).toBe(201)
      expect(response.json().data.listerType).toBe('ORGANIZATION')
    })

    it('returns 401 when not authenticated', async () => {
      const { app } = await buildTestApp()

      const response = await app.inject({
        method: 'POST',
        url: '/api/v1/adoptions',
        body: { petId: VALID_PET_UUID },
      })

      expect(response.statusCode).toBe(401)
    })

    it('returns 409 when pet already has a listing', async () => {
      const { app, service } = await buildTestApp()
      jest.mocked(service.createForUser).mockRejectedValueOnce(HttpError.conflict('ALREADY_EXISTS', 'Já existe.'))

      const response = await app.inject({
        method: 'POST',
        url: '/api/v1/adoptions',
        headers: { authorization: `Bearer ${makeAuthToken()}` },
        body: { petId: VALID_PET_UUID },
      })

      expect(response.statusCode).toBe(409)
    })

    it('returns 403 when user is not a member of the organization', async () => {
      const { app, service } = await buildTestApp()
      jest.mocked(service.createForUser).mockRejectedValueOnce(
        HttpError.forbidden('Você não tem permissão para publicar por esta organização.'),
      )

      const response = await app.inject({
        method: 'POST',
        url: '/api/v1/adoptions',
        headers: { authorization: `Bearer ${makeAuthToken()}` },
        body: { petId: VALID_PET_UUID, organizationId: VALID_ORG_UUID },
      })

      expect(response.statusCode).toBe(403)
    })
  })

  // ── GET /api/v1/adoptions ─────────────────────────────────────────────────

  describe('GET /api/v1/adoptions', () => {
    it('returns 200 with listings list (public route)', async () => {
      const { app, service } = await buildTestApp()
      jest.mocked(service.findAll).mockResolvedValueOnce({
        data: [MOCK_LISTING as any],
        meta: { total: 1, page: 1, pageSize: 20, totalPages: 1 },
      })

      const response = await app.inject({
        method: 'GET',
        url: '/api/v1/adoptions',
      })

      expect(response.statusCode).toBe(200)
      const body = response.json()
      expect(body.success).toBe(true)
      expect(body.data).toHaveLength(1)
      expect(body.meta.total).toBe(1)
    })

    it('filters by status when provided', async () => {
      const { app, service } = await buildTestApp()
      jest.mocked(service.findAll).mockResolvedValueOnce({
        data: [],
        meta: { total: 0, page: 1, pageSize: 20, totalPages: 1 },
      })

      const response = await app.inject({
        method: 'GET',
        url: '/api/v1/adoptions?status=ADOPTED',
      })

      expect(response.statusCode).toBe(200)
      expect(service.findAll).toHaveBeenCalledWith(expect.objectContaining({ status: 'ADOPTED' }))
    })

    it('returns 400 for invalid status query param', async () => {
      const { app } = await buildTestApp()

      const response = await app.inject({
        method: 'GET',
        url: '/api/v1/adoptions?status=INVALID',
      })

      expect(response.statusCode).toBe(400)
    })

    it('filters by organizationId when provided', async () => {
      const { app, service } = await buildTestApp()
      jest.mocked(service.findAll).mockResolvedValueOnce({ data: [], meta: { total: 0, page: 1, pageSize: 20, totalPages: 1 } })

      const response = await app.inject({
        method: 'GET',
        url: `/api/v1/adoptions?organizationId=${VALID_ORG_UUID}`,
      })

      expect(response.statusCode).toBe(200)
      expect(service.findAll).toHaveBeenCalledWith(expect.objectContaining({ organizationId: VALID_ORG_UUID }))
    })
  })

  // ── GET /api/v1/adoptions/:id ─────────────────────────────────────────────

  describe('GET /api/v1/adoptions/:id', () => {
    it('returns 200 with listing when found (public route)', async () => {
      const { app, service } = await buildTestApp()
      jest.mocked(service.findById).mockResolvedValueOnce(MOCK_LISTING as any)

      const response = await app.inject({
        method: 'GET',
        url: '/api/v1/adoptions/listing-1',
      })

      expect(response.statusCode).toBe(200)
      const body = response.json()
      expect(body.success).toBe(true)
      expect(body.data.id).toBe('listing-1')
    })

    it('returns 404 when listing not found', async () => {
      const { app, service } = await buildTestApp()
      jest.mocked(service.findById).mockRejectedValueOnce(HttpError.notFound('Listagem de adoção'))

      const response = await app.inject({
        method: 'GET',
        url: '/api/v1/adoptions/nonexistent',
      })

      expect(response.statusCode).toBe(404)
    })
  })

  // ── PATCH /api/v1/adoptions/:id/status ────────────────────────────────────

  describe('PATCH /api/v1/adoptions/:id/status', () => {
    it('returns 200 with updated listing', async () => {
      const updated = { ...MOCK_LISTING, status: 'RESERVED' }
      const { app, service } = await buildTestApp()
      jest.mocked(service.updateStatus).mockResolvedValueOnce(updated as any)

      const response = await app.inject({
        method: 'PATCH',
        url: '/api/v1/adoptions/listing-1/status',
        headers: { authorization: `Bearer ${makeAuthToken()}` },
        body: { status: 'RESERVED' },
      })

      expect(response.statusCode).toBe(200)
      const body = response.json()
      expect(body.success).toBe(true)
      expect(body.data.status).toBe('RESERVED')
    })

    it('returns 400 on invalid status', async () => {
      const { app } = await buildTestApp()

      const response = await app.inject({
        method: 'PATCH',
        url: '/api/v1/adoptions/listing-1/status',
        headers: { authorization: `Bearer ${makeAuthToken()}` },
        body: { status: 'INVALID_STATUS' },
      })

      expect(response.statusCode).toBe(400)
    })

    it('returns 401 when not authenticated', async () => {
      const { app } = await buildTestApp()

      const response = await app.inject({
        method: 'PATCH',
        url: '/api/v1/adoptions/listing-1/status',
        body: { status: 'RESERVED' },
      })

      expect(response.statusCode).toBe(401)
    })

    it('returns 403 when user does not own the listing', async () => {
      const { app, service } = await buildTestApp()
      const { AppError } = await import('../../../shared/errors/AppError')
      jest.mocked(service.updateStatus).mockRejectedValueOnce(new AppError(403, 'INSUFFICIENT_PERMISSION', 'Sem permissão.'))

      const response = await app.inject({
        method: 'PATCH',
        url: '/api/v1/adoptions/listing-1/status',
        headers: { authorization: `Bearer ${makeAuthToken()}` },
        body: { status: 'RESERVED' },
      })

      expect(response.statusCode).toBe(403)
    })

    it('passes userId to service.updateStatus', async () => {
      const updated = { ...MOCK_LISTING, status: 'RESERVED' }
      const { app, service } = await buildTestApp()
      jest.mocked(service.updateStatus).mockResolvedValueOnce(updated as any)

      await app.inject({
        method: 'PATCH',
        url: '/api/v1/adoptions/listing-1/status',
        headers: { authorization: `Bearer ${makeAuthToken('user-42')}` },
        body: { status: 'RESERVED' },
      })

      expect(service.updateStatus).toHaveBeenCalledWith('listing-1', 'RESERVED', 'user-42')
    })
  })

  // ── DELETE /api/v1/adoptions/:id ──────────────────────────────────────────

  describe('DELETE /api/v1/adoptions/:id', () => {
    it('returns 204 on successful deletion', async () => {
      const { app, service } = await buildTestApp()
      jest.mocked(service.delete).mockResolvedValueOnce(undefined)

      const response = await app.inject({
        method: 'DELETE',
        url: '/api/v1/adoptions/listing-1',
        headers: { authorization: `Bearer ${makeAuthToken()}` },
      })

      expect(response.statusCode).toBe(204)
    })

    it('returns 404 when listing not found', async () => {
      const { app, service } = await buildTestApp()
      jest.mocked(service.delete).mockRejectedValueOnce(HttpError.notFound('Listagem de adoção'))

      const response = await app.inject({
        method: 'DELETE',
        url: '/api/v1/adoptions/listing-1',
        headers: { authorization: `Bearer ${makeAuthToken()}` },
      })

      expect(response.statusCode).toBe(404)
    })

    it('returns 401 when not authenticated', async () => {
      const { app } = await buildTestApp()

      const response = await app.inject({
        method: 'DELETE',
        url: '/api/v1/adoptions/listing-1',
      })

      expect(response.statusCode).toBe(401)
    })

    it('returns 403 when user does not own the listing', async () => {
      const { app, service } = await buildTestApp()
      const { AppError } = await import('../../../shared/errors/AppError')
      jest.mocked(service.delete).mockRejectedValueOnce(new AppError(403, 'INSUFFICIENT_PERMISSION', 'Sem permissão.'))

      const response = await app.inject({
        method: 'DELETE',
        url: '/api/v1/adoptions/listing-1',
        headers: { authorization: `Bearer ${makeAuthToken()}` },
      })

      expect(response.statusCode).toBe(403)
    })

    it('passes userId to service.delete', async () => {
      const { app, service } = await buildTestApp()
      jest.mocked(service.delete).mockResolvedValueOnce(undefined)

      await app.inject({
        method: 'DELETE',
        url: '/api/v1/adoptions/listing-1',
        headers: { authorization: `Bearer ${makeAuthToken('user-42')}` },
      })

      expect(service.delete).toHaveBeenCalledWith('listing-1', 'user-42')
    })
  })
})
