'use client'
import Link from "next/link"
import { Button } from "./ui/button"
import StartCard from "./StratCard"
import CardSkeleton from "./CardSkeleton"
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
                // Get all active game IDs
                const { data: activeGames, error: gamesError } = await client
                    .from('games')
                    .select('id')
                    .eq('is_active', true)

                if (gamesError) throw gamesError

                const activeGameIds = activeGames?.map(g => g.id) || []

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
                    .eq('is_removed', false)
                    .eq('status', 'published')
                    .in('game_id', activeGameIds)
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
                    thumbnailUrl: strat.thumbnail_url,
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
            <section className="px-8 py-6">
                <div className="w-full flex justify-between items-center mb-4">
                    <h2 className="text-2xl font-bold">Recommended Popular Strategies</h2>
                    <Link href="/feed">
                        <Button className="
                        bg-[#2a2a2a] hover:bg-[#333] text-[#ccc] border border-[#333] font-medium py-1.5 px-4 rounded cursor-pointer text-sm">
                            more
                        </Button>
                    </Link>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
                    <CardSkeleton count={5} imageHeight="h-44" />
                </div>
            </section>
        );
    }

    return (
        <section className="px-8 py-6">
            <div className="w-full flex justify-between items-center mb-4">
                <h2 className="text-2xl font-bold">Recommended Popular Strategies</h2>
                <Link href="/feed">
                    <Button className="
                    bg-[#2a2a2a] hover:bg-[#333] text-[#ccc] border border-[#333] font-medium py-1.5 px-4 rounded cursor-pointer text-sm">
                        more
                    </Button>
                </Link>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
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