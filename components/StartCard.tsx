'use client';

import Link from "next/link";
import Image from "next/image";

interface StartCardProps {
  stratId: string;
  title: string;
  author: string;
  game: string;
  thumbnailUrl: string;
  map: string;
  views: number;
  datePublished: string;
}

const StartCard = ({ stratId, title, author, game, thumbnailUrl, map, views, datePublished }: StartCardProps) => {
    const gameSlug = game.toLowerCase().replaceAll(' ','-')
    const mapSlug = map.toLowerCase().replaceAll(' ','-')
  return (
    <article className="bg-gray-950 rounded-lg p-4 shadow-lg">
        <Link href={`/games/${gameSlug}/maps/${mapSlug}/strategies/${stratId}`}>
            <div className="flex flex-col gap-3">
                <div className="relative w-full aspect-video rounded-lg overflow-hidden bg-gray-800">
                    <Image
                    src={thumbnailUrl}
                    alt={title}
                    fill
                    sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                    className="object-cover"
                    />
                </div>
                <div className="w-full items-center">
                    <h3 className="text-xl font-bold h-14 flex">{title}</h3>
                </div>
                <div className="w-full flex flex-col justify-between 3xl:flex-row items-start 3xl:items-center gap-2">
                    <h3 className="pl-2 pr-2 text-md text-gray-200 bg-gray-800 rounded-2xl">{game}</h3>
                    <h2 className="pl-2 pr-2 text-md text-gray-200 bg-gray-700 rounded-2xl">{map}</h2>
                </div>
                <div className="flex items-center gap-2">
                    <Image src="/avatar.svg" alt="avatar" width={30} height={30} className="bg-white p-1 rounded-2xl "/>
                    <p className="text-white font-bold">{author}</p>
                </div>
                <div className="w-full flex justify-between items-center">
                    <div className="flex items-center gap-2">
                        <Image src="/views.svg" alt="avatar" width={20} height={20} className="filter invert"/>
                        <h3 className="text-white">{views}</h3>
                    </div>
                    <h2 className="text-white">{datePublished}</h2>
                </div>
            </div>
        </Link>
    </article>
  )
}

export default StartCard