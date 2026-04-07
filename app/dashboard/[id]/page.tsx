'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { toast } from 'sonner'
import useAuth from '@/components/hooks/useAuth'
import { getOwnedStrats, getSavedStrats, deleteStrat } from '@/lib/actions/strat.actions'
import type { StratListItem } from '@/components/strat-viewer/strat.types'
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

  // Dashboard state
  const [activeSection, setActiveSection] = useState<DashboardSection>('gallery')

  // Gallery state
  const [activeTab, setActiveTab] = useState<GalleryTab>('my-strats')
  const [ownedStrats, setOwnedStrats] = useState<StratListItem[]>([])
  const [savedStrats, setSavedStrats] = useState<StratListItem[]>([])
  const [loading, setLoading] = useState(true)

  // Delete dialog state
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; title: string } | null>(null)
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [deleteLoading, setDeleteLoading] = useState(false)

  // Auth guard
  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/registration')
    } else if (!authLoading && user && !user.email_confirmed_at) {
      router.push('/verify')
    } else if (!authLoading && user && user.id !== dashboardUserId) {
      router.push(`/dashboard/${user.id}`)
    }
  }, [authLoading, user, dashboardUserId, router])

  // Fetch strats
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

  // Handlers

  const handleViewStrat = (id: string) => {
    // Phase 5: open StratViewerDialog
    toast.info('Strat viewer coming soon')
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
      setDeleteOpen(false)
      toast.success('Strat deleted')
    }
    setDeleteLoading(false)
  }


  // Loading
  if (authLoading || loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <p className="text-sm text-[#555]">Loading...</p>
      </div>
    )
  }

  if (!user) return null

  return (
    <>
      <DashboardShell
        activeSection={activeSection}
        onSetActiveSection={setActiveSection}
      >
        {activeSection === 'gallery' && (
          <StratGallery
            ownedStrats={ownedStrats}
            savedStrats={savedStrats}
            activeTab={activeTab}
            onSetActiveTab={setActiveTab}
            onViewStrat={handleViewStrat}
            onDeleteStrat={handleDeleteStrat}
            
          />
        )}

        {activeSection === 'analytics' && (
          <div className="flex items-center justify-center py-20">
            <p className="text-sm text-[#555]">Analytics coming soon</p>
          </div>
        )}
      </DashboardShell>

      <DeleteStratDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        stratTitle={deleteTarget?.title || ''}
        onConfirm={handleDeleteConfirm}
        loading={deleteLoading}
      />
    </>
  )
}