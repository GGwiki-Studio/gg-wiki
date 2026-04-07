'use client'

import { useCallback, useRef, useState } from 'react'

import type { StratViewerProps, HoveredObjectInfo } from './strat-viewer.types'
import StratViewerCanvas from './StratViewerCanvas'
import StratViewerHoverTooltip from './StratViewerHoverTooltip'
import StratViewerTagFilter from './StratViewerTagFilter'

export default function StratViewer({ slideData }: StratViewerProps) {
  const containerRef = useRef<HTMLDivElement | null>(null)
  const [filterTagIds, setFilterTagIds] = useState<string[]>([])
  const [hoveredObject, setHoveredObject] = useState<HoveredObjectInfo | null>(null)
  const hideTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const { slide, tags, icons } = slideData

  // delayed hide so mouse can travel from object to tooltip
  const scheduleHide = useCallback(() => {
    hideTimeoutRef.current = setTimeout(() => {
      setHoveredObject(null)
    }, 150)
  }, [])

  const cancelHide = useCallback(() => {
    if (hideTimeoutRef.current) {
      clearTimeout(hideTimeoutRef.current)
      hideTimeoutRef.current = null
    }
  }, [])

  const handleHoverObject = useCallback((info: HoveredObjectInfo | null) => {
    if (info) {
      cancelHide()
      setHoveredObject(info)
    } else {
      scheduleHide()
    }
  }, [cancelHide, scheduleHide])

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
          icons={icons}
          filterTagIds={filterTagIds}
          onHoverObject={handleHoverObject}
        />

        <StratViewerTagFilter
          tags={tags}
          activeTagIds={filterTagIds}
          onToggleTag={handleToggleTag}
          onClearFilters={handleClearFilters}
        />

        <StratViewerHoverTooltip
          hoveredObject={hoveredObject}
          tags={tags}
          containerRef={containerRef}
          onMouseEnter={cancelHide}
          onMouseLeave={scheduleHide}
        />
      </div>

      <div className="flex items-center justify-between border-t border-[#2a2a2a] px-3 py-1.5">
        <span className="text-[10px] text-[#555]">Hover objects to inspect</span>
        <span className="text-[10px] text-[#555]">
          {filterTagIds.length > 0
            ? `${visibleCount} of ${objectCount} objects`
            : `${objectCount} objects`
          }
          {tags.length > 0 && ` · ${tags.length} tags`}
        </span>
      </div>
    </div>
  )
}