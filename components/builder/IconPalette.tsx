'use client'

import { ChangeEvent, useRef, useState } from 'react'
import { Plus, X } from 'lucide-react'

import { IconPaletteProps, UploadedIcon } from './builder.types'

const IconPalette = ({
  icons,
  iconPalettes,
  onUploadIcon,
  onDeleteIcon,
  onInsertIcon,
  onCreatePalette,
  onDeletePalette,
  onAssignIconToPalette,
}: IconPaletteProps) => {
  const [activePaletteId, setActivePaletteId] = useState<string | null>(null)
  const [creatingPalette, setCreatingPalette] = useState(false)
  const [newPaletteName, setNewPaletteName] = useState('')
  const fileInputRef = useRef<HTMLInputElement | null>(null)

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return
    onUploadIcon(e.target.files, activePaletteId)
    e.target.value = ''
  }

  const handleSubmitNewPalette = () => {
    const trimmed = newPaletteName.trim()
    if (!trimmed) { setCreatingPalette(false); return }
    onCreatePalette(trimmed)
    setNewPaletteName('')
    setCreatingPalette(false)
  }

  const visibleIcons = activePaletteId === null
    ? icons
    : icons.filter((icon) => icon.paletteId === activePaletteId)

  const activePalette = iconPalettes.find((p) => p.id === activePaletteId) ?? null

  return (
    <div className="flex h-full flex-col overflow-hidden">
      <div className="flex flex-wrap items-center gap-1 border-b border-[#1a1a1a] px-3 py-2">
        <button
          type="button"
          onClick={() => setActivePaletteId(null)}
          className={`flex h-6 items-center rounded px-2.5 text-xs transition ${
            activePaletteId === null
              ? 'bg-[#0d1829] text-[#6ba3e0]'
              : 'text-[#555] hover:text-[#aaa]'
          }`}
        >
          All
        </button>

        {iconPalettes.map((palette) => (
          <button
            key={palette.id}
            type="button"
            onClick={() => setActivePaletteId(palette.id)}
            className={`flex h-6 items-center rounded px-2.5 text-xs transition ${
              activePaletteId === palette.id
                ? 'bg-[#0d1829] text-[#6ba3e0]'
                : 'text-[#555] hover:text-[#aaa]'
            }`}
          >
            {palette.name}
          </button>
        ))}

        {creatingPalette ? (
          <div className="flex items-center gap-1">
            <input
              autoFocus
              value={newPaletteName}
              onChange={(e) => setNewPaletteName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleSubmitNewPalette()
                if (e.key === 'Escape') { setCreatingPalette(false); setNewPaletteName('') }
              }}
              maxLength={30}
              placeholder="Palette name"
              className="h-6 w-28 rounded border border-[#3b82f6] bg-[#0d1829] px-2 text-xs text-white outline-none"
            />
            <button
              type="button"
              onClick={handleSubmitNewPalette}
              className="flex h-6 items-center rounded border border-[#1f4a1f] bg-[#0f2a0f] px-1.5 text-xs text-green-400 transition hover:bg-[#1a3a1a]"
            >
              Add
            </button>
            <button
              type="button"
              onClick={() => { setCreatingPalette(false); setNewPaletteName('') }}
              className="flex h-6 w-6 items-center justify-center rounded border border-[#2a2a2a] text-[#555] transition hover:text-[#aaa]"
            >
              <X size={10} />
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => setCreatingPalette(true)}
            className="flex h-6 items-center gap-1 rounded border border-dashed border-[#2a2a2a] px-2 text-xs text-[#444] transition hover:border-[#444] hover:text-[#777]"
          >
            <Plus size={10} />
            New
          </button>
        )}
      </div>

      <div className="flex items-center gap-2 border-b border-[#1a1a1a] px-3 py-2">
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          className="flex h-7 flex-1 items-center justify-center gap-1.5 rounded border border-[#1d3a5e] bg-[#0d1829] text-xs text-[#6ba3e0] transition hover:bg-[#112040]"
        >
          <Plus size={12} />
          Upload icons
        </button>

        {activePalette && (
          <button
            type="button"
            onClick={() => {
              onDeletePalette(activePalette.id)
              setActivePaletteId(null)
            }}
            className="flex h-7 w-7 items-center justify-center rounded border border-[#2a1515] bg-[#1a1010] text-[#884444] transition hover:text-[#ef4444]"
            title={`Delete palette "${activePalette.name}"`}
          >
            <X size={12} />
          </button>
        )}
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/png,image/jpeg,image/jpg,image/webp,image/svg+xml"
        multiple
        onChange={handleFileChange}
        className="hidden"
      />

      <div className="flex-1 overflow-y-auto p-2">
        {visibleIcons.length === 0 ? (
          <div className="flex h-24 items-center justify-center rounded border border-dashed border-[#222] text-xs text-[#444]">
            {activePaletteId === null ? 'No icons uploaded yet' : 'No icons in this palette'}
          </div>
        ) : (
          <div className="grid grid-cols-4 gap-1.5">
            {visibleIcons.map((icon) => (
              <IconCell
                key={icon.id}
                icon={icon}
                palettes={iconPalettes}
                activePaletteId={activePaletteId}
                onInsert={onInsertIcon}
                onDelete={onDeleteIcon}
                onAssign={onAssignIconToPalette}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

const IconCell = ({
  icon,
  palettes,
  activePaletteId,
  onInsert,
  onDelete,
  onAssign,
}: {
  icon: UploadedIcon
  palettes: { id: string; name: string; createdAt: string }[]
  activePaletteId: string | null
  onInsert: (icon: UploadedIcon) => void
  onDelete: (id: string) => void
  onAssign: (iconId: string, paletteId: string | null) => void
}) => {
  const [showMenu, setShowMenu] = useState(false)

  return (
    <div
      className="group relative flex aspect-square cursor-pointer flex-col items-center justify-end rounded border border-[#222] bg-[#181818] transition hover:border-[#333]"
      onClick={() => { if (!showMenu) onInsert(icon) }}
    >
      <img
        src={icon.src}
        alt={icon.name}
        className="absolute inset-0 h-full w-full rounded object-contain p-2"
        draggable={false}
      />

      <div className="relative z-10 w-full truncate bg-[#111111cc] px-1 py-0.5 text-center text-[9px] text-[#666]">
        {icon.name}
      </div>

      <button
        type="button"
        onClick={(e) => { e.stopPropagation(); onDelete(icon.id) }}
        className="absolute right-1 top-1 z-20 flex h-4 w-4 items-center justify-center rounded bg-[#3a1515] text-[#ef4444] opacity-0 transition group-hover:opacity-100"
        title="Delete icon"
      >
        <X size={9} />
      </button>

      {palettes.length > 0 && (
        <button
          type="button"
          onClick={(e) => { e.stopPropagation(); setShowMenu((v) => !v) }}
          className="absolute left-1 top-1 z-20 flex h-4 items-center rounded bg-[#111111bb] px-1 text-[8px] text-[#555] opacity-0 transition group-hover:opacity-100 hover:text-[#aaa]"
          title="Assign to palette"
        >
          ···
        </button>
      )}

      {showMenu && (
        <div
          className="absolute left-0 top-6 z-30 rounded border border-[#2a2a2a] bg-[#161616] py-1 shadow-lg"
          style={{ minWidth: '130px' }}
          onClick={(e) => e.stopPropagation()}
        >
          <button
            type="button"
            onClick={() => { onAssign(icon.id, null); setShowMenu(false) }}
            className={`w-full whitespace-nowrap px-3 py-1 text-left text-xs transition hover:bg-[#1f1f1f] ${
              icon.paletteId === null ? 'text-[#6ba3e0]' : 'text-[#666]'
            }`}
          >
            Unassigned
          </button>
          {palettes.map((p) => (
            <button
              key={p.id}
              type="button"
              onClick={() => { onAssign(icon.id, p.id); setShowMenu(false) }}
              className={`w-full whitespace-nowrap px-3 py-1 text-left text-xs transition hover:bg-[#1f1f1f] ${
                icon.paletteId === p.id ? 'text-[#6ba3e0]' : 'text-[#666]'
              }`}
            >
              {p.name}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

export default IconPalette