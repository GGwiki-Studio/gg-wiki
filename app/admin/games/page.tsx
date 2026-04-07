'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import useAuth from '@/components/hooks/useAuth'
import { getAllGames, addGame, toggleGameActive, deleteGame } from '@/lib/admin'

export default function AdminGames() {
    const { user, userRole, loading } = useAuth()
    const router = useRouter()
    const [games, setGames] = useState<any[]>([])
    const [dataLoading, setDataLoading] = useState(true)
    const [showAddForm, setShowAddForm] = useState(false)

    useEffect(() => {
        if (!loading) {
            if (!user || userRole !== 'admin') {
                router.push('/')
            } else {
                loadGames()
            }
        }
    }, [user, userRole, loading, router])

    async function loadGames() {
        try {
            const data = await getAllGames()
            setGames(data)
        } catch (error) {
            console.error('Failed to load games:', error)
        } finally {
            setDataLoading(false)
        }
    }

    async function handleAddGame(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault()
        const formData = new FormData(e.currentTarget)

        try {
            await addGame({
                name: formData.get('name') as string,
                          slug: formData.get('slug') as string,
                          description: formData.get('description') as string || undefined,
                          genre: formData.get('genre') as string || undefined,
                          cover_image_url: formData.get('cover_image_url') as string || undefined,
            })
            setShowAddForm(false)
            loadGames()
        } catch (error: any) {
            alert('Failed to add game: ' + error.message)
        }
    }

    async function handleToggle(gameId: string, currentStatus: boolean) {
        try {
            await toggleGameActive(gameId, !currentStatus)
            loadGames()
        } catch (error) {
            alert('Failed to toggle game')
        }
    }

    async function handleDelete(gameId: string, gameName: string) {
        if (!confirm(`Delete "${gameName}"? This cannot be undone!`)) return

            try {
                await deleteGame(gameId)
                loadGames()
            } catch (error: any) {
                alert('Failed to delete: ' + error.message)
            }
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
        <h1 className="text-4xl font-bold">Game Management</h1>
        <a href="/admin" className="text-gray-400 hover:text-white">
        ← Back to Dashboard
        </a>
        </div>

        <button
        onClick={() => setShowAddForm(!showAddForm)}
        className="mb-6 bg-green-600 hover:bg-green-700 px-6 py-3 rounded-lg font-medium"
        >
        {showAddForm ? '✕ Cancel' : '+ Add New Game'}
        </button>

        {showAddForm && (
            <div className="bg-[#252525] p-6 rounded-lg border border-gray-700 mb-6">
            <h2 className="text-2xl font-semibold mb-4">Add New Game</h2>
            <form onSubmit={handleAddGame} className="space-y-4">
            <div>
            <label className="block text-sm font-medium mb-1">Name *</label>
            <input
            name="name"
            required
            className="w-full bg-[#1a1a1a] border border-gray-600 rounded px-4 py-2"
            placeholder="e.g. League of Legends"
            />
            </div>
            <div>
            <label className="block text-sm font-medium mb-1">Slug *</label>
            <input
            name="slug"
            required
            className="w-full bg-[#1a1a1a] border border-gray-600 rounded px-4 py-2"
            placeholder="e.g. league-of-legends"
            />
            </div>
            <div>
            <label className="block text-sm font-medium mb-1">Genre</label>
            <input
            name="genre"
            className="w-full bg-[#1a1a1a] border border-gray-600 rounded px-4 py-2"
            placeholder="e.g. MOBA"
            />
            </div>
            <div>
            <label className="block text-sm font-medium mb-1">Cover Image URL</label>
            <input
            name="cover_image_url"
            className="w-full bg-[#1a1a1a] border border-gray-600 rounded px-4 py-2"
            placeholder="https://..."
            />
            </div>
            <div>
            <label className="block text-sm font-medium mb-1">Description</label>
            <textarea
            name="description"
            rows={3}
            className="w-full bg-[#1a1a1a] border border-gray-600 rounded px-4 py-2"
            />
            </div>
            <button type="submit" className="bg-green-600 hover:bg-green-700 px-6 py-2 rounded">
            Add Game
            </button>
            </form>
            </div>
        )}

        {dataLoading ? (
            <p>Loading games...</p>
        ) : (
            <div className="bg-[#252525] rounded-lg border border-gray-700 overflow-hidden">
            <table className="w-full">
            <thead className="bg-[#1a1a1a]">
            <tr>
            <th className="px-6 py-3 text-left text-sm font-medium">Game</th>
            <th className="px-6 py-3 text-left text-sm font-medium">Slug</th>
            <th className="px-6 py-3 text-left text-sm font-medium">Status</th>
            <th className="px-6 py-3 text-left text-sm font-medium">Actions</th>
            </tr>
            </thead>
            <tbody className="divide-y divide-gray-700">
            {games.map(game => (
                <tr key={game.id}>
                <td className="px-6 py-4 font-medium">{game.name}</td>
                <td className="px-6 py-4 text-sm text-gray-400">{game.slug}</td>
                <td className="px-6 py-4">
                <span className={`px-3 py-1 rounded text-xs ${
                    game.is_active ? 'bg-green-600' : 'bg-red-600'
                }`}>
                {game.is_active ? 'Active' : 'Inactive'}
                </span>
                </td>
                <td className="px-6 py-4">
                <div className="flex gap-2">
                <button
                onClick={() => handleToggle(game.id, game.is_active)}
                className="bg-blue-600 hover:bg-blue-700 px-3 py-1 rounded text-sm"
                >
                {game.is_active ? 'Deactivate' : 'Activate'}
                </button>
                <button
                onClick={() => handleDelete(game.id, game.name)}
                className="bg-red-600 hover:bg-red-700 px-3 py-1 rounded text-sm"
                >
                Delete
                </button>
                </div>
                </td>
                </tr>
            ))}
            </tbody>
            </table>
            </div>
        )}
        </div>
        </div>
    )
}
