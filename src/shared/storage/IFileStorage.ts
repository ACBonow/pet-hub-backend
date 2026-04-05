/**
 * @module shared
 * @file IFileStorage.ts
 * @description Interface for file storage operations — enables DIP and testability.
 */

export interface IFileStorage {
  upload(bucket: string, path: string, buffer: Buffer, mime: string): Promise<string>
  delete(bucket: string, path: string): Promise<void>
}

/**
 * Extracts the storage path from a public URL.
 * e.g. "https://.../storage/v1/object/public/pet-images/abc.jpg" → "abc.jpg"
 */
export function extractPathFromUrl(url: string, bucket: string): string {
  const marker = `/object/public/${bucket}/`
  const idx = url.indexOf(marker)
  if (idx === -1) return url
  return url.slice(idx + marker.length)
}
