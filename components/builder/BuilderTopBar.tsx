'use client'

import { Save } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { BuilderTopBarProps } from './builder.types'

const BuilderTopBar = ({
  projectTitle,
  onSave,
  isSaving,
  hasUnsavedChanges,
  canSave,
}: BuilderTopBarProps) => {
  return (
    <div className="flex h-9 items-center border-b border-[#1f1f1f] bg-[#111111] px-4">
      <div className="flex items-center gap-1.5 text-xs">
        <span className="text-[#555]">Strategy</span>
        <span className="text-[#333]">/</span>
        <span className="font-medium text-[#ccc]">
          {projectTitle || 'Untitled Strategy'}
        </span>
      </div>

      {canSave && onSave && (
        <Button
          onClick={onSave}
          disabled={isSaving || !hasUnsavedChanges}
          size="xs"
          variant="ghost"
          className="gap-1.5 text-xs text-[#999] hover:text-[#ccc] disabled:opacity-30"
        >
          <Save className="h-3 w-3" />
          {isSaving ? 'Saving...' : 'Save'}
        </Button>
      )}
    </div>
  )
}

export default BuilderTopBar