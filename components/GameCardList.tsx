'use client';
import Link from "next/link"
import GameCard from "./GameCard"
import{ client } from "@/api/client"

interface Game{
  slug: string;
  name: string;
  //cover_image_url: string;
  member_count: number;
}

import { Button } from "./ui/button"
import { useEffect, useState } from "react";
import { toast } from "sonner";

const GameCardList = () => {
  const [data, setData] = useState<Game[]>([]);
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchData = async () => {
      try {
        const { data: gameData, error } = await client
          .from('games')
          .select('slug, name, cover_image_url, member_count')
          .order('member_count', { ascending: false })
          .limit(5)        
        
        if(error) throw error

        setData(gameData);
      } catch (error) {
        console.error('Failed to fetch data:', error)
        toast.error('Failed to load data. Please try again later.')
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [])

  if(loading){
    return <div>Loading...</div>
  }

  return (
    <section className="pl-4">
        <div className="w-full flex justify-between items-center">
            <h2 className="text-3xl font-bold m-8">Explore Most Popular Games</h2>
            <Link href="/games">
                <Button className="bg-black hover:bg-gray-700 text-white font-bold py-2 px-4 rounded cursor-pointer m-8">
                    more
                </Button>
            </Link>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 px-8">
          {!loading && data.length === 0 && <p>No games found.</p>}

          {!loading && data.map((game) => (
            <GameCard
              key={game.slug}
              gameSlug={game.slug}
              name={game.name}
              thumbnailUrl="https://picsum.photos/320/170"
              members={game.member_count}
            />
          ))}
        </div>
      </section>
  )
}

export default GameCardList