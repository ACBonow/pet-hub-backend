/**
 * @module core
 * @file app.ts
 * @description Fastify application factory. Registers plugins and routes.
 */

import Fastify, { FastifyInstance } from 'fastify'
import cors from '@fastify/cors'
import helmet from '@fastify/helmet'
import { registerErrorHandler } from './shared/middleware/error.middleware'
import { PrismaAuthRepository, registerAuthRoutes, AuthService } from './modules/auth'
import { PrismaPersonRepository, registerPersonRoutes, PersonService } from './modules/person'
import { PrismaOrganizationRepository, registerOrganizationRoutes, OrganizationService } from './modules/organization'
import { PrismaPetRepository, registerPetRoutes, PetService } from './modules/pet'

export function buildApp(): FastifyInstance {
  const app = Fastify({
    logger: process.env.NODE_ENV !== 'test',
  })

  // Plugins
  app.register(cors, {
    origin: process.env.CORS_ORIGIN ?? '*',
  })

  app.register(helmet)

  // Global error handler
  registerErrorHandler(app)

  // Health check
  app.get('/health', async () => ({ status: 'ok' }))

  // Auth routes
  const authService = new AuthService(new PrismaAuthRepository())
  registerAuthRoutes(app, authService)

  // Person routes
  const personRepository = new PrismaPersonRepository()
  const personService = new PersonService(personRepository)
  registerPersonRoutes(app, personService)

  // Organization routes
  const orgService = new OrganizationService(new PrismaOrganizationRepository(), personRepository)
  registerOrganizationRoutes(app, orgService)

  // Pet routes
  const petService = new PetService(new PrismaPetRepository(), personRepository, new PrismaOrganizationRepository())
  registerPetRoutes(app, petService)

  return app
}
