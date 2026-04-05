/**
 * @module organization
 * @file organization.mapper.ts
 * @description Maps Prisma Organization and OrganizationPerson payloads to domain types.
 */

import type { OrganizationPerson, Prisma } from '@prisma/client'
import type { OrgRole, OrganizationPersonRecord, OrganizationRecord } from './organization.types'

export const ORG_INCLUDE = {
  responsiblePersons: true,
} as const

export type PrismaOrgWithMembers = Prisma.OrganizationGetPayload<{
  include: typeof ORG_INCLUDE
}>

export function mapOrg(org: PrismaOrgWithMembers): OrganizationRecord {
  return {
    id: org.id,
    name: org.name,
    type: org.type as 'COMPANY' | 'NGO',
    cnpj: org.cnpj ?? null,
    description: org.description ?? null,
    phone: org.phone ?? null,
    email: org.email ?? null,
    website: org.website ?? null,
    instagram: org.instagram ?? null,
    photoUrl: org.photoUrl ?? null,
    addressStreet: org.addressStreet ?? null,
    addressNeighborhood: org.addressNeighborhood ?? null,
    addressNumber: org.addressNumber ?? null,
    addressCep: org.addressCep ?? null,
    addressCity: org.addressCity ?? null,
    addressState: org.addressState ?? null,
    createdAt: org.createdAt,
    updatedAt: org.updatedAt,
    responsiblePersons: org.responsiblePersons.map((p) => ({
      organizationId: p.organizationId,
      personId: p.personId,
      role: p.role as OrgRole,
      assignedAt: p.assignedAt,
    })),
  }
}

export function mapMember(m: OrganizationPerson): OrganizationPersonRecord {
  return {
    organizationId: m.organizationId,
    personId: m.personId,
    role: m.role as OrgRole,
    assignedAt: m.assignedAt,
  }
}
