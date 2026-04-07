'use client'
import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import useAuth from '@/components/hooks/useAuth'
import { getAllGames, addGame, toggleGameActive, deleteGame } from '@/lib/admin'

interface AdminGame {
    id: string
    name: string
    slug: string
    genre: string | null
    description: string | null
    cover_image_url: string | null
    is_active: boolean
    created_at: string
}

export default function AdminGames() {
    const { user, userRole, loading } = useAuth()
    const router = useRouter()
    const hasFetched = useRef(false)
    const [games, setGames] = useState<AdminGame[]>([])
    const [dataLoading, setDataLoading] = useState(true)
    const [showAddForm, setShowAddForm] = useState(false)
    const [submitting, setSubmitting] = useState(false)
    const [togglingId, setTogglingId] = useState<string | null>(null)
    const [deletingId, setDeletingId] = useState<string | null>(null)
    const [currentPage, setCurrentPage] = useState(1)
    const [totalPages, setTotalPages] = useState(1)
    const [formError, setFormError] = useState<string | null>(null)
    const PAGE_SIZE = 50

    useEffect(() => {
        if (loading) return

            if (!user || userRole !== 'admin') {
                router.push('/')
                return
            }

            if (hasFetched.current) return
                hasFetched.current = true

                loadGames(1)
    }, [user, userRole, loading])

    useEffect(() => {
        if (!hasFetched.current) return
            loadGames(currentPage)
    }, [currentPage])

    async function loadGames(page: number) {
        setDataLoading(true)
        try {
            const result = await getAllGames(page, PAGE_SIZE)
            setGames(result.games as AdminGame[])
            setTotalPages(result.totalPages)
        } catch (error) {
            console.error('Failed to load games:', error)
        } finally {
            setDataLoading(false)
        }
    }

    async function handleAddGame(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault()
        setSubmitting(true)
        setFormError(null)

        const formData = new FormData(e.currentTarget)

        try {
            await addGame({
                name: formData.get('name') as string,
                          slug: formData.get('slug') as string,
                          description: (formData.get('description') as string) || undefined,
                          genre: (formData.get('genre') as string) || undefined,
                          cover_image_url: (formData.get('cover_image_url') as string) || undefined,
            })
            setShowAddForm(false)
            setCurrentPage(1)
            hasFetched.current = false
            loadGames(1)
            ;(e.target as HTMLFormElement).reset()
        } catch (error: any) {
            setFormError(error.message || 'Failed to add game')
        } finally {
            setSubmitting(false)
        }
    }

    async function handleToggle(gameId: string, currentStatus: boolean) {
        setTogglingId(gameId)
        try {
            await toggleGameActive(gameId, !currentStatus)
            setGames(prev =>
            prev.map(g =>
            g.id === gameId ? { ...g, is_active: !currentStatus } : g
            )
            )
        } catch (error) {
            alert('Failed to toggle game status. Please try again.')
            console.error(error)
        } finally {
            setTogglingId(null)
        }
    }

    async function handleDelete(gameId: string, gameName: string) {
        if (
            !confirm(
                `Delete "${gameName}"?\n\nThis cannot be undone and may affect existing strategies.`
            )
        )
            return

            setDeletingId(gameId)
            try {
                await deleteGame(gameId)
                setGames(prev => prev.filter(g => g.id !== gameId))
            } catch (error: any) {
                alert('Failed to delete: ' + error.message)
                console.error(error)
            } finally {
                setDeletingId(null)
            }
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

        {/* Header */}
        <div className="flex justify-between items-center mb-6">
        <div>
        <h1 className="text-4xl font-bold">Game Management</h1>
        <p className="text-gray-400 mt-1">Add and manage games on GGwiki</p>
        </div>
        <a href="/admin" className="text-gray-400 hover:text-white transition">
        ← Back to Dashboard
        </a>
        </div>

        {/* Add Game Button */}
        <button
        onClick={() => {
            setShowAddForm(!showAddForm)
            setFormError(null)
        }}
        className="mb-6 bg-green-600 hover:bg-green-700 px-6 py-3 rounded-lg font-medium transition"
        >
        {showAddForm ? '✕ Cancel' : '+ Add New Game'}
        </button>

        {/* Add Game Form */}
        {showAddForm && (
            <div className="bg-[#252525] p-6 rounded-lg border border-gray-700 mb-6">
            <h2 className="text-2xl font-semibold mb-4">Add New Game</h2>
            <form onSubmit={handleAddGame} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
            <label className="block text-sm font-medium mb-1">
            Name <span className="text-red-400">*</span>
            </label>
            <input
            name="name"
            required
            className="w-full bg-[#1a1a1a] border border-gray-600 rounded px-4 py-2 focus:outline-none focus:border-blue-500"
            placeholder="e.g. League of Legends"
            />
            </div>
            <div>
            <label className="block text-sm font-medium mb-1">
            Slug <span className="text-red-400">*</span>
            </label>
            <input
            name="slug"
            required
            className="w-full bg-[#1a1a1a] border border-gray-600 rounded px-4 py-2 focus:outline-none focus:border-blue-500"
            placeholder="e.g. league-of-legends"
            />
            </div>
            <div>
            <label className="block text-sm font-medium mb-1">
            Genre
            </label>
            <input
            name="genre"
            className="w-full bg-[#1a1a1a] border border-gray-600 rounded px-4 py-2 focus:outline-none focus:border-blue-500"
            placeholder="e.g. MOBA, FPS, RTS"
            />
            </div>
            <div>
            <label className="block text-sm font-medium mb-1">
            Cover Image URL
            </label>
            <input
            name="cover_image_url"
            className="w-full bg-[#1a1a1a] border border-gray-600 rounded px-4 py-2 focus:outline-none focus:border-blue-500"
            placeholder="https://..."
            />
            </div>
            </div>
            <div>
            <label className="block text-sm font-medium mb-1">
            Description
            </label>
            <textarea
            name="description"
            rows={3}
            className="w-full bg-[#1a1a1a] border border-gray-600 rounded px-4 py-2 focus:outline-none focus:border-blue-500"
            placeholder="Short description of the game..."
            />
            </div>

            {formError && (
                <div className="text-red-400 text-sm bg-red-900/20 p-3 rounded border border-red-800">
                ⚠️ {formError}
                </div>
            )}

            <button
            type="submit"
            disabled={submitting}
            className="bg-green-600 hover:bg-green-700 px-6 py-2 rounded font-medium disabled:opacity-50 disabled:cursor-not-allowed transition"
            >
            {submitting ? 'Adding...' : 'Add Game'}
            </button>
            </form>
            </div>
        )}

        {/* Games Table */}
        {dataLoading ? (
            <div className="bg-[#252525] rounded-lg border border-gray-700 p-12 text-center">
            <p className="text-gray-400">Loading games...</p>
            </div>
        ) : games.length === 0 ? (
            <div className="bg-[#252525] rounded-lg border border-gray-700 p-12 text-center">
            <p className="text-xl text-gray-400">No games found</p>
            <p className="text-gray-500 mt-2">Add your first game above!</p>
            </div>
        ) : (
            <>
            <div className="bg-[#252525] rounded-lg border border-gray-700 overflow-hidden">
            <table className="w-full">
            <thead className="bg-[#1a1a1a]">
            <tr>
            <th className="px-6 py-3 text-left text-sm font-medium text-gray-400">Game</th>
            <th className="px-6 py-3 text-left text-sm font-medium text-gray-400">Slug</th>
            <th className="px-6 py-3 text-left text-sm font-medium text-gray-400">Genre</th>
            <th className="px-6 py-3 text-left text-sm font-medium text-gray-400">Status</th>
            <th className="px-6 py-3 text-left text-sm font-medium text-gray-400">Actions</th>
            </tr>
            </thead>
            <tbody className="divide-y divide-gray-700">
            {games.map(game => (
                <tr key={game.id} className="hover:bg-[#2a2a2a] transition">
                <td className="px-6 py-4 font-medium">{game.name}</td>
                <td className="px-6 py-4 text-sm text-gray-400 font-mono">{game.slug}</td>
                <td className="px-6 py-4 text-sm text-gray-400">{game.genre || '—'}</td>
                <td className="px-6 py-4">
                <span className={`px-3 py-1 rounded text-xs font-medium ${game.is_active ? 'bg-green-600' : 'bg-red-600'}`}>
                {game.is_active ? 'Active' : 'Inactive'}
                </span>
                </td>
                <td className="px-6 py-4">
                <div className="flex gap-2">
                <button
                onClick={() => handleToggle(game.id, game.is_active)}
                disabled={togglingId === game.id || deletingId === game.id}
                className="bg-blue-600 hover:bg-blue-700 px-3 py-1 rounded text-sm disabled:opacity-50 disabled:cursor-not-allowed transition"
                >
                {togglingId === game.id ? '...' : game.is_active ? 'Deactivate' : 'Activate'}
                </button>
                <button
                onClick={() => handleDelete(game.id, game.name)}
                disabled={deletingId === game.id || togglingId === game.id}
                className="bg-red-600 hover:bg-red-700 px-3 py-1 rounded text-sm disabled:opacity-50 disabled:cursor-not-allowed transition"
                >
                {deletingId === game.id ? '...' : 'Delete'}
                </button>
                </div>
                </td>
                </tr>
            ))}
            </tbody>
            </table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
                <div className="flex items-center justify-center gap-3 mt-6">
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
