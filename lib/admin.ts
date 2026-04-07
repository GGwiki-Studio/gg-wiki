import { client } from '@/api/client'

export type UserRole = 'user' | 'admin'

// ============ USER MANAGEMENT ============
export async function getAllUsers(page = 1, pageSize = 50) {
    const start = (page - 1) * pageSize
    const end = start + pageSize - 1

    const { data, error, count } = await client
    .from('profiles')
    .select('id, username, avatar_url, role, created_at', { count: 'exact' })
    .order('created_at', { ascending: false })
    .range(start, end)

    if (error) {
        console.error('getAllUsers error:', error)
        throw error
    }

    return {
        users: data || [],
        total: count || 0,
        totalPages: Math.ceil((count || 0) / pageSize)
    }
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
export async function getAllGames(page = 1, pageSize = 50) {
    const start = (page - 1) * pageSize
    const end = start + pageSize - 1

    const { data, error, count } = await client
    .from('games')
    .select('*', { count: 'exact' })
    .order('created_at', { ascending: false })
    .range(start, end)

    if (error) {
        console.error('getAllGames error:', error)
        throw error
    }

    return {
        games: data || [],
        total: count || 0,
        totalPages: Math.ceil((count || 0) / pageSize)
    }
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
export async function getReports(status?: string, page = 1, pageSize = 20) {
    const start = (page - 1) * pageSize
    const end = start + pageSize - 1

    let query = client
    .from('reports')
    .select(`
    *,
    reporter:profiles!reporter_id(username, avatar_url)
    `, { count: 'exact' })
    .order('created_at', { ascending: false })
    .range(start, end)

    if (status) {
        query = query.eq('status', status)
    }

    const { data, error, count } = await query
    if (error) {
        console.error('getReports error:', error)
        throw error
    }

    return {
        reports: data || [],
        total: count || 0,
        totalPages: Math.ceil((count || 0) / pageSize)
    }
}

export async function resolveReport(
    reportId: string,
    action: {
        status: 'resolved' | 'dismissed'
review_note: string
action_taken?: string
judgment?: 'deleted' | 'deactivated' | 'dismissed' | 'restored'
    }
) {
    const { data: { user } } = await client.auth.getUser()

    const { data, error } = await client
    .from('reports')
    .update({
        status: action.status,
        review_note: action.review_note,
        action_taken: action.action_taken,
        reviewed_by: user!.id,
        resolved_at: new Date().toISOString()
    })
    .eq('id', reportId)
    .select()
    .single()

    if (error) throw error
        return data
}

// ============ STRATEGY MANAGEMENT (Soft delete with undo) ============
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

        return { success: true, message: "Strategy deactivated." }
}

export async function restoreStrategy(strategyId: string) {
    const { data, error } = await client
    .from('strategies')
    .update({
        is_removed: false,
        removed_by: null,
        removed_at: null,
        removal_reason: null
    })
    .eq('id', strategyId)
    .select()
    .single()

    if (error) throw error

        return { success: true, data }
}

export async function isStrategyRemoved(strategyId: string): Promise<boolean> {
    const { data, error } = await client
    .from('strategies')
    .select('is_removed')
    .eq('id', strategyId)
    .single()

    if (error) throw error
        return data?.is_removed || false
}

// ============ COMMENT MANAGEMENT (HARD DELETE - Permanent) ============
export async function removeComment(commentId: string, _reason: string) {
    // Delete the comment first
    const { error: commentError } = await client
    .from('comments')
    .delete()
    .eq('id', commentId)

    if (commentError) throw commentError

        // Then delete ALL reports associated with this comment
        const { error: reportError } = await client
        .from('reports')
        .delete()
        .eq('content_id', commentId)
        .eq('content_type', 'comment')

        if (reportError) {
            console.error('Failed to delete associated reports:', reportError)
            // Don't throw - comment is already deleted
        }

        return { success: true, message: "Comment and its reports permanently deleted." }
}

// ============ STRAT MANAGEMENT (Soft delete) ============
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

export async function restoreStrat(stratId: string) {
    const { error } = await client
    .from('strats')
    .update({
        is_removed: false,
        removed_by: null,
        removed_at: null,
        removal_reason: null
    })
    .eq('id', stratId)

    if (error) throw error

        return { success: true }
}

export async function reopenReport(reportId: string) {
    const { error } = await client
    .from('reports')
    .update({
        status: 'pending',
        reviewed_by: null,
        resolved_at: null,
        review_note: null,
        action_taken: null
    })
    .eq('id', reportId)

    if (error) throw error

        return { success: true }
}

// ============ HELPER: Get current user ============
async function getCurrentUserId(): Promise<string | null> {
    const { data: { user } } = await client.auth.getUser()
    return user?.id || null
}
