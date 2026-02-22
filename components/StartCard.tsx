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
  return (
    <article className="bg-gray-950 rounded-lg p-4 shadow-lg">
        <div className="flex flex-col gap-3">
            <div className="rounded-lg overflow-hidden ">
                <Image src={thumbnailUrl} alt={title} width={320} height={170} />
            </div>
            <div className="w-full items-center">
                <h3 className="text-xl font-bold h-14 flex">{title}</h3>
            </div>
            <div className="w-full flex justify-between items-center">
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
        <div className="mt-4 flex gap-4 w-full">
            <Link href={`/games/${stratId}`} className="w-full">
                <button className="w-full bg-gray-500 hover:bg-gray-700 text-white font-bold py-2 px-4 rounded cursor-pointer">
                    Open
                </button>
            </Link>
        </div>
        
    </article>
  )
}

export default StartCard