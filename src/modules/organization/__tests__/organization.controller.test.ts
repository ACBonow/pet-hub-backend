/**
 * @module organization
 * @file organization.controller.test.ts
 * @description HTTP-layer tests for organization routes using Fastify inject — service is mocked.
 */

import jwt from 'jsonwebtoken'
import { buildApp } from '../../../app'
import { OrganizationService } from '../organization.service'

jest.mock('../organization.service')
const MockedOrgService = OrganizationService as jest.MockedClass<typeof OrganizationService>

// ─── Helpers ─────────────────────────────────────────────────────────────────

const MOCK_ORG = {
  id: 'org-1',
  name: 'Pet Rescue ONG',
  type: 'NGO',
  cnpj: null,
  description: null,
  phone: null,
  email: null,
  address: null,
  createdAt: new Date('2026-01-01').toISOString(),
  updatedAt: new Date('2026-01-01').toISOString(),
  responsiblePersons: [{ organizationId: 'org-1', personId: 'person-1', assignedAt: new Date('2026-01-01').toISOString() }],
}

function makeAuthToken(userId = 'user-1'): string {
  return jwt.sign({ sub: userId }, process.env.JWT_SECRET ?? 'test-secret', { expiresIn: '15m' })
}

async function buildTestApp() {
  MockedOrgService.mockClear()
  const app = buildApp()
  await app.ready()
  const service = MockedOrgService.mock.instances[0]
  return { app, service }
}

// ─── Tests ───────────────────────────────────────────────────────────────────

describe('Organization routes', () => {
  // ── POST /api/v1/organizations ────────────────────────────────────────────

  describe('POST /api/v1/organizations', () => {
    it('returns 201 with organization on successful creation', async () => {
      const { app, service } = await buildTestApp()
      jest.mocked(service.create).mockResolvedValueOnce(MOCK_ORG as any)

      const response = await app.inject({
        method: 'POST',
        url: '/api/v1/organizations',
        headers: { authorization: `Bearer ${makeAuthToken()}` },
        payload: {
          name: 'Pet Rescue ONG',
          type: 'NGO',
          responsiblePersonId: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
        },
      })

      expect(response.statusCode).toBe(201)
      const body = response.json()
      expect(body.success).toBe(true)
      expect(body.data).toHaveProperty('id')

      await app.close()
    })

    it('returns 201 when responsiblePersonId is omitted (uses creator person from JWT)', async () => {
      const { app, service } = await buildTestApp()
      jest.mocked(service.create).mockResolvedValueOnce(MOCK_ORG as any)

      const response = await app.inject({
        method: 'POST',
        url: '/api/v1/organizations',
        headers: { authorization: `Bearer ${makeAuthToken()}` },
        payload: { name: 'Pet Rescue ONG', type: 'NGO' },
      })

      expect(response.statusCode).toBe(201)
      expect(jest.mocked(service.create)).toHaveBeenCalledWith(
        expect.objectContaining({ name: 'Pet Rescue ONG', type: 'NGO' }),
        'user-1',
      )

      await app.close()
    })

    it('returns 400 when name is too short', async () => {
      const { app } = await buildTestApp()

      const response = await app.inject({
        method: 'POST',
        url: '/api/v1/organizations',
        headers: { authorization: `Bearer ${makeAuthToken()}` },
        payload: {
          name: 'X',
          type: 'NGO',
          responsiblePersonId: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
        },
      })

      expect(response.statusCode).toBe(400)
      await app.close()
    })

    it('returns 400 when type is invalid', async () => {
      const { app } = await buildTestApp()

      const response = await app.inject({
        method: 'POST',
        url: '/api/v1/organizations',
        headers: { authorization: `Bearer ${makeAuthToken()}` },
        payload: {
          name: 'Empresa XYZ',
          type: 'INVALID',
          responsiblePersonId: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
        },
      })

      expect(response.statusCode).toBe(400)
      await app.close()
    })

    it('returns 400 when responsiblePersonId is not a UUID', async () => {
      const { app } = await buildTestApp()

      const response = await app.inject({
        method: 'POST',
        url: '/api/v1/organizations',
        headers: { authorization: `Bearer ${makeAuthToken()}` },
        payload: {
          name: 'Empresa XYZ',
          type: 'COMPANY',
          responsiblePersonId: 'not-a-uuid',
        },
      })

      expect(response.statusCode).toBe(400)
      await app.close()
    })

    it('returns 400 when CNPJ is required but missing (COMPANY)', async () => {
      const { app, service } = await buildTestApp()
      const { HttpError } = await import('../../../shared/errors/HttpError')
      jest.mocked(service.create).mockRejectedValueOnce(
        HttpError.badRequest('CNPJ_REQUIRED', 'CNPJ é obrigatório para empresas.'),
      )

      const response = await app.inject({
        method: 'POST',
        url: '/api/v1/organizations',
        headers: { authorization: `Bearer ${makeAuthToken()}` },
        payload: {
          name: 'Empresa XYZ',
          type: 'COMPANY',
          responsiblePersonId: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
        },
      })

      expect(response.statusCode).toBe(400)
      const body = response.json()
      expect(body.error.code).toBe('CNPJ_REQUIRED')

      await app.close()
    })

    it('returns 409 when CNPJ is already in use', async () => {
      const { app, service } = await buildTestApp()
      const { HttpError } = await import('../../../shared/errors/HttpError')
      jest.mocked(service.create).mockRejectedValueOnce(
        HttpError.conflict('CNPJ_ALREADY_IN_USE', 'Este CNPJ já está cadastrado.'),
      )

      const response = await app.inject({
        method: 'POST',
        url: '/api/v1/organizations',
        headers: { authorization: `Bearer ${makeAuthToken()}` },
        payload: {
          name: 'Empresa XYZ',
          type: 'COMPANY',
          cnpj: '11.222.333/0001-81',
          responsiblePersonId: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
        },
      })

      expect(response.statusCode).toBe(409)
      await app.close()
    })

    it('returns 401 when not authenticated', async () => {
      const { app } = await buildTestApp()

      const response = await app.inject({
        method: 'POST',
        url: '/api/v1/organizations',
        payload: { name: 'ONG', type: 'NGO', responsiblePersonId: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890' },
      })

      expect(response.statusCode).toBe(401)
      await app.close()
    })
  })

  // ── GET /api/v1/organizations/:id ─────────────────────────────────────────

  describe('GET /api/v1/organizations/:id', () => {
    it('returns 200 with organization data', async () => {
      const { app, service } = await buildTestApp()
      jest.mocked(service.findById).mockResolvedValueOnce(MOCK_ORG as any)

      const response = await app.inject({
        method: 'GET',
        url: '/api/v1/organizations/org-1',
        headers: { authorization: `Bearer ${makeAuthToken()}` },
      })

      expect(response.statusCode).toBe(200)
      const body = response.json()
      expect(body.success).toBe(true)
      expect(body.data.id).toBe('org-1')

      await app.close()
    })

    it('returns 404 when organization not found', async () => {
      const { app, service } = await buildTestApp()
      const { HttpError } = await import('../../../shared/errors/HttpError')
      jest.mocked(service.findById).mockRejectedValueOnce(HttpError.notFound('Organização'))

      const response = await app.inject({
        method: 'GET',
        url: '/api/v1/organizations/nonexistent',
        headers: { authorization: `Bearer ${makeAuthToken()}` },
      })

      expect(response.statusCode).toBe(404)
      await app.close()
    })

    it('returns 401 when not authenticated', async () => {
      const { app } = await buildTestApp()

      const response = await app.inject({
        method: 'GET',
        url: '/api/v1/organizations/org-1',
      })

      expect(response.statusCode).toBe(401)
      await app.close()
    })
  })

  // ── PATCH /api/v1/organizations/:id ──────────────────────────────────────

  describe('PATCH /api/v1/organizations/:id', () => {
    it('returns 200 with updated organization', async () => {
      const { app, service } = await buildTestApp()
      const updated = { ...MOCK_ORG, name: 'ONG Atualizada' }
      jest.mocked(service.update).mockResolvedValueOnce(updated as any)

      const response = await app.inject({
        method: 'PATCH',
        url: '/api/v1/organizations/org-1',
        headers: { authorization: `Bearer ${makeAuthToken()}` },
        payload: { name: 'ONG Atualizada' },
      })

      expect(response.statusCode).toBe(200)
      const body = response.json()
      expect(body.success).toBe(true)
      expect(body.data.name).toBe('ONG Atualizada')

      await app.close()
    })

    it('returns 400 when name is too short', async () => {
      const { app } = await buildTestApp()

      const response = await app.inject({
        method: 'PATCH',
        url: '/api/v1/organizations/org-1',
        headers: { authorization: `Bearer ${makeAuthToken()}` },
        payload: { name: 'X' },
      })

      expect(response.statusCode).toBe(400)
      await app.close()
    })

    it('returns 404 when organization not found', async () => {
      const { app, service } = await buildTestApp()
      const { HttpError } = await import('../../../shared/errors/HttpError')
      jest.mocked(service.update).mockRejectedValueOnce(HttpError.notFound('Organização'))

      const response = await app.inject({
        method: 'PATCH',
        url: '/api/v1/organizations/nonexistent',
        headers: { authorization: `Bearer ${makeAuthToken()}` },
        payload: { name: 'Novo Nome' },
      })

      expect(response.statusCode).toBe(404)
      await app.close()
    })

    it('returns 401 when not authenticated', async () => {
      const { app } = await buildTestApp()

      const response = await app.inject({
        method: 'PATCH',
        url: '/api/v1/organizations/org-1',
        payload: { name: 'Nome' },
      })

      expect(response.statusCode).toBe(401)
      await app.close()
    })
  })

  // ── DELETE /api/v1/organizations/:id ──────────────────────────────────────

  describe('DELETE /api/v1/organizations/:id', () => {
    it('returns 204 on successful deletion', async () => {
      const { app, service } = await buildTestApp()
      jest.mocked(service.delete).mockResolvedValueOnce(undefined)

      const response = await app.inject({
        method: 'DELETE',
        url: '/api/v1/organizations/org-1',
        headers: { authorization: `Bearer ${makeAuthToken()}` },
      })

      expect(response.statusCode).toBe(204)
      await app.close()
    })

    it('returns 404 when organization not found', async () => {
      const { app, service } = await buildTestApp()
      const { HttpError } = await import('../../../shared/errors/HttpError')
      jest.mocked(service.delete).mockRejectedValueOnce(HttpError.notFound('Organização'))

      const response = await app.inject({
        method: 'DELETE',
        url: '/api/v1/organizations/nonexistent',
        headers: { authorization: `Bearer ${makeAuthToken()}` },
      })

      expect(response.statusCode).toBe(404)
      await app.close()
    })

    it('returns 401 when not authenticated', async () => {
      const { app } = await buildTestApp()

      const response = await app.inject({
        method: 'DELETE',
        url: '/api/v1/organizations/org-1',
      })

      expect(response.statusCode).toBe(401)
      await app.close()
    })
  })

  // ── POST /api/v1/organizations/:id/persons/:personId ─────────────────────

  describe('POST /api/v1/organizations/:id/persons/:personId', () => {
    it('returns 200 when person is added successfully', async () => {
      const { app, service } = await buildTestApp()
      jest.mocked(service.addPerson).mockResolvedValueOnce(undefined)

      const response = await app.inject({
        method: 'POST',
        url: '/api/v1/organizations/org-1/persons/person-2',
        headers: { authorization: `Bearer ${makeAuthToken()}` },
      })

      expect(response.statusCode).toBe(200)
      const body = response.json()
      expect(body.success).toBe(true)

      await app.close()
    })

    it('returns 404 when organization or person not found', async () => {
      const { app, service } = await buildTestApp()
      const { HttpError } = await import('../../../shared/errors/HttpError')
      jest.mocked(service.addPerson).mockRejectedValueOnce(HttpError.notFound('Organização'))

      const response = await app.inject({
        method: 'POST',
        url: '/api/v1/organizations/nonexistent/persons/person-1',
        headers: { authorization: `Bearer ${makeAuthToken()}` },
      })

      expect(response.statusCode).toBe(404)
      await app.close()
    })

    it('returns 401 when not authenticated', async () => {
      const { app } = await buildTestApp()

      const response = await app.inject({
        method: 'POST',
        url: '/api/v1/organizations/org-1/persons/person-1',
      })

      expect(response.statusCode).toBe(401)
      await app.close()
    })
  })

  // ── DELETE /api/v1/organizations/:id/persons/:personId ───────────────────

  describe('DELETE /api/v1/organizations/:id/persons/:personId', () => {
    it('returns 204 when person is removed successfully', async () => {
      const { app, service } = await buildTestApp()
      jest.mocked(service.removePerson).mockResolvedValueOnce(undefined)

      const response = await app.inject({
        method: 'DELETE',
        url: '/api/v1/organizations/org-1/persons/person-2',
        headers: { authorization: `Bearer ${makeAuthToken()}` },
      })

      expect(response.statusCode).toBe(204)
      await app.close()
    })

    it('returns 409 when trying to remove the last person', async () => {
      const { app, service } = await buildTestApp()
      const { HttpError } = await import('../../../shared/errors/HttpError')
      jest.mocked(service.removePerson).mockRejectedValueOnce(
        HttpError.conflict('CANNOT_REMOVE_LAST_PERSON', 'A organização deve ter pelo menos uma pessoa responsável.'),
      )

      const response = await app.inject({
        method: 'DELETE',
        url: '/api/v1/organizations/org-1/persons/person-1',
        headers: { authorization: `Bearer ${makeAuthToken()}` },
      })

      expect(response.statusCode).toBe(409)
      const body = response.json()
      expect(body.error.code).toBe('CANNOT_REMOVE_LAST_PERSON')

      await app.close()
    })

    it('returns 404 when organization not found', async () => {
      const { app, service } = await buildTestApp()
      const { HttpError } = await import('../../../shared/errors/HttpError')
      jest.mocked(service.removePerson).mockRejectedValueOnce(HttpError.notFound('Organização'))

      const response = await app.inject({
        method: 'DELETE',
        url: '/api/v1/organizations/nonexistent/persons/person-1',
        headers: { authorization: `Bearer ${makeAuthToken()}` },
      })

      expect(response.statusCode).toBe(404)
      await app.close()
    })

    it('returns 401 when not authenticated', async () => {
      const { app } = await buildTestApp()

      const response = await app.inject({
        method: 'DELETE',
        url: '/api/v1/organizations/org-1/persons/person-1',
      })

      expect(response.statusCode).toBe(401)
      await app.close()
    })
  })
})
