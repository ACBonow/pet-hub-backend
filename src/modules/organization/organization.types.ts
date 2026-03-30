/**
 * @module organization
 * @file organization.types.ts
 * @description TypeScript interfaces for the organization module.
 */

export type OrgType = 'COMPANY' | 'NGO'
export type OrgRole = 'OWNER' | 'MANAGER' | 'MEMBER'

export interface OrganizationPersonRecord {
  organizationId: string
  personId: string
  role: OrgRole
  assignedAt: Date
}

export interface OrganizationCreateInput {
  name: string
  type: OrgType
  cnpj?: string | null
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
  responsiblePersonId?: string | null // optional — resolved by service from JWT when absent
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
  myRole?: OrgRole
}
