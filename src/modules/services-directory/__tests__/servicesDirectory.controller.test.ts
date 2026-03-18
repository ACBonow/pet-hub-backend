/**
 * @module services-directory
 * @file servicesDirectory.controller.test.ts
 * @description HTTP-layer tests for services-directory routes using Fastify inject — service is mocked.
 */

import jwt from 'jsonwebtoken'
import { buildApp } from '../../../app'
import { ServicesDirectoryService } from '../servicesDirectory.service'
import { HttpError } from '../../../shared/errors/HttpError'

jest.mock('../servicesDirectory.service')
const MockedService = ServicesDirectoryService as jest.MockedClass<typeof ServicesDirectoryService>

// ─── Fixtures ─────────────────────────────────────────────────────────────────

const MOCK_LISTING = {
  id: 'svc-1',
  name: 'Clínica VetCare',
  type: 'CLINIC',
  description: 'Atendimento 24h',
  address: 'Rua das Flores, 100',
  phone: '11999999999',
  email: 'contato@vetcare.com',
  website: 'https://vetcare.com',
  organizationId: null,
  createdAt: new Date('2026-01-01').toISOString(),
  updatedAt: new Date('2026-01-01').toISOString(),
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

    it('returns 400 for invalid type query param', async () => {
      const { app } = await buildTestApp()

      const response = await app.inject({
        method: 'GET',
        url: '/api/v1/services-directory?type=INVALID',
      })

      expect(response.statusCode).toBe(400)
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

    it('returns 400 on invalid body', async () => {
      const { app } = await buildTestApp()

      const response = await app.inject({
        method: 'POST',
        url: '/api/v1/services-directory',
        headers: { authorization: `Bearer ${makeAuthToken()}` },
        body: { type: 'CLINIC' }, // missing name
      })

      expect(response.statusCode).toBe(400)
    })

    it('returns 400 on invalid type', async () => {
      const { app } = await buildTestApp()

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
  })
})
