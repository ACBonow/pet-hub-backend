import { validateCnpj, sanitizeCnpj } from '../cnpj.validator'

describe('sanitizeCnpj', () => {
  it('should remove dots, slash and dash from formatted CNPJ', () => {
    expect(sanitizeCnpj('11.222.333/0001-81')).toBe('11222333000181')
  })

  it('should return unformatted CNPJ unchanged', () => {
    expect(sanitizeCnpj('11222333000181')).toBe('11222333000181')
  })
})

describe('validateCnpj', () => {
  it('should return true for a valid CNPJ without formatting', () => {
    expect(validateCnpj('11222333000181')).toBe(true)
  })

  it('should return true for a valid CNPJ with formatting', () => {
    expect(validateCnpj('11.222.333/0001-81')).toBe(true)
  })

  it('should return false for CNPJ with all equal digits', () => {
    const equalDigits = ['00000000000000', '11111111111111', '22222222222222',
      '33333333333333', '44444444444444', '55555555555555']
    equalDigits.forEach((cnpj) => {
      expect(validateCnpj(cnpj)).toBe(false)
    })
  })

  it('should return false for CNPJ with less than 14 digits', () => {
    expect(validateCnpj('1122233300018')).toBe(false)
  })

  it('should return false for CNPJ with more than 14 digits', () => {
    expect(validateCnpj('112223330001810')).toBe(false)
  })

  it('should return false for CNPJ with letters', () => {
    expect(validateCnpj('11.222.333/0001-8A')).toBe(false)
  })

  it('should return false for empty string', () => {
    expect(validateCnpj('')).toBe(false)
  })

  it('should return false for CNPJ with wrong check digit', () => {
    expect(validateCnpj('11222333000182')).toBe(false)
  })
})
