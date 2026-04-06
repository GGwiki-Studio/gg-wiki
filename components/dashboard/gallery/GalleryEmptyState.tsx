'use client'

import { Package, Bookmark } from 'lucide-react'
import type { GalleryEmptyStateProps } from '../dashboard.types'

const EMPTY_STATES = {
  'my-strats': {
    icon: Package,
    title: 'No strats yet',
    description: 'Extract slides from your projects to create independent strats.',
    cta: 'Go to projects',
    href: '/projects',
  },
  'saved-strats': {
    icon: Bookmark,
    title: 'No saved strats',
    description: 'Strats you save from the community feed will appear here.',
    cta: null,
    href: null,
  },
} as const

export default function GalleryEmptyState({ tab }: GalleryEmptyStateProps) {
  const state = EMPTY_STATES[tab]
  const Icon = state.icon

  return (
    <div className="flex flex-col items-center justify-center py-20 text-center">
      <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full border border-dashed border-[#2a2a2a] bg-[#1a1a1a]">
        <Icon size={20} className="text-[#555]" />
      </div>
      <p className="text-sm font-medium text-[#999]">{state.title}</p>
      <p className="mt-1 max-w-xs text-xs text-[#555]">{state.description}</p>
      {state.cta && state.href && (
        <a
          href={state.href}
          className="mt-4 rounded-md border border-[#2a2a2a] bg-[#1e1e1e] px-4 py-2 text-xs text-[#ccc] transition hover:border-[#444] hover:text-[#eee]"
        >
          {state.cta}
        </a>
      )}
    </div>
  )
}