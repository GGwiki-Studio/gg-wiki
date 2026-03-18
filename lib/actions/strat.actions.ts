'use client'
import { client } from "@/api/client"
import { toast } from "sonner";


interface CreateStrat {
    title: string;
    game: string;
    map: string;
    tags: string[];
    difficulty: "Easy" | "Medium" | "Hard";
    content: string;
}

interface GetAllStratsParams {
    limit?: number
    map?: string
    topic?: string | string[]
    gameSlug?: string
}

interface FormattedStrat {
    id: string
    title: string
    thumbnailUrl: string
    view_count: number
    created_at: string
    author: string
    gameName: string
    mapName: string
}

export const createStrat = async (formData: CreateStrat, author: any) => {
    const gameID = (await client.from("games").select("id").eq("slug", formData.game).single()).data
    const mapId = (await client.from("maps").select("id").eq("slug", formData.map).single()).data

    const tagIds = await Promise.all(
        formData.tags.map(async (tagName) => {
            const { data: existingTag } = await client
                .from("tags")
                .select("id")
                .eq("name", tagName)
                .maybeSingle()

            if (existingTag) {
                return existingTag.id
            }
        }
    ))

    if (!gameID) {
        throw new Error("Game not found")
    }

    if (!mapId) {
        throw new Error("Map not found")
    }

    const { data, error } = await client
        .from("strategies")
        .insert({
            title: formData.title,
            game_id: gameID.id,
            map_id: mapId.id,
            difficulty: formData.difficulty,
            content: formData.content,
            user_id: author,
        })
        .select()
        .single()
    
    
    if (error || !data) {
        throw new Error(error?.message || "Failed to create strat")
    }

    if (tagIds.length > 0) {
        const { error: tagAssociationError } = await client
            .from("strategy_tags")
            .insert(
                tagIds.map(tagId => ({
                    strategy_id: data.id,
                    tag_id: tagId
                }))
            )

        if (tagAssociationError) {
            console.error("Failed to associate tags:", tagAssociationError)
        }
    }

    return data
}

export const getStrat = async (stratId: string) => {
    // Fetch the strategy itself (with author + game + map)
    const { data: stratData, error: stratError } = await client
        .from('strategies')
        .select(`
            id,
            title,
            content,
            difficulty,
            view_count,
            created_at,
            strat_url,
            user:user_id (
                id,
                username
            ),
            game:game_id (
                name,
                slug
            ),
            map:map_id (
                name,
                slug
            )
        `)
        .eq('id', stratId)
        .single()

    if (stratError || !stratData) {
        throw new Error(stratError?.message || "Strategy not found")
    }

    // Fetch tags separately to avoid relationship mismatch errors if the foreign key relation isn't configured.
    const { data: tagData, error: tagError } = await client
        .from('strategy_tags')
        .select(`
            tag:tag_id (
                name
            )
        `)
        .eq('strategy_id', stratId)

    if (tagError) {
        console.warn('Failed to load strategy tags:', tagError)
    }

    // Count votes separately since the strategies table does not have votes_count
    const { count: votesCount, error: votesCountError } = await client
        .from('votes')
        .select('id', { count: 'exact', head: true })
        .eq('strategy_id', stratId)
        .eq('vote_type', 1)

    if (votesCountError) {
        console.warn('Failed to count strategy votes:', votesCountError)
    }

    return {
        ...stratData,
        user: Array.isArray(stratData.user) ? stratData.user[0] : stratData.user,
        game: Array.isArray(stratData.game) ? stratData.game[0] : stratData.game,
        map: Array.isArray(stratData.map) ? stratData.map[0] : stratData.map,
        likes_count: votesCount ?? 0,
        tags: Array.isArray(tagData) ? tagData.map((st: any) => st.tag?.name).filter(Boolean) : []
    }
}

export const incrementViewCount = async (stratId: string) => {
    const { error } = await client.rpc('increment_view_count', { strategy_id: stratId })

    if (error) {
        console.warn('Failed to increment view count:', error)
        // Fallback: try to increment manually
        const { data: currentStrat } = await client
            .from('strategies')
            .select('view_count')
            .eq('id', stratId)
            .single()

        if (currentStrat) {
            const { error: updateError } = await client
                .from('strategies')
                .update({ view_count: (currentStrat.view_count || 0) + 1 })
                .eq('id', stratId)

            if (updateError) {
                console.error('Failed to increment view count manually:', updateError)
            }
        }
    }
}

export const likeStrat = async (stratId: string, userId: string, voteType: 'upvote' | 'downvote' = 'upvote') => {
    const voteValue = voteType === 'upvote' ? 1 : -1

    // First check if user already voted on this strategy
    const { data: existingVote } = await client
        .from('votes')
        .select('id, vote_type')
        .eq('strategy_id', stratId)
        .eq('user_id', userId)
        .maybeSingle()

    if (existingVote) {
        if (existingVote.vote_type === voteValue) {
            // Remove vote (unvote)
            const { error: deleteError } = await client
                .from('votes')
                .delete()
                .eq('id', existingVote.id)

            if (deleteError) throw deleteError

            // Recount upvotes
            const { count: newCount, error: countError } = await client
                .from('votes')
                .select('id', { count: 'exact', head: true })
                .eq('strategy_id', stratId)
                .eq('vote_type', 1)

            if (countError) throw countError

            return { voted: false, voteType: null, votesCount: newCount ?? 0 }
        } else {
            // Change vote type (upvote to downvote or vice versa)
            const { error: updateError } = await client
                .from('votes')
                .update({ vote_type: voteValue })
                .eq('id', existingVote.id)

            if (updateError) throw updateError

            // Recount upvotes
            const { count: newCount, error: countError } = await client
                .from('votes')
                .select('id', { count: 'exact', head: true })
                .eq('strategy_id', stratId)
                .eq('vote_type', 1)

            if (countError) throw countError

            return { voted: true, voteType, votesCount: newCount ?? 0 }
        }
    } else {
        // Add new vote
        const { error: insertError } = await client
            .from('votes')
            .insert({
                strategy_id: stratId,
                user_id: userId,
                vote_type: voteValue
            })

        if (insertError) throw insertError

        // Recount upvotes
        const { count: newCount, error: countError } = await client
            .from('votes')
            .select('id', { count: 'exact', head: true })
            .eq('strategy_id', stratId)
            .eq('vote_type', 1)

        if (countError) throw countError

        return { voted: true, voteType, votesCount: newCount ?? 0 }
    }
}

export const getComments = async (stratId: string) => {
    const { data, error } = await client
        .from('comments')
        .select(`
            id,
            content,
            created_at,
            parent_id,
            user:user_id (
                username
            )
        `)
        .eq('strategy_id', stratId)
        .order('created_at', { ascending: true })

    if (error) throw error

    // Fix user relationship arrays
    return (data || []).map(comment => ({
        ...comment,
        user: Array.isArray(comment.user) ? comment.user[0] : comment.user
    }))
}

export const addComment = async (stratId: string, userId: string, content: string) => {
    const { data, error } = await client
        .from('comments')
        .insert({
            strategy_id: stratId,
            user_id: userId,
            content,
            parent_id: null
        })
        .select(`
            id,
            content,
            created_at,
            parent_id,
            user:user_id (
                username
            )
        `)
        .single()

    if (error || !data) {
        throw new Error(error?.message || "Failed to add comment")
    }

    return {
        ...data,
        user: Array.isArray(data.user) ? data.user[0] : data.user
    }
}

export const getAllStrats = async ({ limit = 0, map, topic, gameSlug }: GetAllStratsParams): Promise<FormattedStrat[]> => {
  try {
    let gameId: string | undefined
    if (gameSlug) {
      const { data: gameData } = await client.from('games').select('id').eq('slug', gameSlug).single()
      if (gameData) gameId = gameData.id
    }

    let mapId: string | undefined
    if (map && map !== 'all') {
      const { data: mapData } = await client.from('maps').select('id').eq('slug', map).single()
      if (mapData) mapId = mapData.id
    }
    const topicString =
        typeof topic === 'string'
            ? topic
            : Array.isArray(topic)
            ? topic.join(' ')
            : ''

    const searchWords = topicString.trim().split(/\s+/).filter(Boolean)

    let strategyIdsByTag: string[] = []
    if (searchWords.length) {
      const { data: matchingTags } = await client
        .from('tags')
        .select('id')
        .or(searchWords.map(w => `name.ilike.%${w}%`).join(','))
      
      if (matchingTags?.length) {
        const tagIds = matchingTags.map(t => t.id)
        const { data: stratTags } = await client
          .from('strategy_tags')
          .select('strategy_id')
          .in('tag_id', tagIds)
        
        strategyIdsByTag = stratTags?.map(st => st.strategy_id) || []
      }
    }

    let query = client
      .from('strategies')
      .select(`
        id,
        title,
        thumbnail_url,
        view_count,
        created_at,
        user:user_id ( username ),
        game:game_id ( name ),
        map:map_id ( name )
      `)
      .order('view_count', { ascending: false })

    if (gameId) query = query.eq('game_id', gameId)
    if (mapId) query = query.eq('map_id', mapId)

    if (searchWords.length) {

    const filters: string[] = []

    searchWords.forEach(w => {
        filters.push(`title.ilike.%${w}%`)
        filters.push(`content.ilike.%${w}%`)
        })

        if (strategyIdsByTag.length) {
        filters.push(`id.in.(${strategyIdsByTag.join(',')})`)
        }

        query = query.or(filters.join(','))
    }

    if (limit && limit > 0) query = query.limit(limit)

    const { data, error } = await query
    if (error || !data) return []

    const formatDate = (timestamp: string) => {
      const date = new Date(timestamp)
      const day = date.getDate().toString().padStart(2, '0')
      const month = (date.getMonth() + 1).toString().padStart(2, '0')
      const year = date.getFullYear()
      const hours = date.getHours().toString().padStart(2, '0')
      const minutes = date.getMinutes().toString().padStart(2, '0')
      return `${day}/${month}/${year} ${hours}:${minutes}`
    }

    return data.map((strat: any) => ({
      id: strat.id,
      title: strat.title,
      thumbnailUrl: strat.thumbnail_url,
      view_count: strat.view_count || 0,
      created_at: formatDate(strat.created_at),
      author: Array.isArray(strat.user) ? strat.user[0]?.username : strat.user?.username || 'Unknown',
      gameName: Array.isArray(strat.game) ? strat.game[0]?.name : strat.game?.name || 'Unknown',
      mapName: Array.isArray(strat.map) ? strat.map[0]?.name : strat.map?.name || 'Unknown',
    }))
  } catch (err) {
    console.error('Error fetching strategies:', err)
    return []
  }
}