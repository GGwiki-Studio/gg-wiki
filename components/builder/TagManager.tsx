'use client'

import { useMemo, useState } from 'react'
import { Plus, Trash2 } from 'lucide-react'

import { TagManagerProps } from './builder.types'

const DEFAULT_TAG_COLORS = [
  '#ef4444',
  '#3b82f6',
  '#22c55e',
  '#eab308',
  '#a855f7',
  '#f97316',
  '#06b6d4',
  '#ec4899',
]

const TagManager = ({ tags, onCreateTag, onDeleteTag }: TagManagerProps) => {
  const [tagName, setTagName] = useState('')
  const [selectedColor, setSelectedColor] = useState(DEFAULT_TAG_COLORS[1])

  const normalizedNames = useMemo(
    () => tags.map((t) => t.name.trim().toLowerCase()),
    [tags]
  )

  const canCreate =
    tagName.trim().length > 0 &&
    !normalizedNames.includes(tagName.trim().toLowerCase())

  const handleCreateTag = () => {
    const trimmed = tagName.trim()
    if (!trimmed) return
    if (normalizedNames.includes(trimmed.toLowerCase())) return
    onCreateTag(trimmed, selectedColor)
    setTagName('')
  }

  return (
    <div className="flex h-full flex-col overflow-y-auto">
      <div className="border-b border-[#181818] px-3 py-3">
        <p className="mb-2.5 text-[9px] uppercase tracking-widest text-[#383838]">create tag</p>

        <div className="flex flex-col gap-2">
          <input
            value={tagName}
            onChange={(e) => setTagName(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') handleCreateTag() }}
            maxLength={50}
            placeholder="e.g. entry, plant, support"
            className="h-7 w-full rounded border border-[#1e1e1e] bg-[#0d0d0d] px-2 text-xs text-[#bbb] outline-none focus:border-[#3b82f6] transition"
          />

          <div className="flex flex-wrap gap-1.5">
            {DEFAULT_TAG_COLORS.map((color) => (
              <button
                key={color}
                type="button"
                onClick={() => setSelectedColor(color)}
                className="h-5 w-5 rounded-full transition"
                style={{
                  backgroundColor: color,
                  outline: color === selectedColor ? `2px solid ${color}` : 'none',
                  outlineOffset: '2px',
                }}
              />
            ))}
          </div>

          <button
            type="button"
            onClick={handleCreateTag}
            disabled={!canCreate}
            className="flex h-7 w-full items-center justify-center gap-1.5 rounded border border-[#1d3a5e] bg-[#0d1829] text-xs text-[#6ba3e0] transition hover:bg-[#112040] disabled:cursor-not-allowed disabled:opacity-30"
          >
            <Plus size={11} />
            Create tag
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-3 py-3">
        {tags.length === 0 ? (
          <p className="text-center text-xs text-[#333]">No tags created yet.</p>
        ) : (
          <div className="flex flex-col gap-1.5">
            {tags.map((tag) => (
              <div
                key={tag.id}
                className="flex items-center justify-between gap-2 rounded border border-[#1a1a1a] bg-[#0f0f0f] px-2.5 py-1.5"
              >
                <div className="flex items-center gap-2 min-w-0">
                  <span
                    className="h-2.5 w-2.5 shrink-0 rounded-full"
                    style={{ backgroundColor: tag.color }}
                  />
                  <span className="truncate text-xs text-[#aaa]">{tag.name}</span>
                </div>
                <button
                  type="button"
                  onClick={() => onDeleteTag(tag.id)}
                  className="flex h-5 w-5 shrink-0 items-center justify-center rounded text-[#884444] transition hover:bg-[#1a1010] hover:text-[#ef4444]"
                >
                  <Trash2 size={11} />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

export default TagManager