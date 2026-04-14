/**
 * @module organization
 * @file organization.controller.test.ts
 * @description HTTP-layer tests for organization routes using Fastify inject — service is mocked.
 */

import jwt from 'jsonwebtoken'
import { buildApp } from '../../../app'
import { OrganizationService } from '../organization.service'
import { AppError } from '../../../shared/errors/AppError'
import { resolveActorContext } from '../../../shared/utils/resolve-actor-context'

jest.mock('../organization.service')
jest.mock('../../../shared/utils/resolve-actor-context')

const MockedOrgService = OrganizationService as jest.MockedClass<typeof OrganizationService>
const mockResolveActorContext = jest.mocked(resolveActorContext)

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
  responsiblePersons: [{ organizationId: 'org-1', personId: 'person-1', role: 'OWNER', assignedAt: new Date('2026-01-01').toISOString() }],
  myRole: 'OWNER',
}

const MOCK_MEMBERS = [
  { organizationId: 'org-1', personId: 'person-1', role: 'OWNER', assignedAt: new Date('2026-01-01').toISOString() },
  { organizationId: 'org-1', personId: 'person-2', role: 'MEMBER', assignedAt: new Date('2026-01-01').toISOString() },
]

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

    it('returns 403 when user is not OWNER (service)', async () => {
      const { app, service } = await buildTestApp()
      jest.mocked(service.update).mockRejectedValueOnce(
        new AppError(403, 'INSUFFICIENT_PERMISSION', 'Apenas o OWNER pode editar a organização.'),
      )

      const response = await app.inject({
        method: 'PATCH',
        url: '/api/v1/organizations/org-1',
        headers: { authorization: `Bearer ${makeAuthToken('user-2')}` },
        payload: { name: 'Novo Nome' },
      })

      expect(response.statusCode).toBe(403)
      await app.close()
    })

    it('returns 403 when resolveActorContext rejects (not a member)', async () => {
      const { app, service } = await buildTestApp()
      mockResolveActorContext.mockRejectedValueOnce(
        new AppError(403, 'INSUFFICIENT_PERMISSION', 'Você não tem permissão para realizar esta ação na organização.'),
      )

      const response = await app.inject({
        method: 'PATCH',
        url: '/api/v1/organizations/org-1',
        headers: { authorization: `Bearer ${makeAuthToken('user-outsider')}` },
        payload: { name: 'Novo Nome' },
      })

      expect(response.statusCode).toBe(403)
      expect(service.update).not.toHaveBeenCalled()
      await app.close()
    })

    it('passes userId to service.update', async () => {
      const { app, service } = await buildTestApp()
      jest.mocked(service.update).mockResolvedValueOnce(MOCK_ORG as any)

      await app.inject({
        method: 'PATCH',
        url: '/api/v1/organizations/org-1',
        headers: { authorization: `Bearer ${makeAuthToken('user-1')}` },
        payload: { name: 'ONG Atualizada' },
      })

      expect(service.update).toHaveBeenCalledWith('org-1', expect.any(Object), 'user-1')
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

    it('returns 403 when user is not OWNER (service)', async () => {
      const { app, service } = await buildTestApp()
      jest.mocked(service.delete).mockRejectedValueOnce(
        new AppError(403, 'INSUFFICIENT_PERMISSION', 'Apenas o OWNER pode excluir a organização.'),
      )

      const response = await app.inject({
        method: 'DELETE',
        url: '/api/v1/organizations/org-1',
        headers: { authorization: `Bearer ${makeAuthToken('user-2')}` },
      })

      expect(response.statusCode).toBe(403)
      await app.close()
    })

    it('returns 403 when resolveActorContext rejects (not a member)', async () => {
      const { app, service } = await buildTestApp()
      mockResolveActorContext.mockRejectedValueOnce(
        new AppError(403, 'INSUFFICIENT_PERMISSION', 'Você não tem permissão para realizar esta ação na organização.'),
      )

      const response = await app.inject({
        method: 'DELETE',
        url: '/api/v1/organizations/org-1',
        headers: { authorization: `Bearer ${makeAuthToken('user-outsider')}` },
      })

      expect(response.statusCode).toBe(403)
      expect(service.delete).not.toHaveBeenCalled()
      await app.close()
    })

    it('passes userId to service.delete', async () => {
      const { app, service } = await buildTestApp()
      jest.mocked(service.delete).mockResolvedValueOnce(undefined)

      await app.inject({
        method: 'DELETE',
        url: '/api/v1/organizations/org-1',
        headers: { authorization: `Bearer ${makeAuthToken('user-1')}` },
      })

      expect(service.delete).toHaveBeenCalledWith('org-1', 'user-1')
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
    it('returns 201 when person is added successfully', async () => {
      const { app, service } = await buildTestApp()
      jest.mocked(service.addPerson).mockResolvedValueOnce(undefined)

      const response = await app.inject({
        method: 'POST',
        url: '/api/v1/organizations/org-1/persons/person-2',
        headers: { authorization: `Bearer ${makeAuthToken()}` },
      })

      expect(response.statusCode).toBe(201)
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

    it('returns 403 when user lacks OWNER/MANAGER permission', async () => {
      const { app } = await buildTestApp()
      const { AppError } = await import('../../../shared/errors/AppError')
      mockResolveActorContext.mockRejectedValueOnce(new AppError(403, 'INSUFFICIENT_PERMISSION', 'Permissão insuficiente.'))

      const response = await app.inject({
        method: 'POST',
        url: '/api/v1/organizations/org-1/persons/person-2',
        headers: { authorization: `Bearer ${makeAuthToken('other-user')}` },
      })

      expect(response.statusCode).toBe(403)
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

    it('returns 403 when user lacks OWNER/MANAGER permission', async () => {
      const { app } = await buildTestApp()
      const { AppError } = await import('../../../shared/errors/AppError')
      mockResolveActorContext.mockRejectedValueOnce(new AppError(403, 'INSUFFICIENT_PERMISSION', 'Permissão insuficiente.'))

      const response = await app.inject({
        method: 'DELETE',
        url: '/api/v1/organizations/org-1/persons/person-2',
        headers: { authorization: `Bearer ${makeAuthToken('other-user')}` },
      })

      expect(response.statusCode).toBe(403)
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

  // ── GET /api/v1/organizations/my ──────────────────────────────────────────

  describe('GET /api/v1/organizations/my', () => {
    it('returns 200 with user organizations', async () => {
      const { app, service } = await buildTestApp()
      jest.mocked(service.findMyOrganizations).mockResolvedValueOnce([MOCK_ORG as any])

      const response = await app.inject({
        method: 'GET',
        url: '/api/v1/organizations/my',
        headers: { authorization: `Bearer ${makeAuthToken()}` },
      })

      expect(response.statusCode).toBe(200)
      const body = response.json()
      expect(body.success).toBe(true)
      expect(body.data).toHaveLength(1)
      expect(body.data[0].id).toBe('org-1')

      await app.close()
    })

    it('returns 200 with empty array when user has no organizations', async () => {
      const { app, service } = await buildTestApp()
      jest.mocked(service.findMyOrganizations).mockResolvedValueOnce([])

      const response = await app.inject({
        method: 'GET',
        url: '/api/v1/organizations/my',
        headers: { authorization: `Bearer ${makeAuthToken()}` },
      })

      expect(response.statusCode).toBe(200)
      expect(response.json().data).toEqual([])

      await app.close()
    })

    it('returns 401 when not authenticated', async () => {
      const { app } = await buildTestApp()

      const response = await app.inject({
        method: 'GET',
        url: '/api/v1/organizations/my',
      })

      expect(response.statusCode).toBe(401)
      await app.close()
    })
  })

  // ── GET /api/v1/organizations/:id/members ─────────────────────────────────

  describe('GET /api/v1/organizations/:id/members', () => {
    it('returns 200 with member list', async () => {
      const { app, service } = await buildTestApp()
      jest.mocked(service.getMembers).mockResolvedValueOnce(MOCK_MEMBERS as any)

      const response = await app.inject({
        method: 'GET',
        url: '/api/v1/organizations/org-1/members',
        headers: { authorization: `Bearer ${makeAuthToken()}` },
      })

      expect(response.statusCode).toBe(200)
      const body = response.json()
      expect(body.success).toBe(true)
      expect(body.data).toHaveLength(2)
      expect(body.data[0].role).toBe('OWNER')

      await app.close()
    })

    it('returns 404 when organization not found', async () => {
      const { app, service } = await buildTestApp()
      const { HttpError } = await import('../../../shared/errors/HttpError')
      jest.mocked(service.getMembers).mockRejectedValueOnce(HttpError.notFound('Organização'))

      const response = await app.inject({
        method: 'GET',
        url: '/api/v1/organizations/nonexistent/members',
        headers: { authorization: `Bearer ${makeAuthToken()}` },
      })

      expect(response.statusCode).toBe(404)
      await app.close()
    })

    it('returns 401 when not authenticated', async () => {
      const { app } = await buildTestApp()

      const response = await app.inject({
        method: 'GET',
        url: '/api/v1/organizations/org-1/members',
      })

      expect(response.statusCode).toBe(401)
      await app.close()
    })
  })

  // ── POST /api/v1/organizations/:id/members ────────────────────────────────

  describe('POST /api/v1/organizations/:id/members', () => {
    it('returns 201 when OWNER adds member by CPF with role', async () => {
      const { app, service } = await buildTestApp()
      jest.mocked(service.addMember).mockResolvedValueOnce(undefined)

      const response = await app.inject({
        method: 'POST',
        url: '/api/v1/organizations/org-1/members',
        headers: { authorization: `Bearer ${makeAuthToken()}` },
        payload: { cpf: '52998224725', role: 'MANAGER' },
      })

      expect(response.statusCode).toBe(201)
      expect(jest.mocked(service.addMember)).toHaveBeenCalledWith('org-1', '52998224725', 'MANAGER', 'user-1')
      await app.close()
    })

    it('returns 201 with default MEMBER role when role omitted', async () => {
      const { app, service } = await buildTestApp()
      jest.mocked(service.addMember).mockResolvedValueOnce(undefined)

      const response = await app.inject({
        method: 'POST',
        url: '/api/v1/organizations/org-1/members',
        headers: { authorization: `Bearer ${makeAuthToken()}` },
        payload: { cpf: '52998224725' },
      })

      expect(response.statusCode).toBe(201)
      expect(jest.mocked(service.addMember)).toHaveBeenCalledWith('org-1', '52998224725', 'MEMBER', 'user-1')
      await app.close()
    })

    it('returns 400 when cpf is missing', async () => {
      const { app } = await buildTestApp()

      const response = await app.inject({
        method: 'POST',
        url: '/api/v1/organizations/org-1/members',
        headers: { authorization: `Bearer ${makeAuthToken()}` },
        payload: { role: 'MEMBER' },
      })

      expect(response.statusCode).toBe(400)
      await app.close()
    })

    it('returns 400 when role is invalid', async () => {
      const { app } = await buildTestApp()

      const response = await app.inject({
        method: 'POST',
        url: '/api/v1/organizations/org-1/members',
        headers: { authorization: `Bearer ${makeAuthToken()}` },
        payload: { cpf: '52998224725', role: 'SUPERUSER' },
      })

      expect(response.statusCode).toBe(400)
      await app.close()
    })

    it('returns 403 when requester is not OWNER', async () => {
      const { app, service } = await buildTestApp()
      const { AppError } = await import('../../../shared/errors/AppError')
      jest.mocked(service.addMember).mockRejectedValueOnce(
        new AppError(403, 'INSUFFICIENT_PERMISSION', 'Apenas o OWNER pode adicionar membros.'),
      )

      const response = await app.inject({
        method: 'POST',
        url: '/api/v1/organizations/org-1/members',
        headers: { authorization: `Bearer ${makeAuthToken()}` },
        payload: { cpf: '52998224725', role: 'MEMBER' },
      })

      expect(response.statusCode).toBe(403)
      const body = response.json()
      expect(body.error.code).toBe('INSUFFICIENT_PERMISSION')
      await app.close()
    })

    it('returns 401 when not authenticated', async () => {
      const { app } = await buildTestApp()

      const response = await app.inject({
        method: 'POST',
        url: '/api/v1/organizations/org-1/members',
        payload: { cpf: '52998224725', role: 'MEMBER' },
      })

      expect(response.statusCode).toBe(401)
      await app.close()
    })
  })

  // ── PATCH /api/v1/organizations/:id/members/:personId/role ────────────────

  describe('PATCH /api/v1/organizations/:id/members/:personId/role', () => {
    it('returns 200 when role is changed', async () => {
      const { app, service } = await buildTestApp()
      jest.mocked(service.changeRole).mockResolvedValueOnce(undefined)

      const response = await app.inject({
        method: 'PATCH',
        url: '/api/v1/organizations/org-1/members/person-2/role',
        headers: { authorization: `Bearer ${makeAuthToken()}` },
        payload: { role: 'MANAGER' },
      })

      expect(response.statusCode).toBe(200)
      expect(jest.mocked(service.changeRole)).toHaveBeenCalledWith('org-1', 'person-2', 'MANAGER')
      await app.close()
    })

    it('returns 409 when demoting the last OWNER', async () => {
      const { app, service } = await buildTestApp()
      const { AppError } = await import('../../../shared/errors/AppError')
      jest.mocked(service.changeRole).mockRejectedValueOnce(
        new AppError(409, 'LAST_OWNER', 'Não é possível rebaixar o último OWNER da organização.'),
      )

      const response = await app.inject({
        method: 'PATCH',
        url: '/api/v1/organizations/org-1/members/person-1/role',
        headers: { authorization: `Bearer ${makeAuthToken()}` },
        payload: { role: 'MEMBER' },
      })

      expect(response.statusCode).toBe(409)
      const body = response.json()
      expect(body.error.code).toBe('LAST_OWNER')
      await app.close()
    })

    it('returns 400 when role is invalid', async () => {
      const { app } = await buildTestApp()

      const response = await app.inject({
        method: 'PATCH',
        url: '/api/v1/organizations/org-1/members/person-1/role',
        headers: { authorization: `Bearer ${makeAuthToken()}` },
        payload: { role: 'INVALID' },
      })

      expect(response.statusCode).toBe(400)
      await app.close()
    })

    it('returns 403 when user lacks OWNER/MANAGER permission', async () => {
      const { app } = await buildTestApp()
      const { AppError } = await import('../../../shared/errors/AppError')
      mockResolveActorContext.mockRejectedValueOnce(new AppError(403, 'INSUFFICIENT_PERMISSION', 'Permissão insuficiente.'))

      const response = await app.inject({
        method: 'PATCH',
        url: '/api/v1/organizations/org-1/members/person-2/role',
        headers: { authorization: `Bearer ${makeAuthToken('other-user')}` },
        payload: { role: 'MANAGER' },
      })

      expect(response.statusCode).toBe(403)
      await app.close()
    })

    it('returns 401 when not authenticated', async () => {
      const { app } = await buildTestApp()

      const response = await app.inject({
        method: 'PATCH',
        url: '/api/v1/organizations/org-1/members/person-1/role',
        payload: { role: 'MANAGER' },
      })

      expect(response.statusCode).toBe(401)
      await app.close()
    })
  })

  // ── PATCH /api/v1/organizations/:id/photo ────────────────────────────────

  describe('PATCH /api/v1/organizations/:id/photo', () => {
    it('returns 200 with updated org on successful upload', async () => {
      const { app, service } = await buildTestApp()
      const updatedOrg = { ...MOCK_ORG, photoUrl: 'https://cdn.example.com/org-images/org-1/123.jpg' }
      jest.mocked(service.uploadPhoto).mockResolvedValueOnce(updatedOrg as any)

      const token = makeAuthToken()
      const boundary = 'boundary'
      const payload = Buffer.concat([
        Buffer.from(`--${boundary}\r\nContent-Disposition: form-data; name="file"; filename="photo.jpg"\r\nContent-Type: image/jpeg\r\n\r\n`),
        Buffer.from([0xff, 0xd8, 0xff, 0xe0]),
        Buffer.from(`\r\n--${boundary}--`),
      ])

      const response = await app.inject({
        method: 'PATCH',
        url: '/api/v1/organizations/org-1/photo',
        headers: {
          authorization: `Bearer ${token}`,
          'content-type': `multipart/form-data; boundary=${boundary}`,
        },
        payload,
      })

      expect(jest.mocked(service.uploadPhoto)).toHaveBeenCalled()
      expect(response.statusCode).toBe(200)
      const resBody = response.json()
      expect(resBody.success).toBe(true)
      expect(resBody.data.photoUrl).toBe('https://cdn.example.com/org-images/org-1/123.jpg')

      await app.close()
    })

    it('returns 400 NO_FILE when content-type is not multipart', async () => {
      const { app } = await buildTestApp()

      const response = await app.inject({
        method: 'PATCH',
        url: '/api/v1/organizations/org-1/photo',
        headers: { authorization: `Bearer ${makeAuthToken()}`, 'content-type': 'application/json' },
        payload: '{}',
      })

      expect(response.statusCode).toBe(400)
      const body = response.json()
      expect(body.error.code).toBe('NO_FILE')

      await app.close()
    })

    it('returns 401 when not authenticated', async () => {
      const { app } = await buildTestApp()

      const response = await app.inject({
        method: 'PATCH',
        url: '/api/v1/organizations/org-1/photo',
      })

      expect(response.statusCode).toBe(401)
      await app.close()
    })

    it('returns 403 when user has insufficient permission', async () => {
      const { app, service } = await buildTestApp()
      const { AppError } = await import('../../../shared/errors/AppError')
      jest.mocked(service.uploadPhoto).mockRejectedValueOnce(
        new AppError(403, 'INSUFFICIENT_PERMISSION', 'Permissão insuficiente.'),
      )

      const response = await app.inject({
        method: 'PATCH',
        url: '/api/v1/organizations/org-1/photo',
        headers: {
          authorization: `Bearer ${makeAuthToken()}`,
          'content-type': 'multipart/form-data; boundary=boundary',
        },
        payload: Buffer.concat([
          Buffer.from('--boundary\r\nContent-Disposition: form-data; name="file"; filename="photo.jpg"\r\nContent-Type: image/jpeg\r\n\r\n'),
          Buffer.from([0xff, 0xd8, 0xff, 0xe0]),
          Buffer.from('\r\n--boundary--'),
        ]),
      })

      expect(response.statusCode).toBe(403)
      const body = response.json()
      expect(body.error.code).toBe('INSUFFICIENT_PERMISSION')

      await app.close()
    })
  })

  // ── DELETE /api/v1/organizations/:id/members/:personId ───────────────────

  describe('DELETE /api/v1/organizations/:id/members/:personId', () => {
    it('returns 204 when member is removed', async () => {
      const { app, service } = await buildTestApp()
      jest.mocked(service.removePerson).mockResolvedValueOnce(undefined)

      const response = await app.inject({
        method: 'DELETE',
        url: '/api/v1/organizations/org-1/members/person-2',
        headers: { authorization: `Bearer ${makeAuthToken()}` },
      })

      expect(response.statusCode).toBe(204)
      await app.close()
    })

    it('returns 409 when removing the last OWNER', async () => {
      const { app, service } = await buildTestApp()
      const { HttpError } = await import('../../../shared/errors/HttpError')
      jest.mocked(service.removePerson).mockRejectedValueOnce(
        HttpError.conflict('LAST_OWNER', 'Não é possível remover o último OWNER da organização.'),
      )

      const response = await app.inject({
        method: 'DELETE',
        url: '/api/v1/organizations/org-1/members/person-1',
        headers: { authorization: `Bearer ${makeAuthToken()}` },
      })

      expect(response.statusCode).toBe(409)
      const body = response.json()
      expect(body.error.code).toBe('LAST_OWNER')
      await app.close()
    })

    it('returns 403 when user lacks OWNER/MANAGER permission', async () => {
      const { app } = await buildTestApp()
      const { AppError } = await import('../../../shared/errors/AppError')
      mockResolveActorContext.mockRejectedValueOnce(new AppError(403, 'INSUFFICIENT_PERMISSION', 'Permissão insuficiente.'))

      const response = await app.inject({
        method: 'DELETE',
        url: '/api/v1/organizations/org-1/members/person-2',
        headers: { authorization: `Bearer ${makeAuthToken('other-user')}` },
      })

      expect(response.statusCode).toBe(403)
      await app.close()
    })

    it('returns 401 when not authenticated', async () => {
      const { app } = await buildTestApp()

      const response = await app.inject({
        method: 'DELETE',
        url: '/api/v1/organizations/org-1/members/person-1',
      })

      expect(response.statusCode).toBe(401)
      await app.close()
    })
  })
})
