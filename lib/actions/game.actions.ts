'use client'
import { client } from "@/api/client"

interface GetAllGames {
    limit: number;
    genre: string | string[];
    topic: string | string[];
}

export const getAllGames = async ({limit, genre, topic}: GetAllGames) => {
    let query = client.from('games').select().eq('is_active', true);

    if(genre && topic){
        query = query.ilike('genre', `%${genre}%`)
        .or(`name.ilike.%${topic}%,description.ilike.%${topic}%`)
    }
    else if(genre){
        query = query.ilike('genre', `%${genre}%`)
    }
    else if(topic){
        query = query.or(`name.ilike.%${topic}%,description.ilike.%${topic}%`)
    }

    if(limit !== 0){
        query = query.limit(limit)
    }

    const {data: games, error} = await query;

    if(error){
        throw new Error(error.message)
    }

    return games
}

export async function checkGameMembership(userId: string, gameId: string): Promise<boolean> {
  const { data } = await client
    .from('profile_games')
    .select('profile_id')
    .eq('profile_id', userId)
    .eq('game_id', gameId)
    .maybeSingle()

  return !!data
}

export async function joinGame(userId: string, gameId: string): Promise<{ error: string | null }> {
  // prevent duplicate
  const already = await checkGameMembership(userId, gameId)
  if (already) return { error: null }

  const { error: insertError } = await client
    .from('profile_games')
    .insert({ profile_id: userId, game_id: gameId })

  if (insertError) return { error: insertError.message }

  // count actual rows — always accurate
  const { count } = await client
    .from('profile_games')
    .select('*', { count: 'exact', head: true })
    .eq('game_id', gameId)

  await client
    .from('games')
    .update({ member_count: count ?? 0 })
    .eq('id', gameId)

  return { error: null }
}

export async function leaveGame(userId: string, gameId: string): Promise<{ error: string | null }> {
  const { error: deleteError } = await client
    .from('profile_games')
    .delete()
    .eq('profile_id', userId)
    .eq('game_id', gameId)

  if (deleteError) return { error: deleteError.message }

  const { count } = await client
    .from('profile_games')
    .select('*', { count: 'exact', head: true })
    .eq('game_id', gameId)

  await client
    .from('games')
    .update({ member_count: count ?? 0 })
    .eq('id', gameId)

  return { error: null }
}

export async function getUserJoinedGameIds(userId: string): Promise<string[]> {
  const { data } = await client
    .from('profile_games')
    .select('game_id')
    .eq('profile_id', userId)

  return (data || []).map((row: any) => row.game_id)
}