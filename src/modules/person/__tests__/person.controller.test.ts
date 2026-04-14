/**
 * @module person
 * @file person.controller.test.ts
 * @description HTTP-layer tests for person routes using Fastify inject — service is mocked.
 */

import jwt from 'jsonwebtoken'
import { buildApp } from '../../../app'
import { PersonService } from '../person.service'

jest.mock('../person.service')
const MockedPersonService = PersonService as jest.MockedClass<typeof PersonService>

// ─── Helpers ─────────────────────────────────────────────────────────────────

const MOCK_PERSON = {
  id: 'person-1',
  userId: 'user-1',
  name: 'João Silva',
  cpf: '52998224725',
  phone: null,
  createdAt: new Date('2026-01-01').toISOString(),
  updatedAt: new Date('2026-01-01').toISOString(),
}

function makeAuthToken(userId = 'user-1'): string {
  return jwt.sign({ sub: userId }, process.env.JWT_SECRET ?? 'test-secret', { expiresIn: '15m' })
}

async function buildTestApp() {
  MockedPersonService.mockClear()
  const app = buildApp()
  await app.ready()
  const service = MockedPersonService.mock.instances[0]
  return { app, service }
}

// ─── Tests ───────────────────────────────────────────────────────────────────

describe('Person routes', () => {
  // ── GET /api/v1/persons/me ─────────────────────────────────────────────────

  describe('GET /api/v1/persons/me', () => {
    it('returns 200 with person profile', async () => {
      const { app, service } = await buildTestApp()
      jest.mocked(service.getProfile).mockResolvedValueOnce(MOCK_PERSON as any)

      const response = await app.inject({
        method: 'GET',
        url: '/api/v1/persons/me',
        headers: { authorization: `Bearer ${makeAuthToken()}` },
      })

      expect(response.statusCode).toBe(200)
      const body = response.json()
      expect(body.success).toBe(true)
      expect(body.data).toHaveProperty('cpf')

      await app.close()
    })

    it('returns 404 when user has no profile', async () => {
      const { app, service } = await buildTestApp()
      const { HttpError } = await import('../../../shared/errors/HttpError')
      jest.mocked(service.getProfile).mockRejectedValueOnce(HttpError.notFound('Perfil'))

      const response = await app.inject({
        method: 'GET',
        url: '/api/v1/persons/me',
        headers: { authorization: `Bearer ${makeAuthToken()}` },
      })

      expect(response.statusCode).toBe(404)
      await app.close()
    })

    it('returns 401 when not authenticated', async () => {
      const { app } = await buildTestApp()

      const response = await app.inject({
        method: 'GET',
        url: '/api/v1/persons/me',
      })

      expect(response.statusCode).toBe(401)
      await app.close()
    })
  })

  // ── GET /api/v1/persons/:id ────────────────────────────────────────────────

  describe('GET /api/v1/persons/:id', () => {
    it('returns 200 with person data', async () => {
      const { app, service } = await buildTestApp()
      jest.mocked(service.findById).mockResolvedValueOnce(MOCK_PERSON as any)

      const response = await app.inject({
        method: 'GET',
        url: '/api/v1/persons/person-1',
        headers: { authorization: `Bearer ${makeAuthToken()}` },
      })

      expect(response.statusCode).toBe(200)
      const body = response.json()
      expect(body.success).toBe(true)
      expect(body.data.id).toBe('person-1')

      await app.close()
    })

    it('returns 404 when person not found', async () => {
      const { app, service } = await buildTestApp()
      const { HttpError } = await import('../../../shared/errors/HttpError')
      jest.mocked(service.findById).mockRejectedValueOnce(HttpError.notFound('Pessoa'))

      const response = await app.inject({
        method: 'GET',
        url: '/api/v1/persons/nonexistent',
        headers: { authorization: `Bearer ${makeAuthToken()}` },
      })

      expect(response.statusCode).toBe(404)
      await app.close()
    })

    it('returns 401 when not authenticated', async () => {
      const { app } = await buildTestApp()

      const response = await app.inject({
        method: 'GET',
        url: '/api/v1/persons/person-1',
      })

      expect(response.statusCode).toBe(401)
      await app.close()
    })
  })

  // ── PATCH /api/v1/persons/:id ──────────────────────────────────────────────

  describe('PATCH /api/v1/persons/:id', () => {
    it('returns 200 with updated person', async () => {
      const { app, service } = await buildTestApp()
      const updated = { ...MOCK_PERSON, name: 'João Atualizado' }
      jest.mocked(service.update).mockResolvedValueOnce(updated as any)

      const response = await app.inject({
        method: 'PATCH',
        url: '/api/v1/persons/person-1',
        headers: { authorization: `Bearer ${makeAuthToken()}` },
        payload: { name: 'João Atualizado' },
      })

      expect(response.statusCode).toBe(200)
      const body = response.json()
      expect(body.success).toBe(true)
      expect(body.data.name).toBe('João Atualizado')

      await app.close()
    })

    it('returns 400 when name is too short', async () => {
      const { app } = await buildTestApp()

      const response = await app.inject({
        method: 'PATCH',
        url: '/api/v1/persons/person-1',
        headers: { authorization: `Bearer ${makeAuthToken()}` },
        payload: { name: 'J' },
      })

      expect(response.statusCode).toBe(400)
      await app.close()
    })

    it('returns 404 when person not found', async () => {
      const { app, service } = await buildTestApp()
      const { HttpError } = await import('../../../shared/errors/HttpError')
      jest.mocked(service.update).mockRejectedValueOnce(HttpError.notFound('Pessoa'))

      const response = await app.inject({
        method: 'PATCH',
        url: '/api/v1/persons/nonexistent',
        headers: { authorization: `Bearer ${makeAuthToken()}` },
        payload: { name: 'Novo Nome' },
      })

      expect(response.statusCode).toBe(404)
      await app.close()
    })

    it('returns 403 when user tries to update another person profile', async () => {
      const { app, service } = await buildTestApp()
      const { AppError } = await import('../../../shared/errors/AppError')
      jest.mocked(service.update).mockRejectedValueOnce(new AppError(403, 'INSUFFICIENT_PERMISSION', 'Você não tem permissão para editar este perfil.'))

      const response = await app.inject({
        method: 'PATCH',
        url: '/api/v1/persons/person-2',
        headers: { authorization: `Bearer ${makeAuthToken()}` },
        payload: { name: 'Novo Nome' },
      })

      expect(response.statusCode).toBe(403)
      await app.close()
    })

    it('returns 401 when not authenticated', async () => {
      const { app } = await buildTestApp()

      const response = await app.inject({
        method: 'PATCH',
        url: '/api/v1/persons/person-1',
        payload: { name: 'Novo Nome' },
      })

      expect(response.statusCode).toBe(401)
      await app.close()
    })
  })

  // ── DELETE /api/v1/persons/:id ─────────────────────────────────────────────

  describe('DELETE /api/v1/persons/:id', () => {
    it('returns 204 on successful deletion', async () => {
      const { app, service } = await buildTestApp()
      jest.mocked(service.delete).mockResolvedValueOnce(undefined)

      const response = await app.inject({
        method: 'DELETE',
        url: '/api/v1/persons/person-1',
        headers: { authorization: `Bearer ${makeAuthToken()}` },
      })

      expect(response.statusCode).toBe(204)
      await app.close()
    })

    it('returns 404 when person not found', async () => {
      const { app, service } = await buildTestApp()
      const { HttpError } = await import('../../../shared/errors/HttpError')
      jest.mocked(service.delete).mockRejectedValueOnce(HttpError.notFound('Pessoa'))

      const response = await app.inject({
        method: 'DELETE',
        url: '/api/v1/persons/nonexistent',
        headers: { authorization: `Bearer ${makeAuthToken()}` },
      })

      expect(response.statusCode).toBe(404)
      await app.close()
    })

    it('returns 403 when user tries to delete another person profile', async () => {
      const { app, service } = await buildTestApp()
      const { AppError } = await import('../../../shared/errors/AppError')
      jest.mocked(service.delete).mockRejectedValueOnce(new AppError(403, 'INSUFFICIENT_PERMISSION', 'Você não tem permissão para excluir este perfil.'))

      const response = await app.inject({
        method: 'DELETE',
        url: '/api/v1/persons/person-2',
        headers: { authorization: `Bearer ${makeAuthToken()}` },
      })

      expect(response.statusCode).toBe(403)
      await app.close()
    })

    it('returns 401 when not authenticated', async () => {
      const { app } = await buildTestApp()

      const response = await app.inject({
        method: 'DELETE',
        url: '/api/v1/persons/person-1',
      })

      expect(response.statusCode).toBe(401)
      await app.close()
    })
  })
})
