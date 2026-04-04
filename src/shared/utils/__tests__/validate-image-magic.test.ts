/**
 * @module shared/utils
 * @file validate-image-magic.test.ts
 * @description Tests for magic bytes validation utility.
 */

import { validateImageMagicBytes } from '../validate-image-magic'

describe('validateImageMagicBytes', () => {
  function makeBuffer(...bytes: number[]): Buffer {
    return Buffer.from(bytes)
  }

  describe('JPEG', () => {
    it('accepts valid JPEG (FF D8 FF)', () => {
      const buf = makeBuffer(0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10)
      expect(validateImageMagicBytes(buf, 'image/jpeg')).toBe(true)
    })

    it('rejects buffer that claims JPEG but has PNG header', () => {
      const buf = makeBuffer(0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a)
      expect(validateImageMagicBytes(buf, 'image/jpeg')).toBe(false)
    })

    it('rejects buffer that claims JPEG but is random bytes', () => {
      const buf = makeBuffer(0x00, 0x01, 0x02, 0x03)
      expect(validateImageMagicBytes(buf, 'image/jpeg')).toBe(false)
    })
  })

  describe('PNG', () => {
    it('accepts valid PNG (89 50 4E 47)', () => {
      const buf = makeBuffer(0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a)
      expect(validateImageMagicBytes(buf, 'image/png')).toBe(true)
    })

    it('rejects buffer that claims PNG but has JPEG header', () => {
      const buf = makeBuffer(0xff, 0xd8, 0xff, 0xe0)
      expect(validateImageMagicBytes(buf, 'image/png')).toBe(false)
    })
  })

  describe('WebP', () => {
    it('accepts valid WebP (RIFF....WEBP)', () => {
      // RIFF + 4-byte size + WEBP
      const buf = Buffer.alloc(12)
      buf.write('RIFF', 0, 'ascii')
      buf.writeUInt32LE(100, 4)
      buf.write('WEBP', 8, 'ascii')
      expect(validateImageMagicBytes(buf, 'image/webp')).toBe(true)
    })

    it('rejects buffer that claims WebP but has JPEG header', () => {
      const buf = makeBuffer(0xff, 0xd8, 0xff, 0xe0, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00)
      expect(validateImageMagicBytes(buf, 'image/webp')).toBe(false)
    })

    it('rejects RIFF buffer that is not WEBP (e.g. WAV)', () => {
      const buf = Buffer.alloc(12)
      buf.write('RIFF', 0, 'ascii')
      buf.writeUInt32LE(100, 4)
      buf.write('WAVE', 8, 'ascii')
      expect(validateImageMagicBytes(buf, 'image/webp')).toBe(false)
    })
  })

  describe('edge cases', () => {
    it('returns false for buffer too short to verify', () => {
      const buf = makeBuffer(0xff)
      expect(validateImageMagicBytes(buf, 'image/jpeg')).toBe(false)
    })

    it('returns false for empty buffer', () => {
      const buf = Buffer.alloc(0)
      expect(validateImageMagicBytes(buf, 'image/jpeg')).toBe(false)
    })

    it('returns false for unknown mimetype', () => {
      const buf = makeBuffer(0xff, 0xd8, 0xff, 0xe0)
      expect(validateImageMagicBytes(buf, 'application/pdf')).toBe(false)
    })
  })
})
