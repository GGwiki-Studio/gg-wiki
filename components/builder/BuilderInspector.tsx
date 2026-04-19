'use client'

import { ChangeEvent } from 'react'
import { Copy, Lock, LockOpen, Trash2 } from 'lucide-react'

import { BuilderInspectorProps, BuilderObject, StratTag } from './builder.types'

const Field = ({
  label,
  children,
}: {
  label: string
  children: React.ReactNode
}) => (
  <div className="flex flex-col gap-1">
    <span className="text-[10px] uppercase tracking-widest text-[#3a3a3a]">{label}</span>
    {children}
  </div>
)

const fieldCls =
  'h-7 w-full rounded border border-[#1e1e1e] bg-[#0d0d0d] px-2 text-xs text-[#bbb] outline-none focus:border-[#3b82f6] transition'

const Section = ({ label, children }: { label: string; children: React.ReactNode }) => (
  <div className="border-t border-[#181818] px-3 py-3">
    <p className="mb-2.5 text-[9px] uppercase tracking-widest text-[#383838]">{label}</p>
    <div className="flex flex-col gap-2">{children}</div>
  </div>
)

const BuilderInspector = ({
  selectedObject,
  tags,
  onUpdateMetadata,
  onDeleteObject,
  onDuplicateObject,
  onUpdateObject,
  onToggleObjectTag,
}: BuilderInspectorProps) => {
  if (!selectedObject) {
    return (
      <div className="flex h-full items-center justify-center px-4">
        <p className="text-center text-xs text-[#333]">
          Select an object on the canvas to edit its details.
        </p>
      </div>
    )
  }

  const handleMetadataChange = (field: 'label' | 'description', value: string) => {
    onUpdateMetadata(selectedObject.id, { [field]: value })
  }

  const handleCanvasChange = (
    field: 'x' | 'y' | 'width' | 'height' | 'rotation' | 'opacity' | 'zIndex',
    value: number
  ) => {
    const clamped: Record<string, number> = {
      x: Math.max(0, value),
      y: Math.max(0, value),
      width: Math.max(10, value),
      height: Math.max(10, value),
      rotation: ((value % 360) + 360) % 360,
      opacity: Math.min(1, Math.max(0, value)),
      zIndex: Math.max(0, Math.round(value)),
    }
    onUpdateObject(selectedObject.id, {
      canvas: { ...selectedObject.canvas, [field]: clamped[field] ?? value },
    } as Partial<BuilderObject>)
  }

  const handleStyleChange = (
    field: 'fill' | 'stroke' | 'strokeWidth',
    value: string | number
  ) => {
    onUpdateObject(selectedObject.id, {
      style: { ...selectedObject.style, [field]: value },
    } as Partial<BuilderObject>)
  }

  const handleToggleLocked = () => {
    onUpdateObject(selectedObject.id, {
      canvas: { ...selectedObject.canvas, locked: !selectedObject.canvas.locked },
    } as Partial<BuilderObject>)
  }

  const renderTagButton = (tag: StratTag) => {
    const isSelected = selectedObject.metadata.tagIds.includes(tag.id)
    return (
      <button
        key={tag.id}
        type="button"
        onClick={() => onToggleObjectTag(selectedObject.id, tag.id)}
        className="rounded-full border px-2.5 py-0.5 text-xs transition"
        style={{
          backgroundColor: isSelected ? tag.color : 'transparent',
          borderColor: isSelected ? tag.color : '#2a2a2a',
          color: isSelected ? '#fff' : '#666',
        }}
      >
        {tag.name}
      </button>
    )
  }

  const renderTypeSpecific = () => {
    switch (selectedObject.type) {
      case 'text':
        return (
          <Section label="text">
            <Field label="Content">
              <input
                className={fieldCls}
                value={selectedObject.text}
                onChange={(e) =>
                  onUpdateObject(selectedObject.id, { text: e.target.value } as Partial<BuilderObject>)
                }
              />
            </Field>
            <div className="grid grid-cols-2 gap-2">
              <Field label="Font size">
                <input
                  type="number"
                  className={fieldCls}
                  value={selectedObject.fontSize}
                  onChange={(e) =>
                    onUpdateObject(selectedObject.id, { fontSize: Number(e.target.value) } as Partial<BuilderObject>)
                  }
                />
              </Field>
              <Field label="Align">
                <select
                  className={fieldCls}
                  value={selectedObject.align}
                  onChange={(e: ChangeEvent<HTMLSelectElement>) =>
                    onUpdateObject(selectedObject.id, {
                      align: e.target.value as 'left' | 'center' | 'right',
                    } as Partial<BuilderObject>)
                  }
                >
                  <option value="left">Left</option>
                  <option value="center">Center</option>
                  <option value="right">Right</option>
                </select>
              </Field>
            </div>
          </Section>
        )

      case 'arrow':
        return (
          <Section label="arrow">
            <div className="grid grid-cols-2 gap-2">
              <Field label="Pointer length">
                <input
                  type="number"
                  className={fieldCls}
                  value={selectedObject.pointerLength}
                  onChange={(e) =>
                    onUpdateObject(selectedObject.id, { pointerLength: Number(e.target.value) } as Partial<BuilderObject>)
                  }
                />
              </Field>
              <Field label="Pointer width">
                <input
                  type="number"
                  className={fieldCls}
                  value={selectedObject.pointerWidth}
                  onChange={(e) =>
                    onUpdateObject(selectedObject.id, { pointerWidth: Number(e.target.value) } as Partial<BuilderObject>)
                  }
                />
              </Field>
            </div>
          </Section>
        )

      case 'rectangle':
        return (
          <Section label="rectangle">
            <Field label="Corner radius">
              <input
                type="number"
                className={fieldCls}
                value={selectedObject.cornerRadius}
                onChange={(e) =>
                  onUpdateObject(selectedObject.id, { cornerRadius: Number(e.target.value) } as Partial<BuilderObject>)
                }
              />
            </Field>
          </Section>
        )

      case 'icon':
      case 'image':
      case 'line':
      case 'ellipse':
      default:
        return null
    }
  }

  return (
    <div className="flex h-full flex-col overflow-y-auto">
      <div className="flex items-center justify-between px-3 py-2.5">
        <span className="text-[10px] uppercase tracking-widest text-[#444]">
          {selectedObject.type}
        </span>
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => onDuplicateObject(selectedObject.id)}
            className="flex h-6 w-6 items-center justify-center rounded text-[#555] transition hover:bg-[#1a1a1a] hover:text-[#aaa]"
            title="Duplicate"
          >
            <Copy size={12} />
          </button>
          <button
            type="button"
            onClick={handleToggleLocked}
            className="flex h-6 w-6 items-center justify-center rounded text-[#555] transition hover:bg-[#1a1a1a] hover:text-[#aaa]"
            title={selectedObject.canvas.locked ? 'Unlock' : 'Lock'}
          >
            {selectedObject.canvas.locked ? <Lock size={12} /> : <LockOpen size={12} />}
          </button>
          <button
            type="button"
            onClick={() => onDeleteObject(selectedObject.id)}
            className="flex h-6 w-6 items-center justify-center rounded text-[#884444] transition hover:bg-[#1a1010] hover:text-[#ef4444]"
            title="Delete"
          >
            <Trash2 size={12} />
          </button>
        </div>
      </div>

      <Section label="metadata">
        <Field label="Label">
          <input
            className={fieldCls}
            value={selectedObject.metadata.label}
            onChange={(e) => handleMetadataChange('label', e.target.value)}
            placeholder="Object label"
          />
        </Field>
        <Field label="Description">
          <textarea
            value={selectedObject.metadata.description}
            onChange={(e) => handleMetadataChange('description', e.target.value)}
            placeholder="Describe what this object means in the strat"
            rows={3}
            className="w-full resize-none rounded border border-[#1e1e1e] bg-[#0d0d0d] px-2 py-1.5 text-xs text-[#bbb] outline-none focus:border-[#3b82f6] transition"
          />
        </Field>
        {tags.length > 0 && (
          <Field label="Tags">
            <div className="flex flex-wrap gap-1.5">
              {tags.map(renderTagButton)}
            </div>
          </Field>
        )}
        {tags.length === 0 && (
          <p className="text-xs text-[#333]">No tags created yet.</p>
        )}
      </Section>

      {renderTypeSpecific()}

      <Section label="canvas">
        <div className="grid grid-cols-2 gap-2">
          <Field label="Width">
            <input type="number" className={fieldCls} value={Math.round(selectedObject.canvas.width)}
              onChange={(e) => handleCanvasChange('width', Number(e.target.value))} />
          </Field>
          <Field label="Height">
            <input type="number" className={fieldCls} value={Math.round(selectedObject.canvas.height)}
              onChange={(e) => handleCanvasChange('height', Number(e.target.value))} />
          </Field>
          <Field label="Rotation">
            <input type="number" className={fieldCls} value={Math.round(selectedObject.canvas.rotation)}
              onChange={(e) => handleCanvasChange('rotation', Number(e.target.value))} />
          </Field>
          <Field label="Opacity">
            <input type="number" step="0.1" min="0" max="1" className={fieldCls}
              value={selectedObject.canvas.opacity}
              onChange={(e) => handleCanvasChange('opacity', Number(e.target.value))} />
          </Field>
          <Field label="Layer order">
            <input type="number" className={fieldCls} value={selectedObject.canvas.zIndex}
              onChange={(e) => handleCanvasChange('zIndex', Number(e.target.value))} />
          </Field>
        </div>
      </Section>

      <Section label="style">
        <div className="grid grid-cols-2 gap-2">
          <Field label="Fill">
            <input className={fieldCls} value={selectedObject.style.fill}
              onChange={(e) => handleStyleChange('fill', e.target.value)} />
          </Field>
          <Field label="Stroke">
            <input className={fieldCls} value={selectedObject.style.stroke}
              onChange={(e) => handleStyleChange('stroke', e.target.value)} />
          </Field>
          <Field label="Stroke width">
            <input type="number" className={fieldCls} value={selectedObject.style.strokeWidth}
              onChange={(e) => handleStyleChange('strokeWidth', Number(e.target.value))} />
          </Field>
        </div>
      </Section>

      
    </div>
  )
}

export default BuilderInspector