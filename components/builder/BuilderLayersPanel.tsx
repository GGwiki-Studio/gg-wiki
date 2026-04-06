'use client'

import { useMemo } from 'react'
import {
  ArrowRight,
  ChevronDown,
  ChevronUp,
  Circle,
  Eye,
  EyeOff,
  Image,
  Lock,
  LockOpen,
  Minus,
  MousePointer2,
  Square,
  Type,
} from 'lucide-react'

import { BuilderLayersPanelProps, BuilderObject } from './builder.types'

const TYPE_ICONS: Record<string, React.ReactNode> = {
  text: <Type size={12} />,
  arrow: <ArrowRight size={12} />,
  rectangle: <Square size={12} />,
  ellipse: <Circle size={12} />,
  line: <Minus size={12} />,
  image: <Image size={12} />,
  icon: <MousePointer2 size={12} />,
}

function getObjectLabel(obj: BuilderObject): string {
  if (obj.metadata.label) return obj.metadata.label
  if (obj.type === 'text' && 'text' in obj) return obj.text || 'Text'
  return obj.type.charAt(0).toUpperCase() + obj.type.slice(1)
}

const BuilderLayersPanel = ({
  objects,
  tags,
  selectedObjectId,
  filterTagIds,
  onSelectObject,
  onToggleVisibility,
  onToggleLocked,
  onMoveObjectUp,
  onMoveObjectDown,
  onSetFilterTagIds,
}: BuilderLayersPanelProps) => {
  // sort by zIndex descending (highest layer at top)
  const sorted = useMemo(
    () => [...objects].sort((a, b) => b.canvas.zIndex - a.canvas.zIndex),
    [objects]
  )

  // filter by selected tags (ANY match)
  const filtered = useMemo(() => {
    if (filterTagIds.length === 0) return sorted
    return sorted.filter((obj) =>
      obj.metadata.tagIds.some((id) => filterTagIds.includes(id))
    )
  }, [sorted, filterTagIds])

  const handleToggleFilterTag = (tagId: string) => {
    if (filterTagIds.includes(tagId)) {
      onSetFilterTagIds(filterTagIds.filter((id) => id !== tagId))
    } else {
      onSetFilterTagIds([...filterTagIds, tagId])
    }
  }

  return (
    <div className="flex h-full w-[200px] shrink-0 flex-col border-r border-[#1f1f1f] bg-[#111111]">
      {/* header */}
      <div className="flex h-9 shrink-0 items-center border-b border-[#1f1f1f] px-3">
        <span className="text-[10px] uppercase tracking-widest text-[#666]">Layers</span>
        <span className="ml-auto text-[10px] text-[#333]">{filtered.length}/{objects.length}</span>
      </div>

      {/* tag filter bar */}
      {tags.length > 0 && (
        <div className="flex flex-wrap items-center gap-1 border-b border-[#1f1f1f] px-3 py-2">
          <button
            type="button"
            onClick={() => onSetFilterTagIds([])}
            className={`flex h-5 items-center rounded px-2 text-[10px] transition ${
              filterTagIds.length === 0
                ? 'bg-[#0d1829] text-[#6ba3e0]'
                : 'text-[#555] hover:text-[#aaa]'
            }`}
          >
            All
          </button>
          {tags.map((tag) => {
            const isActive = filterTagIds.includes(tag.id)
            return (
              <button
                key={tag.id}
                type="button"
                onClick={() => handleToggleFilterTag(tag.id)}
                className="flex h-5 items-center rounded-full border px-2 text-[10px] transition"
                style={{
                  backgroundColor: isActive ? tag.color : 'transparent',
                  borderColor: isActive ? tag.color : '#2a2a2a',
                  color: isActive ? '#fff' : '#555',
                }}
              >
                {tag.name}
              </button>
            )
          })}
        </div>
      )}

      {/* object list */}
      <div className="flex-1 overflow-y-auto">
        {filtered.length === 0 ? (
          <div className="flex h-20 items-center justify-center px-3">
            <p className="text-center text-[10px] text-[#333]">
              {objects.length === 0 ? 'No objects on this slide' : 'No objects match filter'}
            </p>
          </div>
        ) : (
          filtered.map((obj, index) => {
            const isSelected = obj.id === selectedObjectId
            const isFirst = index === 0
            const isLast = index === filtered.length - 1

            return (
              <div
                key={obj.id}
                onClick={() => onSelectObject(obj.id)}
                className={`group flex h-8 cursor-pointer items-center gap-1.5 border-b border-[#181818] px-2 transition ${
                  isSelected
                    ? 'bg-[#0d1829] text-[#6ba3e0]'
                    : 'text-[#888] hover:bg-[#161616] hover:text-[#ccc]'
                }`}
              >
                {/* type icon */}
                {obj.type === 'icon' && 'src' in obj ? (
                  <img
                    src={obj.src as string}
                    alt=""
                    className="h-4 w-4 shrink-0 rounded object-contain"
                    draggable={false}
                  />
                ) : (
                  <span className="shrink-0 opacity-50">
                    {TYPE_ICONS[obj.type] ?? <Square size={12} />}
                  </span>
                )}

                {/* label */}
                <span className="min-w-0 flex-1 truncate text-xs">
                  {getObjectLabel(obj)}
                </span>

                {/* reorder buttons */}
                <button
                  type="button"
                  onClick={(e) => { e.stopPropagation(); onMoveObjectUp(obj.id) }}
                  disabled={isFirst}
                  className="flex h-5 w-4 items-center justify-center rounded text-[#555] transition hover:text-[#aaa] disabled:opacity-20"
                  title="Move up"
                >
                  <ChevronUp size={10} />
                </button>
                <button
                  type="button"
                  onClick={(e) => { e.stopPropagation(); onMoveObjectDown(obj.id) }}
                  disabled={isLast}
                  className="flex h-5 w-4 items-center justify-center rounded text-[#555] transition hover:text-[#aaa] disabled:opacity-20"
                  title="Move down"
                >
                  <ChevronDown size={10} />
                </button>

                {/* visibility toggle */}
                <button
                  type="button"
                  onClick={(e) => { e.stopPropagation(); onToggleVisibility(obj.id) }}
                  className={`flex h-5 w-5 items-center justify-center rounded transition ${
                    obj.canvas.visible
                      ? 'text-[#555] hover:text-[#aaa]'
                      : 'text-[#884444] hover:text-[#ef4444]'
                  }`}
                  title={obj.canvas.visible ? 'Hide' : 'Show'}
                >
                  {obj.canvas.visible ? <Eye size={11} /> : <EyeOff size={11} />}
                </button>

                {/* lock toggle */}
                <button
                  type="button"
                  onClick={(e) => { e.stopPropagation(); onToggleLocked(obj.id) }}
                  className={`flex h-5 w-5 items-center justify-center rounded transition ${
                    obj.canvas.locked
                      ? 'text-[#c59030]'
                      : 'text-[#555] hover:text-[#aaa]'
                  }`}
                  title={obj.canvas.locked ? 'Unlock' : 'Lock'}
                >
                  {obj.canvas.locked ? <Lock size={11} /> : <LockOpen size={11} />}
                </button>
              </div>
            )
          })
        )}
      </div>
    </div>
  )
}

export default BuilderLayersPanel