/**
 * @module lost-found
 * @file lost-found.service.ts
 * @description Business logic for lost-found report management.
 */

import { HttpError } from '../../shared/errors/HttpError'
import { AppError } from '../../shared/errors/AppError'
import { uploadFile, deleteFile, extractPathFromUrl } from '../../shared/utils/storage'
import type { ILostFoundRepository } from './lost-found.repository'
import type { IPetRepository } from '../pet'
import type { IPersonRepository } from '../person'
import type { IOrganizationRepository } from '../organization'
import type {
  LostFoundCreateInput,
  LostFoundListFilters,
  LostFoundListResult,
  LostFoundReport,
  LostFoundStatus,
} from './lost-found.types'
import type { CreateLostFoundBody } from './lost-found.schema'

export class LostFoundService {
  constructor(
    private repository: ILostFoundRepository,
    private petRepository: IPetRepository,
    private personRepository: IPersonRepository,
    private orgRepository: IOrganizationRepository,
  ) {}

  async createForUser(userId: string, input: CreateLostFoundBody): Promise<LostFoundReport> {
    const person = await this.personRepository.findByUserId(userId)
    if (!person) {
      throw HttpError.notFound('Perfil de pessoa do usuário')
    }

    if (input.petId) {
      const pet = await this.petRepository.findById(input.petId)
      if (!pet) {
        throw HttpError.notFound('Pet')
      }
    }

    let organizationId: string | undefined = undefined

    if (input.organizationId) {
      const org = await this.orgRepository.findById(input.organizationId)
      if (!org) {
        throw HttpError.notFound('Organização')
      }

      const role = await this.orgRepository.getRole(input.organizationId, person.id)
      if (!role || role === 'MEMBER') {
        throw new AppError(403, 'INSUFFICIENT_PERMISSION', 'Você não tem permissão para realizar esta ação na organização.')
      }

      organizationId = input.organizationId
    }

    const createInput: LostFoundCreateInput = {
      type: input.type,
      petId: input.petId,
      reporterId: person.id,
      organizationId,
      petName: input.petName,
      species: input.species,
      description: input.description,
      location: input.location,
      addressStreet: input.addressStreet,
      addressNeighborhood: input.addressNeighborhood,
      addressNumber: input.addressNumber,
      addressCep: input.addressCep,
      addressCity: input.addressCity,
      addressState: input.addressState,
      addressNotes: input.addressNotes,
      contactEmail: input.contactEmail,
      contactPhone: input.contactPhone ?? undefined,
    }

    return this.repository.create(createInput)
  }

  async findAll(filters: LostFoundListFilters): Promise<LostFoundListResult> {
    const page = filters.page ?? 1
    const pageSize = filters.pageSize ?? 20

    const { reports, total } = await this.repository.findAll({ ...filters, page, pageSize })

    return { data: reports, total, page, pageSize }
  }

  async findById(id: string): Promise<LostFoundReport> {
    const report = await this.repository.findById(id)
    if (!report) {
      throw HttpError.notFound('Relatório de achado/perdido')
    }
    return report
  }

  async updateStatus(id: string, status: LostFoundStatus): Promise<LostFoundReport> {
    const report = await this.repository.findById(id)
    if (!report) {
      throw HttpError.notFound('Relatório de achado/perdido')
    }
    return this.repository.updateStatus(id, status)
  }

  async delete(id: string): Promise<void> {
    const report = await this.repository.findById(id)
    if (!report) {
      throw HttpError.notFound('Relatório de achado/perdido')
    }
    await this.repository.delete(id)
  }

  async uploadPhoto(reportId: string, file: Buffer, mimeType: string): Promise<LostFoundReport> {
    const report = await this.repository.findById(reportId)
    if (!report) {
      throw HttpError.notFound('Relatório de achado/perdido')
    }

    if (report.photoUrl) {
      const oldPath = extractPathFromUrl(report.photoUrl, 'lost-found-images')
      await deleteFile('lost-found-images', oldPath).catch(() => {})
    }

    const ext = mimeType === 'image/png' ? 'png' : mimeType === 'image/webp' ? 'webp' : 'jpg'
    const path = `${reportId}/${Date.now()}.${ext}`
    const photoUrl = await uploadFile('lost-found-images', path, file, mimeType)

    await this.repository.updatePhotoUrl(reportId, photoUrl)

    const updated = await this.repository.findById(reportId)
    return updated!
  }
}
