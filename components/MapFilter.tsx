'use client'

import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectGroup,
  SelectItem,
  SelectContent
} from "./ui/select"

import { client } from "@/api/client"

import { useSearchParams, useRouter, usePathname } from "next/navigation"
import { useState, useEffect } from "react"
import { toast } from "sonner"

interface Map {
  id: string
  name: string
  slug: string
  game_id: string
}

interface Game {
  id: string
  name: string
  slug: string
}

const MapFilter = () => {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  
  const pathSegments = pathname.split('/')
  const gameSlugFromPath = pathSegments[2]

  const queryMap = searchParams.get("map") || "all"
  
  const [games, setGames] = useState<Game[]>([])
  const [map, setMap] = useState(queryMap)
  const [allMaps, setAllMaps] = useState<Map[]>([])
  const [loading, setLoading] = useState(true)
  const [filteredMaps, setFilteredMaps] = useState<Map[]>([])
  const [currentGame, setCurrentGame] = useState<Game | null>(null)

  useEffect(() => {
    if (games.length > 0 && gameSlugFromPath) {
      const game = games.find(g => g.slug === gameSlugFromPath)
      setCurrentGame(game || null)
    }
  }, [games, gameSlugFromPath])

  useEffect(() => {
    if (currentGame && allMaps.length > 0) {
      const maps = allMaps.filter(map => map.game_id === currentGame.id)
      setFilteredMaps(maps)
    } else {
      setFilteredMaps([])
    }
  }, [currentGame, allMaps])

  useEffect(() => {
    const fetchData = async () => {
      try {
        const { data: gamesData, error: gamesError } = await client.from('games').select('id, name, slug')
        if(gamesError) throw gamesError

        const { data: mapsData, error: mapsError } = await client.from('maps').select('id, name, slug, game_id').order('name')
        if (mapsError) throw mapsError

        setGames(gamesData || []);
        setAllMaps(mapsData || []);
      } catch (error) {
        console.error('Failed to fetch data:', error)
        toast.error('Failed to load data. Please try again later.')
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [])

  useEffect(() => {
    setMap(queryMap)
  }, [queryMap])

  useEffect(() => {
    const params = new URLSearchParams(searchParams.toString())

    if (map === "all") {
      params.delete("map")
    } else {
      params.set("map", map)
    }

    const queryString = params.toString()
    const newUrl = queryString ? `${pathname}?${queryString}` : pathname

    const currentQuery = searchParams.toString()
    const currentUrl = currentQuery ? `${pathname}?${currentQuery}` : pathname

    if (newUrl !== currentUrl) {
      router.push(newUrl)
    }
  }, [map, searchParams.toString(), pathname, router])

  if (loading) {
    return <div>Loading maps...</div>
  }

  return (
    <Select value={map} onValueChange={setMap}>
      <SelectTrigger className="w-full max-w-48">
        <SelectValue placeholder={currentGame ? `Select a ${currentGame.name} map` : "Select a map"} />
      </SelectTrigger>

      <SelectContent>
        <SelectGroup>
          <SelectItem value="all">All Maps</SelectItem>
          {filteredMaps.length > 0 ? (
            filteredMaps.map((map) => (
              <SelectItem key={map.id} value={map.slug}>
                {map.name}
              </SelectItem>
            ))
          ) : (
            <SelectItem value="no-maps" disabled>
              No maps available
            </SelectItem>
          )}
        </SelectGroup>
      </SelectContent>
    </Select>
  )
}

export default MapFilter