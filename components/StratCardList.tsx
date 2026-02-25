'use client'
import Link from "next/link"
import { Button } from "./ui/button"
import StartCard from "./StartCard"
import { client } from "@/api/client"
import { useEffect, useState } from "react"
import { toast } from "sonner"


interface FormattedStrat {
    id: string;
    title: string;
    thumbnailUrl: string;
    view_count: number;
    created_at: string;
    author: string;
    gameName: string;
    mapName: string;
}

const StratCardList = () => {
    const [strategies, setStrategies] = useState<FormattedStrat[]>([]);
    const [loading, setLoading] = useState(true);

    

    useEffect(() => {
        const fetchStrategies = async () => {
            try {
                const { data, error } = await client
                    .from('strategies')
                    .select(`
                        id,
                        title,
                        view_count,
                        created_at,
                        thumbnail_url,
                        user:user_id (
                            username
                        ),
                        game:game_id (
                            name
                        ),
                        map:map_id (
                            name
                        )
                    `)
                    .order('view_count', { ascending: false })
                    .limit(5);

                if (error) throw error;

                if (!data) {
                    setStrategies([]);
                    return;
                }

                const formatDate = (timestamp: string): string => {
                    const date = new Date(timestamp);
                    const day = date.getDate().toString().padStart(2, '0');
                    const month = (date.getMonth() + 1).toString().padStart(2, '0');
                    const year = date.getFullYear();
                    const hours = date.getHours().toString().padStart(2, '0');
                    const minutes = date.getMinutes().toString().padStart(2, '0');
                    
                    return `${day}/${month}/${year} ${hours}:${minutes}`;
                }


                const formattedData: FormattedStrat[] = data.map((strat: any) => ({
                    id: strat.id,
                    title: strat.title,
                    thumbnailUrl: strat.thumbnail_url || 'https://picsum.photos/300/150',
                    view_count: strat.view_count || 0,
                    created_at: formatDate(strat.created_at),
                    author: strat.user?.username || 'Unknown',
                    gameName: strat.game?.name || 'Unknown',
                    mapName: strat.map?.name || 'Unknown',
                }));

                setStrategies(formattedData);

            } catch (error) {
                console.error('Error fetching strategies:', error);
                toast.error('Failed to load strategies');
            } finally {
                setLoading(false);
            }
        };

        fetchStrategies();
    }, []);

    if (loading) {
        return (
            <section className="pl-4">
                <div className="w-full flex justify-between items-center">
                    <h2 className="text-3xl font-bold m-8">Recommended Popular Strategies</h2>
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
        );
    }

    return (
        <section className="pl-4">
            <div className="w-full flex justify-between items-center">
                <h2 className="text-3xl font-bold m-8">Recommended Popular Strategies</h2>
                <Link href="/feed">
                    <Button className="bg-black hover:bg-gray-700 text-white font-bold py-2 px-4 rounded cursor-pointer m-8">
                        more
                    </Button>
                </Link>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 px-8">
                {strategies.length === 0 ? (
                    <p className="col-span-5 text-center text-gray-500 py-8">
                        No strategies found.
                    </p>
                ) : (
                    strategies.map((strat) => (
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
    )
}

export default StratCardList