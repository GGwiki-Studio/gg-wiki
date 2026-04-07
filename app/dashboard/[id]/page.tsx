'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { toast } from 'sonner'
import useAuth from '@/components/hooks/useAuth'
import { getOwnedStrats, getSavedStrats, deleteStrat, getStrat } from '@/lib/actions/strat.actions'
import type { StratListItem } from '@/components/strat-viewer/strat.types'
import type { StratSlideData } from '@/components/strat-viewer/strat.types'
import type { DashboardSection, GalleryTab } from '@/components/dashboard/dashboard.types'
import DashboardShell from '@/components/dashboard/DashboardShell'
import StratGallery from '@/components/dashboard/gallery/StratGallery'
import DeleteStratDialog from '@/components/dashboard/gallery/DeleteStratDialog'

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
      // collapse if the deleted strat was expanded
      if (expandedStratId === deleteTarget.id) {
        handleCollapseStrat()
      }
      toast.success('Strat deleted')
    }

    setDeleteLoading(false)
    setDeleteOpen(false)
    setDeleteTarget(null)
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
        expandedStratId={expandedStratId}
        expandedSlideData={expandedSlideData}
      />

      <DeleteStratDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        stratTitle={deleteTarget?.title ?? ''}
        onConfirm={handleDeleteConfirm}
        loading={deleteLoading}
      />
    </DashboardShell>
  )
}
