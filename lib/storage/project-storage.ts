'use client'

import { client } from '@/api/client'

const BUCKET = 'project-assets'

// Upload

export async function uploadBackgroundImage(
  userId: string,
  projectId: string,
  file: File
): Promise<{ url: string | null; error: string | null }> {
  const ext = file.name.split('.').pop() || 'png'
  const fileName = `${crypto.randomUUID()}.${ext}`
  const path = `${userId}/${projectId}/backgrounds/${fileName}`

  const { error } = await client.storage.from(BUCKET).upload(path, file, {
    upsert: false,
  })

  if (error) return { url: null, error: error.message }

  const { data } = client.storage.from(BUCKET).getPublicUrl(path)
  return { url: data.publicUrl, error: null }
}

export async function uploadIcon(
  userId: string,
  projectId: string,
  file: File
): Promise<{ url: string | null; error: string | null }> {
  const ext = file.name.split('.').pop() || 'png'
  const fileName = `${crypto.randomUUID()}.${ext}`
  const path = `${userId}/${projectId}/icons/${fileName}`

  const { error } = await client.storage.from(BUCKET).upload(path, file, {
    upsert: false,
  })

  if (error) return { url: null, error: error.message }

  const { data } = client.storage.from(BUCKET).getPublicUrl(path)
  return { url: data.publicUrl, error: null }
}

// convert inline data URLs to storage URLs
export async function uploadBase64Asset(
  userId: string,
  projectId: string,
  base64: string,
  folder: 'backgrounds' | 'icons'
): Promise<{ url: string | null; error: string | null }> {
  // Extract mime type and data from data URL
  const match = base64.match(/^data:([^;]+);base64,(.+)$/)
  if (!match) return { url: null, error: 'Invalid base64 data URL' }

  const mimeType = match[1]
  const rawData = match[2]
  const ext = mimeType.split('/')[1]?.replace('svg+xml', 'svg') || 'png'
  const fileName = `${crypto.randomUUID()}.${ext}`
  const path = `${userId}/${projectId}/${folder}/${fileName}`

  // Convert base64 to Blob
  const byteChars = atob(rawData)
  const byteArray = new Uint8Array(byteChars.length)
  for (let i = 0; i < byteChars.length; i++) {
    byteArray[i] = byteChars.charCodeAt(i)
  }
  const blob = new Blob([byteArray], { type: mimeType })

  const { error } = await client.storage.from(BUCKET).upload(path, blob, {
    contentType: mimeType,
    upsert: false,
  })

  if (error) return { url: null, error: error.message }

  const { data } = client.storage.from(BUCKET).getPublicUrl(path)
  return { url: data.publicUrl, error: null }
}

// Delete

export async function deleteAsset(path: string): Promise<{ error: string | null }> {
  const { error } = await client.storage.from(BUCKET).remove([path])
  if (error) return { error: error.message }
  return { error: null }
}

export async function deleteProjectAssets(
  userId: string,
  projectId: string
): Promise<{ error: string | null }> {
  const prefix = `${userId}/${projectId}/`

  // List all files under this project
  const { data: files, error: listError } = await client.storage
    .from(BUCKET)
    .list(prefix, { limit: 1000 })

  if (listError) return { error: listError.message }
  if (!files || files.length === 0) return { error: null }

  // Supabase list doesn't return nested files, need to check subfolders
  const allPaths: string[] = []

  for (const item of files) {
    if (item.id) {
      // It's a file
      allPaths.push(`${prefix}${item.name}`)
    } else {
      // It's a folder, list its contents
      const { data: subFiles } = await client.storage
        .from(BUCKET)
        .list(`${prefix}${item.name}/`, { limit: 1000 })

      if (subFiles) {
        for (const sub of subFiles) {
          allPaths.push(`${prefix}${item.name}/${sub.name}`)
        }
      }
    }
  }

  if (allPaths.length === 0) return { error: null }

  const { error } = await client.storage.from(BUCKET).remove(allPaths)
  if (error) return { error: error.message }
  return { error: null }
}