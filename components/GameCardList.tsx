'use client';
import Link from "next/link"
import GameCard from "./GameCard"

import { Button } from "./ui/button"

const GameCardList = () => {
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
          <GameCard 
            gameSlug="counter-strike-source-2"
            name="Counter-Strike Source 2"
            thumbnailUrl="https://picsum.photos/320/170"
            members={1000}
          />
          <GameCard 
            gameSlug="valorant"
            name="Valorant"
            thumbnailUrl="https://picsum.photos/320/170"
            members={800}
          />
          <GameCard 
            gameSlug="league-of-legends"
            name="League of Legends"
            thumbnailUrl="https://picsum.photos/320/170"
            members={1200}
          />
          <GameCard 
            gameSlug="rainbow-six-siege"
            name="Rainbow Six Siege"
            thumbnailUrl="https://picsum.photos/320/170"
            members={1100}
          />
          <GameCard 
            gameSlug="rainbow-six-siege"
            name="Rainbow Six Siege"
            thumbnailUrl="https://picsum.photos/320/170"
            members={1100}
          />
        </div>
      </section>
  )
}

export default GameCardList