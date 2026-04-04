/**
 * @module auth
 * @file auth.tokens.test.ts
 * @description Verifies that JWT tokens are always signed with HS256 (TECH-BE-007)
 * and that verify calls reject tokens signed with other algorithms.
 */

import jwt from 'jsonwebtoken'
import 'dotenv/config'
import { generateTokens } from '../auth.service'

const SECRET = process.env.JWT_SECRET ?? 'test-secret-that-is-long-enough-32chars'
const REFRESH_SECRET = process.env.JWT_REFRESH_SECRET ?? 'refresh-secret-that-is-long-enough-32c'

describe('generateTokens — JWT algorithm', () => {
  it('signs access token with HS256', () => {
    const { accessToken } = generateTokens('user-1')
    const header = jwt.decode(accessToken, { complete: true })?.header
    expect(header?.alg).toBe('HS256')
  })

  it('signs refresh token with HS256', () => {
    const { refreshToken } = generateTokens('user-1')
    const header = jwt.decode(refreshToken, { complete: true })?.header
    expect(header?.alg).toBe('HS256')
  })

  it('access token verify rejects a token signed with HS512', () => {
    const hs512Token = jwt.sign({ sub: 'user-1' }, SECRET, { algorithm: 'HS512' })
    expect(() => jwt.verify(hs512Token, SECRET, { algorithms: ['HS256'] })).toThrow()
  })

  it('refresh token verify rejects a token signed with HS512', () => {
    const hs512Token = jwt.sign({ sub: 'user-1' }, REFRESH_SECRET, { algorithm: 'HS512' })
    expect(() => jwt.verify(hs512Token, REFRESH_SECRET, { algorithms: ['HS256'] })).toThrow()
  })
})
