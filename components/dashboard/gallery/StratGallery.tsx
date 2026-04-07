'use client'

import GalleryTabs from './GalleryTabs'
import GalleryToolbar from './GalleryToolbar'
import GalleryEmptyState from './GalleryEmptyState'
import StratGalleryCard from './StratGalleryCard'
import type { StratGalleryProps } from '../dashboard.types'

export default function StratGallery({
  ownedStrats,
  savedStrats,
  activeTab,
  onSetActiveTab,
  onViewStrat,
  onDeleteStrat,
}: StratGalleryProps) {
  const strats = activeTab === 'my-strats' ? ownedStrats : savedStrats
  const owned = activeTab === 'my-strats'

  return (
    <div>
      <div className="mb-5">
        <h2 className="text-[22px] font-medium text-[#eee]">Strat gallery</h2>
        <p className="mt-1 text-sm text-[#666]">Your extracted strategies</p>
      </div>

      <GalleryTabs
        activeTab={activeTab}
        onSetActiveTab={onSetActiveTab}
        ownedCount={ownedStrats.length}
        savedCount={savedStrats.length}
      />

      <GalleryToolbar activeTab={activeTab} />

      {strats.length === 0 ? (
        <GalleryEmptyState tab={activeTab} />
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {strats.map((strat) => (
            <StratGalleryCard
              key={strat.id}
              strat={strat}
              owned={owned}
              onView={onViewStrat}
              onDelete={onDeleteStrat}
            />
          ))}
        </div>
      )}
    </div>
  )
}