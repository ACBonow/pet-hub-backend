/**
 * @module organization
 * @file organization.types.ts
 * @description TypeScript interfaces for the organization module.
 */

export type OrgType = 'COMPANY' | 'NGO'

export interface OrganizationPersonRecord {
  organizationId: string
  personId: string
  assignedAt: Date
}

export interface OrganizationCreateInput {
  name: string
  type: OrgType
  cnpj?: string
  description?: string
  phone?: string
  email?: string
  address?: string
  responsiblePersonId: string
}

export interface OrganizationUpdateInput {
  name?: string
  description?: string | null
  phone?: string | null
  email?: string | null
  address?: string | null
}

export interface OrganizationRecord {
  id: string
  name: string
  type: OrgType
  cnpj: string | null
  description: string | null
  phone: string | null
  email: string | null
  address: string | null
  createdAt: Date
  updatedAt: Date
  responsiblePersons: OrganizationPersonRecord[]
}
