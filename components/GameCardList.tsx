'use client';
import Link from "next/link"
import GameCard from "./GameCard"
import CardSkeleton from "./CardSkeleton"
import{ client } from "@/api/client"



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
          .eq('is_active', true)
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

  // if(loading){
  //   return <div>Loading...</div>
  // }

  if (loading) {
    return (
      <section className="px-8 py-6">
          <div className="w-full flex justify-between items-center mb-4">
              <h2 className="text-2xl font-bold">Explore Most Popular Games</h2>
              <Link href="/games">
                  <Button className=
                  "bg-[#2a2a2a] hover:bg-[#333] text-[#ccc] border border-[#333] font-medium py-1.5 px-4 rounded cursor-pointer text-sm">
                      more
                  </Button>
              </Link>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
              <CardSkeleton count={5} imageHeight="h-40" />
          </div>
      </section>
    )
  }

  return (
    <section className="px-8 py-6">
        <div className="w-full flex justify-between items-center mb-4">
            <h2 className="text-2xl font-bold">Explore Most Popular Games</h2>
            <Link href="/games">
                <Button className="
                bg-[#2a2a2a] hover:bg-[#333] text-[#ccc] border border-[#333] font-medium py-2 px-4 rounded cursor-pointer m-8">
                    more
                </Button>
            </Link>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
          {!loading && data.length === 0 && <p className="col-span-5 text-center text-gray-500 py-8">No games found.</p>}

          {!loading && data.map((game) => (
            <GameCard
              key={game.slug}
              gameSlug={game.slug}
              name={game.name}
              thumbnailUrl={game.cover_image_url}
              members={game.member_count}
            />
          ))}
        </div>
      </section>
  )
}

export default GameCardList