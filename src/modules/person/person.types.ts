/**
 * @module person
 * @file person.types.ts
 * @description TypeScript interfaces for the person module.
 */

export interface PersonCreateInput {
  userId: string
  name: string
  cpf: string
  phone?: string
}

export interface PersonUpdateInput {
  name?: string
  phone?: string | null
}

export interface PersonRecord {
  id: string
  userId: string
  name: string
  cpf: string
  phone: string | null
  createdAt: Date
  updatedAt: Date
}
