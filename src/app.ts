/**
 * @module core
 * @file app.ts
 * @description Fastify application factory. Registers plugins and routes.
 */

import Fastify, { FastifyInstance } from 'fastify'
import cors from '@fastify/cors'
import { env } from './shared/config/env'
import helmet from '@fastify/helmet'
import multipart from '@fastify/multipart'
import { registerErrorHandler } from './shared/middleware/error.middleware'
import { registerRateLimit } from './shared/plugins/rate-limit'
import { ResendEmailService } from './shared/utils/email'
import { PrismaAuthRepository, registerAuthRoutes, AuthService } from './modules/auth'
import { PrismaPersonRepository, registerPersonRoutes, PersonService } from './modules/person'
import { PrismaOrganizationRepository, registerOrganizationRoutes, OrganizationService } from './modules/organization'
import { PrismaPetRepository, registerPetRoutes, PetService } from './modules/pet'
import { PrismaAdoptionRepository, registerAdoptionRoutes, AdoptionService } from './modules/adoption'
import { PrismaLostFoundRepository, registerLostFoundRoutes, LostFoundService } from './modules/lost-found'
import { PrismaPetHealthRepository, registerPetHealthRoutes, PetHealthService } from './modules/pet-health'
import { PrismaServicesDirectoryRepository, PrismaServiceTypeRepository, registerServicesDirectoryRoutes, ServicesDirectoryService } from './modules/services-directory'
import { PrismaVaccineCatalogRepository, registerVaccineCatalogRoutes, VaccineCatalogService } from './modules/vaccine-catalog'
import { SupabaseFileStorage } from './shared/storage/SupabaseFileStorage'

export function buildApp(): FastifyInstance {
  const app = Fastify({
    logger: process.env.NODE_ENV !== 'test',
  })

  // Plugins
  app.register(cors, {
    origin: env.CORS_ORIGIN,
  })

  app.register(helmet)
  app.register(multipart)

  // Rate limiting (disabled in test env to avoid polluting unit/integration tests)
  if (env.NODE_ENV !== 'test') {
    registerRateLimit(app)
  }

  // Global error handler
  registerErrorHandler(app)

  // Health check
  app.get('/health', async () => ({ status: 'ok' }))

  // Shared storage implementation
  const fileStorage = new SupabaseFileStorage()

  // Person repository (shared — also injected into AuthService)
  const personRepository = new PrismaPersonRepository()

  // Auth routes
  const authService = new AuthService(new PrismaAuthRepository(), new ResendEmailService(), personRepository)
  registerAuthRoutes(app, authService)

  // Person routes
  const personService = new PersonService(personRepository)
  registerPersonRoutes(app, personService)

  // Organization routes
  const orgService = new OrganizationService(new PrismaOrganizationRepository(), personRepository, fileStorage)
  registerOrganizationRoutes(app, orgService)

  // Pet routes
  const petRepository = new PrismaPetRepository()
  const petService = new PetService(petRepository, personRepository, new PrismaOrganizationRepository(), fileStorage)
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
  const lostFoundService = new LostFoundService(new PrismaLostFoundRepository(), petRepository, personRepository, new PrismaOrganizationRepository(), fileStorage)
  registerLostFoundRoutes(app, lostFoundService)

  // Pet Health routes
  const petHealthService = new PetHealthService(
    new PrismaPetHealthRepository(),
    petRepository,
    personRepository,
    fileStorage,
    new PrismaVaccineCatalogRepository(),
  )
  registerPetHealthRoutes(app, petHealthService)

  // Services Directory routes
  const servicesDirectoryService = new ServicesDirectoryService(
    new PrismaServicesDirectoryRepository(),
    new PrismaServiceTypeRepository(),
    personRepository,
    new PrismaOrganizationRepository(),
    fileStorage,
  )
  registerServicesDirectoryRoutes(app, servicesDirectoryService)

  // Vaccine Catalog routes (read-only, public)
  const vaccineCatalogService = new VaccineCatalogService(new PrismaVaccineCatalogRepository())
  registerVaccineCatalogRoutes(app, vaccineCatalogService)

  return app
}
