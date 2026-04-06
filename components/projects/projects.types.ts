import type { ProjectListItem } from '@/lib/actions/project.actions'

// Component Props

export interface ProjectsGridProps {
  projects: ProjectListItem[]
  onCreateProject: () => void
  onRenameProject: (id: string, newTitle: string) => void
  onDeleteProject: (id: string) => void
  onOpenProject: (id: string) => void
}

export interface ProjectCardProps {
  project: ProjectListItem
  onRename: (id: string, newTitle: string) => void
  onDelete: (id: string) => void
  onOpen: (id: string) => void
}

export interface CreateProjectDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onConfirm: (title: string) => void
  loading: boolean
}

export interface RenameProjectDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  currentTitle: string
  onConfirm: (newTitle: string) => void
  loading: boolean
}

export interface DeleteProjectDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  projectTitle: string
  onConfirm: () => void
  loading: boolean
}