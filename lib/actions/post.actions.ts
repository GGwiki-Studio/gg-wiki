'use client'

import { client } from '@/api/client'
import type { StratSlideData } from '@/components/strat-viewer/strat.types'

interface ActionResult<T> {
  data: T | null
  error: string | null
}

export interface PublishStratInput {
  userId: string
  stratId: string
  title: string
  content: string
  difficulty: 'Easy' | 'Medium' | 'Hard'
  gameId: string
  mapId: string
  thumbnailUrl: string | null
  tags: string[]
}

export interface PublishedStrategy {
  id: string
  userId: string
  title: string
  content: string
  difficulty: string
  gameId: string
  mapId: string
  gameName: string
  gameSlug: string
  mapName: string
  mapSlug: string
  authorName: string
  thumbnailUrl: string | null
  stratId: string | null
  slideData: StratSlideData | null
  viewCount: number
  createdAt: string
  updatedAt: string
  tags: { id: string; name: string }[]
}

export async function publishStrat(input: PublishStratInput): Promise<ActionResult<{ id: string }>> {
  const { userId, stratId, title, content, difficulty, gameId, mapId, thumbnailUrl, tags } = input

  const { data: row, error: insertError } = await client
    .from('strategies')
    .insert({
      user_id: userId,
      strat_id: stratId,
      title,
      content,
      difficulty,
      game_id: gameId,
      map_id: mapId,
      thumbnail_url: thumbnailUrl,
      status: 'published',
      view_count: 0,
    })
    .select('id')
    .single()

  if (insertError || !row) return { data: null, error: insertError?.message || 'Failed to publish' }

  if (tags.length > 0) {
    const tagIds: string[] = []

    for (const tagName of tags) {
      const { data: existing } = await client
        .from('tags')
        .select('id')
        .eq('name', tagName)
        .maybeSingle()

      if (existing) {
        tagIds.push(existing.id)
      } else {
        const { data: created } = await client
          .from('tags')
          .insert({ name: tagName })
          .select('id')
          .single()

        if (created) tagIds.push(created.id)
      }
    }

    if (tagIds.length > 0) {
      await client
        .from('strategy_tags')
        .insert(tagIds.map((tagId) => ({ strategy_id: row.id, tag_id: tagId })))
    }
  }

  await client
    .from('strats')
    .update({ visibility: 'public', updated_at: new Date().toISOString() })
    .eq('id', stratId)
    .eq('user_id', userId)

  return { data: { id: row.id }, error: null }
}

export async function getPublishedStrat(strategyId: string): Promise<ActionResult<PublishedStrategy>> {
  const { data: row, error } = await client
    .from('strategies')
    .select(`
      id,
      user_id,
      title,
      content,
      difficulty,
      game_id,
      map_id,
      thumbnail_url,
      strat_id,
      view_count,
      created_at,
      updated_at,
      game:game_id ( name, slug ),
      map:map_id ( name, slug ),
      user:user_id ( username )
    `)
    .eq('id', strategyId)
    .eq('is_removed', false)
    .eq('status', 'published')
    .single()

  if (error || !row) return { data: null, error: error?.message || 'Strategy not found' }

  const { data: tagRows } = await client
    .from('strategy_tags')
    .select('tag:tag_id ( id, name )')
    .eq('strategy_id', strategyId)

  const tags = (tagRows || [])
    .map((r: any) => r.tag)
    .filter(Boolean)

  let slideData: StratSlideData | null = null
  if (row.strat_id) {
    const { data: stratRow } = await client
      .from('strats')
      .select('slide_data')
      .eq('id', row.strat_id)
      .single()

    if (stratRow) slideData = stratRow.slide_data as StratSlideData
  }

  const game = row.game as any
  const map = row.map as any
  const user = row.user as any

  return {
    data: {
      id: row.id,
      userId: row.user_id,
      title: row.title,
      content: row.content,
      difficulty: row.difficulty,
      gameId: row.game_id,
      mapId: row.map_id,
      gameName: game?.name || '',
      gameSlug: game?.slug || '',
      mapName: map?.name || '',
      mapSlug: map?.slug || '',
      authorName: user?.username || 'Unknown',
      thumbnailUrl: row.thumbnail_url,
      stratId: row.strat_id,
      slideData,
      viewCount: row.view_count,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
      tags,
    },
    error: null,
  }
}

export async function getGames(): Promise<ActionResult<{ id: string; name: string; slug: string }[]>> {
  const { data, error } = await client
    .from('games')
    .select('id, name, slug')
    .order('name')

  if (error) return { data: null, error: error.message }
  return { data: data || [], error: null }
}

export async function getMapsByGame(gameId: string): Promise<ActionResult<{ id: string; name: string; slug: string }[]>> {
  const { data, error } = await client
    .from('maps')
    .select('id, name, slug')
    .eq('game_id', gameId)
    .order('name')

  if (error) return { data: null, error: error.message }
  return { data: data || [], error: null }
}