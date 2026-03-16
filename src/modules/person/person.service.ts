/**
 * @module person
 * @file person.service.ts
 * @description Business logic for person management, including CPF validation.
 */

import { sanitizeCpf, validateCpf } from '../../shared/validators/cpf.validator'
import { HttpError } from '../../shared/errors/HttpError'
import type { IPersonRepository } from './person.repository'
import type { PersonCreateInput, PersonRecord, PersonUpdateInput } from './person.types'

export class PersonService {
  constructor(private repository: IPersonRepository) {}

  async create(input: PersonCreateInput): Promise<PersonRecord> {
    const cpf = sanitizeCpf(input.cpf)

    if (!validateCpf(cpf)) {
      throw HttpError.badRequest('INVALID_CPF', 'O CPF informado não é válido.')
    }

    const existing = await this.repository.findByCpf(cpf)
    if (existing) {
      throw HttpError.conflict('CPF_ALREADY_IN_USE', 'Este CPF já está cadastrado.')
    }

    const profileExists = await this.repository.findByUserId(input.userId)
    if (profileExists) {
      throw HttpError.conflict('PROFILE_ALREADY_EXISTS', 'Este usuário já possui um perfil de pessoa.')
    }

    return this.repository.create({ ...input, cpf })
  }

  async findById(id: string): Promise<PersonRecord> {
    const person = await this.repository.findById(id)
    if (!person) {
      throw HttpError.notFound('Pessoa')
    }
    return person
  }

  async getProfile(userId: string): Promise<PersonRecord> {
    const person = await this.repository.findByUserId(userId)
    if (!person) {
      throw HttpError.notFound('Perfil')
    }
    return person
  }

  async update(id: string, data: PersonUpdateInput): Promise<PersonRecord> {
    const person = await this.repository.findById(id)
    if (!person) {
      throw HttpError.notFound('Pessoa')
    }
    return this.repository.update(id, data)
  }

  async delete(id: string): Promise<void> {
    const person = await this.repository.findById(id)
    if (!person) {
      throw HttpError.notFound('Pessoa')
    }
    await this.repository.delete(id)
  }
}
