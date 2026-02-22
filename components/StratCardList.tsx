'use client'
import Link from "next/link"
import { Button } from "./ui/button"
import StartCard from "./StartCard"

const StratCardList = () => {
  return (
    <section className="pl-4">
        <div className="w-full flex justify-between items-center">
            <h2 className="text-3xl font-bold m-8">Recomended Popular Strategies</h2>
            <Link href="/feed">
                <Button className="bg-black hover:bg-gray-700 text-white font-bold py-2 px-4 rounded cursor-pointer m-8">
                    more
                </Button>
            </Link>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 px-8">
            <StartCard 
                stratId="111"
                title="Best AWP Spots in Dust 2"
                author="John Doe"
                game="Counter-Strike Source 2"
                thumbnailUrl="https://picsum.photos/300/150"
                map="Dust 2"
                views={500}
                datePublished="2024-06-01"
            />
            <StartCard 
                stratId="222"
                title="Valorant Map Control Guide"
                author="Jane Smith"
                game="Valorant"
                thumbnailUrl="https://picsum.photos/300/150"
                map="Ascent"
                views={800}
                datePublished="2024-06-02"
            />
            <StartCard 
                stratId="333"
                title="Optimal Farming Routes in League of Legends"
                author="Alice Johnson"
                game="League of Legends"
                thumbnailUrl="https://picsum.photos/300/150"
                map="Summoner's Rift"
                views={1200}
                datePublished="2024-06-03"
            />
            <StartCard 
                stratId="444"
                title="Rainbow Six Siege Operator Guide"
                author="Bob Brown"
                game="Rainbow Six Siege"
                thumbnailUrl="https://picsum.photos/300/150"
                map="Bank"
                views={900}
                datePublished="2024-06-04"
            />
            <StartCard 
                stratId="555"
                title="In-depth Guide to Dust 2 Mid Control"
                author="Charlie Davis"
                game="Counter-Strike Source 2"
                thumbnailUrl="https://picsum.photos/300/150"
                map="Dust 2"
                views={700}
                datePublished="2024-06-05"
            />
        </div>
    </section>
  )
}

export default StratCardList