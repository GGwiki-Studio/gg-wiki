'use client'

import { MousePointerClick, Filter, Layers, Share2 } from 'lucide-react'

interface GuideTip {
  icon: React.ReactNode
  title: string
  description: string
}

const tips: GuideTip[] = [
  {
    icon: <Share2 size={16} />,
    title: 'Create strategies',
    description: 'Use the CREATE editor to build interactive strategies. Extract slides and publish them for others to see.',
  },
  {
    icon: <MousePointerClick size={16} />,
    title: 'Interactive strat viewer',
    description: 'Strategies created by the website\'s built-in editor allow for interactive posted strats; hence, when you see a strat post, you can click on any icon or object placed by the creator to see its label, description, and tags.',
  },
  {
    icon: <Filter size={16} />,
    title: 'Filter by tags',
    description: 'Use the tag filter button when viewing strategies to show or hide specific elements. Great for focusing on one player\'s role or a specific phase.',
  },
  {
    icon: <Layers size={16} />,
    title: 'Game Communities',
    description: 'Every game has its own community page where you can find its related strategies made by the community. Follow your favorite games to stay updated on their latest content.',
  },
]

const WebsiteGuide = () => {
  return (
    <div className="bg-[#2a2a2a] rounded-lg border border-[#353535] p-4">
      
      <div className="flex flex-col gap-4">
        {tips.map((tip, i) => (
          <div key={i} className="flex gap-3">
            <div className="w-7 h-7 rounded-md bg-[#353535] flex items-center justify-center shrink-0 text-[#888]">
              {tip.icon}
            </div>
            <div className="min-w-0">
              <p className="text-xs font-medium text-[#ddd]">{tip.title}</p>
              <p className="text-[11px] text-[#777] leading-relaxed mt-0.5">{tip.description}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

export default WebsiteGuide