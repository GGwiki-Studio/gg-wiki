'use client'

import { useEffect, useRef, useState } from 'react'

import type { StratTag } from '@/components/builder/builder.types'
import type { StratViewerHoverTooltipProps } from './strat-viewer.types'

export default function StratViewerHoverTooltip({
  hoveredObject,
  tags,
  containerRef,
  onMouseEnter,
  onMouseLeave,
}: StratViewerHoverTooltipProps) {
  const tooltipRef = useRef<HTMLDivElement | null>(null)
  const [clampedPos, setClampedPos] = useState({ x: 0, y: 0 })

  useEffect(() => {
    if (!hoveredObject || !containerRef.current || !tooltipRef.current) return

    const container = containerRef.current.getBoundingClientRect()
    const tooltip = tooltipRef.current.getBoundingClientRect()

    const offset = 12
    let x = hoveredObject.position.x + offset
    let y = hoveredObject.position.y - 10

    if (x + tooltip.width > container.width) {
      x = hoveredObject.position.x - tooltip.width - offset
    }

    if (y + tooltip.height > container.height) {
      y = container.height - tooltip.height - 8
    }

    if (y < 8) y = 8
    if (x < 8) x = 8

    setClampedPos({ x, y })
  }, [hoveredObject, containerRef])

  if (!hoveredObject) return null

  const { object } = hoveredObject
  const objectTags = tags.filter((t) => object.metadata.tagIds.includes(t.id))
  const hasLabel = object.metadata.label.trim().length > 0
  const hasDescription = object.metadata.description.trim().length > 0

  if (!hasLabel && !hasDescription && objectTags.length === 0) return null

  return (
    <div
      ref={tooltipRef}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      className="pointer-events-auto absolute z-20 min-w-[180px] max-w-[260px] rounded-[10px] border border-[#2a2a2a] bg-[#161616]/95 px-3.5 py-2.5 backdrop-blur-md"
      style={{ left: clampedPos.x, top: clampedPos.y }}
    >
      {hasLabel && (
        <p className="truncate text-[13px] font-medium text-[#eee]">
          {object.metadata.label}
        </p>
      )}

      {hasDescription && (
        <div className="mt-1 mb-2 max-h-[80px] overflow-y-auto pr-1 text-[11px] leading-[1.5] text-[#777] break-words [&::-webkit-scrollbar]:w-[3px] [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-[#333]">
          {object.metadata.description}
        </div>
      )}

      {objectTags.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {objectTags.map((tag) => (
            <span
              key={tag.id}
              className="rounded-full px-2 py-0.5 text-[10px]"
              style={{
                backgroundColor: tag.color + '33',
                color: tag.color,
              }}
            >
              {tag.name}
            </span>
          ))}
        </div>
      )}
    </div>
  )
}