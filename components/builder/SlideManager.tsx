'use client'

import { useState } from 'react'
import { Copy, Pencil, Plus, Trash2, Check, X } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

import { SlideManagerProps } from './builder.types'

const SlideManager = ({
  slides,
  activeSlideId,
  onSelectSlide,
  onAddSlide,
  onRenameSlide,
  onDuplicateSlide,
  onDeleteSlide,
}: SlideManagerProps) => {
  const [editingSlideId, setEditingSlideId] = useState<string | null>(null)
  const [draftName, setDraftName] = useState('')

  const startRename = (slideId: string, currentName: string) => {
    setEditingSlideId(slideId)
    setDraftName(currentName)
  }

  const cancelRename = () => {
    setEditingSlideId(null)
    setDraftName('')
  }

  const submitRename = (slideId: string) => {
    const trimmedName = draftName.trim()

    if (!trimmedName) {
      cancelRename()
      return
    }

    onRenameSlide(slideId, trimmedName)
    cancelRename()
  }

  return (
    <section className="rounded-2xl border border-[#2a2a2a] bg-[#111111] p-4">
      <div className="mb-4 flex items-center justify-between gap-2">
        <div>
          <h2 className="text-base font-semibold text-white">Slides</h2>
          <p className="text-xs text-gray-400">
            Floors, variations, or phases in one workspace
          </p>
        </div>

        <Button
          type="button"
          onClick={onAddSlide}
          className="cursor-pointer bg-blue-600 text-white hover:bg-blue-700"
        >
          <Plus size={16} className="mr-1" />
          Add
        </Button>
      </div>

      <div className="space-y-3">
        {slides.length === 0 ? (
          <div className="rounded-xl border border-dashed border-[#333333] bg-[#171717] px-3 py-6 text-center text-sm text-gray-400">
            No slides yet.
          </div>
        ) : (
          slides.map((slide, index) => {
            const isActive = slide.id === activeSlideId
            const isEditing = slide.id === editingSlideId

            return (
              <div
                key={slide.id}
                className={`rounded-xl border p-3 transition ${
                  isActive
                    ? 'border-blue-500 bg-[#162033]'
                    : 'border-[#2d2d2d] bg-[#171717]'
                }`}
              >
                {isEditing ? (
                  <div className="space-y-3">
                    <Input
                      value={draftName}
                      onChange={(e) => setDraftName(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') submitRename(slide.id)
                        if (e.key === 'Escape') cancelRename()
                      }}
                      autoFocus
                      className="border-[#2d2d2d] bg-[#101010] text-white"
                      placeholder="Slide name"
                    />

                    <div className="flex gap-2">
                      <Button
                        type="button"
                        onClick={() => submitRename(slide.id)}
                        className="cursor-pointer bg-emerald-600 text-white hover:bg-emerald-700"
                      >
                        <Check size={15} />
                      </Button>

                      <Button
                        type="button"
                        onClick={cancelRename}
                        className="cursor-pointer bg-[#2a2a2a] text-white hover:bg-[#3a3a3a]"
                      >
                        <X size={15} />
                      </Button>
                    </div>
                  </div>
                ) : (
                  <>
                    <button
                      type="button"
                      onClick={() => onSelectSlide(slide.id)}
                      className="w-full cursor-pointer text-left"
                    >
                      <div className="mb-1 flex items-center justify-between gap-2">
                        <span className="text-xs uppercase tracking-wide text-gray-400">
                          Slide {index + 1}
                        </span>

                        {isActive ? (
                          <span className="rounded-md bg-blue-600 px-2 py-0.5 text-[10px] font-semibold uppercase text-white">
                            Active
                          </span>
                        ) : null}
                      </div>

                      <div className="truncate text-sm font-semibold text-white">
                        {slide.name}
                      </div>

                      <div className="mt-1 text-xs text-gray-400">
                        {slide.objects.length} object
                        {slide.objects.length !== 1 ? 's' : ''}
                        {slide.backgroundImage ? ' • image added' : ' • no image'}
                      </div>
                    </button>

                    <div className="mt-3 flex flex-wrap gap-2">
                      <Button
                        type="button"
                        onClick={() => startRename(slide.id, slide.name)}
                        className="cursor-pointer bg-[#222222] text-white hover:bg-[#303030]"
                      >
                        <Pencil size={14} />
                      </Button>

                      <Button
                        type="button"
                        onClick={() => onDuplicateSlide(slide.id)}
                        className="cursor-pointer bg-[#1d2735] text-white hover:bg-[#263349]"
                      >
                        <Copy size={14} />
                      </Button>

                      <Button
                        type="button"
                        onClick={() => onDeleteSlide(slide.id)}
                        className="cursor-pointer bg-[#3a1f1f] text-white hover:bg-[#522727]"
                        disabled={slides.length === 1}
                      >
                        <Trash2 size={14} />
                      </Button>
                    </div>
                  </>
                )}
              </div>
            )
          })
        )}
      </div>
    </section>
  )
}

export default SlideManager