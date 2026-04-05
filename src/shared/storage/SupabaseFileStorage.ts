/**
 * @module shared
 * @file SupabaseFileStorage.ts
 * @description Supabase Storage implementation of IFileStorage.
 * Uses SUPABASE_SERVICE_ROLE_KEY — backend only, never exposed to the frontend.
 */

import { createClient } from '@supabase/supabase-js'
import { env } from '../config/env'
import type { IFileStorage } from './IFileStorage'

export class SupabaseFileStorage implements IFileStorage {
  private getClient() {
    return createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY)
  }

  async upload(bucket: string, path: string, buffer: Buffer, mime: string): Promise<string> {
    const supabase = this.getClient()

    const { error } = await supabase.storage.from(bucket).upload(path, buffer, {
      contentType: mime,
      upsert: true,
    })

    if (error) {
      throw new Error(`Erro ao fazer upload do arquivo: ${error.message}`)
    }

    const { data } = supabase.storage.from(bucket).getPublicUrl(path)
    return data.publicUrl
  }

  async delete(bucket: string, path: string): Promise<void> {
    const supabase = this.getClient()

    const { error } = await supabase.storage.from(bucket).remove([path])

    if (error) {
      throw new Error(`Erro ao deletar arquivo: ${error.message}`)
    }
  }
}
