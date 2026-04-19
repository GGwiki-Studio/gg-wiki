'use client';

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { useRouter} from "next/navigation"
import useAuth from "./hooks/useAuth"

interface GameCardProps {
    gameSlug: string;
    name: string;
    thumbnailUrl: string;
    members: number;
}

const GameCard = ({ gameSlug, name, thumbnailUrl, members }: GameCardProps) => {
    const [joined, setJoined] = useState(false);
    const router = useRouter();
    const auth = useAuth();
    const user = auth?.user;

    const handleJoinClick = (e: React.MouseEvent) => {
        if (!user) {
        e.preventDefault();
        router.push("/registration");
        return;
        }
        else if (user && !user.email_confirmed_at) {
        e.preventDefault();
        router.push("/verify");
        return;
        }
        setJoined(!joined)
        return;
    }

    return (
    <article className="bg-[#2a2a2a] rounded-lg overflow-hidden border border-[#353535] transition-all hover:border-[#4a4a4a] hover:shadow-lg hover:shadow-black/20">
        <Link href={`/games/${gameSlug}`}>
            <div className="relative w-full h-40">
                <Image
                    src={thumbnailUrl}
                    alt={name}
                    fill
                    className="object-cover"
                    sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 20vw"
                />
            </div>
            <div className="px-3 py-2.5 flex justify-between items-center">
                <h3 className="text-sm font-semibold text-[#eee] truncate">{name}</h3>
                <div className="flex items-center gap-1.5 shrink-0 ml-2">
                    <p className="text-xs text-[#888]">{members}</p>
                    <Image src="/people.svg" alt="members" width={16} height={16} className="filter invert opacity-60"/>
                </div>
            </div>
        </Link>
        <div className="px-3 pb-3">
            <button
                onClick={(e) => handleJoinClick(e)}
                className="w-full bg-[#3a3a3a] hover:bg-[#4a4a4a] text-[#ccc] text-sm font-medium py-1.5 rounded cursor-pointer transition-colors"
            >
                {joined ? "Leave" : "Join"}
            </button>
        </div>
    </article>
  )
}

export default GameCard