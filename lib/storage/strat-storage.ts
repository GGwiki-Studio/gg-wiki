'use client'

import { client } from '@/api/client'

const BUCKET = 'strat-assets'
const SOURCE_BUCKET = 'project-assets'

// Copy a single asset from project-assets to strat-assets
export async function copyAssetToStrat(
  sourceUrl: string,
  userId: string,
  stratId: string
): Promise<{ url: string | null; error: string | null }> {
  try {
    const sourcePathMatch = sourceUrl.match(/project-assets\/(.+)$/)
    if (!sourcePathMatch) return { url: null, error: 'Invalid source URL' }

    const { data: fileData, error: downloadError } = await client.storage
      .from(SOURCE_BUCKET)
      .download(sourcePathMatch[1])

    if (downloadError || !fileData) return { url: null, error: downloadError?.message || 'Download failed' }

    // Upload to strat-assets with new path
    const fileName = sourcePathMatch[1].split('/').pop() || `${crypto.randomUUID()}.png`
    const destPath = `${userId}/${stratId}/${fileName}`

    const { error: uploadError } = await client.storage
      .from(BUCKET)
      .upload(destPath, fileData, {
        contentType: fileData.type,
        upsert: false,
      })

    if (uploadError) return { url: null, error: uploadError.message }

    const { data } = client.storage.from(BUCKET).getPublicUrl(destPath)
    return { url: data.publicUrl, error: null }
  } catch {
    return { url: null, error: 'Failed to copy asset' }
  }
}


export async function deleteStratAssets(
  userId: string,
  stratId: string
): Promise<{ error: string | null }> {
  const prefix = `${userId}/${stratId}/`

  const { data: files, error: listError } = await client.storage
    .from(BUCKET)
    .list(prefix, { limit: 1000 })

  if (listError) return { error: listError.message }
  if (!files || files.length === 0) return { error: null }

  const paths = files.map((f) => `${prefix}${f.name}`)

  const { error } = await client.storage.from(BUCKET).remove(paths)
  if (error) return { error: error.message }
  return { error: null }
}