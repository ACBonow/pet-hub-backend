/**
 * @module core
 * @file api/index.ts
 * @description Vercel serverless entry point.
 */

import { buildApp } from '../src/app'

const app = buildApp()

export default async function handler(req: unknown, res: unknown) {
  await app.ready()
  app.server.emit('request', req, res)
}
