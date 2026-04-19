'use client'
import GameCard from "@/components/GameCard";
import GameCardList from "@/components/GameCardList"
import HomeCarousel from "@/components/HomeCarousel"
import LatestActivity from "@/components/LatestActivity"
import WebsiteGuide from "@/components/WebsiteGuide"
import NewsLetter from "@/components/NewsLetter"
import StartCard from "@/components/StratCard";
import StratCardList from "@/components/StratCardList"
import { Button } from "@/components/ui/button";
import { getAllGames } from "@/lib/actions/game.actions";
import { getAllStrats } from "@/lib/actions/posted.actions";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import { toast } from "sonner";

function PageContent(){
  const searchParams = useSearchParams()
  const [isSearch, setisSearch] = useState(false)
  const [games, setGames] = useState<Game[]>([])
  const [strats, setStrats] = useState<Strat[]>([])
  const [loading, setLoading] = useState(true)
  const topic = searchParams.get('topic') || ''

  useEffect(() => {
    const fetch = async () => {
      setLoading(true)
      const genre = ''
      const map = ''
      const gameSlug = ''
      const limit = 5
      if(topic.length > 0){
        setisSearch(true)
      }
      else{
        setisSearch(false)
      }
      try{
        const fetchedGames = await getAllGames({limit, genre, topic})
        const fetchedStrats = await getAllStrats({limit, map, topic, gameSlug})
        setStrats(fetchedStrats)
        setGames(fetchedGames)
      } catch(error){
        console.error('Failed to fetch data:', error)
        toast.error('Failed to load data. Please try again later.')
      }
      
      setLoading(false)
    }

    fetch()
  }, [searchParams])

  const buildSearchUrl = (base: string) => topic ? `${base}?topic=${encodeURIComponent(topic)}` : base

  if (loading && isSearch) return (
    <section>
    <section className="pl-4">
      <div className="w-full flex justify-between items-center">
        <h2 className="text-3xl font-bold m-8">Searched Games</h2>
        <Link href="/games">
          <Button className="bg-black hover:bg-gray-700 text-white font-bold py-2 px-4 rounded cursor-pointer m-8">
            more
          </Button>
        </Link>
      </div>
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
    </section>
    <section className="pl-4">
      <div className="w-full flex justify-between items-center">
        <h2 className="text-3xl font-bold m-8">Searched Strategies</h2>
        <Link href="/feed">
          <Button className="bg-black hover:bg-gray-700 text-white font-bold py-2 px-4 rounded cursor-pointer m-8">
            more
          </Button>
        </Link>
      </div>
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
    </section>
    </section>
  )

  if(isSearch){
    return(
      <main>
      <div className="items-center flex-col text-center bg-linear-to-br from-black to-gray-800 flex">
        <h1 className="text-4xl font-bold m-8">
          YOUR #1 PLATFORM TO SHARE YOUR STARTS <br />OF YOUR FAVORITE GAMES ONLINE!
        </h1>
      </div>
      
      <section className="pl-4">
        <div className="w-full flex justify-between items-center">
          <h2 className="text-3xl font-bold m-8">Searched Games</h2>
          <Link href={buildSearchUrl("/games")}>
            <Button className="bg-black hover:bg-gray-700 text-white font-bold py-2 px-4 rounded cursor-pointer m-8">
              more
            </Button>
          </Link>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 px-8">
          {!loading && games.length === 0 && <p className="col-span-5 text-center text-gray-500 py-8">No games found.</p>}

          {!loading && games.map((game) => (
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

      <section className="pl-4">
        <div className="w-full flex justify-between items-center">
          <h2 className="text-3xl font-bold m-8">Searched Strategies</h2>
          <Link href={buildSearchUrl("/feed")}>
            <Button className="bg-black hover:bg-gray-700 text-white font-bold py-2 px-4 rounded cursor-pointer m-8">
              more
            </Button>
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 px-8">
          {strats.length === 0 ? (
            <p className="col-span-5 text-center text-gray-500 py-8">
              No strategies found.
            </p>
          ) : (
            strats.map((strat) => (
              <StartCard
                key={strat.id}
                stratId={strat.id}
                title={strat.title}
                author={strat.author}
                game={strat.gameName}
                thumbnailUrl={strat.thumbnailUrl}
                map={strat.mapName}
                views={strat.view_count}
                datePublished={strat.created_at}
              />
            ))
          )}
        </div>
      </section>

      <div className="items-center flex-col text-center bg-linear-to-br from-gray-800 to-black flex mt-8">
        <NewsLetter />
        <p className="text-white">&copy; 2026 GGWIKI. All rights reserved.</p>
      </div>
    </main>
    )
  }

return (
    <main>
      <HomeCarousel />
      <hr className="border-[#333] mx-8" />
      <GameCardList />
      <hr className="border-[#333] mx-8" />
      <section className="px-8 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-[3fr_2fr] gap-8">
          <div>
            <h2 className="text-xl font-bold mb-4">Latest Activity</h2>
            <LatestActivity />
          </div>
          <div>
            <h2 className="text-xl font-bold mb-4">Getting Started</h2>
            <WebsiteGuide />
          </div>
        </div>
      </section>
      <hr className="border-[#333] mx-8" />
      <StratCardList />
      <div className="items-center flex-col text-center bg-linear-to-br from-gray-800 to-black flex mt-8">
      </div>
    </main>
  )
}

const page = () => {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <PageContent />
    </Suspense>
  )
}

export default page