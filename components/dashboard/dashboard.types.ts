import type { StratListItem } from '@/components/strat-viewer/strat.types'
import type { StratSlideData } from '@/components/strat-viewer/strat.types'

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
  onExpandStrat: (id: string) => void
  onCollapseStrat: () => void
  onDeleteStrat: (id: string) => void
  onExportStrat: (id: string) => void
  onRenameStrat: (id: string, newTitle: string) => void
  onPublishStrat: (id: string) => void
  onToggleVisibility: (id: string) => void
  publishedStratIds: Set<string>
  expandedStratId: string | null
  expandedSlideData: StratSlideData | null
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
  expanded: boolean
  slideData: StratSlideData | null
  isPublished: boolean
  onExpand: (id: string) => void
  onCollapse: () => void
  onDelete: (id: string) => void
  onExport: (id: string) => void
  onRename: (id: string, newTitle: string) => void
  onPublish: (id: string) => void
  onToggleVisibility: (id: string) => void
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