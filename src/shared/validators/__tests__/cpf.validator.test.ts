import { validateCpf, sanitizeCpf } from '../cpf.validator'

describe('sanitizeCpf', () => {
  it('should remove dots and dash from formatted CPF', () => {
    expect(sanitizeCpf('529.982.247-25')).toBe('52998224725')
  })

  it('should return unformatted CPF unchanged', () => {
    expect(sanitizeCpf('52998224725')).toBe('52998224725')
  })

  it('should remove all non-digit characters', () => {
    expect(sanitizeCpf('529 982 247-25')).toBe('52998224725')
  })
})

describe('validateCpf', () => {
  it('should return true for a valid CPF without formatting', () => {
    expect(validateCpf('52998224725')).toBe(true)
  })

  it('should return true for a valid CPF with formatting', () => {
    expect(validateCpf('529.982.247-25')).toBe(true)
  })

  it('should return false for CPF with all equal digits', () => {
    const equalDigits = ['00000000000', '11111111111', '22222222222', '33333333333',
      '44444444444', '55555555555', '66666666666', '77777777777',
      '88888888888', '99999999999']
    equalDigits.forEach((cpf) => {
      expect(validateCpf(cpf)).toBe(false)
    })
  })

  it('should return false for CPF with less than 11 digits', () => {
    expect(validateCpf('5299822472')).toBe(false)
  })

  it('should return false for CPF with more than 11 digits', () => {
    expect(validateCpf('529982247250')).toBe(false)
  })

  it('should return false for CPF with letters', () => {
    expect(validateCpf('529.982.247-2A')).toBe(false)
  })

  it('should return false for empty string', () => {
    expect(validateCpf('')).toBe(false)
  })

  it('should return false for CPF with wrong check digit', () => {
    expect(validateCpf('52998224726')).toBe(false)
  })

  it('should return false for formatted CPF with wrong check digit', () => {
    expect(validateCpf('529.982.247-26')).toBe(false)
  })
})
