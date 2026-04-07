'use client'
import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import useAuth from '@/components/hooks/useAuth'
import {
    getReports,
    resolveReport,
    removeStrategy,
    removeComment,
    removeStrat,
} from '@/lib/admin'
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
    content_url?: string | null
}

// Simple inline modal to replace prompt()
function NoteModal({
    title,
    onConfirm,
    onCancel,
}: {
    title: string
    onConfirm: (note: string) => void
    onCancel: () => void
}) {
    const [value, setValue] = useState('')

    return (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
        <div className="bg-[#1a1a1a] p-6 rounded-lg border border-gray-700 max-w-md w-full mx-4 shadow-2xl">
        <h3 className="text-xl font-bold mb-4">{title}</h3>
        <textarea
        value={value}
        onChange={e => setValue(e.target.value)}
        className="w-full bg-[#252525] border border-gray-600 rounded p-3 mb-4 text-sm focus:outline-none focus:border-blue-500"
        placeholder="Enter details..."
        rows={4}
        autoFocus
        />
        <div className="flex gap-3">
        <button
        onClick={() => onConfirm(value)}
        disabled={!value.trim()}
        className="bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded font-medium disabled:opacity-50 disabled:cursor-not-allowed transition"
        >
        Confirm
        </button>
        <button
        onClick={onCancel}
        className="bg-gray-700 hover:bg-gray-600 px-4 py-2 rounded transition"
        >
        Cancel
        </button>
        </div>
        </div>
        </div>
    )
}

export default function AdminReports() {
    const { user, userRole, loading } = useAuth()
    const router = useRouter()
    const [reports, setReports] = useState<ReportWithContent[]>([])
    const [dataLoading, setDataLoading] = useState(true)
    const [filter, setFilter] = useState<string>('')
    const [currentPage, setCurrentPage] = useState(1)
    const [totalPages, setTotalPages] = useState(1)
    const [actionLoading, setActionLoading] = useState<string | null>(null)
    const [modal, setModal] = useState<{
        type: 'resolve' | 'dismiss' | 'remove'
        reportId: string
        contentType?: string
        contentId?: string
    } | null>(null)
    const PAGE_SIZE = 20
    const hasFetched = useRef(false)  // add this line near your other state declarations

    // Auth guard — runs once
    useEffect(() => {
        if (loading) return

            if (!user || userRole !== 'admin') {
                router.push('/')
                return
            }

            if (hasFetched.current) return
                hasFetched.current = true

                loadReports()
    }, [user, userRole, loading]) // no router, no filter, no currentPage

    // Filter/page changes — runs after initial load
    useEffect(() => {
        if (!hasFetched.current) return
            loadReports()
    }, [filter, currentPage])

    async function loadReports() {
        setDataLoading(true)
        try {
            const result = await getReports(filter || undefined, currentPage, PAGE_SIZE)

            // Batch fetch content details to avoid N+1
            const reportsWithContent = await fetchAllContentDetails(result.reports)

            setReports(reportsWithContent)
            setTotalPages(result.totalPages)
        } catch (error) {
            console.error('Failed to load reports:', error)
        } finally {
            setDataLoading(false)
        }
    }

    // Batch fetches content in 3 queries instead of N queries
    async function fetchAllContentDetails(
        rawReports: any[]
    ): Promise<ReportWithContent[]> {
        const strategyIds = rawReports
        .filter(r => r.content_type === 'strategy')
        .map(r => r.content_id)

        const commentIds = rawReports
        .filter(r => r.content_type === 'comment')
        .map(r => r.content_id)

        const stratIds = rawReports
        .filter(r => r.content_type === 'strat')
        .map(r => r.content_id)

        // Fetch all in parallel
        const [strategiesResult, commentsResult, stratsResult] = await Promise.all([
            strategyIds.length > 0
            ? client
            .from('strategies')
            .select(
                'id, title, content, user:profiles!user_id(username), game:games!game_id(slug), map:maps!map_id(slug)'
            )
            .in('id', strategyIds)
            : Promise.resolve({ data: [] }),

                                                                                   commentIds.length > 0
                                                                                   ? client
                                                                                   .from('comments')
                                                                                   .select(
                                                                                       'id, content, user:profiles!user_id(username), strategy:strategies!strategy_id(id, title, game:games!game_id(slug), map:maps!map_id(slug))'
                                                                                   )
                                                                                   .in('id', commentIds)
                                                                                   : Promise.resolve({ data: [] }),

                                                                                   stratIds.length > 0
                                                                                   ? client
                                                                                   .from('strats')
                                                                                   .select('id, title, user:profiles!user_id(username)')
                                                                                   .in('id', stratIds)
                                                                                   : Promise.resolve({ data: [] }),
        ])

        // Build lookup maps
        const strategyMap = new Map(
            (strategiesResult.data || []).map((s: any) => [s.id, s])
        )
        const commentMap = new Map(
            (commentsResult.data || []).map((c: any) => [c.id, c])
        )
        const stratMap = new Map(
            (stratsResult.data || []).map((s: any) => [s.id, s])
        )

        // Map reports to include content details
        return rawReports.map(report => {
            if (report.content_type === 'strategy') {
                const s = strategyMap.get(report.content_id) as any
                if (s) {
                    const gameSlug = s.game?.slug || ''
                    const mapSlug = s.map?.slug || ''
        return {
            ...report,
            content_title: s.title,
            content_preview:
            s.content?.substring(0, 150) +
            (s.content?.length > 150 ? '...' : ''),
                              content_author: s.user?.username || 'Unknown',
                              content_url: `/games/${gameSlug}/maps/${mapSlug}/strategies/${s.id}`,
        }
                }
            } else if (report.content_type === 'comment') {
                const c = commentMap.get(report.content_id) as any
                if (c) {
                    const strategy = c.strategy as any
                    const gameSlug = strategy?.game?.slug || ''
                    const mapSlug = strategy?.map?.slug || ''
        return {
            ...report,
            content_title: `Comment on "${strategy?.title || 'Unknown'}"`,
            content_preview:
            c.content?.substring(0, 150) +
            (c.content?.length > 150 ? '...' : ''),
                              content_author: c.user?.username || 'Unknown',
                              content_url: strategy?.id
                              ? `/games/${gameSlug}/maps/${mapSlug}/strategies/${strategy.id}`
                              : null,
        }
                }
            } else if (report.content_type === 'strat') {
                const s = stratMap.get(report.content_id) as any
                if (s) {
                    return {
                        ...report,
                        content_title: s.title,
                        content_preview: 'Strat content',
                        content_author: s.user?.username || 'Unknown',
                        content_url: null,
                    }
                }
            }

            return {
                ...report,
                content_title: 'Content not found',
                content_preview: 'This content may have been deleted',
                content_author: 'Unknown',
                content_url: null,
            }
        })
    }

    async function handleResolve(
        reportId: string,
        status: 'resolved' | 'dismissed',
        note: string
    ) {
        setActionLoading(reportId)
        setModal(null)
        try {
            await resolveReport(reportId, {
                status,
                review_note: note,
                action_taken:
                status === 'resolved' ? 'Content reviewed' : 'No action taken',
            })
            // Update local state
            setReports(prev =>
            prev.map(r => (r.id === reportId ? { ...r, status } : r))
            )
        } catch (error) {
            alert('Failed to resolve report. Please try again.')
            console.error(error)
        } finally {
            setActionLoading(null)
        }
    }

    async function handleRemove(
        contentType: string,
        contentId: string,
        reportId: string,
        reason: string
    ) {
        setActionLoading(reportId)
        setModal(null)
        try {
            if (contentType === 'strategy') {
                await removeStrategy(contentId, reason)
            } else if (contentType === 'comment') {
                await removeComment(contentId, reason)
            } else if (contentType === 'strat') {
                await removeStrat(contentId, reason)
            }

            await resolveReport(reportId, {
                status: 'resolved',
                review_note: `Content removed: ${reason}`,
                action_taken: 'Content removed',
            })

            setReports(prev =>
            prev.map(r => (r.id === reportId ? { ...r, status: 'resolved' } : r))
            )
        } catch (error) {
            alert('Failed to remove content. Please try again.')
            console.error(error)
        } finally {
            setActionLoading(null)
        }
    }

    function formatDate(timestamp: string) {
        return new Date(timestamp).toLocaleString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        })
    }

    if (loading || !user || userRole !== 'admin') {
        return (
            <div className="min-h-screen flex items-center justify-center">
            <p className="text-xl">Loading...</p>
            </div>
        )
    }

    return (
        <div className="min-h-screen p-8">
        <div className="max-w-7xl mx-auto">

        {/* Modal */}
        {modal && (
            <NoteModal
            title={
                modal.type === 'remove'
                ? '🗑️ Enter reason for removal'
                : modal.type === 'resolve'
                ? '✅ Enter resolution note'
                : '❌ Enter dismissal reason'
            }
            onConfirm={note => {
                if (modal.type === 'remove') {
                    handleRemove(
                        modal.contentType!,
                        modal.contentId!,
                        modal.reportId,
                        note
                    )
                } else {
                    handleResolve(
                        modal.reportId,
                        modal.type === 'resolve' ? 'resolved' : 'dismissed',
                        note
                    )
                }
            }}
            onCancel={() => setModal(null)}
            />
        )}

        {/* Header */}
        <div className="flex justify-between items-center mb-6">
        <div>
        <h1 className="text-4xl font-bold">Reports</h1>
        <p className="text-gray-400 mt-1">
        Review and moderate reported content
        </p>
        </div>
        <a href="/admin" className="text-gray-400 hover:text-white transition">
        ← Back to Dashboard
        </a>
        </div>

        {/* Filter Buttons */}
        <div className="mb-6 flex gap-2 flex-wrap">
        {[
            { value: '', label: 'All' },
            { value: 'pending', label: '🟡 Pending' },
            { value: 'resolved', label: '🟢 Resolved' },
            { value: 'dismissed', label: '⚫ Dismissed' },
        ].map(f => (
            <button
            key={f.value}
            onClick={() => {
                setFilter(f.value)
                setCurrentPage(1)
            }}
            className={`px-4 py-2 rounded transition ${
                filter === f.value
                ? 'bg-blue-600 text-white'
                : 'bg-[#252525] border border-gray-700 hover:bg-[#333]'
            }`}
            >
            {f.label}
            </button>
        ))}
        </div>

        {/* Reports List */}
        {dataLoading ? (
            <div className="bg-[#252525] rounded-lg border border-gray-700 p-12 text-center">
            <p className="text-gray-400">Loading reports...</p>
            </div>
        ) : reports.length === 0 ? (
            <div className="bg-[#252525] p-12 rounded-lg border border-gray-700 text-center">
            <p className="text-xl text-gray-400">No reports found 🎉</p>
            <p className="text-gray-500 mt-2">
            {filter ? `No ${filter} reports at the moment.` : 'Nothing to review!'}
            </p>
            </div>
        ) : (
            <>
            <div className="space-y-6">
            {reports.map(report => (
                <div
                key={report.id}
                className="bg-[#252525] rounded-lg border border-gray-700 overflow-hidden"
                >
                {/* Report Header */}
                <div className="bg-[#1a1a1a] px-6 py-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                <span
                className={`px-3 py-1 rounded text-xs font-medium ${
                    report.status === 'pending'
                    ? 'bg-yellow-600'
                    : report.status === 'resolved'
                    ? 'bg-green-600'
                    : 'bg-gray-600'
                }`}
                >
                {report.status.toUpperCase()}
                </span>
                <span
                className={`px-3 py-1 rounded text-xs font-medium ${
                    report.content_type === 'strategy'
                    ? 'bg-purple-600'
                    : report.content_type === 'comment'
                    ? 'bg-blue-600'
                    : 'bg-orange-600'
                }`}
                >
                {report.content_type}
                </span>
                </div>
                <span className="text-sm text-gray-400">
                {formatDate(report.created_at)}
                </span>
                </div>

                {/* Report Body */}
                <div className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">

                {/* Reported Content */}
                <div className="bg-[#1a1a1a] p-4 rounded-lg">
                <h3 className="text-sm font-medium text-gray-400 mb-2">
                📄 Reported Content
                </h3>
                <p className="text-lg font-semibold mb-1">
                {report.content_title}
                </p>
                <p className="text-sm text-gray-400 mb-2">
                by {report.content_author}
                </p>
                <p className="text-sm text-gray-300 bg-[#252525] p-3 rounded italic">
                "{report.content_preview}"
                </p>
                {report.content_url && (
                    <a
                    href={report.content_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-block mt-3 text-blue-400 hover:text-blue-300 text-sm transition"
                    >
                    🔗 View Content →
                    </a>
                )}
                </div>

                {/* Report Details */}
                <div className="bg-[#1a1a1a] p-4 rounded-lg">
                <h3 className="text-sm font-medium text-gray-400 mb-2">
                🚩 Report Details
                </h3>
                <div className="space-y-3">
                <div>
                <span className="text-sm text-gray-400">
                Reported by:
                </span>
                <p className="font-medium">
                {report.reporter?.username || 'Unknown'}
                </p>
                </div>
                <div>
                <span className="text-sm text-gray-400">
                Reason:
                </span>
                <p className="font-medium capitalize">
                {report.reason}
                </p>
                </div>
                {report.description && (
                    <div>
                    <span className="text-sm text-gray-400">
                    Description:
                    </span>
                    <p className="text-gray-300 text-sm mt-1">
                    {report.description}
                    </p>
                    </div>
                )}
                </div>
                </div>
                </div>

                {/* Action Buttons — only show for pending */}
                {report.status === 'pending' && (
                    <div className="flex gap-3 flex-wrap pt-4 border-t border-gray-700">
                    <button
                    onClick={() =>
                        setModal({
                            type: 'remove',
                            reportId: report.id,
                            contentType: report.content_type,
                            contentId: report.content_id,
                        })
                    }
                    disabled={actionLoading === report.id}
                    className="bg-red-600 hover:bg-red-700 px-4 py-2 rounded text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed transition"
                    >
                    🗑️ Remove Content
                    </button>
                    <button
                    onClick={() =>
                        setModal({
                            type: 'resolve',
                            reportId: report.id,
                        })
                    }
                    disabled={actionLoading === report.id}
                    className="bg-green-600 hover:bg-green-700 px-4 py-2 rounded text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed transition"
                    >
                    ✅ Mark Resolved
                    </button>
                    <button
                    onClick={() =>
                        setModal({
                            type: 'dismiss',
                            reportId: report.id,
                        })
                    }
                    disabled={actionLoading === report.id}
                    className="bg-gray-600 hover:bg-gray-700 px-4 py-2 rounded text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed transition"
                    >
                    ❌ Dismiss
                    </button>
                    {report.content_url && (
                        <a
                        href={report.content_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded text-sm font-medium ml-auto transition"
                        >
                        👁️ View Content
                        </a>
                    )}
                    {actionLoading === report.id && (
                        <span className="text-sm text-gray-400 self-center">
                        Processing...
                        </span>
                    )}
                    </div>
                )}
                </div>
                </div>
            ))}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
                <div className="flex items-center justify-center gap-3 mt-8">
                <button
                onClick={() => setCurrentPage(p => p - 1)}
                disabled={currentPage === 1}
                className="px-4 py-2 bg-[#252525] border border-gray-700 rounded hover:bg-[#333] disabled:opacity-40 disabled:cursor-not-allowed transition"
                >
                ← Previous
                </button>
                <span className="text-gray-400">
                Page {currentPage} of {totalPages}
                </span>
                <button
                onClick={() => setCurrentPage(p => p + 1)}
                disabled={currentPage === totalPages}
                className="px-4 py-2 bg-[#252525] border border-gray-700 rounded hover:bg-[#333] disabled:opacity-40 disabled:cursor-not-allowed transition"
                >
                Next →
                </button>
                </div>
            )}
            </>
        )}
        </div>
        </div>
    )
}
