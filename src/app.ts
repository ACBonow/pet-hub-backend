/**
 * @module core
 * @file app.ts
 * @description Fastify application factory. Registers plugins and routes.
 */

import Fastify, { FastifyInstance } from 'fastify'
import cors from '@fastify/cors'
import helmet from '@fastify/helmet'
import multipart from '@fastify/multipart'
import { registerErrorHandler } from './shared/middleware/error.middleware'
import { PrismaAuthRepository, registerAuthRoutes, AuthService } from './modules/auth'
import { PrismaPersonRepository, registerPersonRoutes, PersonService } from './modules/person'
import { PrismaOrganizationRepository, registerOrganizationRoutes, OrganizationService } from './modules/organization'
import { PrismaPetRepository, registerPetRoutes, PetService } from './modules/pet'
import { PrismaAdoptionRepository, registerAdoptionRoutes, AdoptionService } from './modules/adoption'
import { PrismaLostFoundRepository, registerLostFoundRoutes, LostFoundService } from './modules/lost-found'
import { PrismaPetHealthRepository, registerPetHealthRoutes, PetHealthService } from './modules/pet-health'
import { PrismaServicesDirectoryRepository, registerServicesDirectoryRoutes, ServicesDirectoryService } from './modules/services-directory'

export function buildApp(): FastifyInstance {
  const app = Fastify({
    logger: process.env.NODE_ENV !== 'test',
  })

  // Plugins
  app.register(cors, {
    origin: process.env.CORS_ORIGIN ?? '*',
  })

  app.register(helmet)
  app.register(multipart)

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
  const petRepository = new PrismaPetRepository()
  const petService = new PetService(petRepository, personRepository, new PrismaOrganizationRepository())
  registerPetRoutes(app, petService)

  // Adoption routes
  const adoptionService = new AdoptionService(
    new PrismaAdoptionRepository(),
    petRepository,
    personRepository,
    new PrismaOrganizationRepository(),
  )
  registerAdoptionRoutes(app, adoptionService)

  // Lost & Found routes
  const lostFoundService = new LostFoundService(new PrismaLostFoundRepository(), petRepository, personRepository)
  registerLostFoundRoutes(app, lostFoundService)

  // Pet Health routes
  const petHealthService = new PetHealthService(
    new PrismaPetHealthRepository(),
    petRepository,
    personRepository,
  )
  registerPetHealthRoutes(app, petHealthService)

  // Services Directory routes
  const servicesDirectoryService = new ServicesDirectoryService(new PrismaServicesDirectoryRepository())
  registerServicesDirectoryRoutes(app, servicesDirectoryService)

  return app
}
