import { prisma } from '../shared/config/database'

describe('Database connection', () => {
  afterAll(async () => {
    await prisma.$disconnect()
  })

  it('should connect to Supabase and run a simple query', async () => {
    const result = await prisma.$queryRaw<[{ now: Date }]>`SELECT NOW() as now`
    expect(result[0].now).toBeInstanceOf(Date)
  })

  it('should have all expected tables', async () => {
    const tables = await prisma.$queryRaw<{ tablename: string }[]>`
      SELECT tablename FROM pg_tables
      WHERE schemaname = 'public'
      ORDER BY tablename
    `
    const tableNames = tables.map((t) => t.tablename)

    expect(tableNames).toContain('users')
    expect(tableNames).toContain('persons')
    expect(tableNames).toContain('organizations')
    expect(tableNames).toContain('pets')
    expect(tableNames).toContain('tutorships')
    expect(tableNames).toContain('vaccinations')
    expect(tableNames).toContain('exam_files')
    expect(tableNames).toContain('adoption_listings')
    expect(tableNames).toContain('lost_found_reports')
    expect(tableNames).toContain('service_listings')
  })
})
