'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import useAuth from '@/components/hooks/useAuth'
import { getAllUsers, getAllGames, getReports } from '@/lib/admin'

export default function AdminDashboard() {
    const { user, userRole, loading } = useAuth()
    const router = useRouter()
    const [stats, setStats] = useState({
        users: 0,
        games: 0,
        pendingReports: 0,
    })
    const [dataLoading, setDataLoading] = useState(true)

    useEffect(() => {
        if (!loading) {
            if (!user || userRole !== 'admin') {
                router.push('/')
            } else {
                loadStats()
            }
        }
    }, [user, userRole, loading, router])

    async function loadStats() {
        try {
            const [usersResult, gamesResult, reportsResult] = await Promise.all([
                getAllUsers(1, 1),
                                                                                getAllGames(1, 1),
                                                                                getReports('pending', 1, 1),
            ])
            setStats({
                users: usersResult.total,
                games: gamesResult.total,
                pendingReports: reportsResult.total,
            })
        } catch (error) {
            console.error('Failed to load stats:', error)
        } finally {
            setDataLoading(false)
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
        <h1 className="text-4xl font-bold mb-2">Admin Dashboard</h1>
        <p className="text-gray-400 mb-8">
        Logged in as{' '}
        <span className="text-white">{user?.email}</span> — Role:{' '}
        <span className="text-red-400 font-semibold">{userRole}</span>
        </p>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-[#252525] p-6 rounded-lg border border-gray-700">
        <h2 className="text-lg text-gray-400 mb-1">Total Users</h2>
        <p className="text-3xl font-bold">
        {dataLoading ? '—' : stats.users}
        </p>
        </div>
        <div className="bg-[#252525] p-6 rounded-lg border border-gray-700">
        <h2 className="text-lg text-gray-400 mb-1">Games</h2>
        <p className="text-3xl font-bold">
        {dataLoading ? '—' : stats.games}
        </p>
        </div>
        <div className="bg-[#252525] p-6 rounded-lg border border-gray-700">
        <h2 className="text-lg text-gray-400 mb-1">Pending Reports</h2>
        <p className="text-3xl font-bold text-yellow-400">
        {dataLoading ? '—' : stats.pendingReports}
        </p>
        </div>
        </div>

        {/* Quick Actions */}
        <div className="bg-[#252525] p-6 rounded-lg border border-gray-700">
        <h2 className="text-2xl font-semibold mb-4">Quick Actions</h2>
        <div className="flex gap-4 flex-wrap">
        <a
        href="/admin/users"
        className="bg-blue-600 hover:bg-blue-700 px-6 py-3 rounded-lg font-medium transition"
        >
        👥 Manage Users
        </a>
        <a
        href="/admin/games"
        className="bg-green-600 hover:bg-green-700 px-6 py-3 rounded-lg font-medium transition"
        >
        🎮 Manage Games
        </a>
        <a
        href="/admin/reports"
        className="bg-red-600 hover:bg-red-700 px-6 py-3 rounded-lg font-medium transition"
        >
        🚩 Reports{' '}
        {stats.pendingReports > 0 && `(${stats.pendingReports})`}
        </a>
        </div>
        </div>
        </div>
        </div>
    )
}
