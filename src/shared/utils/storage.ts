/**
 * @module shared
 * @file storage.ts
 * @description Helper for Supabase Storage operations (upload and delete).
 * Uses SUPABASE_SERVICE_ROLE_KEY — backend only, never exposed to the frontend.
 */

import { createClient } from '@supabase/supabase-js'
import { env } from '../config/env'

function getStorageClient() {
  return createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY)
}

/**
 * Uploads a file buffer to Supabase Storage.
 * Returns the public URL of the uploaded file.
 */
export async function uploadFile(
  bucket: string,
  path: string,
  file: Buffer,
  contentType: string,
): Promise<string> {
  const supabase = getStorageClient()

  const { error } = await supabase.storage.from(bucket).upload(path, file, {
    contentType,
    upsert: true,
  })

  if (error) {
    throw new Error(`Erro ao fazer upload do arquivo: ${error.message}`)
  }

  const { data } = supabase.storage.from(bucket).getPublicUrl(path)
  return data.publicUrl
}

/**
 * Deletes a file from Supabase Storage by its path.
 */
export async function deleteFile(bucket: string, path: string): Promise<void> {
  const supabase = getStorageClient()

  const { error } = await supabase.storage.from(bucket).remove([path])

  if (error) {
    throw new Error(`Erro ao deletar arquivo: ${error.message}`)
  }
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
