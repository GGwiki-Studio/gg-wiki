import type { BuilderObject } from '@/components/builder/builder.types'
import type { StratTag } from '@/components/builder/builder.types'
import type { StratSlideData } from './strat.types'

export interface StratViewerProps {
  slideData: StratSlideData
}

export interface SelectedObjectInfo {
  object: BuilderObject
  position: { x: number; y: number }
}

export interface StratViewerCanvasProps {
  slide: StratSlideData['slide']
  tags: StratTag[]
  filterTagIds: string[]
  onSelectObject: (info: SelectedObjectInfo | null) => void
}

export interface StratViewerTooltipProps {
  selectedObject: SelectedObjectInfo | null
  tags: StratTag[]
  containerRef: React.RefObject<HTMLDivElement | null>
  onDismiss: () => void
}

export interface StratViewerTagFilterProps {
  tags: StratTag[]
  activeTagIds: string[]
  onToggleTag: (tagId: string) => void
  onClearFilters: () => void
}
