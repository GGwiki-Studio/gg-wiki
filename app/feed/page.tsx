'use client'

import MapFilter from "@/components/MapFilter";
import StartCard from "@/components/StartCard";
import { getAllStrats } from "@/lib/actions/strat.actions";
import { useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import { toast } from "sonner";

interface Strat{
  id: string;
  title: string;
  thumbnailUrl: string;
  view_count: number;
  created_at: string;
  author: string;
  gameName: string;
  mapName: string;
}

function PageContent(){
  const searchParams = useSearchParams()
  const [strats, setStrats] = useState<Strat[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchStrats = async () => {
      setLoading(true)
      const map = '' // optional map filter, can be extended later
      const limit = 0

      // Only use topic if user actually searched
      const topicParam = searchParams.get('topic')
      const topic = topicParam && topicParam.trim() !== '' ? topicParam : undefined
      
      try {
        const fetchedStrats = await getAllStrats({
          limit,
          map,
          topic: topic || '', // getAllStrats expects string, empty = no filter
          gameSlug: '' // empty means fetch all games
        })
        setStrats(fetchedStrats)
      } catch(error){
        console.error('Failed to fetch data:', error)
        toast.error('Failed to load data. Please try again later.')
      }

      setLoading(false)
    }

    fetchStrats()
  }, [searchParams])

  if (loading) return (
    <main>
      <section className="pl-4 flex justify-between gap-4 max-sm:flex-col">
        <h1 className="text-3xl font-bold m-8">Game Strategies</h1>
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
        <h1 className="text-3xl font-bold m-8">Strategies</h1>
      </section>
      <section className="flex-wrap gap-4 w-full max-md:justify-center justify-between grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 px-8">
        {strats?.map((strat) => (
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
        ))}
        {strats?.length === 0 && (
          <div className="col-span-full text-center py-8 text-gray-500">
            No strategies found.
          </div>
        )}
      </section>
    </main>
  )
}

const Page = () => {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <PageContent />
    </Suspense>
  )
}

export default Page