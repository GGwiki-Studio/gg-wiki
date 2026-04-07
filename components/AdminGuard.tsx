'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import useAuth from '@/components/hooks/useAuth'

interface AdminGuardProps {
    children: React.ReactNode
    requireRole?: 'admin' | 'moderator'
}

export default function AdminGuard({ children, requireRole }: AdminGuardProps) {
    const { user, userRole, loading } = useAuth()
    const router = useRouter()
    const [allowed, setAllowed] = useState(false)

    useEffect(() => {
        if (!loading) {
            if (!user) {
                router.push('/')
                return
            }

            if (requireRole === 'admin' && userRole !== 'admin') {
                router.push('/')
                return
            }

            if (!requireRole && userRole !== 'admin' && userRole !== 'moderator') {
                router.push('/')
                return
            }

            setAllowed(true)
        }
    }, [user, userRole, loading, router, requireRole])

    if (loading || !allowed) {
        return (
            <div className="min-h-screen flex items-center justify-center">
            <p className="text-xl">Loading...</p>
            </div>
        )
    }

    return <>{children}</>
}
