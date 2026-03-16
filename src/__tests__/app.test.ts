import { buildApp } from '../app'

describe('App', () => {
  it('should build the app without errors', async () => {
    const app = buildApp()
    await expect(app.ready()).resolves.toBeDefined()
    await app.close()
  })

  it('should respond 404 on unknown routes', async () => {
    const app = buildApp()
    await app.ready()

    const response = await app.inject({
      method: 'GET',
      url: '/unknown-route',
    })

    expect(response.statusCode).toBe(404)
    await app.close()
  })
})
