'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { toast } from 'sonner'
import useAuth from '@/components/hooks/useAuth'
import { getProject } from '@/lib/actions/project.actions'
import { migrateProjectData, CURRENT_SCHEMA_VERSION } from '@/lib/schema/builder/schema-migration'
import type { BuilderProject } from '@/components/builder/builder.types'
import Builder from '@/components/builder/Builder'

export default function EditorPage() {
  const params = useParams()
  const projectId = params.id as string
  const router = useRouter()
  const auth = useAuth()
  const user = auth?.user
  const authLoading = auth?.loading

  const [projectData, setProjectData] = useState<BuilderProject | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Auth guard
  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/registration')
    } else if (!authLoading && user && !user.email_confirmed_at) {
      router.push('/verify')
    }
  }, [authLoading, user, router])

  // Fetch project and migrate if needed
  useEffect(() => {
    if (!user || !projectId) return
    const fetch = async () => {
      setLoading(true)
      const { data, error: fetchError } = await getProject(projectId, user.id)
      if (fetchError || !data) {
        setError('Project not found')
        toast.error('Project not found')
      } else {
        let projectData = data.projectData
        if (data.schemaVersion < CURRENT_SCHEMA_VERSION) {
          projectData = migrateProjectData(projectData, data.schemaVersion)
        }
        setProjectData(projectData)
      }
      setLoading(false)
    }
    fetch()
  }, [user, projectId])

  if (authLoading || loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-sm text-[#555]">Loading editor...</p>
      </div>
    )
  }

  if (error || !projectData) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4">
        <p className="text-sm text-[#999]">{error || 'Something went wrong'}</p>
        <button
          onClick={() => router.push('/projects')}
          className="text-sm text-[#e8c4c0] hover:underline"
        >
          Back to projects
        </button>
      </div>
    )
  }

  return (
    <Builder
      initialProject={projectData}
      projectId={projectId}
      userId={user!.id}
      />
  )
}
