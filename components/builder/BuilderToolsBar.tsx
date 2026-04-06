'use client'

import {
  ArrowRight,
  Circle,
  Minus,
  MousePointer2,
  Square,
  Type,
} from 'lucide-react'

import { BuilderToolsBarProps, ToolType } from './builder.types'

const TOOLS: { value: ToolType; icon: React.ReactNode; label: string }[] = [
  { value: 'select',    icon: <MousePointer2 size={14} />, label: 'Select' },
  { value: 'text',      icon: <Type size={14} />,          label: 'Text' },
  { value: 'arrow',     icon: <ArrowRight size={14} />,    label: 'Arrow' },
  { value: 'rectangle', icon: <Square size={14} />,        label: 'Rectangle' },
  { value: 'ellipse',   icon: <Circle size={14} />,        label: 'Ellipse' },
  { value: 'line',      icon: <Minus size={14} />,         label: 'Line'},
]

const BuilderToolsBar = ({ activeTool, onSetActiveTool }: BuilderToolsBarProps) => {
  return (
    <div className="flex h-9 items-center gap-1 border-b border-[#1f1f1f] bg-[#111111] px-3">
      {TOOLS.map((tool, i) => {
        const isActive = activeTool === tool.value

        return (
          <div key={tool.value} className="flex items-center">
            {i === 1 && (
              <div className="mr-1 h-4 w-px bg-[#252525]" />
            )}
            <button
              type="button"
              onClick={() => onSetActiveTool(tool.value)}
              title={`${tool.label}`}
              className={`relative flex h-7 w-7 items-center justify-center rounded transition ${
                isActive
                  ? 'bg-[#1d3050] text-[#6ba3e0]'
                  : 'text-[#888] hover:bg-[#1a1a1a] hover:text-[#ccc]'
              }`}
            >
              {tool.icon}
            </button>
          </div>
        )
      })}
    </div>
  )
}

export default BuilderToolsBar