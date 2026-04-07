'use client'

import { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react'
import type Konva from 'konva'
import {
  Arrow as KonvaArrow,
  Ellipse,
  Image as KonvaImage,
  Layer,
  Line,
  Rect,
  Stage,
  Text as KonvaText,
} from 'react-konva'

import type { BuilderObject, IconBuilderObject, ImageBuilderObject } from '@/components/builder/builder.types'
import type { StratViewerCanvasProps } from './strat-viewer.types'

const STAGE_WIDTH = 1100
const STAGE_HEIGHT = 700

function useLoadedImage(src: string | null) {
  const [image, setImage] = useState<HTMLImageElement | null>(null)

  useEffect(() => {
    if (!src) { setImage(null); return }

    const img = new window.Image()
    img.crossOrigin = 'anonymous'
    img.onload = () => setImage(img)
    img.src = src

    return () => { img.onload = null; img.src = '' }
  }, [src])

  return image
}

function useContainerWidth(ref: React.RefObject<HTMLDivElement | null>): number {
  const [width, setWidth] = useState(STAGE_WIDTH)

  useEffect(() => {
    const el = ref.current
    if (!el) return

    setWidth(el.getBoundingClientRect().width)

    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) setWidth(entry.contentRect.width)
    })

    observer.observe(el)
    return () => observer.disconnect()
  }, [ref])

  return width
}

// read-only image/icon renderer
const ViewerImageObject = memo(({
  object,
  opacity,
  isHovered,
  onMouseEnter,
  onMouseLeave,
}: {
  object: ImageBuilderObject | IconBuilderObject
  opacity: number
  isHovered: boolean
  onMouseEnter: () => void
  onMouseLeave: () => void
}) => {
  const image = useLoadedImage(object.src)
  if (!image) return null

  return (
    <KonvaImage
      image={image}
      x={object.canvas.x}
      y={object.canvas.y}
      width={object.canvas.width}
      height={object.canvas.height}
      rotation={object.canvas.rotation}
      opacity={opacity}
      visible={object.canvas.visible}
      draggable={false}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      shadowEnabled={isHovered}
      shadowColor={isHovered ? '#fff' : undefined}
      shadowBlur={isHovered ? 10 : 0}
    />
  )
})

ViewerImageObject.displayName = 'ViewerImageObject'

export default function StratViewerCanvas({
  slide,
  tags,
  icons,
  filterTagIds,
  onHoverObject,
}: StratViewerCanvasProps) {
  const containerRef = useRef<HTMLDivElement | null>(null)
  const stageRef = useRef<Konva.Stage | null>(null)
  const [hoveredObjectId, setHoveredObjectId] = useState<string | null>(null)

  const containerWidth = useContainerWidth(containerRef)
  const stageScale = containerWidth / STAGE_WIDTH
  const scaledStageHeight = STAGE_HEIGHT * stageScale

  const backgroundImage = useLoadedImage(slide.backgroundImage)

  const sortedObjects = useMemo(
    () => [...slide.objects].sort((a, b) => a.canvas.zIndex - b.canvas.zIndex),
    [slide.objects]
  )

  // which objects match the active tag filter
  const objectMatchesFilter = useCallback((obj: BuilderObject): boolean => {
    if (filterTagIds.length === 0) return true
    return obj.metadata.tagIds.some((id) => filterTagIds.includes(id))
  }, [filterTagIds])

  const handleMouseEnter = useCallback((obj: BuilderObject) => {
    setHoveredObjectId(obj.id)

    const stage = stageRef.current
    if (!stage) return

    const pos = stage.getPointerPosition()
    if (!pos) return

    onHoverObject({
      object: obj,
      position: { x: pos.x, y: pos.y },
    })
  }, [onHoverObject])

  const handleMouseLeave = useCallback(() => {
    setHoveredObjectId(null)
    onHoverObject(null)
  }, [onHoverObject])

  const renderObject = useCallback((object: BuilderObject) => {
    if (!object.canvas.visible) return null

    const matches = objectMatchesFilter(object)
    const dimmed = filterTagIds.length > 0 && !matches
    const opacity = dimmed ? 0.15 : object.canvas.opacity
    const isHovered = hoveredObjectId === object.id

    const commonProps = {
      x: object.canvas.x,
      y: object.canvas.y,
      rotation: object.canvas.rotation,
      opacity,
      draggable: false,
      onMouseEnter: () => handleMouseEnter(object),
      onMouseLeave: handleMouseLeave,
      shadowEnabled: isHovered && !dimmed,
      shadowColor: isHovered ? '#fff' : undefined,
      shadowBlur: isHovered ? 10 : 0,
      listening: !dimmed,
    }

    switch (object.type) {
      case 'rectangle':
        return (
          <Rect
            key={object.id}
            {...commonProps}
            width={object.canvas.width}
            height={object.canvas.height}
            fill={object.style.fill}
            stroke={object.style.stroke}
            strokeWidth={object.style.strokeWidth}
            cornerRadius={object.cornerRadius}
            perfectDrawEnabled={false}
            shadowForStrokeEnabled={false}
          />
        )

      case 'ellipse':
        return (
          <Ellipse
            key={object.id}
            {...commonProps}
            radiusX={object.canvas.width / 2}
            radiusY={object.canvas.height / 2}
            fill={object.style.fill}
            stroke={object.style.stroke}
            strokeWidth={object.style.strokeWidth}
            offsetX={-object.canvas.width / 2}
            offsetY={-object.canvas.height / 2}
            perfectDrawEnabled={false}
            shadowForStrokeEnabled={false}
          />
        )

      case 'text':
        return (
          <KonvaText
            key={object.id}
            {...commonProps}
            text={object.text}
            width={object.canvas.width}
            height={object.canvas.height}
            fontSize={object.fontSize}
            fontFamily={object.fontFamily}
            align={object.align}
            fill={object.style.fill}
            shadowForStrokeEnabled={false}
          />
        )

      case 'arrow':
        return (
          <KonvaArrow
            key={object.id}
            {...commonProps}
            points={[0, object.canvas.height / 2, object.canvas.width, object.canvas.height / 2]}
            pointerLength={object.pointerLength}
            pointerWidth={object.pointerWidth}
            stroke={object.style.stroke}
            fill={object.style.fill}
            strokeWidth={object.style.strokeWidth}
            hitStrokeWidth={24}
            perfectDrawEnabled={false}
            shadowForStrokeEnabled={false}
          />
        )

      case 'line':
        return (
          <Line
            key={object.id}
            {...commonProps}
            points={[0, object.canvas.height / 2, object.canvas.width, object.canvas.height / 2]}
            stroke={object.style.stroke}
            strokeWidth={object.style.strokeWidth}
            hitStrokeWidth={24}
            perfectDrawEnabled={false}
            shadowForStrokeEnabled={false}
          />
        )

      case 'image':
      case 'icon':
        return (
          <ViewerImageObject
            key={object.id}
            object={object}
            opacity={opacity}
            isHovered={isHovered && !dimmed}
            onMouseEnter={() => handleMouseEnter(object)}
            onMouseLeave={handleMouseLeave}
          />
        )

      default:
        return null
    }
  }, [hoveredObjectId, filterTagIds, objectMatchesFilter, handleMouseEnter, handleMouseLeave])

  return (
    <div ref={containerRef} className="w-full overflow-hidden bg-[#111]">
      <Stage
        ref={stageRef}
        width={containerWidth}
        height={scaledStageHeight}
        scale={{ x: stageScale, y: stageScale }}
      >
        <Layer>
          {backgroundImage && (
            <KonvaImage
              image={backgroundImage}
              x={0}
              y={0}
              width={STAGE_WIDTH}
              height={STAGE_HEIGHT}
              listening={false}
            />
          )}
          {sortedObjects.map(renderObject)}
        </Layer>
      </Stage>
    </div>
  )
}
