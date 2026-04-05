/**
 * @module pet
 * @file pet.service.ts
 * @description Business logic for pet management, including tutorship and co-tutor rules.
 */

import { AppError } from '../../shared/errors/AppError'
import { HttpError } from '../../shared/errors/HttpError'
import { extractPathFromUrl } from '../../shared/storage/IFileStorage'
import type { IFileStorage } from '../../shared/storage/IFileStorage'
import type { IPetRepository } from './pet.repository'
import type { IPersonRepository } from '../person'
import type { IOrganizationRepository } from '../organization'
import type {
  AddCoTutorInput,
  CoTutorRecord,
  PetCreateForUserInput,
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
    private fileStorage: IFileStorage,
  ) {}

  private async validateOrgTutor(orgTutorId: string): Promise<void> {
    const org = await this.orgRepository.findById(orgTutorId)
    if (!org) {
      throw HttpError.notFound('Organização tutora')
    }
  }

  async create(input: PetCreateInput): Promise<PetRecord> {
    if (input.tutorType === 'PERSON') {
      if (!input.personTutorId) {
        throw HttpError.badRequest('TUTOR_REQUIRED', 'ID do tutor pessoa é obrigatório.')
      }
      const person = await this.personRepository.findById(input.personTutorId)
      if (!person) throw HttpError.notFound('Tutor')
    } else {
      if (!input.orgTutorId) {
        throw HttpError.badRequest('TUTOR_REQUIRED', 'ID da organização tutora é obrigatório.')
      }
      await this.validateOrgTutor(input.orgTutorId)
    }
    return this.repository.create(input)
  }

  async createForUser(userId: string, input: PetCreateForUserInput): Promise<PetRecord> {
    const person = await this.personRepository.findByUserId(userId)
    if (!person) {
      throw HttpError.notFound('Perfil de pessoa do usuário')
    }
    const createInput: PetCreateInput = {
      ...input,
      tutorType: 'PERSON',
      personTutorId: person.id,
      tutorshipType: input.tutorshipType ?? 'OWNER',
    }
    return this.repository.create(createInput)
  }

  async findByOrg(orgId: string, userId: string): Promise<PetRecord[]> {
    const person = await this.personRepository.findByUserId(userId)
    if (!person) {
      throw HttpError.notFound('Perfil de pessoa do usuário')
    }
    const role = await this.orgRepository.getRole(orgId, person.id)
    if (!role) {
      throw new AppError(403, 'INSUFFICIENT_PERMISSION', 'Você não é membro desta organização.')
    }
    return this.repository.findByOrgId(orgId)
  }

  async findByUser(userId: string): Promise<PetRecord[]> {
    const person = await this.personRepository.findByUserId(userId)
    if (!person) {
      throw HttpError.notFound('Perfil de pessoa do usuário')
    }
    return this.repository.findByPersonId(person.id)
  }

  async findById(id: string): Promise<PetRecord> {
    const pet = await this.repository.findById(id)
    if (!pet) {
      throw HttpError.notFound('Pet')
    }
    return pet
  }

  async update(id: string, data: PetUpdateInput, userId: string): Promise<PetRecord> {
    const pet = await this.repository.findById(id)
    if (!pet) {
      throw HttpError.notFound('Pet')
    }
    const person = await this.personRepository.findByUserId(userId)
    if (!person || pet.activeTutorship?.personTutorId !== person.id) {
      throw new AppError(403, 'INSUFFICIENT_PERMISSION', 'Apenas o tutor primário pode editar o pet.')
    }
    return this.repository.update(id, data)
  }

  async delete(id: string, userId: string): Promise<void> {
    const pet = await this.repository.findById(id)
    if (!pet) {
      throw HttpError.notFound('Pet')
    }
    const person = await this.personRepository.findByUserId(userId)
    if (!person || pet.activeTutorship?.personTutorId !== person.id) {
      throw new AppError(403, 'INSUFFICIENT_PERMISSION', 'Apenas o tutor primário pode excluir o pet.')
    }
    await this.repository.delete(id)
  }

  async transferTutorship(petId: string, data: TransferTutorshipInput): Promise<TutorshipRecord> {
    const pet = await this.repository.findById(petId)
    if (!pet) {
      throw HttpError.notFound('Pet')
    }

    let personTutorId: string | undefined
    if (data.tutorType === 'PERSON') {
      if (!data.personCpf) {
        throw HttpError.badRequest('TUTOR_REQUIRED', 'CPF do novo tutor é obrigatório.')
      }
      const person = await this.personRepository.findByCpf(data.personCpf)
      if (!person) throw HttpError.notFound('Tutor')
      personTutorId = person.id
    } else {
      if (!data.orgTutorId) {
        throw HttpError.badRequest('TUTOR_REQUIRED', 'ID da organização tutora é obrigatório.')
      }
      await this.validateOrgTutor(data.orgTutorId)
    }

    return this.repository.transferTutorship(petId, {
      tutorType: data.tutorType,
      personTutorId,
      orgTutorId: data.orgTutorId,
      tutorshipType: data.tutorshipType,
      transferNotes: data.transferNotes ?? null,
    })
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

    let personTutorId: string | undefined
    if (data.tutorType === 'PERSON') {
      if (!data.personCpf) {
        throw HttpError.badRequest('TUTOR_REQUIRED', 'CPF do co-tutor é obrigatório.')
      }
      const person = await this.personRepository.findByCpf(data.personCpf)
      if (!person) throw HttpError.notFound('Co-tutor')
      personTutorId = person.id
    } else {
      if (!data.orgTutorId) {
        throw HttpError.badRequest('TUTOR_REQUIRED', 'ID da organização co-tutora é obrigatório.')
      }
      await this.validateOrgTutor(data.orgTutorId)
    }

    // Co-tutor cannot be the same as the active primary tutor
    const activeTutorship = pet.activeTutorship
    if (activeTutorship) {
      if (
        data.tutorType === 'PERSON' &&
        activeTutorship.tutorType === 'PERSON' &&
        activeTutorship.personTutorId === personTutorId
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

    return this.repository.addCoTutor(petId, {
      tutorType: data.tutorType,
      personTutorId,
      orgTutorId: data.orgTutorId,
    })
  }

  async removeCoTutor(petId: string, coTutorId: string): Promise<void> {
    const pet = await this.repository.findById(petId)
    if (!pet) {
      throw HttpError.notFound('Pet')
    }
    await this.repository.removeCoTutor(petId, coTutorId)
  }

  async uploadPhoto(petId: string, file: Buffer, mimeType: string): Promise<PetRecord> {
    const pet = await this.repository.findById(petId)
    if (!pet) {
      throw HttpError.notFound('Pet')
    }

    if (pet.photoUrl) {
      const oldPath = extractPathFromUrl(pet.photoUrl, 'pet-images')
      await this.fileStorage.delete('pet-images', oldPath).catch(() => {})
    }

    const ext = mimeType === 'image/png' ? 'png' : mimeType === 'image/webp' ? 'webp' : 'jpg'
    const path = `${petId}/${Date.now()}.${ext}`
    const photoUrl = await this.fileStorage.upload('pet-images', path, file, mimeType)

    await this.repository.updatePhotoUrl(petId, photoUrl)

    const updated = await this.repository.findById(petId)
    return updated!
  }
}
