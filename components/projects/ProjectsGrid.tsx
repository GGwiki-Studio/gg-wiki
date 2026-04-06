'use client'

import { Button } from '@/components/ui/button'
import ProjectCard from './ProjectCard'
import ProjectsEmptyState from './ProjectsEmptyState'
import type { ProjectsGridProps } from './projects.types'

export default function ProjectsGrid({
  projects,
  onCreateProject,
  onRenameProject,
  onDeleteProject,
  onOpenProject,
}: ProjectsGridProps) {
  return (
    <div>
      <div className="mb-7 flex items-center justify-between">
        <div>
          <h2 className="text-[22px] font-medium text-[#eee]">My projects</h2>
          <p className="mt-1 text-sm text-[#666]">Create and manage your strategy projects</p>
        </div>
        {projects.length > 0 && (
          <Button
            onClick={onCreateProject}
            className="bg-white text-[#1a1a1a] hover:bg-[#e0e0e0]"
          >
            + New project
          </Button>
        )}
      </div>

      {projects.length === 0 ? (
        <ProjectsEmptyState onCreateProject={onCreateProject} />
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {projects.map((project) => (
            <ProjectCard
              key={project.id}
              project={project}
              onRename={onRenameProject}
              onDelete={onDeleteProject}
              onOpen={onOpenProject}
            />
          ))}
        </div>
      )}
    </div>
  )
}