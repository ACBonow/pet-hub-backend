/**
 * @module shared
 * @file cpf.validator.ts
 * @description Brazilian CPF validation using the official check-digit algorithm.
 */

const KNOWN_INVALID_CPFS = new Set([
  '00000000000', '11111111111', '22222222222', '33333333333',
  '44444444444', '55555555555', '66666666666', '77777777777',
  '88888888888', '99999999999',
])

export function sanitizeCpf(cpf: string): string {
  return cpf.replace(/\D/g, '')
}

export function validateCpf(cpf: string): boolean {
  const digits = sanitizeCpf(cpf)

  if (digits.length !== 11) return false
  if (KNOWN_INVALID_CPFS.has(digits)) return false

  let sum = 0
  for (let i = 0; i < 9; i++) {
    sum += parseInt(digits[i]) * (10 - i)
  }
  let firstCheck = (sum * 10) % 11
  if (firstCheck === 10 || firstCheck === 11) firstCheck = 0
  if (firstCheck !== parseInt(digits[9])) return false

  sum = 0
  for (let i = 0; i < 10; i++) {
    sum += parseInt(digits[i]) * (11 - i)
  }
  let secondCheck = (sum * 10) % 11
  if (secondCheck === 10 || secondCheck === 11) secondCheck = 0
  if (secondCheck !== parseInt(digits[10])) return false

  return true
}
