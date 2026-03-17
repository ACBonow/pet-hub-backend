/**
 * @module lost-found
 * @file lost-found.service.ts
 * @description Business logic for lost-found report management.
 */

import { HttpError } from '../../shared/errors/HttpError'
import type { ILostFoundRepository } from './lost-found.repository'
import type { IPetRepository } from '../pet'
import type { IPersonRepository } from '../person'
import type {
  LostFoundCreateInput,
  LostFoundListFilters,
  LostFoundListResult,
  LostFoundReport,
  LostFoundStatus,
} from './lost-found.types'

export class LostFoundService {
  constructor(
    private repository: ILostFoundRepository,
    private petRepository: IPetRepository,
    private personRepository: IPersonRepository,
  ) {}

  async create(input: LostFoundCreateInput): Promise<LostFoundReport> {
    const reporter = await this.personRepository.findById(input.reporterId)
    if (!reporter) {
      throw HttpError.notFound('Relator')
    }

    if (input.petId) {
      const pet = await this.petRepository.findById(input.petId)
      if (!pet) {
        throw HttpError.notFound('Pet')
      }
    }

    return this.repository.create(input)
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
}
