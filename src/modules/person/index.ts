/**
 * @module person
 * @file index.ts
 * @description Public surface of the person module.
 */

export { PersonService } from './person.service'
export { PrismaPersonRepository } from './person.repository'
export type { IPersonRepository } from './person.repository'
export { registerPersonRoutes } from './person.routes'
export type { PersonCreateInput, PersonRecord, PersonUpdateInput } from './person.types'
