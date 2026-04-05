/**
 * @module organization
 * @file organization.repository.ts
 * @description Repository interface and Prisma implementation for organization persistence.
 */

import { prisma } from '../../shared/config/database'
import type { Prisma } from '@prisma/client'
import { mapOrg, mapMember, ORG_INCLUDE } from './organization.mapper'
import type {
  OrgRole,
  OrganizationCreateInput,
  OrganizationMemberView,
  OrganizationPersonRecord,
  OrganizationRecord,
  OrganizationUpdateInput,
} from './organization.types'

export interface IOrganizationRepository {
  create(data: OrganizationCreateInput): Promise<OrganizationRecord>
  findById(id: string): Promise<OrganizationRecord | null>
  findByCnpj(cnpj: string): Promise<OrganizationRecord | null>
  findByPersonId(personId: string): Promise<OrganizationRecord[]>
  update(id: string, data: OrganizationUpdateInput): Promise<OrganizationRecord>
  delete(id: string): Promise<void>
  addPerson(organizationId: string, personId: string, role?: OrgRole): Promise<void>
  removePerson(organizationId: string, personId: string): Promise<void>
  personCount(organizationId: string): Promise<number>
  hasPerson(organizationId: string, personId: string): Promise<boolean>
  getRole(organizationId: string, personId: string): Promise<OrgRole | null>
  setRole(organizationId: string, personId: string, role: OrgRole): Promise<void>
  countByRole(organizationId: string, role: OrgRole): Promise<number>
  findMembers(organizationId: string): Promise<OrganizationPersonRecord[]>
  findMembersWithNames(organizationId: string): Promise<OrganizationMemberView[]>
  updatePhotoUrl(id: string, photoUrl: string | null): Promise<void>
}

const include = ORG_INCLUDE

export class PrismaOrganizationRepository implements IOrganizationRepository {
  async create(data: OrganizationCreateInput): Promise<OrganizationRecord> {
    return prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      const org = await tx.organization.create({
        data: {
          name: data.name,
          type: data.type as any,
          cnpj: data.cnpj ?? null,
          description: data.description ?? null,
          phone: data.phone ?? null,
          email: data.email ?? null,
          website: data.website ?? null,
          instagram: data.instagram ?? null,
          addressStreet: data.addressStreet ?? null,
          addressNeighborhood: data.addressNeighborhood ?? null,
          addressNumber: data.addressNumber ?? null,
          addressCep: data.addressCep ?? null,
          addressCity: data.addressCity ?? null,
          addressState: data.addressState ?? null,
        },
        include,
      })

      // responsiblePersonId is always resolved by the service — creator gets OWNER role
      await tx.organizationPerson.create({
        data: { organizationId: org.id, personId: data.responsiblePersonId!, role: 'OWNER' },
      })

      return mapOrg({ ...org, responsiblePersons: [{ organizationId: org.id, personId: data.responsiblePersonId!, role: 'OWNER', assignedAt: new Date() }] })
    })
  }

  async findById(id: string): Promise<OrganizationRecord | null> {
    const org = await prisma.organization.findUnique({ where: { id }, include })
    return org ? mapOrg(org) : null
  }

  async findByCnpj(cnpj: string): Promise<OrganizationRecord | null> {
    const org = await prisma.organization.findUnique({ where: { cnpj }, include })
    return org ? mapOrg(org) : null
  }

  async findByPersonId(personId: string): Promise<OrganizationRecord[]> {
    const memberships = await prisma.organizationPerson.findMany({
      where: { personId },
      include: { organization: { include } },
    })
    return memberships.map((m) => mapOrg(m.organization))
  }

  async update(id: string, data: OrganizationUpdateInput): Promise<OrganizationRecord> {
    const org = await prisma.organization.update({ where: { id }, data, include })
    return mapOrg(org)
  }

  async delete(id: string): Promise<void> {
    await prisma.organization.delete({ where: { id } })
  }

  async addPerson(organizationId: string, personId: string, role: OrgRole = 'MEMBER'): Promise<void> {
    await prisma.organizationPerson.create({ data: { organizationId, personId, role } })
  }

  async removePerson(organizationId: string, personId: string): Promise<void> {
    await prisma.organizationPerson.delete({
      where: { organizationId_personId: { organizationId, personId } },
    })
  }

  async personCount(organizationId: string): Promise<number> {
    return prisma.organizationPerson.count({ where: { organizationId } })
  }

  async hasPerson(organizationId: string, personId: string): Promise<boolean> {
    const count = await prisma.organizationPerson.count({
      where: { organizationId, personId },
    })
    return count > 0
  }

  async getRole(organizationId: string, personId: string): Promise<OrgRole | null> {
    const m = await prisma.organizationPerson.findUnique({
      where: { organizationId_personId: { organizationId, personId } },
    })
    return m ? (m.role as OrgRole) : null
  }

  async setRole(organizationId: string, personId: string, role: OrgRole): Promise<void> {
    await prisma.organizationPerson.update({
      where: { organizationId_personId: { organizationId, personId } },
      data: { role },
    })
  }

  async countByRole(organizationId: string, role: OrgRole): Promise<number> {
    return prisma.organizationPerson.count({ where: { organizationId, role } })
  }

  async findMembers(organizationId: string): Promise<OrganizationPersonRecord[]> {
    const members = await prisma.organizationPerson.findMany({ where: { organizationId } })
    return members.map(mapMember)
  }

  async findMembersWithNames(organizationId: string): Promise<OrganizationMemberView[]> {
    const members = await prisma.organizationPerson.findMany({
      where: { organizationId },
      include: { person: true },
    })
    return members.map((m: any) => ({
      personId: m.personId,
      name: m.person.name,
      role: m.role as OrgRole,
      assignedAt: m.assignedAt,
    }))
  }

  async updatePhotoUrl(id: string, photoUrl: string | null): Promise<void> {
    await prisma.organization.update({ where: { id }, data: { photoUrl } })
  }
}
