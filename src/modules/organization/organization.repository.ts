/**
 * @module organization
 * @file organization.repository.ts
 * @description Repository interface and Prisma implementation for organization persistence.
 */

import { prisma } from '../../shared/config/database'
import type { Prisma } from '@prisma/client'
import type {
  OrganizationCreateInput,
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
  addPerson(organizationId: string, personId: string): Promise<void>
  removePerson(organizationId: string, personId: string): Promise<void>
  personCount(organizationId: string): Promise<number>
  hasPerson(organizationId: string, personId: string): Promise<boolean>
}

function mapOrg(org: any): OrganizationRecord {
  return {
    id: org.id,
    name: org.name,
    type: org.type as 'COMPANY' | 'NGO',
    cnpj: org.cnpj,
    description: org.description,
    phone: org.phone,
    email: org.email,
    address: org.address,
    createdAt: org.createdAt,
    updatedAt: org.updatedAt,
    responsiblePersons: org.responsiblePersons ?? [],
  }
}

const include = { responsiblePersons: true }

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
          address: data.address ?? null,
        },
        include,
      })

      // responsiblePersonId is always resolved by the service before reaching the repository
      await tx.organizationPerson.create({
        data: { organizationId: org.id, personId: data.responsiblePersonId! },
      })

      return mapOrg({ ...org, responsiblePersons: [{ organizationId: org.id, personId: data.responsiblePersonId!, assignedAt: new Date() }] })
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
    return memberships.map((m: any) => mapOrg(m.organization))
  }

  async update(id: string, data: OrganizationUpdateInput): Promise<OrganizationRecord> {
    const org = await prisma.organization.update({ where: { id }, data, include })
    return mapOrg(org)
  }

  async delete(id: string): Promise<void> {
    await prisma.organization.delete({ where: { id } })
  }

  async addPerson(organizationId: string, personId: string): Promise<void> {
    await prisma.organizationPerson.create({ data: { organizationId, personId } })
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
}
