/**
 * @module shared
 * @file schema-maxlength.test.ts
 * @description Verifies that all schemas enforce maxLength constraints (TECH-BE-006).
 * One representative field per limit per schema to keep the suite focused.
 */

import { RegisterSchema } from '../../modules/auth/auth.schema'
import { CreatePersonSchema, UpdatePersonSchema } from '../../modules/person/person.schema'
import { CreateOrganizationSchema, UpdateOrganizationSchema } from '../../modules/organization/organization.schema'
import { CreatePetSchema, UpdatePetSchema, TransferTutorshipSchema } from '../../modules/pet/pet.schema'
import { CreateAdoptionForUserSchema } from '../../modules/adoption/adoption.schema'
import { CreateLostFoundSchema } from '../../modules/lost-found/lost-found.schema'
import { CreateServiceListingSchema, UpdateServiceListingSchema } from '../../modules/services-directory/servicesDirectory.schema'
import { AddVaccinationSchema } from '../../modules/pet-health/petHealth.schema'

const over = (n: number) => 'a'.repeat(n + 1)

// ── auth ─────────────────────────────────────────────────────────────────────

describe('RegisterSchema maxLength', () => {
  const base = { email: 'a@b.com', password: '12345678', name: 'Jo', cpf: '52998224725' }

  it('rejects name > 100', () => {
    expect(RegisterSchema.safeParse({ ...base, name: over(100) }).success).toBe(false)
  })
  it('rejects email > 254', () => {
    expect(RegisterSchema.safeParse({ ...base, email: `${'a'.repeat(249)}@b.com` }).success).toBe(false)
  })
  it('rejects password > 128', () => {
    expect(RegisterSchema.safeParse({ ...base, password: over(128) }).success).toBe(false)
  })
  it('rejects phone > 20', () => {
    expect(RegisterSchema.safeParse({ ...base, phone: over(20) }).success).toBe(false)
  })
})

// ── person ────────────────────────────────────────────────────────────────────

describe('CreatePersonSchema maxLength', () => {
  const base = { name: 'Jo', cpf: '52998224725' }

  it('rejects name > 100', () => {
    expect(CreatePersonSchema.safeParse({ ...base, name: over(100) }).success).toBe(false)
  })
  it('rejects phone > 20', () => {
    expect(CreatePersonSchema.safeParse({ ...base, phone: over(20) }).success).toBe(false)
  })
})

describe('UpdatePersonSchema maxLength', () => {
  it('rejects name > 100', () => {
    expect(UpdatePersonSchema.safeParse({ name: over(100) }).success).toBe(false)
  })
  it('rejects phone > 20', () => {
    expect(UpdatePersonSchema.safeParse({ phone: over(20) }).success).toBe(false)
  })
})

// ── organization ──────────────────────────────────────────────────────────────

describe('CreateOrganizationSchema maxLength', () => {
  const base = { name: 'Org', type: 'NGO' as const }

  it('rejects name > 100', () => {
    expect(CreateOrganizationSchema.safeParse({ ...base, name: over(100) }).success).toBe(false)
  })
  it('rejects description > 2000', () => {
    expect(CreateOrganizationSchema.safeParse({ ...base, description: over(2000) }).success).toBe(false)
  })
  it('rejects email > 254', () => {
    expect(CreateOrganizationSchema.safeParse({ ...base, email: `${'a'.repeat(249)}@b.com` }).success).toBe(false)
  })
  it('rejects phone > 20', () => {
    expect(CreateOrganizationSchema.safeParse({ ...base, phone: over(20) }).success).toBe(false)
  })
  it('rejects addressStreet > 300', () => {
    expect(CreateOrganizationSchema.safeParse({ ...base, addressStreet: over(300) }).success).toBe(false)
  })
  it('rejects website > 500', () => {
    expect(CreateOrganizationSchema.safeParse({ ...base, website: over(500) }).success).toBe(false)
  })
  it('rejects instagram > 100', () => {
    expect(CreateOrganizationSchema.safeParse({ ...base, instagram: over(100) }).success).toBe(false)
  })
})

describe('UpdateOrganizationSchema maxLength', () => {
  it('rejects name > 100', () => {
    expect(UpdateOrganizationSchema.safeParse({ name: over(100) }).success).toBe(false)
  })
  it('rejects description > 2000', () => {
    expect(UpdateOrganizationSchema.safeParse({ description: over(2000) }).success).toBe(false)
  })
  it('rejects phone > 20', () => {
    expect(UpdateOrganizationSchema.safeParse({ phone: over(20) }).success).toBe(false)
  })
  it('rejects addressStreet > 300', () => {
    expect(UpdateOrganizationSchema.safeParse({ addressStreet: over(300) }).success).toBe(false)
  })
})

// ── pet ───────────────────────────────────────────────────────────────────────

describe('CreatePetSchema maxLength', () => {
  const base = { name: 'Rex', species: 'dog' }

  it('rejects name > 100', () => {
    expect(CreatePetSchema.safeParse({ ...base, name: over(100) }).success).toBe(false)
  })
  it('rejects species > 100', () => {
    expect(CreatePetSchema.safeParse({ ...base, species: over(100) }).success).toBe(false)
  })
  it('rejects breed > 100', () => {
    expect(CreatePetSchema.safeParse({ ...base, breed: over(100) }).success).toBe(false)
  })
  it('rejects microchip > 50', () => {
    expect(CreatePetSchema.safeParse({ ...base, microchip: over(50) }).success).toBe(false)
  })
  it('rejects notes > 2000', () => {
    expect(CreatePetSchema.safeParse({ ...base, notes: over(2000) }).success).toBe(false)
  })
})

describe('UpdatePetSchema maxLength', () => {
  it('rejects name > 100', () => {
    expect(UpdatePetSchema.safeParse({ name: over(100) }).success).toBe(false)
  })
  it('rejects notes > 2000', () => {
    expect(UpdatePetSchema.safeParse({ notes: over(2000) }).success).toBe(false)
  })
})

describe('TransferTutorshipSchema maxLength', () => {
  it('rejects transferNotes > 2000', () => {
    const input = { tutorType: 'PERSON' as const, personCpf: '52998224725', tutorshipType: 'OWNER' as const, transferNotes: over(2000) }
    expect(TransferTutorshipSchema.safeParse(input).success).toBe(false)
  })
})

// ── adoption ──────────────────────────────────────────────────────────────────

describe('CreateAdoptionForUserSchema maxLength', () => {
  const base = { petId: '00000000-0000-0000-0000-000000000001' }

  it('rejects description > 2000', () => {
    expect(CreateAdoptionForUserSchema.safeParse({ ...base, description: over(2000) }).success).toBe(false)
  })
  it('rejects contactPhone > 20', () => {
    expect(CreateAdoptionForUserSchema.safeParse({ ...base, contactPhone: over(20) }).success).toBe(false)
  })
  it('rejects contactWhatsapp > 20', () => {
    expect(CreateAdoptionForUserSchema.safeParse({ ...base, contactWhatsapp: over(20) }).success).toBe(false)
  })
})

// ── lost-found ────────────────────────────────────────────────────────────────

describe('CreateLostFoundSchema maxLength', () => {
  const base = { type: 'LOST' as const, description: 'desc', contactEmail: 'a@b.com' }

  it('rejects description > 2000', () => {
    expect(CreateLostFoundSchema.safeParse({ ...base, description: over(2000) }).success).toBe(false)
  })
  it('rejects petName > 100', () => {
    expect(CreateLostFoundSchema.safeParse({ ...base, petName: over(100) }).success).toBe(false)
  })
  it('rejects species > 100', () => {
    expect(CreateLostFoundSchema.safeParse({ ...base, species: over(100) }).success).toBe(false)
  })
  it('rejects location > 300', () => {
    expect(CreateLostFoundSchema.safeParse({ ...base, location: over(300) }).success).toBe(false)
  })
  it('rejects contactPhone > 20', () => {
    expect(CreateLostFoundSchema.safeParse({ ...base, contactPhone: over(20) }).success).toBe(false)
  })
  it('rejects addressStreet > 300', () => {
    expect(CreateLostFoundSchema.safeParse({ ...base, addressStreet: over(300) }).success).toBe(false)
  })
  it('rejects addressNotes > 300', () => {
    expect(CreateLostFoundSchema.safeParse({ ...base, addressNotes: over(300) }).success).toBe(false)
  })
})

// ── services-directory ────────────────────────────────────────────────────────

describe('CreateServiceListingSchema maxLength', () => {
  const base = { name: 'Clínica', type: 'CLINIC' }

  it('rejects name > 100', () => {
    expect(CreateServiceListingSchema.safeParse({ ...base, name: over(100) }).success).toBe(false)
  })
  it('rejects description > 2000', () => {
    expect(CreateServiceListingSchema.safeParse({ ...base, description: over(2000) }).success).toBe(false)
  })
  it('rejects phone > 20', () => {
    expect(CreateServiceListingSchema.safeParse({ ...base, phone: over(20) }).success).toBe(false)
  })
  it('rejects whatsapp > 20', () => {
    expect(CreateServiceListingSchema.safeParse({ ...base, whatsapp: over(20) }).success).toBe(false)
  })
  it('rejects street > 300', () => {
    expect(CreateServiceListingSchema.safeParse({ ...base, street: over(300) }).success).toBe(false)
  })
  it('rejects instagram > 100', () => {
    expect(CreateServiceListingSchema.safeParse({ ...base, instagram: over(100) }).success).toBe(false)
  })
  it('rejects website > 500', () => {
    // website validates as URL — a 500-char URL with valid format should fail on max length
    // easier to test: a non-URL that is over 500 chars
    expect(CreateServiceListingSchema.safeParse({ ...base, website: 'https://example.com/' + 'a'.repeat(490) }).success).toBe(false)
  })
})

describe('UpdateServiceListingSchema maxLength', () => {
  it('rejects name > 100', () => {
    expect(UpdateServiceListingSchema.safeParse({ name: over(100) }).success).toBe(false)
  })
  it('rejects description > 2000', () => {
    expect(UpdateServiceListingSchema.safeParse({ description: over(2000) }).success).toBe(false)
  })
  it('rejects phone > 20', () => {
    expect(UpdateServiceListingSchema.safeParse({ phone: over(20) }).success).toBe(false)
  })
})

// ── pet-health ────────────────────────────────────────────────────────────────

describe('AddVaccinationSchema maxLength', () => {
  const base = { vaccineName: 'Vacina X', applicationDate: '2026-01-01' }

  it('rejects vaccineName > 100', () => {
    expect(AddVaccinationSchema.safeParse({ ...base, vaccineName: over(100) }).success).toBe(false)
  })
  it('rejects manufacturer > 100', () => {
    expect(AddVaccinationSchema.safeParse({ ...base, manufacturer: over(100) }).success).toBe(false)
  })
  it('rejects batchNumber > 50', () => {
    expect(AddVaccinationSchema.safeParse({ ...base, batchNumber: over(50) }).success).toBe(false)
  })
  it('rejects veterinarianName > 100', () => {
    expect(AddVaccinationSchema.safeParse({ ...base, veterinarianName: over(100) }).success).toBe(false)
  })
  it('rejects clinicName > 100', () => {
    expect(AddVaccinationSchema.safeParse({ ...base, clinicName: over(100) }).success).toBe(false)
  })
  it('rejects notes > 2000', () => {
    expect(AddVaccinationSchema.safeParse({ ...base, notes: over(2000) }).success).toBe(false)
  })
})
