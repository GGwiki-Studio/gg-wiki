'use client'

import { DropdownMenu } from 'radix-ui'
import { Eye, MoreHorizontal, Trash2 } from 'lucide-react'
import type { StratGalleryCardProps } from '../dashboard.types'

function timeAgo(dateString: string): string {
  const now = Date.now()
  const then = new Date(dateString).getTime()
  const seconds = Math.floor((now - then) / 1000)

  if (seconds < 60) return 'just now'
  const minutes = Math.floor(seconds / 60)
  if (minutes < 60) return `${minutes}m ago`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.floor(hours / 24)
  if (days < 30) return `${days}d ago`
  const months = Math.floor(days / 30)
  return `${months}mo ago`
}

export default function StratGalleryCard({
  strat,
  owned,
  onView,
  onDelete,
}: StratGalleryCardProps) {
  const isPublic = strat.visibility === 'public'

  return (
    <div
      onClick={() => onView(strat.id)}
      className="group cursor-pointer overflow-hidden rounded-[10px] border border-[#2a2a2a] bg-[#1e1e1e] transition-colors hover:border-[#3a3a3a]"
    >
      {/* Thumbnail placeholder */}
      <div className="flex h-[100px] items-center justify-center overflow-hidden bg-[#252525]">
        <span className="text-xs text-[#555]">Strat preview</span>
      </div>

      <div className="p-3.5">
        <div className="mb-1.5 flex items-start justify-between">
          <h3 className="truncate text-sm font-medium text-[#ddd]">{strat.title}</h3>

          <DropdownMenu.Root>
            <DropdownMenu.Trigger asChild>
              <button
                onClick={(e) => e.stopPropagation()}
                className="shrink-0 rounded p-1 text-[#555] opacity-0 transition-opacity hover:text-[#999] group-hover:opacity-100"
              >
                <MoreHorizontal className="h-4 w-4" />
              </button>
            </DropdownMenu.Trigger>

            <DropdownMenu.Portal>
              <DropdownMenu.Content
                align="end"
                sideOffset={4}
                className="z-50 min-w-[160px] rounded-lg border border-[#2a2a2a] bg-[#1e1e1e] py-1 shadow-lg"
                onClick={(e) => e.stopPropagation()}
              >
                <DropdownMenu.Item
                  onSelect={() => onView(strat.id)}
                  className="flex cursor-pointer items-center gap-2 px-4 py-2 text-sm text-[#ccc] outline-none hover:bg-[#252525]"
                >
                  <Eye size={14} className="text-[#666]" />
                  View
                </DropdownMenu.Item>

                {owned && (
                  <>
                    <DropdownMenu.Separator className="my-1 h-px bg-[#2a2a2a]" />
                    <DropdownMenu.Item
                      onSelect={() => onDelete(strat.id)}
                      className="flex cursor-pointer items-center gap-2 px-4 py-2 text-sm text-red-400 outline-none hover:bg-[#252525]"
                    >
                      <Trash2 size={14} />
                      Delete
                    </DropdownMenu.Item>
                  </>
                )}

                {!owned && (
                  <DropdownMenu.Item
                    disabled
                    className="flex cursor-not-allowed items-center gap-2 px-4 py-2 text-sm text-[#555] outline-none"
                  >
                    Fork to editor (soon)
                  </DropdownMenu.Item>
                )}
              </DropdownMenu.Content>
            </DropdownMenu.Portal>
          </DropdownMenu.Root>
        </div>

        <div className="flex items-center justify-between">
          <span className="text-[11px] text-[#444]">{timeAgo(strat.updatedAt)}</span>
          {!owned && strat.forkedFromId && (
            <span className="rounded bg-[#1a1a2e] px-2 py-0.5 text-[10px] text-[#818cf8]">
              Forked
            </span>
          )}
        </div>
      </div>
    </div>
  )
}