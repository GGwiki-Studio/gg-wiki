'use client'

import { ChangeEvent, useEffect, useRef, useState } from 'react'
import { Check, Copy, ImagePlus, Plus, Trash2, X } from 'lucide-react'

import { BuilderSlideStripProps } from './builder.types'

const BuilderSlideStrip = ({
  slides,
  activeSlideId,
  activeSlide,

  onSelectSlide,
  onAddSlide,
  onRenameSlide,
  onDuplicateSlide,
  onDeleteSlide,

  onUploadBackground,
  onClearBackground,

  selectedSlideIds = [],
  onToggleSlideSelect,

  onExtractSlides,
  extractDialogOpen,
}: BuilderSlideStripProps) => {
  const [editingSlideId, setEditingSlideId] = useState<string | null>(null)
  const [draftName, setDraftName] = useState('')
  const fileInputRef = useRef<HTMLInputElement | null>(null)
  const stripRef = useRef<HTMLDivElement | null>(null)

  // Clear selection action when clicking outside the slide strip
  useEffect(() => {
    if (selectedSlideIds.length === 0 || extractDialogOpen) return

    const handleClickOutside = (e: MouseEvent) => {
      if (stripRef.current && !stripRef.current.contains(e.target as Node)) {
        onToggleSlideSelect?.('__clear__')
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [selectedSlideIds.length, onToggleSlideSelect])

  const startRename = (slideId: string, currentName: string) => {
    setEditingSlideId(slideId)
    setDraftName(currentName)
  }

  const cancelRename = () => {
    setEditingSlideId(null)
    setDraftName('')
  }

  const submitRename = (slideId: string) => {
    const trimmed = draftName.trim()
    if (!trimmed) { cancelRename(); return }
    onRenameSlide(slideId, trimmed)
    cancelRename()
  }

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    onUploadBackground(file)
    e.target.value = ''
  }

  const handleSlideClick = (slideId: string, e: React.MouseEvent) => {
    if (e.ctrlKey || e.metaKey) {
      onToggleSlideSelect?.(slideId)
      return
    }
    onSelectSlide(slideId)
  }

  const isSelected = (slideId: string) => selectedSlideIds.includes(slideId)

  return (
    <div ref={stripRef} className="flex h-auto min-h-[36px] flex-wrap items-center gap-x-1 gap-y-1 border-b border-[#1f1f1f] bg-[#111111] px-3 py-1.5">
      <span className="mr-1 shrink-0 text-[10px] font-medium uppercase tracking-widest text-[#666]">
        Slides
      </span>

      {slides.map((slide, index) => {
        const isActive = slide.id === activeSlideId
        const isEditing = slide.id === editingSlideId
        const selected = isSelected(slide.id)

        if (isEditing) {
          return (
            <div key={slide.id} className="flex items-center gap-1">
              <input
                value={draftName}
                onChange={(e) => setDraftName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') submitRename(slide.id)
                  if (e.key === 'Escape') cancelRename()
                }}
                autoFocus
                maxLength={50}
                className="h-7 w-32 rounded border border-[#3b82f6] bg-[#0d1829] px-2 text-xs text-white outline-none"
              />
              <button
                type="button"
                onClick={() => submitRename(slide.id)}
                className="flex h-7 w-7 items-center justify-center rounded border border-[#1f4a1f] bg-[#0f2a0f] text-green-400 transition hover:bg-[#1a3a1a]"
              >
                <Check size={11} />
              </button>
              <button
                type="button"
                onClick={cancelRename}
                className="flex h-7 w-7 items-center justify-center rounded border border-[#2a2a2a] bg-[#1a1a1a] text-[#666] transition hover:text-[#aaa]"
              >
                <X size={11} />
              </button>
            </div>
          )
        }

        return (
          <button
            key={slide.id}
            type="button"
            onClick={(e) => handleSlideClick(slide.id, e)}
            onDoubleClick={() => startRename(slide.id, slide.name)}
            title={`${slide.name} — double-click to rename, Ctrl+click to select for extraction`}
            className={`group flex h-7 items-center gap-1.5 rounded border px-2.5 text-xs transition ${
              selected
                ? 'border-[#e8c4c0] bg-[#2a1f1e] text-[#e8c4c0]'
                : isActive
                  ? 'border-[#2d5a9e] bg-[#0d1829] text-[#6ba3e0]'
                  : 'border-[#2a2a2a] bg-[#1a1a1a] text-[#888] hover:border-[#444] hover:text-[#ccc]'
            }`}
          >
            {selected && <Check size={10} className="shrink-0" />}
            <span className="text-[10px] opacity-50">{index + 1}</span>
            <span className="max-w-[120px] truncate">{slide.name}</span>
          </button>
        )
      })}

      <button
        type="button"
        onClick={onAddSlide}
        className="flex h-7 items-center gap-1 rounded border border-dashed border-[#2a2a2a] px-2.5 text-xs text-[#666] transition hover:border-[#666] hover:text-[#777]"
      >
        <Plus size={11} />
        Add
      </button>

      {/* Always visible extract button */}
      {onExtractSlides && (
        <button
          type="button"
          onClick={() => onExtractSlides(selectedSlideIds)}
          className={`flex h-7 items-center gap-1.5 rounded border px-2.5 text-xs transition ${
            selectedSlideIds.length > 0
              ? 'border-[#e8c4c0]/30 bg-[#2a1f1e] text-[#e8c4c0] hover:border-[#e8c4c0]/60 hover:bg-[#3a2a28]'
              : 'border-[#2a2a2a] bg-[#1a1a1a] text-[#666] hover:border-[#444] hover:text-[#888]'
          }`}
        >
          Extract ({selectedSlideIds.length})
        </button>
      )}

      {activeSlide && (
        <div className="ml-auto flex items-center gap-1">
          {activeSlide.id && editingSlideId !== activeSlide.id && (
            <>
              <button
                type="button"
                onClick={() => startRename(activeSlide.id, activeSlide.name)}
                className="flex h-7 items-center gap-1.5 rounded border border-[#252525] bg-[#1a1a1a] px-2.5 text-xs text-[#666] transition hover:border-[#333] hover:text-[#aaa]"
              >
                Rename
              </button>

              <button
                type="button"
                onClick={() => onDuplicateSlide(activeSlide.id)}
                className="flex h-7 w-7 items-center justify-center rounded border border-[#252525] bg-[#1a1a1a] text-[#666] transition hover:border-[#333] hover:text-[#aaa]"
                title="Duplicate slide"
              >
                <Copy size={12} />
              </button>

              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="flex h-7 items-center gap-1.5 rounded border border-[#252525] bg-[#1a1a1a] px-2.5 text-xs text-[#666] transition hover:border-[#333] hover:text-[#aaa]"
              >
                <ImagePlus size={12} />
                Upload Map
              </button>

              <button
                type="button"
                onClick={onClearBackground}
                disabled={!activeSlide.backgroundImage}
                className="flex h-7 items-center gap-1.5 rounded border border-[#2a1515] bg-[#1a1010] px-2.5 text-xs text-[#884444] transition hover:border-[#3a1f1f] hover:text-[#ef4444] disabled:cursor-not-allowed disabled:opacity-30"
              >
                Clear Map
              </button>

              <button
                type="button"
                onClick={() => onDeleteSlide(activeSlide.id)}
                disabled={slides.length === 1}
                className="flex h-7 w-7 items-center justify-center rounded border border-[#2a1515] bg-[#1a1010] text-[#884444] transition hover:border-[#3a1f1f] hover:text-[#ef4444] disabled:cursor-not-allowed disabled:opacity-30"
                title="Delete slide"
              >
                <Trash2 size={12} />
              </button>
            </>
          )}
        </div>
      )}

      <input
        ref={fileInputRef}
        type="file"
        accept="image/png,image/jpeg,image/jpg,image/webp"
        onChange={handleFileChange}
        className="hidden"
      />
    </div>
  )
}

export default BuilderSlideStrip