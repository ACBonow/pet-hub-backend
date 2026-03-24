/**
 * @module core
 * @file server.ts
 * @description Local development server entry point.
 */

import 'dotenv/config'
import { buildApp } from './app'

const PORT = Number(process.env.PORT) || 3000

const app = buildApp()

app.listen({ port: PORT, host: '0.0.0.0' }, (err) => {
  if (err) {
    app.log.error(err)
    process.exit(1)
  }
})
