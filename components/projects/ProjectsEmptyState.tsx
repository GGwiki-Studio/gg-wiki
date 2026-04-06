'use client'

import { Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface ProjectsEmptyStateProps {
  onCreateProject: () => void
}

export default function ProjectsEmptyState({ onCreateProject }: ProjectsEmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-[#2a2a2a] bg-[#1a1a1a] px-6 py-16">
      <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-[#252525] text-[#555]">
        <Plus className="h-6 w-6" />
      </div>
      <h3 className="mb-1 text-base font-medium text-[#777]">No projects yet</h3>
      <p className="mb-6 text-sm text-[#555]">
        Create your first project to start building strategies
      </p>
      <Button
        onClick={onCreateProject}
        className="bg-white text-[#1a1a1a] hover:bg-[#e0e0e0]"
      >
        Create your first project
      </Button>
    </div>
  )
}