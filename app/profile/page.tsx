'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { toast } from 'sonner'
import { Badge } from '@/components/ui/badge'
import useAuth from '@/components/hooks/useAuth'
import { client } from '@/api/client'
import { Calendar, Eye, ShieldCheck, User } from 'lucide-react'

interface UserStrategy {
  id: string
  title: string
  view_count: number
  created_at: string
  gameName: string
  gameSlug: string
  mapName: string
  mapSlug: string
}

const ProfilePage = () => {
  const { user, profile, loading } = useAuth()
  const [pageLoading, setPageLoading] = useState(true)
  const [strategies, setStrategies] = useState<UserStrategy[]>([])
  const [totalViews, setTotalViews] = useState(0)
  const [editProfile, setEditProfile] = useState({ username: '' })
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'success' | 'error'>('idle')

  useEffect(() => {
    if (!profile) return
    setEditProfile({
      username: profile.username ?? ''
    })
  }, [profile])

  useEffect(() => {
    const fetchProfileData = async () => {
      if (!user) return

      setPageLoading(true)
      try {
        const { data: strategyRows, error: strategyError } = await client
          .from('strategies')
          .select('id, title, view_count, created_at, game:game_id (name, slug), map:map_id (name, slug)')
          .eq('user_id', user.id)
          .eq('is_removed', false)
          .eq('status', 'published')
          .order('created_at', { ascending: false })

        if (strategyError) throw strategyError

        const formattedStrategies: UserStrategy[] = (strategyRows || []).map((strategy: any) => ({
          id: strategy.id,
          title: strategy.title,
          view_count: strategy.view_count || 0,
          created_at: strategy.created_at,
          gameName: Array.isArray(strategy.game) ? strategy.game[0]?.name || 'Unknown' : strategy.game?.name || 'Unknown',
          gameSlug: Array.isArray(strategy.game) ? strategy.game[0]?.slug || 'unknown-game' : strategy.game?.slug || 'unknown-game',
          mapName: Array.isArray(strategy.map) ? strategy.map[0]?.name || 'Unknown' : strategy.map?.name || 'Unknown',
          mapSlug: Array.isArray(strategy.map) ? strategy.map[0]?.slug || 'unknown-map' : strategy.map?.slug || 'unknown-map'
        }))

        setStrategies(formattedStrategies)
        setTotalViews((strategyRows || []).reduce((sum: number, strat: any) => sum + (strat.view_count || 0), 0))
      } catch (error) {
        console.error('Failed to load profile content:', error)
        toast.error('Unable to load profile content. Refresh to try again.')
      } finally {
        setPageLoading(false)
      }
    }

    fetchProfileData()
  }, [user])

  const initials = useMemo(() => {
    if (!profile?.username) return 'U'
    return profile.username
      .split(' ')
      .map(part => part[0]?.toUpperCase())
      .slice(0, 2)
      .join('')
  }, [profile])

  const profileCreatedDate = profile
    ? new Date(profile.created_at).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      })
    : ''

  const displayUsername = editProfile.username || profile?.username || 'Profile'

  const handleSave = async () => {
    if (!user) return
    setSaveStatus('saving')

    try {
      // Update profile username
      if (editProfile.username?.trim()) {
        const { error: profileError } = await client
          .from('profiles')
          .update({ username: editProfile.username.trim() })
          .eq('id', user.id)
          .single()

        if (profileError) throw profileError
      }

      // Update password only if provided
      if (password) {
        if (password !== confirmPassword) {
          toast.error('Passwords do not match')
          setSaveStatus('error')
          return
        }

        // Supabase auth update
        const { error: authError } = await (client as any).auth.updateUser({ password })
        if (authError) throw authError
      }

      toast.success('Profile updated successfully')
      setSaveStatus('success')
      setPassword('')
      setConfirmPassword('')
    } catch (err) {
      console.error('Profile update failed', err)
      toast.error('Could not update your profile. Try again.')
      setSaveStatus('error')
    }
  }

  // removed old save function that used bio

  if (loading || pageLoading) {
    return (
      <main className="min-h-screen bg-[#070707] p-8 text-white">
        <div className="mx-auto max-w-6xl space-y-6">
          <div className="animate-pulse rounded-3xl bg-gray-850 p-8" style={{ minHeight: 420 }} />
          <div className="grid gap-6 md:grid-cols-3">
            {[...Array(3)].map((_, index) => (
              <div key={index} className="animate-pulse rounded-3xl bg-gray-850 p-6 h-40" />
            ))}
          </div>
        </div>
      </main>
    )
  }

  if (!user || !profile) {
    return (
      <main className="min-h-screen bg-[#070707] p-8 text-white">
        <div className="mx-auto max-w-4xl rounded-3xl border border-gray-800 bg-gray-950 p-12 text-center">
          <h1 className="text-3xl font-semibold">Profile</h1>
          <p className="mt-4 text-gray-400">Sign in to view and edit your profile.</p>
          <Link href="/registration" className="mt-6 inline-flex rounded-full bg-indigo-600 px-6 py-3 text-white transition hover:bg-indigo-500">
            Sign in or register
          </Link>
        </div>
      </main>
    )
  }

  return (
    <div className="min-h-screen bg-[#070707] text-white">
      <div className="flex">
        {/* Sidebar */}
        <aside className="w-56 border-r border-gray-800 bg-[#0b0b0b] p-6">
          <div className="mb-8 text-2xl font-bold">GGWIKI</div>
          <nav className="space-y-2 text-sm text-gray-300">
            <Link href={`/dashboard/${user?.id ?? ''}`} className="block rounded-md px-3 py-2 hover:bg-gray-900">Dashboard</Link>
            <Link href={`/dashboard/${user?.id ?? ''}/gallery`} className="block rounded-md px-3 py-2 hover:bg-gray-900">Gallery</Link>
            <Link href="/games" className="block rounded-md px-3 py-2 hover:bg-gray-900">Games</Link>
            <Link href="/projects" className="block rounded-md px-3 py-2 hover:bg-gray-900">Create</Link>
          </nav>
        </aside>

        <main className="flex-1 p-8">
          <div className="mx-auto max-w-6xl space-y-8">
            <header className="mb-6">
              <h1 className="text-3xl font-semibold">Account Settings</h1>
              <p className="text-sm text-gray-400">Manage your username and password</p>
            </header>
        <section className="rounded-3xl border border-gray-800 bg-gray-950 p-8 shadow-xl">
          <div className="flex flex-col gap-8 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex items-center gap-6">
              <div className="relative flex h-28 w-28 items-center justify-center overflow-hidden rounded-full bg-indigo-600 text-4xl font-semibold text-white">
                {profile.avatar_url?.trim() ? (
                  <Image
                    src={profile.avatar_url.trim()}
                    alt={profile.username}
                    fill
                    className="object-cover"
                  />
                ) : (
                  <span>{initials}</span>
                )}
              </div>
              <div>
                <div className="flex flex-wrap items-center gap-3">
                  <h1 className="text-4xl font-bold tracking-tight">{displayUsername}</h1>
                  <Badge className="bg-indigo-600 text-white">{profile.role}</Badge>
                </div>
                <div className="mt-4 flex flex-wrap gap-4 text-sm text-gray-400">
                  <span className="inline-flex items-center gap-2">
                    <User size={16} /> {user.email}
                  </span>
                  <span className="inline-flex items-center gap-2">
                    <Calendar size={16} /> Member since {profileCreatedDate}
                  </span>
                  <span className="inline-flex items-center gap-2">
                    <ShieldCheck size={16} /> {user.email_confirmed_at ? 'Verified account' : 'Unverified account'}
                  </span>
                </div>
              </div>
            </div>
            <div className="grid w-full gap-4 sm:grid-cols-2 lg:w-auto lg:grid-cols-1">
              <div className="rounded-3xl border border-gray-800 bg-gray-900 p-6">
                <p className="text-sm uppercase tracking-[0.2em] text-gray-500">Published strategies</p>
                <p className="mt-4 text-4xl font-semibold text-white">{strategies.length}</p>
              </div>
              <div className="rounded-3xl border border-gray-800 bg-gray-900 p-6">
                <p className="text-sm uppercase tracking-[0.2em] text-gray-500">Total views</p>
                <p className="mt-4 text-4xl font-semibold text-white">{totalViews}</p>
              </div>
            </div>
          </div>
        </section>

        <section className="grid gap-6 lg:grid-cols-2">
          <div className="rounded-3xl border border-gray-800 bg-gray-950 p-6">
            <div className="mb-6 flex items-center justify-between gap-4">
              <div>
                <p className="text-sm uppercase tracking-[0.2em] text-gray-500">Profile settings</p>
                <h2 className="mt-2 text-2xl font-semibold text-white">Account information</h2>
              </div>
            </div>
            <div className="space-y-6">
              <div>
                <label className="mb-2 block text-sm font-medium text-gray-300">Username</label>
                <input
                  value={editProfile.username}
                  onChange={event => setEditProfile(prev => ({ ...prev, username: event.target.value }))}
                  className="w-full rounded-3xl border border-gray-800 bg-gray-900 px-4 py-3 text-white outline-none focus:border-indigo-500"
                />
              </div>
              <div>
                <label className="mb-2 block text-sm font-medium text-gray-300">Email</label>
                <input
                  type="email"
                  value={user.email ?? ''}
                  readOnly
                  className="w-full rounded-3xl border border-gray-800 bg-gray-900 px-4 py-3 text-white outline-none focus:border-indigo-500"
                />
              </div>
              <div>
                <label className="mb-2 block text-sm font-medium text-gray-300">New password</label>
                <input
                  type="password"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="Leave blank to keep current password"
                  className="w-full rounded-3xl border border-gray-800 bg-gray-900 px-4 py-3 text-white outline-none focus:border-indigo-500"
                />
              </div>
              <div>
                <label className="mb-2 block text-sm font-medium text-gray-300">Confirm password</label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={e => setConfirmPassword(e.target.value)}
                  placeholder="Confirm new password"
                  className="w-full rounded-3xl border border-gray-800 bg-gray-900 px-4 py-3 text-white outline-none focus:border-indigo-500"
                />
              </div>
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={handleSave}
                  disabled={saveStatus === 'saving'}
                  className="inline-flex items-center justify-center rounded-full bg-indigo-600 px-6 py-3 text-sm font-semibold text-white transition hover:bg-indigo-500 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {saveStatus === 'saving' ? 'Saving…' : 'Save changes'}
                </button>
                {saveStatus === 'success' && <span className="text-sm text-emerald-400">Saved</span>}
                {saveStatus === 'error' && <span className="text-sm text-rose-400">Save failed</span>}
              </div>
            </div>
          </div>

          <div className="rounded-3xl border border-gray-800 bg-gray-950 p-6">
            <div className="mb-6 flex items-center justify-between gap-4">
              <div>
                <p className="text-sm uppercase tracking-[0.2em] text-gray-500">Your strategies</p>
                <h2 className="mt-2 text-2xl font-semibold text-white">Latest published strats</h2>
              </div>
              <Link href={`/dashboard/${user?.id ?? ''}`} className="text-sm text-indigo-400 hover:text-indigo-300">
                Manage strategies
              </Link>
            </div>
            {strategies.length === 0 ? (
              <div className="rounded-3xl border border-dashed border-gray-700 bg-gray-900 p-8 text-center text-gray-400">
                No published strategies yet. Create one to start contributing.
              </div>
            ) : (
              <div className="space-y-4">
                {strategies.slice(0, 6).map(strategy => (
                  <Link
                    key={strategy.id}
                    href={`/games/${strategy.gameSlug}/maps/${strategy.mapSlug}/strategies/${strategy.id}`}
                    className="block rounded-3xl border border-gray-800 bg-gray-900 p-4 transition hover:border-indigo-500"
                  >
                    <div className="flex items-center justify-between gap-4">
                      <div>
                        <h3 className="text-lg font-semibold text-white">{strategy.title}</h3>
                        <p className="mt-1 text-sm text-gray-400">{strategy.gameName} · {strategy.mapName}</p>
                      </div>
                      <span className="rounded-full bg-gray-800 px-3 py-1 text-xs uppercase tracking-[0.2em] text-gray-400">{strategy.view_count} views</span>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </section>
          </div>
        </main>
      </div>
    </div>
  )
}

export default ProfilePage
