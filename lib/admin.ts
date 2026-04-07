import { client } from '@/api/client'

export type UserRole = 'user' | 'admin'

// ============ USER MANAGEMENT ============
export async function getAllUsers() {
    const { data, error } = await client
    .from('profiles')
    .select('id, username, avatar_url, role, created_at')
    .order('created_at', { ascending: false })

    if (error) {
        console.error('getAllUsers error:', error)
        throw error
    }
    return data || []
}

export async function updateUserRole(userId: string, newRole: UserRole) {
    const { data, error } = await client
    .from('profiles')
    .update({ role: newRole })
    .eq('id', userId)
    .select()
    .single()

    if (error) throw error
        return data
}

// ============ GAME MANAGEMENT ============
export async function getAllGames() {
    const { data, error } = await client
    .from('games')
    .select('*')
    .order('created_at', { ascending: false })

    if (error) {
        console.error('getAllGames error:', error)
        throw error
    }
    return data || []
}

export async function addGame(game: {
    name: string
    slug: string
    description?: string
    genre?: string
    cover_image_url?: string
}) {
    const { data: { user } } = await client.auth.getUser()

    const { data, error } = await client
    .from('games')
    .insert({
        ...game,
        created_by: user!.id,
        is_active: true
    })
    .select()
    .single()

    if (error) throw error
        return data
}

export async function toggleGameActive(gameId: string, isActive: boolean) {
    const { data, error } = await client
    .from('games')
    .update({ is_active: isActive, updated_at: new Date().toISOString() })
    .eq('id', gameId)
    .select()
    .single()

    if (error) throw error
        return data
}

export async function deleteGame(gameId: string) {
    const { error } = await client
    .from('games')
    .delete()
    .eq('id', gameId)

    if (error) throw error
}

// ============ REPORTS ============
export async function getReports(status?: string) {
    let query = client
    .from('reports')
    .select(`
    *,
    reporter:profiles!reporter_id(username, avatar_url)
    `)
    .order('created_at', { ascending: false })

    if (status) {
        query = query.eq('status', status)
    }

    const { data, error } = await query
    if (error) {
        console.error('getReports error:', error)
        throw error
    }
    return data || []
}

export async function resolveReport(
    reportId: string,
    action: {
        status: 'resolved' | 'dismissed'
review_note: string
action_taken?: string
    }
) {
    const { data: { user } } = await client.auth.getUser()

    const { data, error } = await client
    .from('reports')
    .update({
        ...action,
        reviewed_by: user!.id,
        resolved_at: new Date().toISOString()
    })
    .eq('id', reportId)
    .select()
    .single()

    if (error) throw error
        return data
}

export async function removeStrategy(strategyId: string, reason: string) {
    const { data: { user } } = await client.auth.getUser()

    const { error } = await client
    .from('strategies')
    .update({
        is_removed: true,
        removed_by: user!.id,
        removed_at: new Date().toISOString(),
            removal_reason: reason
    })
    .eq('id', strategyId)

    if (error) throw error
}

export async function removeComment(commentId: string, reason: string) {
    const { data: { user } } = await client.auth.getUser()

    const { error } = await client
    .from('comments')
    .update({
        is_removed: true,
        removed_by: user!.id,
        removed_at: new Date().toISOString(),
            removal_reason: reason
    })
    .eq('id', commentId)

    if (error) throw error
}

export async function removeStrat(stratId: string, reason: string) {
    const { data: { user } } = await client.auth.getUser()

    const { error } = await client
    .from('strats')
    .update({
        is_removed: true,
        removed_by: user!.id,
        removed_at: new Date().toISOString(),
            removal_reason: reason
    })
    .eq('id', stratId)

    if (error) throw error
}
