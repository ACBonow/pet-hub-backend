/**
 * @module shared
 * @file cnpj.validator.ts
 * @description Brazilian CNPJ validation using the official check-digit algorithm.
 */

const KNOWN_INVALID_CNPJS = new Set([
  '00000000000000', '11111111111111', '22222222222222', '33333333333333',
  '44444444444444', '55555555555555', '66666666666666', '77777777777777',
  '88888888888888', '99999999999999',
])

export function sanitizeCnpj(cnpj: string): string {
  return cnpj.replace(/\D/g, '')
}

export function validateCnpj(cnpj: string): boolean {
  const digits = sanitizeCnpj(cnpj)

  if (digits.length !== 14) return false
  if (KNOWN_INVALID_CNPJS.has(digits)) return false

  const calcDigit = (slice: string, weights: number[]): number => {
    const sum = slice.split('').reduce((acc, d, i) => acc + parseInt(d) * weights[i], 0)
    const remainder = sum % 11
    return remainder < 2 ? 0 : 11 - remainder
  }

  const firstWeights = [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2]
  const secondWeights = [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2]

  const firstCheck = calcDigit(digits.slice(0, 12), firstWeights)
  if (firstCheck !== parseInt(digits[12])) return false

  const secondCheck = calcDigit(digits.slice(0, 13), secondWeights)
  if (secondCheck !== parseInt(digits[13])) return false

  return true
}
