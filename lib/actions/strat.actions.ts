'use client'

import { client } from '@/api/client'
import { getProject } from './project.actions'
import { copyAssetToStrat, deleteStratAssets } from '@/lib/storage/strat-storage'
import type { StratSlideData, StratEntity, StratListItem } from '@/components/strat-viewer/strat.types'
import type { BuilderSlide } from '@/components/builder/builder.types'
import type { StratTag, UploadedIcon } from '@/components/builder/builder.types'
import { CURRENT_SCHEMA_VERSION } from '@/lib/schema/builder/schema-migration'

interface ActionResult<T> {
  data: T | null
  error: string | null
}

// Helpers

function toStratListItem(row: Record<string, unknown>): StratListItem {
  return {
    id: row.id as string,
    title: row.title as string,
    visibility: row.visibility as 'private' | 'public',
    savedFromFeed: row.saved_from_feed as boolean,
    forkedFromId: (row.forked_from_id as string) || null,
    thumbnailUrl: (row.thumbnail_url as string) || null,
    createdAt: row.created_at as string,
    updatedAt: row.updated_at as string,
  }
}

function toStratEntity(row: Record<string, unknown>): StratEntity {
  return {
    id: row.id as string,
    userId: row.user_id as string,
    title: row.title as string,
    slideData: row.slide_data as StratSlideData,
    schemaVersion: row.schema_version as number,
    visibility: row.visibility as 'private' | 'public',
    savedFromFeed: row.saved_from_feed as boolean,
    forkedFromId: (row.forked_from_id as string) || null,
    originalAuthorId: (row.original_author_id as string) || null,
    thumbnailUrl: (row.thumbnail_url as string) || null,
    createdAt: row.created_at as string,
    updatedAt: row.updated_at as string,
  }
}

// Build self-contained slide data with only referenced tags and icons
function buildSlideData(
  slide: BuilderSlide,
  allTags: StratTag[],
  allIcons: UploadedIcon[]
): StratSlideData {
  const usedTagIds = new Set<string>()
  const usedIconIds = new Set<string>()

  for (const obj of slide.objects) {
    obj.metadata.tagIds.forEach((id) => usedTagIds.add(id))
    if (obj.type === 'icon') usedIconIds.add(obj.iconId)
  }

  return {
    slide: structuredClone(slide),
    tags: allTags.filter((t) => usedTagIds.has(t.id)),
    icons: allIcons.filter((i) => usedIconIds.has(i.id)),
    schemaVersion: CURRENT_SCHEMA_VERSION,
  }
}

// Replace project-assets URLs with strat-assets URLs in slide data
async function copySlideAssets(
  slideData: StratSlideData,
  userId: string,
  stratId: string
): Promise<StratSlideData> {
  const updated = structuredClone(slideData)

  const copies: Promise<void>[] = []

  // Copy background image
  if (updated.slide.backgroundImage && updated.slide.backgroundImage.startsWith('http')) {
    copies.push(
      copyAssetToStrat(updated.slide.backgroundImage, userId, stratId).then(({ url }) => {
        if (url) updated.slide.backgroundImage = url
      })
    )
  }

  // Copy icon srcs
  for (const icon of updated.icons) {
    if (icon.src.startsWith('http')) {
      copies.push(
        copyAssetToStrat(icon.src, userId, stratId).then(({ url }) => {
          if (url) icon.src = url
        })
      )
    }
  }

  // Copy image/icon object srcs
  for (const obj of updated.slide.objects) {
    if ((obj.type === 'image' || obj.type === 'icon') && obj.src.startsWith('http')) {
      copies.push(
        copyAssetToStrat(obj.src, userId, stratId).then(({ url }) => {
          if (url) obj.src = url
        })
      )
    }
  }

  await Promise.all(copies)
  return updated
}

// Actions

export async function extractStrat(
  userId: string,
  projectId: string,
  slideId: string,
  title?: string,
  thumbnailDataUrl?: string | null
): Promise<ActionResult<StratListItem>> {
  // Fetch the project
  const { data: project, error: projectError } = await getProject(projectId, userId)
  if (projectError || !project) return { data: null, error: projectError || 'Project not found' }

  const projectData = project.projectData
  const slide = projectData.slides.find((s) => s.id === slideId)
  if (!slide) return { data: null, error: 'Slide not found' }

  // Build self-contained slide data
  const slideData = buildSlideData(slide, projectData.tags, projectData.uploadedIcons)

  // Insert strat first to get the ID
  const { data: row, error: insertError } = await client
    .from('strats')
    .insert({
      user_id: userId,
      title: title || slide.name || 'Untitled Strat',
      slide_data: slideData,
      schema_version: CURRENT_SCHEMA_VERSION,
    })
    .select('*')
    .single()

  if (insertError || !row) return { data: null, error: insertError?.message || 'Failed to create strat' }

  // Copy assets to strat-assets bucket so strat is independent
  const copiedSlideData = await copySlideAssets(slideData, userId, row.id)

  // Upload thumbnail
  let thumbnailUrl: string | null = null
  if (thumbnailDataUrl) {
    const match = thumbnailDataUrl.match(/^data:([^;]+);base64,(.+)$/)
    if (match) {
      const path = `${userId}/${row.id}/thumbnail.png`
      const byteChars = atob(match[2])
      const byteArray = new Uint8Array(byteChars.length)
      for (let i = 0; i < byteChars.length; i++) byteArray[i] = byteChars.charCodeAt(i)
      const blob = new Blob([byteArray], { type: 'image/png' })

      await client.storage.from('strat-assets').upload(path, blob, {
        contentType: 'image/png',
        upsert: true,
      })
      const { data: urlData } = client.storage.from('strat-assets').getPublicUrl(path)
      thumbnailUrl = `${urlData.publicUrl}?t=${Date.now()}`
    }
  }

  // Update with copied asset URLs
  const { error: updateError } = await client
    .from('strats')
    .update({
      slide_data: copiedSlideData,
      ...(thumbnailUrl ? { thumbnail_url: thumbnailUrl } : {}),
    })
    .eq('id', row.id)
    .eq('user_id', userId)

  if (updateError) return { data: null, error: updateError.message }

  return { data: toStratListItem({ ...row, thumbnail_url: thumbnailUrl }), error: null }
}

export async function extractStrats(
  userId: string,
  projectId: string,
  slideIds: string[],
  thumbnails?: Record<string, string>
): Promise<ActionResult<StratListItem[]>> {
  const results: StratListItem[] = []
  const errors: string[] = []

  for (const slideId of slideIds) {
    const { data, error } = await extractStrat( userId, projectId, slideId, undefined, thumbnails?.[slideId] || null)
    if (error) {
      errors.push(error)
    } else if (data) {
      results.push(data)
    }
  }

  if (results.length === 0 && errors.length > 0) {
    return { data: null, error: errors[0] }
  }

  return { data: results, error: null }
}
export async function getUserStrats(
  userId: string
): Promise<ActionResult<StratListItem[]>> {
  const { data, error } = await client
    .from('strats')
    .select('id, title, visibility, saved_from_feed, forked_from_id, thumbnail_url, created_at, updated_at')
    .eq('user_id', userId)
    .order('updated_at', { ascending: false })

  if (error) return { data: null, error: error.message }
  return { data: (data || []).map(toStratListItem), error: null }
}

export async function getStrat(
  stratId: string,
  userId: string
): Promise<ActionResult<StratEntity>> {
  const { data, error } = await client
    .from('strats')
    .select('*')
    .eq('id', stratId)
    .eq('user_id', userId)
    .single()

  if (error) return { data: null, error: error.message }
  return { data: toStratEntity(data), error: null }
}

export async function deleteStrat(
  stratId: string,
  userId: string
): Promise<ActionResult<{ id: string }>> {
  // Delete assets from storage
  await deleteStratAssets(userId, stratId)

  const { error } = await client
    .from('strats')
    .delete()
    .eq('id', stratId)
    .eq('user_id', userId)

  if (error) return { data: null, error: error.message }
  return { data: { id: stratId }, error: null }
}

export async function getOwnedStrats(
  userId: string
): Promise<ActionResult<StratListItem[]>> {
  const { data, error } = await client
    .from('strats')
    .select('id, title, visibility, saved_from_feed, forked_from_id, thumbnail_url, created_at, updated_at')
    .eq('user_id', userId)
    .eq('saved_from_feed', false)
    .order('updated_at', { ascending: false })

  if (error) return { data: null, error: error.message }
  return { data: (data || []).map(toStratListItem), error: null }
}

export async function getSavedStrats(
  userId: string
): Promise<ActionResult<StratListItem[]>> {
  const { data, error } = await client
    .from('strats')
    .select('id, title, visibility, saved_from_feed, forked_from_id, thumbnail_url, created_at, updated_at')
    .eq('user_id', userId)
    .eq('saved_from_feed', true)
    .order('updated_at', { ascending: false })

  if (error) return { data: null, error: error.message }
  return { data: (data || []).map(toStratListItem), error: null }
}

export async function renameStrat(
  stratId: string,
  userId: string,
  newTitle: string
): Promise<ActionResult<StratListItem>> {
  const { data, error } = await client
    .from('strats')
    .update({
      title: newTitle,
      updated_at: new Date().toISOString(),
    })
    .eq('id', stratId)
    .eq('user_id', userId)
    .select('id, title, visibility, saved_from_feed, forked_from_id, thumbnail_url, created_at, updated_at')
    .single()

  if (error) return { data: null, error: error.message }
  return { data: toStratListItem(data), error: null }
}


export async function toggleStratVisibility(
  stratId: string,
  userId: string
): Promise<ActionResult<{ visibility: 'private' | 'public' }>> {
  const { data: current, error: fetchError } = await client
    .from('strats')
    .select('visibility')
    .eq('id', stratId)
    .eq('user_id', userId)
    .single()

  if (fetchError || !current) return { data: null, error: fetchError?.message || 'Not found' }

  const newVisibility = current.visibility === 'public' ? 'private' : 'public'

  const { error: updateError } = await client
    .from('strats')
    .update({ visibility: newVisibility, updated_at: new Date().toISOString() })
    .eq('id', stratId)
    .eq('user_id', userId)

  if (updateError) return { data: null, error: updateError.message }

  const newStatus = newVisibility === 'public' ? 'published' : 'hidden'
  await client
    .from('strategies')
    .update({ status: newStatus, updated_at: new Date().toISOString() })
    .eq('strat_id', stratId)
    .eq('user_id', userId)

  return { data: { visibility: newVisibility }, error: null }
}