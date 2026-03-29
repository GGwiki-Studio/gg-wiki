'use client'

import { BuilderTopBarProps } from './builder.types'

const BuilderTopBar = ({ projectTitle }: BuilderTopBarProps) => {
  return (
    <div className="flex h-9 items-center border-b border-[#1f1f1f] bg-[#111111] px-4">
      <div className="flex items-center gap-1.5 text-xs">
        <span className="text-[#555]">Strategy</span>
        <span className="text-[#333]">/</span>
        <span className="font-medium text-[#ccc]">
          {projectTitle || 'Untitled Strategy'}
        </span>
      </div>
      {/* future: undo redo save publish go here */}
    </div>
  )
}

export default BuilderTopBar