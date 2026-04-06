'use client'

import type { GalleryTabsProps } from '../dashboard.types'

export default function GalleryTabs({
  activeTab,
  onSetActiveTab,
  ownedCount,
  savedCount,
}: GalleryTabsProps) {
  const tabs = [
    { id: 'my-strats' as const, label: 'My strats', count: ownedCount },
    { id: 'saved-strats' as const, label: 'Saved strats', count: savedCount },
  ]

  return (
    <div className="flex gap-0 border-b border-[#2a2a2a]">
      {tabs.map((tab) => {
        const isActive = activeTab === tab.id
        return (
          <button
            key={tab.id}
            type="button"
            onClick={() => onSetActiveTab(tab.id)}
            className={`relative px-4 py-2.5 text-sm transition ${
              isActive
                ? 'font-medium text-[#eee]'
                : 'text-[#666] hover:text-[#999]'
            }`}
          >
            {tab.label}
            <span className={`ml-1.5 text-[11px] ${isActive ? 'text-[#888]' : 'text-[#555]'}`}>
              {tab.count}
            </span>
            {isActive && (
              <span className="absolute bottom-[-0.5px] left-0 right-0 h-[2px] bg-[#eee]" />
            )}
          </button>
        )
      })}
    </div>
  )
}