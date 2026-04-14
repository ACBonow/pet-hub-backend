/**
 * @module vaccine-catalog
 * @file vaccineCatalog.controller.test.ts
 * @description HTTP-layer tests for vaccine-catalog routes.
 */

import { buildApp } from '../../../app'
import { VaccineCatalogService } from '../vaccineCatalog.service'
import type { VaccineTemplateRecord } from '../vaccineCatalog.types'

jest.mock('../vaccineCatalog.service')
const MockedService = VaccineCatalogService as jest.MockedClass<typeof VaccineCatalogService>

const MOCK_TEMPLATE: VaccineTemplateRecord = {
  id: 'tmpl-1',
  name: 'Tríplice Felina',
  slug: 'triplice-felina',
  type: 'VACCINE',
  species: ['CAT'],
  category: 'CORE',
  preventiveType: null,
  targetConditions: null,
  minimumAgeWeeks: 6,
  initialDosesCount: 3,
  initialIntervalDays: 21,
  boosterIntervalDays: 365,
  isRequiredByLaw: false,
  notes: null,
  brands: [],
}

async function buildTestApp() {
  MockedService.mockClear()
  const app = buildApp()
  await app.ready()
  const service = MockedService.mock.instances[0]
  return { app, service }
}

describe('Vaccine Catalog routes', () => {
  describe('GET /api/v1/vaccine-catalog', () => {
    it('returns 200 with list of templates', async () => {
      const { app, service } = await buildTestApp()
      jest.mocked(service.listTemplates).mockResolvedValueOnce([MOCK_TEMPLATE])

      const response = await app.inject({ method: 'GET', url: '/api/v1/vaccine-catalog' })

      expect(response.statusCode).toBe(200)
      const body = response.json()
      expect(body.success).toBe(true)
      expect(body.data).toHaveLength(1)
      expect(body.data[0].slug).toBe('triplice-felina')

      await app.close()
    })

    it('passes species query param as filter', async () => {
      const { app, service } = await buildTestApp()
      jest.mocked(service.listTemplates).mockResolvedValueOnce([MOCK_TEMPLATE])

      await app.inject({ method: 'GET', url: '/api/v1/vaccine-catalog?species=CAT' })

      expect(service.listTemplates).toHaveBeenCalledWith({ species: 'CAT' })

      await app.close()
    })

    it('passes type query param as filter', async () => {
      const { app, service } = await buildTestApp()
      jest.mocked(service.listTemplates).mockResolvedValueOnce([])

      await app.inject({ method: 'GET', url: '/api/v1/vaccine-catalog?type=VACCINE' })

      expect(service.listTemplates).toHaveBeenCalledWith({ type: 'VACCINE' })

      await app.close()
    })

    it('passes category query param as filter', async () => {
      const { app, service } = await buildTestApp()
      jest.mocked(service.listTemplates).mockResolvedValueOnce([])

      await app.inject({ method: 'GET', url: '/api/v1/vaccine-catalog?category=CORE' })

      expect(service.listTemplates).toHaveBeenCalledWith({ category: 'CORE' })

      await app.close()
    })

    it('returns 400 on invalid species value', async () => {
      const { app } = await buildTestApp()

      const response = await app.inject({ method: 'GET', url: '/api/v1/vaccine-catalog?species=INVALID' })

      expect(response.statusCode).toBe(400)
      await app.close()
    })
  })

  describe('GET /api/v1/vaccine-catalog/:slug', () => {
    it('returns 200 with template', async () => {
      const { app, service } = await buildTestApp()
      jest.mocked(service.getTemplateBySlug).mockResolvedValueOnce(MOCK_TEMPLATE)

      const response = await app.inject({ method: 'GET', url: '/api/v1/vaccine-catalog/triplice-felina' })

      expect(response.statusCode).toBe(200)
      const body = response.json()
      expect(body.success).toBe(true)
      expect(body.data.slug).toBe('triplice-felina')

      await app.close()
    })

    it('returns 404 when template not found', async () => {
      const { app, service } = await buildTestApp()
      const { AppError } = await import('../../../shared/errors/AppError')
      jest.mocked(service.getTemplateBySlug).mockRejectedValueOnce(
        new AppError(404, 'VACCINE_TEMPLATE_NOT_FOUND', 'Template não encontrado.'),
      )

      const response = await app.inject({ method: 'GET', url: '/api/v1/vaccine-catalog/nao-existe' })

      expect(response.statusCode).toBe(404)
      await app.close()
    })
  })
})
