'use client'

import { useCallback, useRef, useState } from 'react'

import type { StratViewerProps, SelectedObjectInfo } from './strat-viewer.types'
import StratViewerCanvas from './StratViewerCanvas'
import StratViewerTooltip from './StratViewerTooltip'
import StratViewerTagFilter from './StratViewerTagFilter'

export default function StratViewer({ slideData }: StratViewerProps) {
  const containerRef = useRef<HTMLDivElement | null>(null)
  const [filterTagIds, setFilterTagIds] = useState<string[]>([])
  const [selectedObject, setSelectedObject] = useState<SelectedObjectInfo | null>(null)

  const { slide, tags } = slideData

  const handleSelectObject = useCallback((info: SelectedObjectInfo | null) => {
    setSelectedObject(info)
  }, [])

  const handleDismiss = useCallback(() => {
    setSelectedObject(null)
  }, [])

  const handleToggleTag = useCallback((tagId: string) => {
    setFilterTagIds((prev) =>
      prev.includes(tagId)
        ? prev.filter((id) => id !== tagId)
        : [...prev, tagId]
    )
  }, [])

  const handleClearFilters = useCallback(() => {
    setFilterTagIds([])
  }, [])

  const objectCount = slide.objects.length
  const visibleCount = filterTagIds.length > 0
    ? slide.objects.filter((obj) =>
        obj.metadata.tagIds.some((id) => filterTagIds.includes(id))
      ).length
    : objectCount

  return (
    <div ref={containerRef} className="relative overflow-hidden rounded-lg border border-[#2a2a2a] bg-[#141414]">
      <div className="relative">
        <StratViewerCanvas
          slide={slide}
          tags={tags}
          filterTagIds={filterTagIds}
          onSelectObject={handleSelectObject}
        />

        <StratViewerTagFilter
          tags={tags}
          activeTagIds={filterTagIds}
          onToggleTag={handleToggleTag}
          onClearFilters={handleClearFilters}
        />

        <StratViewerTooltip
          selectedObject={selectedObject}
          tags={tags}
          containerRef={containerRef}
          onDismiss={handleDismiss}
        />
      </div>

      <div className="flex items-center justify-between border-t border-[#2a2a2a] px-3 py-1.5">
        <span className="text-[10px] text-[#555]">Click objects to inspect</span>
        <span className="text-[10px] text-[#555]">
          {filterTagIds.length > 0
            ? `${visibleCount}/${objectCount} objects`
            : `${objectCount} objects`}
        </span>
      </div>
    </div>
  )
}