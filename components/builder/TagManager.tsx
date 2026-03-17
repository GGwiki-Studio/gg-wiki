'use client'

import { useMemo, useState } from 'react'
import { Plus, Tag, Trash2 } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

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

const TagManager = ({
  tags,
  onCreateTag,
  onDeleteTag,
}: TagManagerProps) => {
  const [tagName, setTagName] = useState('')
  const [selectedColor, setSelectedColor] = useState(DEFAULT_TAG_COLORS[1])

  const normalizedNames = useMemo(
    () => tags.map((tag) => tag.name.trim().toLowerCase()),
    [tags]
  )

  const canCreate =
    tagName.trim().length > 0 &&
    !normalizedNames.includes(tagName.trim().toLowerCase())

  const handleCreateTag = () => {
    const trimmedName = tagName.trim()
    if (!trimmedName) return
    if (normalizedNames.includes(trimmedName.toLowerCase())) return

    onCreateTag(trimmedName, selectedColor)
    setTagName('')
  }

  return (
    <section className="rounded-2xl border border-[#2a2a2a] bg-[#111111] p-4">
      <div className="mb-4">
        <h2 className="text-base font-semibold text-white">Tags</h2>
        <p className="text-xs text-gray-400">
          Create reusable tags for objects and regions
        </p>
      </div>

      <div className="space-y-3 rounded-xl border border-[#2d2d2d] bg-[#171717] p-3">
        <div>
          <label className="mb-2 block text-xs font-medium uppercase tracking-wide text-gray-400">
            Tag Name
          </label>
          <Input
            value={tagName}
            onChange={(e) => setTagName(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleCreateTag()
            }}
            placeholder="e.g. entry, plant, support"
            className="border-[#2d2d2d] bg-[#101010] text-white"
          />
        </div>

        <div>
          <label className="mb-2 block text-xs font-medium uppercase tracking-wide text-gray-400">
            Tag Color
          </label>

          <div className="flex flex-wrap gap-2">
            {DEFAULT_TAG_COLORS.map((color) => {
              const isSelected = color === selectedColor

              return (
                <button
                  key={color}
                  type="button"
                  onClick={() => setSelectedColor(color)}
                  className={`h-8 w-8 rounded-full border-2 transition ${
                    isSelected
                      ? 'border-white scale-105'
                      : 'border-transparent opacity-85 hover:opacity-100'
                  }`}
                  style={{ backgroundColor: color }}
                  aria-label={`Select color ${color}`}
                  title={color}
                />
              )
            })}
          </div>
        </div>

        <Button
          type="button"
          onClick={handleCreateTag}
          disabled={!canCreate}
          className="w-full cursor-pointer bg-blue-600 text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
        >
          <Plus size={16} className="mr-2" />
          Create Tag
        </Button>
      </div>

      <div className="mt-4 space-y-2">
        {tags.length === 0 ? (
          <div className="rounded-xl border border-dashed border-[#333333] bg-[#171717] px-3 py-6 text-center text-sm text-gray-400">
            No tags created yet.
          </div>
        ) : (
          tags.map((tag) => (
            <div
              key={tag.id}
              className="flex items-center justify-between gap-3 rounded-xl border border-[#2d2d2d] bg-[#171717] px-3 py-3"
            >
              <div className="flex min-w-0 items-center gap-3">
                <span
                  className="h-3 w-3 shrink-0 rounded-full"
                  style={{ backgroundColor: tag.color }}
                />
                <div className="flex min-w-0 items-center gap-2">
                  <Tag size={14} className="shrink-0 text-gray-400" />
                  <span className="truncate text-sm font-medium text-white">
                    {tag.name}
                  </span>
                </div>
              </div>

              <Button
                type="button"
                onClick={() => onDeleteTag(tag.id)}
                className="cursor-pointer bg-[#3a1f1f] text-white hover:bg-[#522727]"
              >
                <Trash2 size={14} />
              </Button>
            </div>
          ))
        )}
      </div>

      <div className="mt-4 rounded-xl border border-[#2d2d2d] bg-[#171717] p-3 text-xs text-gray-400">
        Tags are being added now so objects can later reuse them in the inspector.
        {/* Later,
            Add object list filtering by selected tag(s),
            hide/show by tag, and search by tag name. */}
      </div>
    </section>
  )
}

export default TagManager