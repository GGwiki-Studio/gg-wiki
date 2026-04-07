'use client'
import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import useAuth from '@/components/hooks/useAuth'
import { getAllUsers, updateUserRole } from '@/lib/admin'

interface AdminUser {
    id: string
    username: string
    avatar_url: string | null
    role: 'user' | 'admin'
    created_at: string
}

export default function AdminUsers() {
    const { user, userRole, loading } = useAuth()
    const router = useRouter()
    const hasFetched = useRef(false)
    const [users, setUsers] = useState<AdminUser[]>([])
    const [dataLoading, setDataLoading] = useState(true)
    const [currentPage, setCurrentPage] = useState(1)
    const [totalPages, setTotalPages] = useState(1)
    const [updatingId, setUpdatingId] = useState<string | null>(null)
    const PAGE_SIZE = 50

    useEffect(() => {
        if (loading) return

            if (!user || userRole !== 'admin') {
                router.push('/')
                return
            }

            if (hasFetched.current) return
                hasFetched.current = true

                loadUsers(1)
    }, [user, userRole, loading]) // no router

    useEffect(() => {
        if (!hasFetched.current) return
            loadUsers(currentPage)
    }, [currentPage])

    async function loadUsers(page: number) {
        setDataLoading(true)
        try {
            const result = await getAllUsers(page, PAGE_SIZE)
            setUsers(result.users as AdminUser[])
            setTotalPages(result.totalPages)
        } catch (error) {
            console.error('Failed to load users:', error)
        } finally {
            setDataLoading(false)
        }
    }

    async function handleRoleChange(userId: string, newRole: 'user' | 'admin') {
        if (userId === user?.id && newRole === 'user') {
            alert('⚠️ You cannot demote yourself! Ask another admin to do this.')
            loadUsers(currentPage)
            return
        }

        setUpdatingId(userId)
        try {
            await updateUserRole(userId, newRole)
            setUsers(prev =>
            prev.map(u => (u.id === userId ? { ...u, role: newRole } : u))
            )
        } catch (error) {
            alert('Failed to update role. Please try again.')
            console.error(error)
        } finally {
            setUpdatingId(null)
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
        <h1 className="text-4xl font-bold">User Management</h1>
        <p className="text-gray-400 mt-1">
        Manage user roles and permissions
        </p>
        </div>
        <a href="/admin" className="text-gray-400 hover:text-white transition">
        ← Back to Dashboard
        </a>
        </div>

        {dataLoading ? (
            <div className="bg-[#252525] rounded-lg border border-gray-700 p-12 text-center">
            <p className="text-gray-400">Loading users...</p>
            </div>
        ) : (
            <>
            <div className="bg-[#252525] rounded-lg border border-gray-700 overflow-hidden">
            <table className="w-full">
            <thead className="bg-[#1a1a1a]">
            <tr>
            <th className="px-6 py-3 text-left text-sm font-medium text-gray-400">
            Username
            </th>
            <th className="px-6 py-3 text-left text-sm font-medium text-gray-400">
            Current Role
            </th>
            <th className="px-6 py-3 text-left text-sm font-medium text-gray-400">
            Joined
            </th>
            <th className="px-6 py-3 text-left text-sm font-medium text-gray-400">
            Change Role
            </th>
            </tr>
            </thead>
            <tbody className="divide-y divide-gray-700">
            {users.map(u => (
                <tr
                key={u.id}
                className={u.id === user?.id ? 'bg-blue-900/10' : ''}
                >
                <td className="px-6 py-4">
                <div className="flex items-center gap-2">
                <span>{u.username}</span>
                {u.id === user?.id && (
                    <span className="text-xs bg-blue-600 px-2 py-0.5 rounded">
                    You
                    </span>
                )}
                </div>
                </td>
                <td className="px-6 py-4">
                <span
                className={`px-3 py-1 rounded text-xs font-medium ${
                    u.role === 'admin'
                    ? 'bg-red-600'
                    : 'bg-gray-600'
                }`}
                >
                {u.role}
                </span>
                </td>
                <td className="px-6 py-4 text-sm text-gray-400">
                {new Date(u.created_at).toLocaleDateString()}
                </td>
                <td className="px-6 py-4">
                {updatingId === u.id ? (
                    <span className="text-sm text-gray-400">
                    Updating...
                    </span>
                ) : (
                    <select
                    value={u.role}
                    onChange={e =>
                        handleRoleChange(
                            u.id,
                            e.target.value as 'user' | 'admin'
                        )
                    }
                    disabled={updatingId !== null}
                    className="bg-[#1a1a1a] border border-gray-600 rounded px-3 py-1 text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                    <option value="user">User</option>
                    <option value="admin">Admin</option>
                    </select>
                )}
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
