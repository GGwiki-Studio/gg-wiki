import type { StratListItem } from '@/components/strat-viewer/strat.types'

// Dashboard Shell

export type DashboardSection = 'gallery' | 'analytics'

export interface DashboardSectionConfig {
  id: DashboardSection
  label: string
  icon?: string
  disabled?: boolean
}

export interface DashboardShellProps {
  activeSection: DashboardSection
  onSetActiveSection: (section: DashboardSection) => void
  children: React.ReactNode
}

// Gallery

export type GalleryTab = 'my-strats' | 'saved-strats'

export interface StratGalleryProps {
  ownedStrats: StratListItem[]
  savedStrats: StratListItem[]
  activeTab: GalleryTab
  onSetActiveTab: (tab: GalleryTab) => void
  onViewStrat: (id: string) => void
  onDeleteStrat: (id: string) => void
}

export interface GalleryTabsProps {
  activeTab: GalleryTab
  onSetActiveTab: (tab: GalleryTab) => void
  ownedCount: number
  savedCount: number
}

export interface GalleryToolbarProps {
  activeTab: GalleryTab
}

export interface StratGalleryCardProps {
  strat: StratListItem
  owned: boolean
  onView: (id: string) => void
  onDelete: (id: string) => void
}

export interface GalleryEmptyStateProps {
  tab: GalleryTab
}

// Dialogs

export interface DeleteStratDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  stratTitle: string
  onConfirm: () => void
  loading: boolean
}

export interface StratViewerDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  stratId: string | null
}
