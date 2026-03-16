/**
 * @module person
 * @file person.repository.ts
 * @description Repository interface and Prisma implementation for person persistence.
 */

import { prisma } from '../../shared/config/database'
import type { PersonCreateInput, PersonRecord, PersonUpdateInput } from './person.types'

export interface IPersonRepository {
  create(data: PersonCreateInput): Promise<PersonRecord>
  findById(id: string): Promise<PersonRecord | null>
  findByUserId(userId: string): Promise<PersonRecord | null>
  findByCpf(cpf: string): Promise<PersonRecord | null>
  update(id: string, data: PersonUpdateInput): Promise<PersonRecord>
  delete(id: string): Promise<void>
}

export class PrismaPersonRepository implements IPersonRepository {
  async create(data: PersonCreateInput): Promise<PersonRecord> {
    return prisma.person.create({
      data: {
        userId: data.userId,
        name: data.name,
        cpf: data.cpf,
        phone: data.phone ?? null,
      },
    })
  }

  async findById(id: string): Promise<PersonRecord | null> {
    return prisma.person.findUnique({ where: { id } })
  }

  async findByUserId(userId: string): Promise<PersonRecord | null> {
    return prisma.person.findUnique({ where: { userId } })
  }

  async findByCpf(cpf: string): Promise<PersonRecord | null> {
    return prisma.person.findUnique({ where: { cpf } })
  }

  async update(id: string, data: PersonUpdateInput): Promise<PersonRecord> {
    return prisma.person.update({
      where: { id },
      data,
    })
  }

  async delete(id: string): Promise<void> {
    await prisma.person.delete({ where: { id } })
  }
}
