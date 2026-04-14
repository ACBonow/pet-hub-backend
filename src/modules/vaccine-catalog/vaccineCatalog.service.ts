/**
 * @module vaccine-catalog
 * @file vaccineCatalog.service.ts
 * @description Business logic for the vaccine catalog (read-only).
 */

import { AppError } from '../../shared/errors/AppError'
import type { IVaccineCatalogRepository } from './vaccineCatalog.repository'
import type { ListVaccineCatalogFilter, VaccineTemplateRecord } from './vaccineCatalog.types'

export class VaccineCatalogService {
  constructor(private readonly repo: IVaccineCatalogRepository) {}

  async listTemplates(filter: ListVaccineCatalogFilter): Promise<VaccineTemplateRecord[]> {
    return this.repo.findAll(filter)
  }

  async getTemplateBySlug(slug: string): Promise<VaccineTemplateRecord> {
    const template = await this.repo.findBySlug(slug)
    if (!template) throw new AppError(404, 'VACCINE_TEMPLATE_NOT_FOUND', 'Template não encontrado.')
    return template
  }
}
