/**
 * @module shared
 * @file with-timeout.test.ts
 * @description Tests for the withTimeout utility.
 */

import { withTimeout } from '../with-timeout'

describe('withTimeout', () => {
  beforeEach(() => jest.useFakeTimers())
  afterEach(() => jest.useRealTimers())

  it('resolves with the value when promise completes before timeout', async () => {
    const fast = Promise.resolve('ok')
    const result = await withTimeout(fast, 5000)
    expect(result).toBe('ok')
  })

  it('rejects with STORAGE_TIMEOUT when promise takes longer than the limit', async () => {
    const slow = new Promise<string>((resolve) => setTimeout(() => resolve('late'), 10000))

    const race = withTimeout(slow, 1000)
    jest.advanceTimersByTime(1001)

    await expect(race).rejects.toMatchObject({ code: 'STORAGE_TIMEOUT' })
  })

  it('error message contains the timeout value in seconds', async () => {
    const slow = new Promise<string>((resolve) => setTimeout(() => resolve('late'), 10000))

    const race = withTimeout(slow, 30000)
    jest.advanceTimersByTime(30001)

    await expect(race).rejects.toMatchObject({
      message: expect.stringContaining('30s'),
    })
  })

  it('does not reject when promise resolves just before timeout', async () => {
    const nearly = new Promise<string>((resolve) => setTimeout(() => resolve('just in time'), 999))

    const race = withTimeout(nearly, 1000)
    jest.advanceTimersByTime(999)

    await expect(race).resolves.toBe('just in time')
  })

  it('propagates rejection from the original promise', async () => {
    const failing = Promise.reject(new Error('original error'))
    await expect(withTimeout(failing, 5000)).rejects.toThrow('original error')
  })
})
