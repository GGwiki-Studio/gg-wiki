'use client'

import { Dialog } from 'radix-ui'
import { X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import type { DeleteStratDialogProps } from '../dashboard.types'

export default function DeleteStratDialog({
  open,
  onOpenChange,
  stratTitle,
  onConfirm,
  loading,
}: DeleteStratDialogProps) {
  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-black/60" />
        <Dialog.Content className="fixed left-1/2 top-1/2 z-50 w-full max-w-sm -translate-x-1/2 -translate-y-1/2 rounded-lg border border-[#2a2a2a] bg-[#1e1e1e] p-6 shadow-lg">
          <div className="mb-4 flex items-center justify-between">
            <Dialog.Title className="text-lg font-medium text-[#eee]">
              Delete strat
            </Dialog.Title>
            <Dialog.Close asChild>
              <button className="rounded p-1 text-[#555] hover:text-[#999]">
                <X className="h-4 w-4" />
              </button>
            </Dialog.Close>
          </div>

          <Dialog.Description className="mb-6 text-sm text-[#999]">
            Are you sure you want to delete{' '}
            <span className="font-medium text-[#ccc]">{stratTitle}</span>?
            This will also remove its assets from storage. This action cannot be undone.
          </Dialog.Description>

          <div className="flex justify-end gap-3">
            <Dialog.Close asChild>
              <Button variant="ghost" className="text-[#999] hover:text-[#ccc]">
                Cancel
              </Button>
            </Dialog.Close>
            <Button
              onClick={onConfirm}
              disabled={loading}
              className="bg-[#ef4444] text-white hover:bg-[#dc2626] disabled:opacity-40"
            >
              {loading ? 'Deleting...' : 'Delete'}
            </Button>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  )
}