'use client';

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import useAuth from "./hooks/useAuth"
import { joinGame, leaveGame, checkGameMembership } from "@/lib/actions/game.actions"

interface GameCardProps {
    gameId: string;
    gameSlug: string;
    name: string;
    thumbnailUrl: string;
    members: number;
}

const GameCard = ({ gameId, gameSlug, name, thumbnailUrl, members }: GameCardProps) => {
    const [joined, setJoined] = useState(false);
    const [memberCount, setMemberCount] = useState(members);
    const [loading, setLoading] = useState(false);
    const router = useRouter();
    const auth = useAuth();
    const user = auth?.user;

    useEffect(() => {
        if (!user || !user.email_confirmed_at) return
        checkGameMembership(user.id, gameId).then(setJoined)
    }, [user, gameId])

    const handleJoinClick = async (e: React.MouseEvent) => {
        e.stopPropagation()
        e.preventDefault()

        if (!user) {
            router.push("/registration");
            return;
        }
        if (user && !user.email_confirmed_at) {
            router.push("/verify");
            return;
        }

        setLoading(true)
        if (joined) {
            const { error } = await leaveGame(user.id, gameId)
            if (error) {
                toast.error('Failed to leave game')
            } else {
                setJoined(false)
                setMemberCount((prev) => Math.max(0, prev - 1))
            }
        } else {
            const { error } = await joinGame(user.id, gameId)
            if (error) {
                toast.error('Failed to join game')
            } else {
                setJoined(true)
                setMemberCount((prev) => prev + 1)
            }
        }
        setLoading(false)
    }

    return (
        <article className="bg-gray-950 rounded-lg p-4 shadow-lg">
            <Link href={`/games/${gameSlug}`}>
                <div className="flex flex-col gap-4">
                    <div className="relative w-full aspect-video rounded-lg overflow-hidden bg-gray-800">
                        <Image
                        src={thumbnailUrl}
                        alt={name}
                        fill
                        sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                        className="object-cover"
                        />
                    </div>
                    <div className="px-3 py-2.5 flex justify-between items-center">
                        <h3 className="text-sm font-semibold text-[#eee] truncate">{name}</h3>
                        <div className="flex items-center gap-2">
                            <p className="text-xs text-[#888]">{memberCount}</p>
                            <Image src="/people.svg" alt="members" width={16} height={16} className="filter invert opacity-60"/>
                        </div>
                    </div>
                </div>
            </Link>
            <div className="px-3 pb-3">
                <button
                    onClick={handleJoinClick}
                    disabled={loading}
                    className={`w-full font-bold py-2 px-4 rounded cursor-pointer transition disabled:opacity-50 ${
                        joined
                            ? 'bg-gray-700 hover:bg-gray-800 text-gray-300'
                            : 'bg-gray-500 hover:bg-gray-700 text-white'
                    }`}
                >
                    {loading ? '...' : joined ? 'Leave' : 'Join'}
                </button>
            </div>
        </article>
    )
}

export default GameCard