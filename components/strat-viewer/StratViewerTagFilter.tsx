'use client'

import { useEffect, useRef, useState } from 'react'
import { Filter } from 'lucide-react'

import type { StratViewerTagFilterProps } from './strat-viewer.types'

export default function StratViewerTagFilter({
  tags,
  activeTagIds,
  onToggleTag,
  onClearFilters,
}: StratViewerTagFilterProps) {
  const [open, setOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement | null>(null)

  // close on click outside
  useEffect(() => {
    if (!open) return

    const handleClick = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [open])

  if (tags.length === 0) return null

  const activeCount = activeTagIds.length

  return (
    <div ref={dropdownRef} className="absolute top-2.5 left-2.5 z-10">
      {/* trigger button */}
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        className="flex items-center gap-1.5 rounded-md border bg-[#141414]/85 px-2.5 py-1.5 text-[11px] backdrop-blur-md transition"
        style={{
          borderColor: open || activeCount > 0 ? '#534AB7' : '#3a3a3a',
          color: open || activeCount > 0 ? '#CECBF6' : '#aaa',
        }}
      >
        <Filter size={12} />
        <span>Filter tags</span>
        {activeCount > 0 && (
          <span className="rounded-full bg-[#534AB7] px-1.5 py-px text-[9px] text-white">
            {activeCount}
          </span>
        )}
      </button>

      {/* dropdown strip */}
      {open && (
        <div className="mt-1 w-[190px] rounded-lg border border-[#2a2a2a] bg-[#161616]/95 py-1.5 backdrop-blur-md [&::-webkit-scrollbar]:w-[3px] [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-[#333]"
          style={{ maxHeight: '200px', overflowY: 'auto' }}
        >
          {activeCount > 0 && (
            <button
              type="button"
              onClick={onClearFilters}
              className="mb-1 w-full px-3 py-1 text-left text-[11px] text-[#666] transition hover:text-[#aaa]"
            >
              Clear filters
            </button>
          )}

          {tags.map((tag) => {
            const isActive = activeTagIds.includes(tag.id)

            return (
              <button
                key={tag.id}
                type="button"
                onClick={() => onToggleTag(tag.id)}
                className="flex w-full items-center gap-2.5 rounded-md px-3 py-1.5 transition hover:bg-[#1e1e1e]"
              >
                {/* checkbox */}
                <div
                  className="flex h-3.5 w-3.5 shrink-0 items-center justify-center rounded-[3px] border transition"
                  style={{
                    borderColor: isActive ? tag.color : '#444',
                    backgroundColor: isActive ? tag.color : 'transparent',
                  }}
                >
                  {isActive && (
                    <svg width="9" height="9" viewBox="0 0 12 12" fill="none" stroke="#fff" strokeWidth="2.5">
                      <polyline points="2,6 5,9 10,3" />
                    </svg>
                  )}
                </div>

                <span
                  className="text-[12px]"
                  style={{ color: isActive ? '#eee' : '#888' }}
                >
                  {tag.name}
                </span>
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}