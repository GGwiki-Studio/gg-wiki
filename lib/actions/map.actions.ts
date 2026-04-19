'use server'

import { createClient } from '@/lib/supabase/server'

export async function createMap({
  gameId,
  name,
  slug,
  description,
}: {
  gameId: string
  name: string
  slug: string
  description?: string
}) {
  const supabase = await createClient()

  const { error } = await supabase.from('maps').insert({
    game_id: gameId,
    name,
    slug,
    description,
  })

  if (error) {
    throw new Error(error.message)
  }

  return true
}
