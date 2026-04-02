describe('env config', () => {
  const ORIGINAL_ENV = process.env

  beforeEach(() => {
    jest.resetModules()
    process.env = { ...ORIGINAL_ENV }
  })

  afterAll(() => {
    process.env = ORIGINAL_ENV
  })

  it('should throw if JWT_SECRET is missing', async () => {
    delete process.env.JWT_SECRET
    await expect(import('../env')).rejects.toThrow()
  })

  it('should throw if CORS_ORIGIN is missing', async () => {
    delete process.env.CORS_ORIGIN
    await expect(import('../env')).rejects.toThrow(/CORS_ORIGIN/)
  })

  it('should return env values when all required vars are set', async () => {
    process.env.JWT_SECRET = 'test-secret-min-32-characters-long!!'
    process.env.JWT_REFRESH_SECRET = 'test-refresh-secret-min-32-chars!!'
    process.env.DATABASE_URL = 'postgresql://localhost/test'
    process.env.SUPABASE_URL = 'https://test.supabase.co'
    process.env.SUPABASE_SERVICE_ROLE_KEY = 'test-key'
    process.env.SUPABASE_ANON_KEY = 'test-anon-key'
    process.env.CORS_ORIGIN = 'http://localhost:5173'

    const { env } = await import('../env')
    expect(env.JWT_SECRET).toBe('test-secret-min-32-characters-long!!')
    expect(env.CORS_ORIGIN).toBe('http://localhost:5173')
  })
})
