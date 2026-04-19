'use client';

import Link from "next/link";
import Image from "next/image";

interface StratCardProps {
  stratId: string;
  title: string;
  author: string;
  game: string;
  thumbnailUrl: string;
  map: string;
  views: number;
  datePublished: string;
}

const StratCard = ({ stratId, title, author, game, thumbnailUrl, map, views, datePublished }: StratCardProps) => {
    const gameSlug = game.toLowerCase().replaceAll(' ','-')
    const mapSlug = map.toLowerCase().replaceAll(' ','-')
  return (
    <article className="bg-[#2a2a2a] rounded-lg overflow-hidden border border-[#353535] transition-all hover:border-[#4a4a4a] hover:shadow-lg hover:shadow-black/20">
        <Link href={`/games/${gameSlug}/maps/${mapSlug}/strategies/${stratId}`}>
            <div className="relative w-full h-44">
                <Image
                    src={thumbnailUrl}
                    alt={title}
                    fill
                    className="object-cover"
                    sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 20vw"
                />
            </div>
            <div className="p-3 flex flex-col gap-2">
                <h3 className="text-sm font-semibold text-[#eee] line-clamp-2 min-h-[2.5rem]">{title}</h3>
                <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="text-xs text-[#bbb] bg-[#353535] px-2 py-0.5 rounded-full">{game}</span>
                    <span className="text-xs text-[#bbb] bg-[#333] px-2 py-0.5 rounded-full">{map}</span>
                </div>
                <div className="flex items-center gap-2">
                    <Image src="/avatar.svg" alt="avatar" width={20} height={20} className="bg-[#444] p-0.5 rounded-full"/>
                    <p className="text-xs text-[#999] font-medium">{author}</p>
                </div>
                <div className="flex justify-between items-center pt-1 border-t border-[#353535]">
                    <div className="flex items-center gap-1.5">
                        <Image src="/views.svg" alt="views" width={14} height={14} className="filter invert opacity-50"/>
                        <span className="text-xs text-[#888]">{views}</span>
                    </div>
                    <span className="text-xs text-[#666]">{datePublished}</span>
                </div>
            </div>
        </Link>
    </article>
  )
}

export default StratCard