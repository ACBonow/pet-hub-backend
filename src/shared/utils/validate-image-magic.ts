/**
 * @module shared/utils
 * @file validate-image-magic.ts
 * @description Validates image file authenticity by checking magic bytes (file signature).
 * Prevents MIME type spoofing where a malicious file is sent with a forged Content-Type.
 */

/**
 * Checks that the buffer's magic bytes match the declared MIME type.
 *
 * Supported types: image/jpeg, image/png, image/webp.
 * Returns false for any unsupported MIME type.
 */
export function validateImageMagicBytes(buffer: Buffer, mimetype: string): boolean {
  if (buffer.length < 4) return false

  switch (mimetype) {
    case 'image/jpeg':
      // JPEG: FF D8 FF
      return buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff

    case 'image/png':
      // PNG: 89 50 4E 47
      return (
        buffer[0] === 0x89 &&
        buffer[1] === 0x50 &&
        buffer[2] === 0x4e &&
        buffer[3] === 0x47
      )

    case 'image/webp':
      // WebP: RIFF????WEBP (bytes 0-3 = 'RIFF', bytes 8-11 = 'WEBP')
      if (buffer.length < 12) return false
      return (
        buffer.toString('ascii', 0, 4) === 'RIFF' &&
        buffer.toString('ascii', 8, 12) === 'WEBP'
      )

    default:
      return false
  }
}
