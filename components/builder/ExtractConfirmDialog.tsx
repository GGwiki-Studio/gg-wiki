'use client'

import { Dialog } from 'radix-ui'
import { Package, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import type { BuilderSlide } from './builder.types'

interface ExtractConfirmDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  slides: BuilderSlide[]
  onConfirm: () => void
  loading: boolean
}

export default function ExtractConfirmDialog({
  open,
  onOpenChange,
  slides,
  onConfirm,
  loading,
}: ExtractConfirmDialogProps) {
  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-black/60" />
        <Dialog.Content className="fixed left-1/2 top-1/2 z-50 w-full max-w-md -translate-x-1/2 -translate-y-1/2 rounded-lg border border-[#2a2a2a] bg-[#1e1e1e] p-6 shadow-lg">
          <div className="mb-4 flex items-center justify-between">
            <Dialog.Title className="text-lg font-medium text-[#eee]">
              Extract strats
            </Dialog.Title>
            <Dialog.Close asChild>
              <button className="rounded p-1 text-[#555] hover:text-[#999]">
                <X className="h-4 w-4" />
              </button>
            </Dialog.Close>
          </div>

          <Dialog.Description className="mb-4 text-sm text-[#999]">
            Each selected slide becomes an independent strat in your dashboard.
          </Dialog.Description>

            <div className="mb-6 flex flex-col gap-1.5">
            {slides.length === 0 ? (
              <div className="rounded border border-dashed border-[#2a2a2a] bg-[#252525] px-4 py-6 text-center text-sm text-[#555]">
                Ctrl/Cmd + Left Click slides to 'select' for extraction
                <br />
                Click anywhere to exit 'selection'
              </div>
            ) : (
              slides.map((slide, i) => (
                <div
                  key={slide.id}
                  className="flex items-center gap-2 rounded border border-[#2a2a2a] bg-[#252525] px-3 py-2 text-sm text-[#ccc]"
                >
                  <span className="text-[10px] text-[#555]">{i + 1}</span>
                  <span className="truncate">{slide.name}</span>
                </div>
              ))
            )}
          </div>

          <div className="flex justify-end gap-3">
            <Dialog.Close asChild>
              <Button variant="ghost" className="text-[#999]">
                Cancel
              </Button>
            </Dialog.Close>
            <Button
              onClick={onConfirm}
              disabled={loading}
              className="bg-white text-[#1a1a1a] hover:bg-[#e0e0e0] disabled:opacity-40"
            >
              {loading ? `Extracting (${slides.length})...` : slides.length === 0 ? 'Extract' : `Extract ${slides.length} strat${slides.length > 1 ? 's' : ''}`}
            </Button>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  )
}