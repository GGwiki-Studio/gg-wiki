'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import useAuth from '@/components/hooks/useAuth'
import {
  createProject,
  getUserProjects,
  renameProject,
  deleteProject,
} from '@/lib/actions/project.actions'
import type { ProjectListItem } from '@/lib/actions/project.actions'
import ProjectsGrid from '@/components/projects/ProjectsGrid'
import CreateProjectDialog from '@/components/projects/CreateProjectDialog'
import RenameProjectDialog from '@/components/projects/RenameProjectDialog'
import DeleteProjectDialog from '@/components/projects/DeleteProjectDialog'

export default function ProjectsPage() {
  const auth = useAuth()
  const user = auth?.user
  const authLoading = auth?.loading
  const router = useRouter()

  const [projects, setProjects] = useState<ProjectListItem[]>([])
  const [loading, setLoading] = useState(true)

  // Dialog states
  const [createOpen, setCreateOpen] = useState(false)
  const [createLoading, setCreateLoading] = useState(false)

  const [renameOpen, setRenameOpen] = useState(false)
  const [renameLoading, setRenameLoading] = useState(false)
  const [renameTarget, setRenameTarget] = useState<{ id: string; title: string } | null>(null)

  const [deleteOpen, setDeleteOpen] = useState(false)
  const [deleteLoading, setDeleteLoading] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; title: string } | null>(null)

  // Auth guard
  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/registration')
    } else if (!authLoading && user && !user.email_confirmed_at) {
      router.push('/verify')
    }
  }, [authLoading, user, router])

  // Fetch projects
  useEffect(() => {
    if (!user) return
    const fetch = async () => {
      setLoading(true)
      const { data, error } = await getUserProjects(user.id)
      if (error) {
        toast.error('Failed to load projects')
      } else {
        setProjects(data || [])
      }
      setLoading(false)
    }
    fetch()
  }, [user])

  // Handlers
  const handleCreateProject = async (title: string) => {
    if (!user) return
    setCreateLoading(true)
    const { data, error } = await createProject(user.id, title)
    if (error) {
      toast.error('Failed to create project')
    } else if (data) {
      setProjects((prev) => [data, ...prev])
      setCreateOpen(false)
      toast.success('Project created')
    }
    setCreateLoading(false)
  }

  const handleRenameProject = (id: string, currentTitle: string) => {
    setRenameTarget({ id, title: currentTitle })
    setRenameOpen(true)
  }

  const handleRenameConfirm = async (newTitle: string) => {
    if (!user || !renameTarget) return
    setRenameLoading(true)
    const { data, error } = await renameProject(renameTarget.id, user.id, newTitle)
    if (error) {
      toast.error('Failed to rename project')
    } else if (data) {
      setProjects((prev) => prev.map((p) => (p.id === data.id ? data : p)))
      setRenameOpen(false)
      toast.success('Project renamed')
    }
    setRenameLoading(false)
  }

  const handleDeleteProject = (id: string) => {
    const project = projects.find((p) => p.id === id)
    if (!project) return
    setDeleteTarget({ id, title: project.title })
    setDeleteOpen(true)
  }

  const handleDeleteConfirm = async () => {
    if (!user || !deleteTarget) return
    setDeleteLoading(true)
    const { error } = await deleteProject(deleteTarget.id, user.id)
    if (error) {
      toast.error('Failed to delete project')
    } else {
      setProjects((prev) => prev.filter((p) => p.id !== deleteTarget.id))
      setDeleteOpen(false)
      toast.success('Project deleted')
    }
    setDeleteLoading(false)
  }

  const handleOpenProject = (id: string) => {
    router.push(`/projects/${id}/editor`)
  }

  // Loading / auth states
  if (authLoading || loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <p className="text-sm text-[#555]">Loading...</p>
      </div>
    )
  }

  if (!user) return null

  return (
    <div className="mx-auto max-w-6xl px-6 py-10">
      <div className="bg-[#191919] p-8">
        <ProjectsGrid
          projects={projects}
          onCreateProject={() => setCreateOpen(true)}
          onRenameProject={handleRenameProject}
          onDeleteProject={handleDeleteProject}
          onOpenProject={handleOpenProject}
        />
      </div>

      <CreateProjectDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
        onConfirm={handleCreateProject}
        loading={createLoading}
      />

      <RenameProjectDialog
        open={renameOpen}
        onOpenChange={setRenameOpen}
        currentTitle={renameTarget?.title || ''}
        onConfirm={handleRenameConfirm}
        loading={renameLoading}
      />

      <DeleteProjectDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        projectTitle={deleteTarget?.title || ''}
        onConfirm={handleDeleteConfirm}
        loading={deleteLoading}
      />
    </div>
  )
}