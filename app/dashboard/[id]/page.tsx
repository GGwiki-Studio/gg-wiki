'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { toast } from 'sonner'
import useAuth from '@/components/hooks/useAuth'
import { getOwnedStrats, getSavedStrats, deleteStrat, getStrat, renameStrat, toggleStratVisibility } from '@/lib/actions/strat.actions'
import type { StratListItem } from '@/components/strat-viewer/strat.types'
import type { StratSlideData } from '@/components/strat-viewer/strat.types'
import type { DashboardSection, GalleryTab } from '@/components/dashboard/dashboard.types'
import DashboardShell from '@/components/dashboard/DashboardShell'
import StratGallery from '@/components/dashboard/gallery/StratGallery'
import DeleteStratDialog from '@/components/dashboard/gallery/DeleteStratDialog'
import PublishStratDialog from '@/components/dashboard/gallery/PublishStratDialog'
import { client } from '@/api/client'

export default function DashboardPage() {
  const params = useParams()
  const dashboardUserId = params.id as string
  const router = useRouter()
  const auth = useAuth()
  const user = auth?.user
  const authLoading = auth?.loading

  const [activeSection, setActiveSection] = useState<DashboardSection>('gallery')
  const [activeTab, setActiveTab] = useState<GalleryTab>('my-strats')
  const [ownedStrats, setOwnedStrats] = useState<StratListItem[]>([])
  const [savedStrats, setSavedStrats] = useState<StratListItem[]>([])
  const [loading, setLoading] = useState(true)

  const [deleteTarget, setDeleteTarget] = useState<{ id: string; title: string } | null>(null)
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [deleteLoading, setDeleteLoading] = useState(false)

  // expand state
  const [expandedStratId, setExpandedStratId] = useState<string | null>(null)
  const [expandedSlideData, setExpandedSlideData] = useState<StratSlideData | null>(null)

  // publish state
  const [publishTarget, setPublishTarget] = useState<StratListItem | null>(null)
  const [publishOpen, setPublishOpen] = useState(false)
  const [publishedStratIds, setPublishedStratIds] = useState<Set<string>>(new Set())

  // auth guard
  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/registration')
    } else if (!authLoading && user && !user.email_confirmed_at) {
      router.push('/verify')
    } else if (!authLoading && user && user.id !== dashboardUserId) {
      router.push(`/dashboard/${user.id}`)
    }
  }, [authLoading, user, dashboardUserId, router])

  // fetch strats
  useEffect(() => {
    if (!user || user.id !== dashboardUserId) return

    const fetchStrats = async () => {
      setLoading(true)
      const [ownedResult, savedResult] = await Promise.all([
        getOwnedStrats(user.id),
        getSavedStrats(user.id),
      ])

      if (ownedResult.data) setOwnedStrats(ownedResult.data)
      if (savedResult.data) setSavedStrats(savedResult.data)
      if (ownedResult.error || savedResult.error) {
        toast.error('Failed to load some strats')
      }

      // fetch which strats have been published
      const { data: publishedRows } = await client
        .from('strategies')
        .select('strat_id')
        .eq('user_id', user.id)
        .not('strat_id', 'is', null)

      if (publishedRows) {
        setPublishedStratIds(new Set(publishedRows.map((r: any) => r.strat_id)))
      }

      setLoading(false)
    }

    fetchStrats()
  }, [user, dashboardUserId])

  // expand a card and fetch full strat data
  const handleExpandStrat = async (id: string) => {
    setExpandedStratId(id)
    setExpandedSlideData(null)

    const { data, error } = await getStrat(id, user!.id)
    if (error || !data) {
      toast.error('Failed to load strat')
      setExpandedStratId(null)
      return
    }

    setExpandedSlideData(data.slideData)
  }

  const handleCollapseStrat = () => {
    setExpandedStratId(null)
    setExpandedSlideData(null)
  }

  const handleDeleteStrat = (id: string) => {
    const strat = ownedStrats.find((s) => s.id === id)
    if (!strat) return
    setDeleteTarget({ id, title: strat.title })
    setDeleteOpen(true)
  }

  const handleDeleteConfirm = async () => {
    if (!user || !deleteTarget) return
    setDeleteLoading(true)
    const { error } = await deleteStrat(deleteTarget.id, user.id)

    if (error) {
      toast.error('Failed to delete strat')
    } else {
      setOwnedStrats((prev) => prev.filter((s) => s.id !== deleteTarget.id))
      if (expandedStratId === deleteTarget.id) {
        handleCollapseStrat()
      }
      toast.success('Strat deleted')
    }

    setDeleteLoading(false)
    setDeleteOpen(false)
    setDeleteTarget(null)
  }


  const handleRenameStrat = async (id: string, newTitle: string) => {
    if (!user) return

    const { error } = await renameStrat(id, user.id, newTitle)
    if (error) {
      toast.error('Failed to rename strat')
      return
    }

    setOwnedStrats((prev) =>
      prev.map((s) => (s.id === id ? { ...s, title: newTitle, updatedAt: new Date().toISOString() } : s))
    )
    toast.success('Strat renamed')
  }

  const handleToggleVisibility = async (id: string) => {
    if (!user) return

    const { data, error } = await toggleStratVisibility(id, user.id)
    if (error) {
      toast.error('Failed to update visibility')
      return
    }

    setOwnedStrats((prev) =>
      prev.map((s) => (s.id === id ? { ...s, visibility: data!.visibility, updatedAt: new Date().toISOString() } : s))
    )
    toast.success(data!.visibility === 'public' ? 'Strat set to public' : 'Strat set to private')
  }

  // publish
  const handlePublishStrat = (id: string) => {
    const strat = ownedStrats.find((s) => s.id === id)
    if (!strat) return
    setPublishTarget(strat)
    setPublishOpen(true)
  }

  const handlePublished = (strategyId: string, gameSlug: string, mapSlug: string) => {
    if (publishTarget) {
      setPublishedStratIds((prev) => new Set([...prev, publishTarget.id]))
    }
    router.push(`/games/${gameSlug}/maps/${mapSlug}/strategies/${strategyId}`)
  }

  // sync rename from publish dialog back to the list
  const handlePublishRenamed = (id: string, newTitle: string) => {
    setOwnedStrats((prev) =>
      prev.map((s) => (s.id === id ? { ...s, title: newTitle, updatedAt: new Date().toISOString() } : s))
    )
  }

  if (authLoading || loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-[#0e0e0e]">
        <span className="text-sm text-[#555]">Loading...</span>
      </div>
    )
  }

  return (
    <DashboardShell activeSection={activeSection} onSetActiveSection={setActiveSection}>
      <StratGallery
        ownedStrats={ownedStrats}
        savedStrats={savedStrats}
        activeTab={activeTab}
        onSetActiveTab={setActiveTab}
        onExpandStrat={handleExpandStrat}
        onCollapseStrat={handleCollapseStrat}
        onDeleteStrat={handleDeleteStrat}
        onRenameStrat={handleRenameStrat}
        onPublishStrat={handlePublishStrat}
        expandedStratId={expandedStratId}
        expandedSlideData={expandedSlideData}
        onToggleVisibility={handleToggleVisibility}
        publishedStratIds={publishedStratIds}
      />

      <DeleteStratDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        stratTitle={deleteTarget?.title ?? ''}
        onConfirm={handleDeleteConfirm}
        loading={deleteLoading}
      />

      <PublishStratDialog
        open={publishOpen}
        onOpenChange={setPublishOpen}
        strat={publishTarget}
        userId={user!.id}
        onPublished={handlePublished}
        onRenamed={handlePublishRenamed}
      />
    </DashboardShell>
  )
}