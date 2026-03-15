import { AppError } from '../AppError'

describe('AppError', () => {
  it('should create an error with statusCode, code and message', () => {
    const error = new AppError(400, 'INVALID_CPF', 'O CPF informado não é válido.')

    expect(error).toBeInstanceOf(Error)
    expect(error).toBeInstanceOf(AppError)
    expect(error.statusCode).toBe(400)
    expect(error.code).toBe('INVALID_CPF')
    expect(error.message).toBe('O CPF informado não é válido.')
  })

  it('should have a stack trace', () => {
    const error = new AppError(500, 'INTERNAL_ERROR', 'Erro interno.')
    expect(error.stack).toBeDefined()
  })

  it('should default name to AppError', () => {
    const error = new AppError(404, 'NOT_FOUND', 'Não encontrado.')
    expect(error.name).toBe('AppError')
  })
})
