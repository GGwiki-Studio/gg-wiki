'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import useAuth from '@/components/hooks/useAuth'
import { getReports, resolveReport, removeStrategy, removeComment, removeStrat } from '@/lib/admin'
import { client } from '@/api/client'

interface ReportWithContent {
    id: string
    reporter_id: string
    content_type: 'strategy' | 'comment' | 'strat'
    content_id: string
    reason: string
    description: string | null
    status: string
    created_at: string
    reporter?: { username: string }
    content_title?: string
    content_preview?: string
    content_author?: string
    content_url?: string
}

export default function AdminReports() {
    const { user, userRole, loading } = useAuth()
    const router = useRouter()
    const [reports, setReports] = useState<ReportWithContent[]>([])
    const [dataLoading, setDataLoading] = useState(true)
    const [filter, setFilter] = useState<string>('')

    useEffect(() => {
        if (!loading) {
            if (!user || userRole !== 'admin') {
                router.push('/')
            } else {
                loadReports()
            }
        }
    }, [user, userRole, loading, router, filter])

    async function loadReports() {
        setDataLoading(true)
        try {
            const data = await getReports(filter || undefined)

            const reportsWithContent = await Promise.all(
                data.map(async (report: any) => {
                    const contentDetails = await fetchContentDetails(report.content_type, report.content_id)
                    return {
                        ...report,
                        ...contentDetails
                    }
                })
            )

            setReports(reportsWithContent)
        } catch (error) {
            console.error('Failed to load reports:', error)
        } finally {
            setDataLoading(false)
        }
    }

    async function fetchContentDetails(contentType: string, contentId: string) {
        try {
            if (contentType === 'strategy') {
                const { data } = await client
                .from('strategies')
                .select(`
                id,
                title,
                content,
                user:user_id(username),
                        game:game_id(slug),
                        map:map_id(slug)
                        `)
                .eq('id', contentId)
                .single()

                if (data) {
                    const gameSlug = (data.game as any)?.slug || ''
                    const mapSlug = (data.map as any)?.slug || ''
                    return {
                        content_title: data.title,
                        content_preview: data.content?.substring(0, 150) + (data.content?.length > 150 ? '...' : ''),
                        content_author: (data.user as any)?.username || 'Unknown',
                        content_url: `/games/${gameSlug}/maps/${mapSlug}/strategies/${contentId}`
                    }
                }
            } else if (contentType === 'comment') {
                const { data } = await client
                .from('comments')
                .select(`
                id,
                content,
                user:user_id(username),
                        strategy:strategy_id(
                            id,
                            title,
                            game:game_id(slug),
                                             map:map_id(slug)
                        )
                        `)
                .eq('id', contentId)
                .single()

                if (data) {
                    const strategy = data.strategy as any
                    const gameSlug = strategy?.game?.slug || ''
                    const mapSlug = strategy?.map?.slug || ''
                    return {
                        content_title: `Comment on "${strategy?.title || 'Unknown Strategy'}"`,
                        content_preview: data.content?.substring(0, 150) + (data.content?.length > 150 ? '...' : ''),
                        content_author: (data.user as any)?.username || 'Unknown',
                        content_url: `/games/${gameSlug}/maps/${mapSlug}/strategies/${strategy?.id}`
                    }
                }
            } else if (contentType === 'strat') {
                const { data } = await client
                .from('strats')
                .select(`
                id,
                title,
                user:user_id(username)
                `)
                .eq('id', contentId)
                .single()

                if (data) {
                    return {
                        content_title: data.title,
                        content_preview: 'Strat content',
                        content_author: (data.user as any)?.username || 'Unknown',
                        content_url: `/dashboard/${contentId}`
                    }
                }
            }
        } catch (error) {
            console.error('Failed to fetch content details:', error)
        }

        return {
            content_title: 'Content not found',
            content_preview: 'This content may have been deleted',
            content_author: 'Unknown',
            content_url: null
        }
    }

    async function handleResolve(reportId: string, status: 'resolved' | 'dismissed') {
        const note = prompt(`Note for ${status}:`)
        if (!note) return

            try {
                await resolveReport(reportId, {
                    status,
                    review_note: note,
                    action_taken: status === 'resolved' ? 'Content reviewed' : 'No action'
                })
                loadReports()
            } catch (error) {
                alert('Failed to resolve report')
            }
    }

    async function handleRemove(contentType: string, contentId: string, reportId: string) {
        const reason = prompt('Reason for removal:')
        if (!reason) return

            try {
                if (contentType === 'strategy') {
                    await removeStrategy(contentId, reason)
                } else if (contentType === 'comment') {
                    await removeComment(contentId, reason)
                } else if (contentType === 'strat') {
                    await removeStrat(contentId, reason)
                }

                // Also resolve the report
                await resolveReport(reportId, {
                    status: 'resolved',
                    review_note: `Content removed: ${reason}`,
                    action_taken: 'Content removed'
                })

                alert('Content removed!')
                loadReports()
            } catch (error) {
                alert('Failed to remove content')
            }
    }

    function formatDate(timestamp: string) {
        return new Date(timestamp).toLocaleString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        })
    }

    if (loading || !user || userRole !== 'admin') {
        return <div className="min-h-screen flex items-center justify-center">
        <p className="text-xl">Loading...</p>
        </div>
    }

    return (
        <div className="min-h-screen p-8">
        <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-6">
        <h1 className="text-4xl font-bold">Reports</h1>
        <a href="/admin" className="text-gray-400 hover:text-white">
        ← Back to Dashboard
        </a>
        </div>

        {/* Filter buttons */}
        <div className="mb-6 flex gap-2">
        {[
            { value: '', label: 'All' },
            { value: 'pending', label: 'Pending' },
            { value: 'resolved', label: 'Resolved' },
            { value: 'dismissed', label: 'Dismissed' }
        ].map(f => (
            <button
            key={f.value}
            onClick={() => setFilter(f.value)}
            className={`px-4 py-2 rounded transition ${
                filter === f.value
                ? 'bg-blue-600 text-white'
                : 'bg-gray-700 hover:bg-gray-600'
            }`}
            >
            {f.label}
            </button>
        ))}
        </div>

        {dataLoading ? (
            <div className="text-center py-12">
            <p className="text-xl">Loading reports...</p>
            </div>
        ) : reports.length === 0 ? (
            <div className="bg-[#252525] p-12 rounded-lg border border-gray-700 text-center">
            <p className="text-xl text-gray-400">No reports found 🎉</p>
            </div>
        ) : (
            <div className="space-y-6">
            {reports.map(report => (
                <div key={report.id} className="bg-[#252525] rounded-lg border border-gray-700 overflow-hidden">
                {/* Report Header */}
                <div className="bg-[#1a1a1a] px-6 py-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                <span className={`px-3 py-1 rounded text-xs font-medium ${
                    report.status === 'pending' ? 'bg-yellow-600' :
                    report.status === 'resolved' ? 'bg-green-600' : 'bg-gray-600'
                }`}>
                {report.status.toUpperCase()}
                </span>
                <span className={`px-3 py-1 rounded text-xs ${
                    report.content_type === 'strategy' ? 'bg-purple-600' :
                    report.content_type === 'comment' ? 'bg-blue-600' : 'bg-orange-600'
                }`}>
                {report.content_type}
                </span>
                </div>
                <span className="text-sm text-gray-400">
                {formatDate(report.created_at)}
                </span>
                </div>

                {/* Content Details */}
                <div className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                {/* Reported Content */}
                <div className="bg-[#1a1a1a] p-4 rounded-lg">
                <h3 className="text-sm font-medium text-gray-400 mb-2">📄 Reported Content</h3>
                <p className="text-lg font-semibold mb-1">{report.content_title}</p>
                <p className="text-sm text-gray-400 mb-2">by {report.content_author}</p>
                <p className="text-sm text-gray-300 bg-[#252525] p-3 rounded">
                "{report.content_preview}"
                </p>
                {report.content_url && (
                    <a
                    href={report.content_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-block mt-3 text-blue-400 hover:text-blue-300 text-sm"
                    >
                    🔗 View Content →
                    </a>
                )}
                </div>

                {/* Report Details */}
                <div className="bg-[#1a1a1a] p-4 rounded-lg">
                <h3 className="text-sm font-medium text-gray-400 mb-2">🚩 Report Details</h3>
                <div className="space-y-3">
                <div>
                <span className="text-sm text-gray-400">Reported by:</span>
                <p className="font-medium">{report.reporter?.username || 'Unknown'}</p>
                </div>
                <div>
                <span className="text-sm text-gray-400">Reason:</span>
                <p className="font-medium capitalize">{report.reason}</p>
                </div>
                {report.description && (
                    <div>
                    <span className="text-sm text-gray-400">Description:</span>
                    <p className="text-gray-300">{report.description}</p>
                    </div>
                )}
                </div>
                </div>
                </div>

                {/* Actions */}
                {report.status === 'pending' && (
                    <div className="flex gap-3 pt-4 border-t border-gray-700">
                    <button
                    onClick={() => handleRemove(report.content_type, report.content_id, report.id)}
                    className="bg-red-600 hover:bg-red-700 px-4 py-2 rounded text-sm font-medium transition"
                    >
                    🗑️ Remove Content
                    </button>
                    <button
                    onClick={() => handleResolve(report.id, 'resolved')}
                    className="bg-green-600 hover:bg-green-700 px-4 py-2 rounded text-sm font-medium transition"
                    >
                    ✅ Mark Resolved
                    </button>
                    <button
                    onClick={() => handleResolve(report.id, 'dismissed')}
                    className="bg-gray-600 hover:bg-gray-700 px-4 py-2 rounded text-sm font-medium transition"
                    >
                    ❌ Dismiss
                    </button>
                    {report.content_url && (
                        <a
                        href={report.content_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded text-sm font-medium transition ml-auto"
                        >
                        👁️ View Content
                        </a>
                    )}
                    </div>
                )}

                {/* Resolved info */}
                {report.status !== 'pending' && (
                    <div className="pt-4 border-t border-gray-700 text-sm text-gray-400">
                    Status: <span className="capitalize">{report.status}</span>
                    </div>
                )}
                </div>
                </div>
            ))}
            </div>
        )}
        </div>
        </div>
    )
}
