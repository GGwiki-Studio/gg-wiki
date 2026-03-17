'use client'

import { ChangeEvent, useRef } from 'react'
import { ImagePlus, MousePointerClick, Trash2 } from 'lucide-react'

import { Button } from '@/components/ui/button'

import { IconPaletteProps } from './builder.types'

const IconPalette = ({
  icons,
  onUploadIcon,
  onDeleteIcon,
  onInsertIcon,
}: IconPaletteProps) => {
  const fileInputRef = useRef<HTMLInputElement | null>(null)

  const handleTriggerUpload = () => {
    fileInputRef.current?.click()
  }

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    onUploadIcon(file)
    e.target.value = ''
  }

  return (
    <section className="rounded-2xl border border-[#2a2a2a] bg-[#111111] p-4">
      <div className="mb-4 flex items-start justify-between gap-3">
        <div>
          <h2 className="text-base font-semibold text-white">Icon Palette</h2>
          <p className="text-xs text-gray-400">
            Upload reusable icons and place them on the canvas later
          </p>
        </div>

        <Button
          type="button"
          onClick={handleTriggerUpload}
          className="cursor-pointer bg-blue-600 text-white hover:bg-blue-700"
        >
          <ImagePlus size={16} className="mr-2" />
          Upload
        </Button>
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/png,image/jpeg,image/jpg,image/webp,image/svg+xml"
        onChange={handleFileChange}
        className="hidden"
      />

      {icons.length === 0 ? (
        <div className="rounded-xl border border-dashed border-[#333333] bg-[#171717] px-3 py-8 text-center text-sm text-gray-400">
          No icons uploaded yet.
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3">
          {icons.map((icon) => (
            <div
              key={icon.id}
              className="rounded-xl border border-[#2d2d2d] bg-[#171717] p-3"
            >
              <div className="mb-3 flex aspect-square items-center justify-center overflow-hidden rounded-lg border border-[#2a2a2a] bg-[#101010]">
                <img
                  src={icon.src}
                  alt={icon.name}
                  className="max-h-full max-w-full object-contain"
                />
              </div>

              <div className="mb-3">
                <div className="truncate text-sm font-medium text-white">
                  {icon.name}
                </div>
                <div className="truncate text-xs text-gray-400">
                  {icon.fileName}
                </div>
              </div>

              <div className="flex gap-2">
                <Button
                  type="button"
                  onClick={() => onInsertIcon?.(icon)}
                  className="flex-1 cursor-pointer bg-[#1d2735] text-white hover:bg-[#263349]"
                  disabled={!onInsertIcon}
                >
                  <MousePointerClick size={14} className="mr-2" />
                  Insert
                </Button>

                <Button
                  type="button"
                  onClick={() => onDeleteIcon(icon.id)}
                  className="cursor-pointer bg-[#3a1f1f] text-white hover:bg-[#522727]"
                >
                  <Trash2 size={14} />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="mt-4 rounded-xl border border-[#2d2d2d] bg-[#171717] p-3 text-xs text-gray-400">
        Uploaded icons are project-level assets.
        {/* Future idea:
            Support drag-and-drop from palette into canvas,
            icon categories, search, and favorites. */}
      </div>
    </section>
  )
}

export default IconPalette