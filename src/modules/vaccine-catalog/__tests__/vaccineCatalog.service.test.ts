/**
 * @module vaccine-catalog
 * @file vaccineCatalog.service.test.ts
 * @description Unit tests for VaccineCatalogService.
 */

import { VaccineCatalogService } from '../vaccineCatalog.service'
import type { IVaccineCatalogRepository } from '../vaccineCatalog.repository'
import type { VaccineTemplateRecord } from '../vaccineCatalog.types'
import { AppError } from '../../../shared/errors/AppError'

// ─── Mock data ────────────────────────────────────────────────────────────────

const MOCK_TEMPLATE: VaccineTemplateRecord = {
  id: 'tmpl-1',
  name: 'Tríplice Felina',
  slug: 'triplice-felina',
  type: 'VACCINE',
  species: ['CAT'],
  category: 'CORE',
  preventiveType: null,
  targetConditions: 'Rinotraqueíte, Calicivírose, Panleucopenia',
  minimumAgeWeeks: 6,
  initialDosesCount: 3,
  initialIntervalDays: 21,
  boosterIntervalDays: 365,
  isRequiredByLaw: false,
  notes: null,
  brands: [
    { id: 'brand-1', brandName: 'Nobivac Tricat Trio', manufacturer: 'MSD Animal Health', presentation: null },
  ],
}

const MOCK_PREVENTIVE: VaccineTemplateRecord = {
  id: 'tmpl-2',
  name: 'Antipulgas e Carrapatos (Spot-on)',
  slug: 'antipulgas-carrapatos-spot-on',
  type: 'PREVENTIVE',
  species: ['DOG', 'CAT'],
  category: 'LIFESTYLE',
  preventiveType: 'FLEA_TICK',
  targetConditions: 'Pulgas e carrapatos',
  minimumAgeWeeks: 8,
  initialDosesCount: 1,
  initialIntervalDays: 0,
  boosterIntervalDays: 30,
  isRequiredByLaw: false,
  notes: null,
  brands: [],
}

// ─── Tests ────────────────────────────────────────────────────────────────────

function makeRepo(overrides: Partial<IVaccineCatalogRepository> = {}): IVaccineCatalogRepository {
  return {
    findAll: jest.fn().mockResolvedValue([MOCK_TEMPLATE, MOCK_PREVENTIVE]),
    findBySlug: jest.fn().mockResolvedValue(MOCK_TEMPLATE),
    findById: jest.fn().mockResolvedValue(MOCK_TEMPLATE),
    ...overrides,
  }
}

describe('VaccineCatalogService', () => {
  describe('listTemplates', () => {
    it('returns all templates when no filter', async () => {
      const repo = makeRepo()
      const service = new VaccineCatalogService(repo)
      const result = await service.listTemplates({})
      expect(result).toHaveLength(2)
      expect(repo.findAll).toHaveBeenCalledWith({})
    })

    it('passes species filter to repository', async () => {
      const repo = makeRepo({ findAll: jest.fn().mockResolvedValue([MOCK_TEMPLATE]) })
      const service = new VaccineCatalogService(repo)
      await service.listTemplates({ species: 'CAT' })
      expect(repo.findAll).toHaveBeenCalledWith({ species: 'CAT' })
    })

    it('passes type filter to repository', async () => {
      const repo = makeRepo({ findAll: jest.fn().mockResolvedValue([MOCK_PREVENTIVE]) })
      const service = new VaccineCatalogService(repo)
      await service.listTemplates({ type: 'PREVENTIVE' })
      expect(repo.findAll).toHaveBeenCalledWith({ type: 'PREVENTIVE' })
    })

    it('passes category filter to repository', async () => {
      const repo = makeRepo({ findAll: jest.fn().mockResolvedValue([MOCK_TEMPLATE]) })
      const service = new VaccineCatalogService(repo)
      await service.listTemplates({ category: 'CORE' })
      expect(repo.findAll).toHaveBeenCalledWith({ category: 'CORE' })
    })
  })

  describe('getTemplateBySlug', () => {
    it('returns template when found', async () => {
      const repo = makeRepo()
      const service = new VaccineCatalogService(repo)
      const result = await service.getTemplateBySlug('triplice-felina')
      expect(result).toEqual(MOCK_TEMPLATE)
    })

    it('throws 404 when slug not found', async () => {
      const repo = makeRepo({ findBySlug: jest.fn().mockResolvedValue(null) })
      const service = new VaccineCatalogService(repo)
      await expect(service.getTemplateBySlug('unknown-slug')).rejects.toThrow(AppError)
      await expect(service.getTemplateBySlug('unknown-slug')).rejects.toMatchObject({ statusCode: 404 })
    })
  })
})
