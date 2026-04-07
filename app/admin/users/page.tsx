'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import useAuth from '@/components/hooks/useAuth'
import { getAllUsers, updateUserRole } from '@/lib/admin'

export default function AdminUsers() {
    const { user, userRole, loading } = useAuth()
    const router = useRouter()
    const [users, setUsers] = useState<any[]>([])
    const [dataLoading, setDataLoading] = useState(true)

    useEffect(() => {
        if (!loading) {
            if (!user || userRole !== 'admin') {
                router.push('/')
            } else {
                loadUsers()
            }
        }
    }, [user, userRole, loading, router])

    async function loadUsers() {
        try {
            const data = await getAllUsers()
            setUsers(data)
        } catch (error) {
            console.error('Failed to load users:', error)
        } finally {
            setDataLoading(false)
        }
    }

    async function handleRoleChange(userId: string, newRole: 'user' | 'admin') {
        try {
            await updateUserRole(userId, newRole)
            loadUsers()
        } catch (error) {
            alert('Failed to update role')
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
        <h1 className="text-4xl font-bold">User Management</h1>
        <a href="/admin" className="text-gray-400 hover:text-white">
        ← Back to Dashboard
        </a>
        </div>

        {dataLoading ? (
            <p>Loading users...</p>
        ) : (
            <div className="bg-[#252525] rounded-lg border border-gray-700 overflow-hidden">
            <table className="w-full">
            <thead className="bg-[#1a1a1a]">
            <tr>
            <th className="px-6 py-3 text-left text-sm font-medium">Username</th>
            <th className="px-6 py-3 text-left text-sm font-medium">Current Role</th>
            <th className="px-6 py-3 text-left text-sm font-medium">Joined</th>
            <th className="px-6 py-3 text-left text-sm font-medium">Change Role</th>
            </tr>
            </thead>
            <tbody className="divide-y divide-gray-700">
            {users.map(u => (
                <tr key={u.id}>
                <td className="px-6 py-4">{u.username}</td>
                <td className="px-6 py-4">
                <span className={`px-3 py-1 rounded text-xs font-medium ${
                    u.role === 'admin' ? 'bg-red-600' : 'bg-gray-600'
                }`}>
                {u.role}
                </span>
                </td>
                <td className="px-6 py-4 text-sm text-gray-400">
                {new Date(u.created_at).toLocaleDateString()}
                </td>
                <td className="px-6 py-4">
                <select
                value={u.role}
                onChange={(e) => handleRoleChange(u.id, e.target.value as 'user' | 'admin')}
                className="bg-[#1a1a1a] border border-gray-600 rounded px-3 py-1 text-sm"
                >
                <option value="user">User</option>
                <option value="admin">Admin</option>
                </select>
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
