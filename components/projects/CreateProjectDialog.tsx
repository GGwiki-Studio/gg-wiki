'use client'

import { useState, useEffect } from 'react'
import { Dialog } from 'radix-ui'
import { X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import type { CreateProjectDialogProps } from './projects.types'

export default function CreateProjectDialog({
  open,
  onOpenChange,
  onConfirm,
  loading,
}: CreateProjectDialogProps) {
  const [title, setTitle] = useState('')

  //Reset title, bug was that when you create a project and you reclick create project it was putting same name as previous
  //so we used useEffect instead of a function to clear it
  useEffect(() => {
    if (open) setTitle('')
  }, [open])

  const handleSubmit = () => {
    const trimmed = title.trim()
    if (!trimmed) return
    onConfirm(trimmed)
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !loading) handleSubmit()
  }

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-black/60" />
        <Dialog.Content className="fixed left-1/2 top-1/2 z-50 w-full max-w-md -translate-x-1/2 -translate-y-1/2 rounded-lg border border-[#2a2a2a] bg-[#1e1e1e] p-6 shadow-lg">
          <div className="mb-4 flex items-center justify-between">
            <Dialog.Title className="text-lg font-medium text-[#eee]">
              New project
            </Dialog.Title>
            <Dialog.Close asChild>
              <button className="rounded p-1 text-[#555] hover:text-[#999]">
                <X className="h-4 w-4" />
              </button>
            </Dialog.Close>
          </div>

          <Dialog.Description className="mb-4 text-sm text-[#666]">
            Give your project a name. You can change it later.
          </Dialog.Description>

          <Input
            placeholder="Project name"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            onKeyDown={handleKeyDown}
            maxLength={100}
            autoFocus
            className="mb-6 border-[#333] bg-[#252525] text-[#ddd] placeholder:text-[#555]"
          />

          <div className="flex justify-end gap-3">
            <Dialog.Close asChild>
              <Button variant="ghost" className="text-[#999] hover:text-[#ccc]">
                Cancel
              </Button>
            </Dialog.Close>
            <Button
              onClick={handleSubmit}
              disabled={!title.trim() || loading}
              className="bg-white text-[#1a1a1a] hover:bg-[#e0e0e0] disabled:opacity-40"
            >
              {loading ? 'Creating...' : 'Create'}
            </Button>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  )
}