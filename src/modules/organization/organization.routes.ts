/**
 * @module organization
 * @file organization.routes.ts
 * @description Fastify route registration for the organization module.
 */

import type { FastifyInstance } from 'fastify'
import { authMiddleware } from '../../shared/middleware/auth.middleware'
import type { OrganizationService } from './organization.service'
import { OrganizationController } from './organization.controller'

export function registerOrganizationRoutes(app: FastifyInstance, service: OrganizationService): void {
  const controller = new OrganizationController(service)
  const auth = { preHandler: [authMiddleware] }

  app.post('/api/v1/organizations', { ...auth, handler: controller.create.bind(controller) })
  app.get('/api/v1/organizations/my', { ...auth, handler: controller.getMyOrganizations.bind(controller) })
  app.get('/api/v1/organizations/:id', { ...auth, handler: controller.getById.bind(controller) })
  app.patch('/api/v1/organizations/:id', { ...auth, handler: controller.update.bind(controller) })
  app.delete('/api/v1/organizations/:id', { ...auth, handler: controller.delete.bind(controller) })
  app.post('/api/v1/organizations/:id/persons/:personId', { ...auth, handler: controller.addPerson.bind(controller) })
  app.delete('/api/v1/organizations/:id/persons/:personId', { ...auth, handler: controller.removePerson.bind(controller) })
  app.get('/api/v1/organizations/:id/members', { ...auth, handler: controller.getMembers.bind(controller) })
  app.post('/api/v1/organizations/:id/members', { ...auth, handler: controller.addMember.bind(controller) })
  app.patch('/api/v1/organizations/:id/members/:personId/role', { ...auth, handler: controller.changeMemberRole.bind(controller) })
  app.delete('/api/v1/organizations/:id/members/:personId', { ...auth, handler: controller.removeMember.bind(controller) })
  app.patch('/api/v1/organizations/:id/photo', { ...auth, handler: controller.uploadPhoto.bind(controller) })
}
