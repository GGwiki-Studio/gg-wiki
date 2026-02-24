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
        setJoined(!joined)
        return;
    }

    return (
    <article className="bg-gray-950 rounded-lg p-4 shadow-lg">
        <Link href={`/games/${gameSlug}`}>
            <div className="flex flex-col gap-4">
                <div className="rounded-lg overflow-hidden ">
                    <Image src={thumbnailUrl} alt={name} width={320} height={170} />
                </div>
                <div className="w-full flex justify-between items-center">
                    <h3 className="text-xl font-bold">{name}</h3>
                    <div className="flex items-center gap-2">
                        <p className="text-gray-400">{members}</p>
                        <Image src="/people.svg" alt="members" width={20} height={20} className="filter invert"/>
                    </div>
                </div>
            </div>
        </Link>
        <div className="mt-4 flex gap-4 w-full">
            <button onClick={(e) => handleJoinClick(e)} className="w-full bg-gray-500 hover:bg-gray-700 text-white font-bold py-2 px-4 rounded cursor-pointer">
                {joined ? "Leave" : "Join"}
            </button>
        </div>
        
    </article>
  )
}

export default GameCard