'use client'

import type { GalleryToolbarProps } from '../dashboard.types'

export default function GalleryToolbar({ activeTab }: GalleryToolbarProps) {
  return (
    <div className="flex items-center gap-2 py-3">
      {/* Future: filter dropdown */}
      {/* Future: sort dropdown */}
      {/* Future: search input */}

      {activeTab === 'my-strats' && (
        <div className="ml-auto">
          {/* Future: create bundle button */}
        </div>
      )}
    </div>
  )
}

