/**
 * @module pet
 * @file pet.service.ts
 * @description Business logic for pet management, including tutorship and co-tutor rules.
 */

import { HttpError } from '../../shared/errors/HttpError'
import type { IPetRepository } from './pet.repository'
import type { IPersonRepository } from '../person'
import type { IOrganizationRepository } from '../organization'
import type {
  AddCoTutorInput,
  CoTutorRecord,
  PetCreateInput,
  PetRecord,
  PetUpdateInput,
  TransferTutorshipInput,
  TutorshipRecord,
} from './pet.types'

export class PetService {
  constructor(
    private repository: IPetRepository,
    private personRepository: IPersonRepository,
    private orgRepository: IOrganizationRepository,
  ) {}

  private async validateTutor(input: { tutorType: string; personTutorId?: string; orgTutorId?: string }): Promise<void> {
    if (input.tutorType === 'PERSON') {
      if (!input.personTutorId) {
        throw HttpError.badRequest('TUTOR_REQUIRED', 'ID do tutor pessoa é obrigatório.')
      }
      const person = await this.personRepository.findById(input.personTutorId)
      if (!person) {
        throw HttpError.notFound('Tutor')
      }
    } else if (input.tutorType === 'ORGANIZATION') {
      if (!input.orgTutorId) {
        throw HttpError.badRequest('TUTOR_REQUIRED', 'ID da organização tutora é obrigatório.')
      }
      const org = await this.orgRepository.findById(input.orgTutorId)
      if (!org) {
        throw HttpError.notFound('Organização tutora')
      }
    }
  }

  async create(input: PetCreateInput): Promise<PetRecord> {
    await this.validateTutor(input)
    return this.repository.create(input)
  }

  async findById(id: string): Promise<PetRecord> {
    const pet = await this.repository.findById(id)
    if (!pet) {
      throw HttpError.notFound('Pet')
    }
    return pet
  }

  async update(id: string, data: PetUpdateInput): Promise<PetRecord> {
    const pet = await this.repository.findById(id)
    if (!pet) {
      throw HttpError.notFound('Pet')
    }
    return this.repository.update(id, data)
  }

  async delete(id: string): Promise<void> {
    const pet = await this.repository.findById(id)
    if (!pet) {
      throw HttpError.notFound('Pet')
    }
    await this.repository.delete(id)
  }

  async transferTutorship(petId: string, data: TransferTutorshipInput): Promise<TutorshipRecord> {
    const pet = await this.repository.findById(petId)
    if (!pet) {
      throw HttpError.notFound('Pet')
    }

    await this.validateTutor(data)

    return this.repository.transferTutorship(petId, data)
  }

  async getTutorshipHistory(petId: string): Promise<TutorshipRecord[]> {
    const pet = await this.repository.findById(petId)
    if (!pet) {
      throw HttpError.notFound('Pet')
    }
    return this.repository.getTutorshipHistory(petId)
  }

  async addCoTutor(petId: string, data: AddCoTutorInput): Promise<CoTutorRecord> {
    const pet = await this.repository.findById(petId)
    if (!pet) {
      throw HttpError.notFound('Pet')
    }

    await this.validateTutor(data)

    // Co-tutor cannot be the same as the active primary tutor
    const activeTutorship = pet.activeTutorship
    if (activeTutorship) {
      if (
        data.tutorType === 'PERSON' &&
        activeTutorship.tutorType === 'PERSON' &&
        activeTutorship.personTutorId === data.personTutorId
      ) {
        throw HttpError.conflict('TUTOR_CONFLICT', 'O co-tutor não pode ser o mesmo que o tutor primário.')
      }
      if (
        data.tutorType === 'ORGANIZATION' &&
        activeTutorship.tutorType === 'ORGANIZATION' &&
        activeTutorship.orgTutorId === data.orgTutorId
      ) {
        throw HttpError.conflict('TUTOR_CONFLICT', 'O co-tutor não pode ser o mesmo que o tutor primário.')
      }
    }

    return this.repository.addCoTutor(petId, data)
  }

  async removeCoTutor(petId: string, coTutorId: string): Promise<void> {
    const pet = await this.repository.findById(petId)
    if (!pet) {
      throw HttpError.notFound('Pet')
    }
    await this.repository.removeCoTutor(petId, coTutorId)
  }
}
