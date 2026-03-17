'use client'

import { ChangeEvent, useRef } from 'react'
import {
  ImagePlus,
  Layers3,
  Trash2,
  Type,
  ArrowRight,
  Square,
  Circle,
  Minus,
  Map,
} from 'lucide-react'

import { Button } from '@/components/ui/button'

import { BuilderToolbarProps, ToolType } from './builder.types'

interface ExtendedBuilderToolbarProps extends BuilderToolbarProps {
  activeTool: ToolType
  onSetActiveTool: (tool: ToolType) => void
}

const BuilderToolbar = ({
  activeSlide,
  activeTool,
  onSetActiveTool,
  onUploadBackground,
  onClearBackground,
  onAddSlide,
}: ExtendedBuilderToolbarProps) => {
  const fileInputRef = useRef<HTMLInputElement | null>(null)

  const handleTriggerUpload = () => {
    fileInputRef.current?.click()
  }

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    onUploadBackground(file)
    e.target.value = ''
  }

  const toolButtons: {
    value: ToolType
    label: string
    icon: React.ReactNode
  }[] = [
    { value: 'select', label: 'Select', icon: <Layers3 size={15} /> },
    { value: 'text', label: 'Text', icon: <Type size={15} /> },
    { value: 'arrow', label: 'Arrow', icon: <ArrowRight size={15} /> },
    { value: 'rectangle', label: 'Box', icon: <Square size={15} /> },
    { value: 'ellipse', label: 'Circle', icon: <Circle size={15} /> },
    { value: 'line', label: 'Line', icon: <Minus size={15} /> },
  ]

  return (
    <section className="rounded-2xl border border-[#2a2a2a] bg-[#111111] p-4">
      <div className="flex flex-col gap-4">
        <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
          <div>
            <h1 className="text-lg font-semibold text-white">Builder Toolbar</h1>
            <p className="text-xs text-gray-400">
              Manage slide background, slides, and drawing tools
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              onClick={onAddSlide}
              className="cursor-pointer bg-blue-600 text-white hover:bg-blue-700"
            >
              Add Slide
            </Button>

            <Button
              type="button"
              onClick={handleTriggerUpload}
              className="cursor-pointer bg-[#1d2735] text-white hover:bg-[#263349]"
              disabled={!activeSlide}
            >
              <ImagePlus size={15} className="mr-2" />
              Upload Map
            </Button>

            <Button
              type="button"
              onClick={onClearBackground}
              className="cursor-pointer bg-[#3a1f1f] text-white hover:bg-[#522727]"
              disabled={!activeSlide || !activeSlide.backgroundImage}
            >
              <Trash2 size={15} className="mr-2" />
              Clear Map
            </Button>
          </div>
        </div>

        <input
          ref={fileInputRef}
          type="file"
          accept="image/png,image/jpeg,image/jpg,image/webp"
          onChange={handleFileChange}
          className="hidden"
        />

        <div className="rounded-xl border border-[#2d2d2d] bg-[#171717] p-3">
          <div className="mb-2 text-xs font-medium uppercase tracking-wide text-gray-400">
            Active Slide
          </div>

          {activeSlide ? (
            <div className="flex flex-col gap-1 text-sm">
              <span className="font-semibold text-white">{activeSlide.name}</span>
              <span className="text-gray-400">
                {activeSlide.backgroundImage ? 'Map image added' : 'No map image yet'}
              </span>
            </div>
          ) : (
            <div className="text-sm text-gray-400">No active slide selected</div>
          )}
        </div>

        <div className="rounded-xl border border-[#2d2d2d] bg-[#171717] p-3">
          <div className="mb-3 text-xs font-medium uppercase tracking-wide text-gray-400">
            Tools
          </div>

          <div className="flex flex-wrap gap-2">
            {toolButtons.map((tool) => {
              const isActive = activeTool === tool.value

              return (
                <Button
                  key={tool.value}
                  type="button"
                  onClick={() => onSetActiveTool(tool.value)}
                  className={`cursor-pointer ${
                    isActive
                      ? 'bg-blue-600 text-white hover:bg-blue-700'
                      : 'bg-[#222222] text-white hover:bg-[#303030]'
                  }`}
                >
                  <span className="mr-2">{tool.icon}</span>
                  {tool.label}
                </Button>
              )
            })}
          </div>

          <div className="mt-3 text-xs text-gray-400">
            
          </div>
        </div>
      </div>
    </section>
  )
}

export default BuilderToolbar