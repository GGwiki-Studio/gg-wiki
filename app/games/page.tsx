'use client'

import GameCard from "@/components/GameCard";
import { getAllGames } from "@/lib/actions/game.actions";
import { useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { toast } from "sonner";

const Page = () => {
  const searchParams = useSearchParams()
  const [games, setGames] = useState<Game[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchGames = async () => {
      setLoading(true)
      const name = searchParams.get('name') || ''
      const genre = searchParams.get('genre') || ''
      const description = searchParams.get('description') || ''
      try{
        const fetchedGames = await getAllGames({name, genre, description})
        setGames(fetchedGames)
      } catch(error){
        console.error('Failed to fetch data:', error)
        toast.error('Failed to load data. Please try again later.')
      }
      
      setLoading(false)
    }

    fetchGames()
  }, [searchParams]) // Re-fetch when search params change

  if (loading) return (
    <main>
      <section className="pl-4 flex justify-between gap-4 max-sm:flex-col">
        <h1 className="text-3xl font-bold m-8">Game Communities</h1>
        <div className="flex gap-4 py-2 px-4 m-8">Filters</div>
      </section>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 px-8">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="animate-pulse">
            <div className="bg-gray-300 h-48 rounded-t-lg"></div>
            <div className="bg-gray-200 h-24 rounded-b-lg p-4">
              <div className="h-4 bg-gray-400 rounded w-3/4 mb-2"></div>
              <div className="h-3 bg-gray-400 rounded w-1/2"></div>
            </div>
          </div>
        ))}
      </div>
    </main>
  )

  return (
    <main>
      <section className="pl-4 flex justify-between gap-4 max-sm:flex-col">
        <h1 className="text-3xl font-bold m-8">Game Communities</h1>
        <div className="flex gap-4 py-2 px-4 m-8">Filters</div>
      </section>
      <section className="flex-wrap gap-4 w-full max-md:justify-center justify-between grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 px-8">
        {games?.map((game) => (
          <GameCard 
            key={game.slug}
            gameSlug={game.slug}
            name={game.name}
            thumbnailUrl={game.cover_image_url}
            members={game.member_count}
          />
        ))}
      </section>
    </main>
  )
}

export default Page