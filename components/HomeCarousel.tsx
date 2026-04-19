'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { client } from '@/api/client'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import useAuth from './hooks/useAuth'

interface CarouselGame {
  slug: string
  name: string
  cover_image_url: string
}

const MAX_SLOTS = 7
const CARD_W = 160
const CARD_W_ACTIVE = 200
const CARD_H = 215
const CARD_H_ACTIVE = 270
const GAP = 16
const STEP = CARD_W + GAP

const HomeCarousel = () => {
  const [games, setGames] = useState<CarouselGame[]>([])
  const [activeIndex, setActiveIndex] = useState(0)
  const [scrollX, setScrollX] = useState(0)
  const containerRef = useRef<HTMLDivElement>(null)
  const isDragging = useRef(false)
  const dragStartX = useRef(0)
  const dragStartScroll = useRef(0)
  const hasDragged = useRef(false)

  const auth = useAuth()
  const user = auth?.user

  useEffect(() => {
    const fetchJoinedGames = async () => {
      if (!user) {
        setGames([])
        return
      }

      try {
        const { data, error } = await client
          .from('profile_games')
          .select(`
            game_id,
            game:game_id (
              slug,
              name,
              cover_image_url
            )
          `)
          .eq('profile_id', user.id)
          .limit(MAX_SLOTS)

        if (error) throw error

        const joined: CarouselGame[] = (data || [])
          .map((row: any) => {
            const game = Array.isArray(row.game) ? row.game[0] : row.game
            if (!game) return null
            return {
              slug: game.slug,
              name: game.name,
              cover_image_url: game.cover_image_url,
            }
          })
          .filter(Boolean) as CarouselGame[]

        setGames(joined)

        if (joined.length > 0) {
          const mid = Math.floor(joined.length / 2)
          setActiveIndex(mid)
          setScrollX(mid * STEP)
        }
      } catch (err) {
        console.error('Failed to fetch joined games:', err)
        setGames([])
      }
    }

    fetchJoinedGames()
  }, [user])

  // Live update when join/leave happens
  useEffect(() => {
    const handleChange = () => {
      if (!user) return
      client
        .from('profile_games')
        .select('game_id, game:game_id (slug, name, cover_image_url)')
        .eq('profile_id', user.id)
        .limit(MAX_SLOTS)
        .then(({ data }) => {
          const joined = (data || [])
            .map((row: any) => {
              const game = Array.isArray(row.game) ? row.game[0] : row.game
              if (!game) return null
              return { slug: game.slug, name: game.name, cover_image_url: game.cover_image_url }
            })
            .filter(Boolean) as CarouselGame[]
          setGames(joined)
        })
    }

    window.addEventListener('game-membership-changed', handleChange)
    return () => window.removeEventListener('game-membership-changed', handleChange)
  }, [user])

  const emptySlots = MAX_SLOTS - games.length
  const totalItems = MAX_SLOTS

  const scrollToIndex = useCallback((index: number) => {
    const clamped = Math.max(0, Math.min(totalItems - 1, index))
    setScrollX(clamped * STEP)
    setActiveIndex(clamped)
  }, [totalItems])

  const getActiveFromScroll = useCallback((sx: number) => {
    const raw = Math.round(sx / STEP)
    return Math.max(0, Math.min(totalItems - 1, raw))
  }, [totalItems])

  const navigate = (dir: number) => scrollToIndex(activeIndex + dir)

  const onMouseDown = (e: React.MouseEvent) => {
    isDragging.current = true; hasDragged.current = false
    dragStartX.current = e.clientX; dragStartScroll.current = scrollX
  }
  const onMouseMove = (e: React.MouseEvent) => {
    if (!isDragging.current) return
    const dx = e.clientX - dragStartX.current
    if (Math.abs(dx) > 5) hasDragged.current = true
    const maxScroll = Math.max(0, (totalItems - 1) * STEP)
    setScrollX(Math.max(0, Math.min(maxScroll, dragStartScroll.current - dx)))
  }
  const onMouseUp = () => {
    if (!isDragging.current) return
    isDragging.current = false
    scrollToIndex(getActiveFromScroll(scrollX))
  }

  const onTouchStart = (e: React.TouchEvent) => {
    isDragging.current = true; hasDragged.current = false
    dragStartX.current = e.touches[0].clientX; dragStartScroll.current = scrollX
  }
  const onTouchMove = (e: React.TouchEvent) => {
    if (!isDragging.current) return
    const dx = e.touches[0].clientX - dragStartX.current
    if (Math.abs(dx) > 5) hasDragged.current = true
    const maxScroll = Math.max(0, (totalItems - 1) * STEP)
    setScrollX(Math.max(0, Math.min(maxScroll, dragStartScroll.current - dx)))
  }
  const onTouchEnd = () => {
    if (!isDragging.current) return
    isDragging.current = false
    scrollToIndex(getActiveFromScroll(scrollX))
  }

  const visibleIndex = getActiveFromScroll(scrollX)

  const activeGame = visibleIndex < games.length ? games[visibleIndex] : null

  return (
    <section className="relative overflow-hidden select-none">
      
      <div className="absolute inset-0 z-0">
        {activeGame && (
          <Image
            key={activeGame.slug}
            src={activeGame.cover_image_url}
            alt=""
            fill
            className="object-cover scale-110 blur-[20px] opacity-50 saturate-150 brightness-75 transition-opacity duration-500"
            sizes="100vw"
            priority
          />
        )}
        <div className="absolute inset-0 bg-gradient-to-b from-[#252525]/60 via-transparent to-[#252525]" />
      </div>

      <div className="relative z-10 py-10">
      
        <button onClick={() => navigate(-1)}
          className="absolute left-4 top-1/2 -translate-y-1/2 z-20 w-10 h-10 rounded-full bg-black/40 border border-white/10 flex items-center justify-center text-white/70 hover:text-white hover:bg-black/60 transition-all cursor-pointer backdrop-blur-sm">
          <ChevronLeft size={20} />
        </button>
        <button onClick={() => navigate(1)}
          className="absolute right-4 top-1/2 -translate-y-1/2 z-20 w-10 h-10 rounded-full bg-black/40 border border-white/10 flex items-center justify-center text-white/70 hover:text-white hover:bg-black/60 transition-all cursor-pointer backdrop-blur-sm">
          <ChevronRight size={20} />
        </button>

        <div
          ref={containerRef}
          onMouseDown={onMouseDown}
          onMouseMove={onMouseMove}
          onMouseUp={onMouseUp}
          onMouseLeave={onMouseUp}
          onTouchStart={onTouchStart}
          onTouchMove={onTouchMove}
          onTouchEnd={onTouchEnd}
          className="overflow-hidden"
          style={{ cursor: isDragging.current ? 'grabbing' : 'grab' }}
        >
          <div
            className="flex items-center will-change-transform"
            style={{
              gap: `${GAP}px`,
              transform: `translateX(-${scrollX}px)`,
              transition: isDragging.current ? 'none' : 'transform 0.35s ease-out',
              paddingLeft: `calc(50% - ${CARD_W_ACTIVE / 2}px)`,
              paddingRight: `calc(50% - ${CARD_W / 2}px)`,
            }}
          >

            {games.map((game, i) => {
              const isActive = i === visibleIndex
              const dist = Math.abs(i - visibleIndex)
              return (
                <Link key={game.slug} href={`/games/${game.slug}`} draggable={false}
                  onClick={(e) => {
                    if (hasDragged.current) { e.preventDefault(); return }
                    if (!isActive) { e.preventDefault(); scrollToIndex(i) }
                  }}
                  className="flex-shrink-0 transition-all duration-300 ease-out"
                  style={{
                    transform: `scale(${isActive ? 1 : dist === 1 ? 0.88 : 0.78})`,
                    opacity: isActive ? 1 : dist === 1 ? 0.65 : 0.35,
                    zIndex: isActive ? 10 : 5 - dist,
                  }}>
                  <div className={`relative overflow-hidden rounded-xl transition-all duration-300 ${
                    isActive ? 'border-2 border-white/50 shadow-lg shadow-black/40' : 'border border-white/10'
                  }`} style={{ width: isActive ? CARD_W_ACTIVE : CARD_W, height: isActive ? CARD_H_ACTIVE : CARD_H }}>
                    <Image src={game.cover_image_url} alt={game.name} fill className="object-cover" sizes="200px" draggable={false} />
                    {isActive && (
                      <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent p-3 pt-8">
                        <p className="text-sm font-semibold text-white text-center truncate">{game.name}</p>
                      </div>
                    )}
                  </div>
                </Link>
              )
            })}




            {[...Array(emptySlots)].map((_, i) => {
              const slotIndex = games.length + i
              const isActive = slotIndex === visibleIndex
              const dist = Math.abs(slotIndex - visibleIndex)
              return (
                <Link key={`empty-${i}`} href="/games" draggable={false}
                  onClick={(e) => {
                    if (hasDragged.current) { e.preventDefault(); return }
                    if (!isActive) { e.preventDefault(); scrollToIndex(slotIndex) }
                  }}
                  className="flex-shrink-0 transition-all duration-300 ease-out"
                  style={{
                    transform: `scale(${isActive ? 1 : dist === 1 ? 0.88 : 0.78})`,
                    opacity: isActive ? 1 : dist === 1 ? 0.5 : 0.3,
                    zIndex: isActive ? 10 : 5 - dist,
                  }}>
                  <div className={`rounded-xl border-2 border-dashed flex flex-col items-center justify-center gap-2 transition-all duration-300 ${
                    isActive ? 'border-white/30' : 'border-white/10'
                  }`} style={{ width: isActive ? CARD_W_ACTIVE : CARD_W, height: isActive ? CARD_H_ACTIVE : CARD_H }}>
                    <span className={`text-3xl ${isActive ? 'text-white/50' : 'text-white/20'}`}>+</span>
                    <span className={`text-xs ${isActive ? 'text-white/50' : 'text-white/20'}`}>Join a game</span>
                  </div>
                </Link>
              )
            })}
          </div>
        </div>
        <div className="text-center mt-5">
          <p className="text-sm text-[#999]">
            {games.length === 0
              ? 'Collect 7 game cards by joining game communities'
              : `${games.length}/${MAX_SLOTS} game cards collected`
            }
          </p>
          {games.length > 0 && games.length < MAX_SLOTS && (
            <p className="text-xs text-[#666] mt-1">Join more communities to fill your collection</p>
          )}
          {games.length === MAX_SLOTS && (
            <p className="text-xs text-[#888] mt-1">Collection complete!</p>
          )}
        </div>
        <div className="flex justify-center gap-1.5 mt-3">
          {[...Array(totalItems)].map((_, i) => (
            <button key={i} onClick={() => scrollToIndex(i)}
              className={`rounded-full transition-all cursor-pointer ${
                i === visibleIndex ? 'w-6 h-1.5 bg-white/80' : 'w-1.5 h-1.5 bg-white/25 hover:bg-white/40'
              }`} />
          ))}
        </div>
      </div>
    </section>
  )
}

export default HomeCarousel