import type { BuilderSlide } from '@/components/builder/builder.types'
import type { StratTag, UploadedIcon } from '@/components/builder/builder.types'

// The self-contained JSONB stored in strats.slide_data
export interface StratSlideData {
  slide: BuilderSlide
  tags: StratTag[]
  icons: UploadedIcon[]
  schemaVersion: number
}

// Full row from strats table
export interface StratEntity {
  id: string
  userId: string
  title: string
  slideData: StratSlideData
  schemaVersion: number
  visibility: 'private' | 'public'
  savedFromFeed: boolean
  forkedFromId: string | null
  originalAuthorId: string | null
  thumbnailUrl: string | null
  createdAt: string
  updatedAt: string
}

// Lightweight version for listing in dashboard
export interface StratListItem {
  id: string
  title: string
  visibility: 'private' | 'public'
  savedFromFeed: boolean
  forkedFromId: string | null
  thumbnailUrl: string | null
  createdAt: string
  updatedAt: string
}