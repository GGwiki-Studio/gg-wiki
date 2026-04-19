'use client'

import { useEffect, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { client } from '@/api/client'

interface ActivityItem {
  id: string
  title: string
  thumbnailUrl: string
  author: string
  gameName: string
  gameSlug: string
  mapSlug: string
  timeAgo: string
  views: number
}

function getTimeAgo(timestamp: string): string {
  const now = Date.now()
  const then = new Date(timestamp).getTime()
  const diffMs = now - then

  const minutes = Math.floor(diffMs / 60000)
  if (minutes < 60) return `${minutes}m ago`

  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}h ago`

  const days = Math.floor(hours / 24)
  if (days < 7) return `${days}d ago`

  const weeks = Math.floor(days / 7)
  return `${weeks}w ago`
}

const LatestActivity = () => {
  const [items, setItems] = useState<ActivityItem[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchActivity = async () => {
      try {
        const { data: activeGames, error: gamesError } = await client
          .from('games')
          .select('id')
          .eq('is_active', true)

        if (gamesError) throw gamesError

        const activeGameIds = activeGames?.map(g => g.id) || []

        const { data, error } = await client
          .from('strategies')
          .select(`
            id,
            title,
            thumbnail_url,
            view_count,
            created_at,
            user:user_id ( username ),
            game:game_id ( name, slug ),
            map:map_id ( name, slug )
          `)
          .eq('is_removed', false)
          .eq('status', 'published')
          .in('game_id', activeGameIds)
          .order('created_at', { ascending: false })
          .limit(6)

        if (error) throw error

        const formatted: ActivityItem[] = (data || []).map((strat: any) => {
          const user = Array.isArray(strat.user) ? strat.user[0] : strat.user
          const game = Array.isArray(strat.game) ? strat.game[0] : strat.game
          const map = Array.isArray(strat.map) ? strat.map[0] : strat.map

          return {
            id: strat.id,
            title: strat.title,
            thumbnailUrl: strat.thumbnail_url,
            author: user?.username || 'Unknown',
            gameName: game?.name || 'Unknown',
            gameSlug: game?.slug || '',
            mapSlug: map?.slug || '',
            timeAgo: getTimeAgo(strat.created_at),
            views: strat.view_count || 0,
          }
        })

        setItems(formatted)
      } catch (err) {
        console.error('Failed to fetch latest activity:', err)
      } finally {
        setLoading(false)
      }
    }

    fetchActivity()
  }, [])

  if (loading) {
    return (
      <div className="flex flex-col gap-2">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="animate-pulse flex gap-3 items-center bg-[#2a2a2a] rounded-lg p-2.5 border border-[#353535]">
            <div className="w-16 h-11 bg-[#353535] rounded shrink-0" />
            <div className="flex-1 space-y-1.5">
              <div className="h-3.5 bg-[#353535] rounded w-3/4" />
              <div className="h-2.5 bg-[#353535] rounded w-1/2" />
            </div>
          </div>
        ))}
      </div>
    )
  }

  if (items.length === 0) {
    return <p className="text-sm text-[#666] py-4">No recent activity yet.</p>
  }

  return (
    <div className="flex flex-col gap-2">
      {items.map((item) => (
        <Link
          key={item.id}
          href={`/games/${item.gameSlug}/maps/${item.mapSlug}/strategies/${item.id}`}
          className="flex gap-3 items-center bg-[#2a2a2a] rounded-lg p-2.5 border border-[#353535] hover:border-[#4a4a4a] transition-colors"
        >
          <div className="relative w-16 h-11 rounded overflow-hidden shrink-0 bg-[#353535]">
            {item.thumbnailUrl && (
              <Image
                src={item.thumbnailUrl}
                alt={item.title}
                fill
                className="object-cover"
                sizes="64px"
              />
            )}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-medium text-[#ddd] truncate">
              {item.title} — {item.gameName}
            </p>
            <p className="text-[11px] text-[#777] mt-0.5">
              {item.author} · {item.timeAgo} · {item.views} views
            </p>
          </div>
        </Link>
      ))}
    </div>
  )
}

export default LatestActivity