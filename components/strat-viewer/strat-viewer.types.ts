import type { BuilderObject } from '@/components/builder/builder.types'
import type { StratTag } from '@/components/builder/builder.types'
import type { StratSlideData } from './strat.types'

export interface StratViewerProps {
  slideData: StratSlideData
}

export interface HoveredObjectInfo {
  object: BuilderObject
  position: { x: number; y: number }
}

export interface StratViewerCanvasProps {
  slide: StratSlideData['slide']
  tags: StratTag[]
  icons: StratSlideData['icons']
  filterTagIds: string[]
  onHoverObject: (info: HoveredObjectInfo | null) => void
}

export interface StratViewerHoverTooltipProps {
  hoveredObject: HoveredObjectInfo | null
  tags: StratTag[]
  containerRef: React.RefObject<HTMLDivElement | null>
  onMouseEnter: () => void
  onMouseLeave: () => void
}

export interface StratViewerTagFilterProps {
  tags: StratTag[]
  activeTagIds: string[]
  onToggleTag: (tagId: string) => void
  onClearFilters: () => void
}
