'use client'
import GameCardList from "@/components/GameCardList"
import NewsLetter from "@/components/NewsLetter"
import StratCardList from "@/components/StratCardList"

const page = () => {
  return (
    <main>
      <div className="items-center flex-col text-center bg-linear-to-br from-black to-gray-800 flex">
        <h1 className="text-4xl font-bold m-8">
          YOUR #1 PLATFORM TO SHARE YOUR STARTS <br />OF YOUR FAVORITE GAMES ONLINE!
        </h1>
      </div>
      <GameCardList />
      <StratCardList />
      <div className="items-center flex-col text-center bg-linear-to-br from-gray-800 to-black flex mt-8">
        <NewsLetter />
        <p className="text-white">&copy; 2026 GGWIKI. All rights reserved.</p>
      </div>
    </main>
  )
}

export default page