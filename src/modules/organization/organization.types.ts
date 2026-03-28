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
  website?: string
  instagram?: string
  addressStreet?: string
  addressNeighborhood?: string
  addressNumber?: string
  addressCep?: string
  addressCity?: string
  addressState?: string
  responsiblePersonId?: string // optional — resolved by service from JWT when absent
}

export interface OrganizationUpdateInput {
  name?: string
  description?: string | null
  phone?: string | null
  email?: string | null
  website?: string | null
  instagram?: string | null
  addressStreet?: string | null
  addressNeighborhood?: string | null
  addressNumber?: string | null
  addressCep?: string | null
  addressCity?: string | null
  addressState?: string | null
}

export interface OrganizationRecord {
  id: string
  name: string
  type: OrgType
  cnpj: string | null
  description: string | null
  phone: string | null
  email: string | null
  website: string | null
  instagram: string | null
  addressStreet: string | null
  addressNeighborhood: string | null
  addressNumber: string | null
  addressCep: string | null
  addressCity: string | null
  addressState: string | null
  createdAt: Date
  updatedAt: Date
  responsiblePersons: OrganizationPersonRecord[]
}
