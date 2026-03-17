'use client'

import { ChangeEvent } from 'react'
import { Copy, Lock, LockOpen, Trash2 } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

import { BuilderInspectorProps, BuilderObject, StratTag } from './builder.types'

interface ExtendedBuilderInspectorProps extends BuilderInspectorProps {
  onDeleteObject: (objectId: string) => void
  onDuplicateObject: (objectId: string) => void
  onUpdateObject: (objectId: string, updates: Partial<BuilderObject>) => void
  onToggleObjectTag: (objectId: string, tagId: string) => void
}

const BuilderInspector = ({
  selectedObject,
  tags,
  onUpdateMetadata,
  onDeleteObject,
  onDuplicateObject,
  onUpdateObject,
  onToggleObjectTag,
}: ExtendedBuilderInspectorProps) => {
  if (!selectedObject) {
    return (
      <aside className="rounded-2xl border border-[#2a2a2a] bg-[#111111] p-4">
        <h2 className="text-base font-semibold text-white">Inspector</h2>
        <p className="mt-2 text-sm text-gray-400">
          Select an object on the canvas to edit its details.
        </p>
      </aside>
    )
  }

  const handleMetadataChange = (
    field: 'label' | 'description',
    value: string
  ) => {
    onUpdateMetadata(selectedObject.id, {
      [field]: value,
    })
  }

  const handleCanvasChange = (
    field:
      | 'x'
      | 'y'
      | 'width'
      | 'height'
      | 'rotation'
      | 'opacity'
      | 'zIndex',
    value: number
  ) => {
    onUpdateObject(selectedObject.id, {
      canvas: {
        ...selectedObject.canvas,
        [field]: value,
      },
    } as Partial<BuilderObject>)
  }

  const handleStyleChange = (
    field: 'fill' | 'stroke' | 'strokeWidth',
    value: string | number
  ) => {
    onUpdateObject(selectedObject.id, {
      style: {
        ...selectedObject.style,
        [field]: value,
      },
    } as Partial<BuilderObject>)
  }

  const handleToggleLocked = () => {
    onUpdateObject(selectedObject.id, {
      canvas: {
        ...selectedObject.canvas,
        locked: !selectedObject.canvas.locked,
      },
    } as Partial<BuilderObject>)
  }

  const renderTagButton = (tag: StratTag) => {
    const isSelected = selectedObject.metadata.tagIds.includes(tag.id)

    return (
      <button
        key={tag.id}
        type="button"
        onClick={() => onToggleObjectTag(selectedObject.id, tag.id)}
        className={`rounded-full border px-3 py-1 text-xs font-medium transition ${
          isSelected
            ? 'border-white text-white'
            : 'border-[#2d2d2d] text-gray-300'
        }`}
        style={{
          backgroundColor: isSelected ? tag.color : 'transparent',
        }}
      >
        {tag.name}
      </button>
    )
  }

  const renderTypeSpecificFields = () => {
    switch (selectedObject.type) {
      case 'text':
        return (
          <>
            <div>
              <label className="mb-2 block text-xs font-medium uppercase tracking-wide text-gray-400">
                Text
              </label>
              <Input
                value={selectedObject.text}
                onChange={(e) =>
                  onUpdateObject(selectedObject.id, {
                    text: e.target.value,
                  } as Partial<BuilderObject>)
                }
                className="border-[#2d2d2d] bg-[#101010] text-white"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="mb-2 block text-xs font-medium uppercase tracking-wide text-gray-400">
                  Font Size
                </label>
                <Input
                  type="number"
                  value={selectedObject.fontSize}
                  onChange={(e) =>
                    onUpdateObject(selectedObject.id, {
                      fontSize: Number(e.target.value),
                    } as Partial<BuilderObject>)
                  }
                  className="border-[#2d2d2d] bg-[#101010] text-white"
                />
              </div>

              <div>
                <label className="mb-2 block text-xs font-medium uppercase tracking-wide text-gray-400">
                  Align
                </label>
                <select
                  value={selectedObject.align}
                  onChange={(e: ChangeEvent<HTMLSelectElement>) =>
                    onUpdateObject(selectedObject.id, {
                      align: e.target.value as 'left' | 'center' | 'right',
                    } as Partial<BuilderObject>)
                  }
                  className="h-10 w-full rounded-md border border-[#2d2d2d] bg-[#101010] px-3 text-white"
                >
                  <option value="left">Left</option>
                  <option value="center">Center</option>
                  <option value="right">Right</option>
                </select>
              </div>
            </div>
          </>
        )

      case 'arrow':
        return (
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-2 block text-xs font-medium uppercase tracking-wide text-gray-400">
                Pointer Length
              </label>
              <Input
                type="number"
                value={selectedObject.pointerLength}
                onChange={(e) =>
                  onUpdateObject(selectedObject.id, {
                    pointerLength: Number(e.target.value),
                  } as Partial<BuilderObject>)
                }
                className="border-[#2d2d2d] bg-[#101010] text-white"
              />
            </div>

            <div>
              <label className="mb-2 block text-xs font-medium uppercase tracking-wide text-gray-400">
                Pointer Width
              </label>
              <Input
                type="number"
                value={selectedObject.pointerWidth}
                onChange={(e) =>
                  onUpdateObject(selectedObject.id, {
                    pointerWidth: Number(e.target.value),
                  } as Partial<BuilderObject>)
                }
                className="border-[#2d2d2d] bg-[#101010] text-white"
              />
            </div>
          </div>
        )

      case 'rectangle':
        return (
          <div>
            <label className="mb-2 block text-xs font-medium uppercase tracking-wide text-gray-400">
              Corner Radius
            </label>
            <Input
              type="number"
              value={selectedObject.cornerRadius}
              onChange={(e) =>
                onUpdateObject(selectedObject.id, {
                  cornerRadius: Number(e.target.value),
                } as Partial<BuilderObject>)
              }
              className="border-[#2d2d2d] bg-[#101010] text-white"
            />
          </div>
        )

      case 'line':
        return (
          <div className="rounded-xl border border-[#2d2d2d] bg-[#171717] p-3 text-xs text-gray-400">
            Line points will later be editable directly from canvas handles.
          </div>
        )

      case 'image':
        return (
          <div className="rounded-xl border border-[#2d2d2d] bg-[#171717] p-3 text-xs text-gray-400">
            Image source comes from uploaded asset or map attachment.
          </div>
        )

      case 'icon':
        return (
          <div className="rounded-xl border border-[#2d2d2d] bg-[#171717] p-3 text-xs text-gray-400">
            Icon source comes from the project icon palette.
          </div>
        )

      case 'ellipse':
      default:
        return null
    }
  }

  return (
    <aside className="rounded-2xl border border-[#2a2a2a] bg-[#111111] p-4">
      <div className="mb-4 flex items-start justify-between gap-2">
        <div>
          <h2 className="text-base font-semibold text-white">Inspector</h2>
          <p className="text-xs text-gray-400">
            Type: <span className="font-medium text-white">{selectedObject.type}</span>
          </p>
        </div>

        <div className="flex gap-2">
          <Button
            type="button"
            onClick={() => onDuplicateObject(selectedObject.id)}
            className="cursor-pointer bg-[#1d2735] text-white hover:bg-[#263349]"
          >
            <Copy size={14} />
          </Button>

          <Button
            type="button"
            onClick={handleToggleLocked}
            className="cursor-pointer bg-[#222222] text-white hover:bg-[#303030]"
          >
            {selectedObject.canvas.locked ? <Lock size={14} /> : <LockOpen size={14} />}
          </Button>

          <Button
            type="button"
            onClick={() => onDeleteObject(selectedObject.id)}
            className="cursor-pointer bg-[#3a1f1f] text-white hover:bg-[#522727]"
          >
            <Trash2 size={14} />
          </Button>
        </div>
      </div>

      <div className="space-y-4">
        <div className="rounded-xl border border-[#2d2d2d] bg-[#171717] p-3">
          <div className="mb-3 text-xs font-medium uppercase tracking-wide text-gray-400">
            Metadata
          </div>

          <div className="space-y-3">
            <div>
              <label className="mb-2 block text-xs font-medium uppercase tracking-wide text-gray-400">
                Label
              </label>
              <Input
                value={selectedObject.metadata.label}
                onChange={(e) => handleMetadataChange('label', e.target.value)}
                placeholder="Object label"
                className="border-[#2d2d2d] bg-[#101010] text-white"
              />
            </div>

            <div>
              <label className="mb-2 block text-xs font-medium uppercase tracking-wide text-gray-400">
                Description
              </label>
              <textarea
                value={selectedObject.metadata.description}
                onChange={(e) =>
                  handleMetadataChange('description', e.target.value)
                }
                placeholder="Describe what this object means in the strat"
                className="min-h-[100px] w-full rounded-md border border-[#2d2d2d] bg-[#101010] px-3 py-2 text-sm text-white outline-none"
              />
            </div>

            <div>
              <label className="mb-2 block text-xs font-medium uppercase tracking-wide text-gray-400">
                Tags
              </label>

              {tags.length === 0 ? (
                <div className="rounded-lg border border-dashed border-[#333333] bg-[#121212] px-3 py-3 text-xs text-gray-400">
                  No tags created yet.
                </div>
              ) : (
                <div className="flex flex-wrap gap-2">{tags.map(renderTagButton)}</div>
              )}

              {/* Future idea:
                  Add filtering by tag in the object list / canvas layer panel. */}
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-[#2d2d2d] bg-[#171717] p-3">
          <div className="mb-3 text-xs font-medium uppercase tracking-wide text-gray-400">
            Canvas
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-2 block text-xs font-medium uppercase tracking-wide text-gray-400">
                X
              </label>
              <Input
                type="number"
                value={selectedObject.canvas.x}
                onChange={(e) => handleCanvasChange('x', Number(e.target.value))}
                className="border-[#2d2d2d] bg-[#101010] text-white"
              />
            </div>

            <div>
              <label className="mb-2 block text-xs font-medium uppercase tracking-wide text-gray-400">
                Y
              </label>
              <Input
                type="number"
                value={selectedObject.canvas.y}
                onChange={(e) => handleCanvasChange('y', Number(e.target.value))}
                className="border-[#2d2d2d] bg-[#101010] text-white"
              />
            </div>

            <div>
              <label className="mb-2 block text-xs font-medium uppercase tracking-wide text-gray-400">
                Width
              </label>
              <Input
                type="number"
                value={selectedObject.canvas.width}
                onChange={(e) =>
                  handleCanvasChange('width', Number(e.target.value))
                }
                className="border-[#2d2d2d] bg-[#101010] text-white"
              />
            </div>

            <div>
              <label className="mb-2 block text-xs font-medium uppercase tracking-wide text-gray-400">
                Height
              </label>
              <Input
                type="number"
                value={selectedObject.canvas.height}
                onChange={(e) =>
                  handleCanvasChange('height', Number(e.target.value))
                }
                className="border-[#2d2d2d] bg-[#101010] text-white"
              />
            </div>

            <div>
              <label className="mb-2 block text-xs font-medium uppercase tracking-wide text-gray-400">
                Rotation
              </label>
              <Input
                type="number"
                value={selectedObject.canvas.rotation}
                onChange={(e) =>
                  handleCanvasChange('rotation', Number(e.target.value))
                }
                className="border-[#2d2d2d] bg-[#101010] text-white"
              />
            </div>

            <div>
              <label className="mb-2 block text-xs font-medium uppercase tracking-wide text-gray-400">
                Opacity
              </label>
              <Input
                type="number"
                step="0.1"
                min="0"
                max="1"
                value={selectedObject.canvas.opacity}
                onChange={(e) =>
                  handleCanvasChange('opacity', Number(e.target.value))
                }
                className="border-[#2d2d2d] bg-[#101010] text-white"
              />
            </div>

            <div className="col-span-2">
              <label className="mb-2 block text-xs font-medium uppercase tracking-wide text-gray-400">
                Layer Order
              </label>
              <Input
                type="number"
                value={selectedObject.canvas.zIndex}
                onChange={(e) =>
                  handleCanvasChange('zIndex', Number(e.target.value))
                }
                className="border-[#2d2d2d] bg-[#101010] text-white"
              />
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-[#2d2d2d] bg-[#171717] p-3">
          <div className="mb-3 text-xs font-medium uppercase tracking-wide text-gray-400">
            Style
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-2 block text-xs font-medium uppercase tracking-wide text-gray-400">
                Fill
              </label>
              <Input
                value={selectedObject.style.fill}
                onChange={(e) => handleStyleChange('fill', e.target.value)}
                className="border-[#2d2d2d] bg-[#101010] text-white"
              />
            </div>

            <div>
              <label className="mb-2 block text-xs font-medium uppercase tracking-wide text-gray-400">
                Stroke
              </label>
              <Input
                value={selectedObject.style.stroke}
                onChange={(e) => handleStyleChange('stroke', e.target.value)}
                className="border-[#2d2d2d] bg-[#101010] text-white"
              />
            </div>

            <div className="col-span-2">
              <label className="mb-2 block text-xs font-medium uppercase tracking-wide text-gray-400">
                Stroke Width
              </label>
              <Input
                type="number"
                value={selectedObject.style.strokeWidth}
                onChange={(e) =>
                  handleStyleChange('strokeWidth', Number(e.target.value))
                }
                className="border-[#2d2d2d] bg-[#101010] text-white"
              />
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-[#2d2d2d] bg-[#171717] p-3">
          <div className="mb-3 text-xs font-medium uppercase tracking-wide text-gray-400">
            Object-Specific
          </div>

          <div className="space-y-3">{renderTypeSpecificFields()}</div>
        </div>
      </div>
    </aside>
  )
}

export default BuilderInspector