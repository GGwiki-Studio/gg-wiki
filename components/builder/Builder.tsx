'use client'

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react'
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
  Transformer,
} from 'react-konva'

import BuilderInspector from './BuilderInspector'
import BuilderSidebar from './BuilderSidebar'
import BuilderToolbar from './BuilderToolbar'
import {
  BuilderObject,
  BuilderObjectType,
  BuilderProject,
  BuilderSlide,
  IconBuilderObject,
  ImageBuilderObject,
  ToolType,
  UploadedIcon,
} from './builder.types'
import {
  createDefaultObject,
  createDefaultProject,
  createDefaultSlide,
  createDefaultTag,
  createUploadedIcon,
  duplicateObject,
  duplicateSlide,
  findSlideById,
  getNowIso,
} from './builder.utils'

/* =========================================================
   CONFIG
========================================================= */

const STAGE_WIDTH = 1100
const STAGE_HEIGHT = 700

/* =========================================================
   IMAGE LOADER
========================================================= */

function useLoadedImage(src: string | null) {
  const [image, setImage] = useState<HTMLImageElement | null>(null)

  useEffect(() => {
    if (!src) {
      setImage(null)
      return
    }

    const img = new window.Image()
    img.crossOrigin = 'anonymous'
    img.onload = () => setImage(img)
    img.src = src

    return () => {
      img.onload = null
    }
  }, [src])

  return image
}

/* =========================================================
   HELPERS
========================================================= */

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max)
}

function readFileAsDataUrl(file: File) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader()

    reader.onload = () => {
      if (typeof reader.result === 'string') {
        resolve(reader.result)
      } else {
        reject(new Error('Failed to read file'))
      }
    }

    reader.onerror = () => reject(new Error('Failed to read file'))
    reader.readAsDataURL(file)
  })
}

function getPointerPosition(stage: Konva.Stage | null) {
  if (!stage) {
    return { x: 120, y: 120 }
  }

  const pointer = stage.getPointerPosition()
  if (!pointer) {
    return { x: 120, y: 120 }
  }

  return pointer
}

function sortObjectsByLayer(objects: BuilderObject[]) {
  return [...objects].sort((a, b) => a.canvas.zIndex - b.canvas.zIndex)
}



/* =========================================================
   CANVAS OBJECT IMAGE
========================================================= */

const CanvasImageObject = ({
  object,
  isSelected,
  onSelect,
  onDragEnd,
  onTransformEnd,
  nodeRef,
}: {
  object: ImageBuilderObject | IconBuilderObject
  isSelected: boolean
  onSelect: () => void
  onDragEnd: (x: number, y: number) => void
  onTransformEnd: (node: Konva.Image) => void
  nodeRef: (node: Konva.Image | null) => void
}) => {
  const image = useLoadedImage(object.src)

  if (!image) return null

  return (
    <KonvaImage
      ref={nodeRef}
      image={image}
      x={object.canvas.x}
      y={object.canvas.y}
      width={object.canvas.width}
      height={object.canvas.height}
      rotation={object.canvas.rotation}
      opacity={object.canvas.opacity}
      visible={object.canvas.visible}
      draggable={!object.canvas.locked}
      onClick={onSelect}
      onTap={onSelect}
      onDragEnd={(e) => onDragEnd(e.target.x(), e.target.y())}
      onTransformEnd={(e) => onTransformEnd(e.target as Konva.Image)}
      shadowEnabled={isSelected}
      shadowColor={isSelected ? '#60a5fa' : undefined}
      shadowBlur={isSelected ? 12 : 0}
    />
  )
}

/* =========================================================
   MAIN BUILDER
========================================================= */

const Builder = () => {
  /* -----------------------------
     STATE
  ----------------------------- */
  const [project, setProject] = useState<BuilderProject>(() => createDefaultProject())
  const [activeTool, setActiveTool] = useState<ToolType>('select')
  const [selectedObjectId, setSelectedObjectId] = useState<string | null>(null)

  /* -----------------------------
     REFS
  ----------------------------- */
  const stageRef = useRef<Konva.Stage | null>(null)
  const transformerRef = useRef<Konva.Transformer | null>(null)
  const objectNodeMapRef = useRef<Record<string, Konva.Node | null>>({})

  /* -----------------------------
     DERIVED
  ----------------------------- */
  const activeSlide = useMemo(
    () => findSlideById(project.slides, project.activeSlideId),
    [project.slides, project.activeSlideId]
  )

  const selectedObject = useMemo(
    () => activeSlide?.objects.find((object) => object.id === selectedObjectId) ?? null,
    [activeSlide, selectedObjectId]
  )

  const sortedObjects = useMemo(
    () => sortObjectsByLayer(activeSlide?.objects ?? []),
    [activeSlide?.objects]
  )

  const backgroundImage = useLoadedImage(activeSlide?.backgroundImage ?? null)

  /* -----------------------------
     PROJECT / SLIDE HELPERS
  ----------------------------- */
  const updateProject = useCallback((updater: (prev: BuilderProject) => BuilderProject) => {
    setProject((prev) => {
      const next = updater(prev)
      return {
        ...next,
        updatedAt: getNowIso(),
      }
    })
  }, [])

  const updateActiveSlide = useCallback(
    (updater: (slide: BuilderSlide) => BuilderSlide) => {
      updateProject((prev) => {
        if (!prev.activeSlideId) return prev

        return {
          ...prev,
          slides: prev.slides.map((slide) => {
            if (slide.id !== prev.activeSlideId) return slide
            return {
              ...updater(slide),
              updatedAt: getNowIso(),
            }
          }),
        }
      })
    },
    [updateProject]
  )

  const updateObjectInActiveSlide = useCallback(
    (objectId: string, updater: (object: BuilderObject) => BuilderObject) => {
      updateActiveSlide((slide) => ({
        ...slide,
        objects: slide.objects.map((object) =>
          object.id === objectId
            ? {
                ...updater(object),
                updatedAt: getNowIso(),
              }
            : object
        ),
      }))
    },
    [updateActiveSlide]
  )

  /* -----------------------------
     TOOL / TRANSFORMER
  ----------------------------- */
  useEffect(() => {
    const transformer = transformerRef.current
    if (!transformer) return

    if (!selectedObjectId) {
      transformer.nodes([])
      transformer.getLayer()?.batchDraw()
      return
    }

    const node = objectNodeMapRef.current[selectedObjectId]
    if (!node) {
      transformer.nodes([])
      transformer.getLayer()?.batchDraw()
    return
    }


    transformer.nodes([node])
    transformer.getLayer()?.batchDraw()
  }, [selectedObjectId, selectedObject])
  
  const transformerAnchors =
  selectedObject?.type === 'line' || selectedObject?.type === 'arrow'
    ? ['middle-left', 'middle-right']
    : [
        'top-left',
        'top-center',
        'top-right',
        'middle-right',
        'bottom-right',
        'bottom-center',
        'bottom-left',
        'middle-left',
      ]

  /* -----------------------------
     SLIDE ACTIONS
  ----------------------------- */
  const handleSelectSlide = (slideId: string) => {
    setSelectedObjectId(null)
    updateProject((prev) => ({
      ...prev,
      activeSlideId: slideId,
    }))
  }

  const handleAddSlide = () => {
    const nextSlide = createDefaultSlide({
      name: `Slide ${project.slides.length + 1}`,
    })

    setSelectedObjectId(null)

    updateProject((prev) => ({
      ...prev,
      slides: [...prev.slides, nextSlide],
      activeSlideId: nextSlide.id,
    }))
  }

  const handleRenameSlide = (slideId: string, newName: string) => {
    updateProject((prev) => ({
      ...prev,
      slides: prev.slides.map((slide) =>
        slide.id === slideId ? { ...slide, name: newName, updatedAt: getNowIso() } : slide
      ),
    }))
  }

  const handleDuplicateSlide = (slideId: string) => {
    updateProject((prev) => {
      const source = prev.slides.find((slide) => slide.id === slideId)
      if (!source) return prev

      const copy = duplicateSlide(source)

      return {
        ...prev,
        slides: [...prev.slides, copy],
        activeSlideId: copy.id,
      }
    })

    setSelectedObjectId(null)
  }

  const handleDeleteSlide = (slideId: string) => {
    updateProject((prev) => {
      if (prev.slides.length === 1) return prev

      const nextSlides = prev.slides.filter((slide) => slide.id !== slideId)
      const nextActiveSlideId =
        prev.activeSlideId === slideId
          ? nextSlides[0]?.id ?? null
          : prev.activeSlideId

      return {
        ...prev,
        slides: nextSlides,
        activeSlideId: nextActiveSlideId,
      }
    })

    setSelectedObjectId(null)
  }

  /* -----------------------------
     TAG ACTIONS
  ----------------------------- */
  const handleCreateTag = (name: string, color: string) => {
    updateProject((prev) => ({
      ...prev,
      tags: [...prev.tags, createDefaultTag(name, color)],
    }))
  }

  const handleDeleteTag = (tagId: string) => {
    updateProject((prev) => ({
      ...prev,
      tags: prev.tags.filter((tag) => tag.id !== tagId),
      slides: prev.slides.map((slide) => ({
        ...slide,
        objects: slide.objects.map((object) => ({
          ...object,
          metadata: {
            ...object.metadata,
            tagIds: object.metadata.tagIds.filter((id) => id !== tagId),
          },
        })),
      })),
    }))
  }

  /* -----------------------------
     ICON ACTIONS
  ----------------------------- */
  const handleUploadIcon = async (file: File) => {
    const src = await readFileAsDataUrl(file)

    updateProject((prev) => ({
      ...prev,
      uploadedIcons: [
        ...prev.uploadedIcons,
        createUploadedIcon({
          name: file.name.replace(/\.[^/.]+$/, ''),
          src,
          fileName: file.name,
        }),
      ],
    }))
  }

  const handleDeleteIcon = (iconId: string) => {
    updateProject((prev) => ({
      ...prev,
      uploadedIcons: prev.uploadedIcons.filter((icon) => icon.id !== iconId),
      slides: prev.slides.map((slide) => ({
        ...slide,
        objects: slide.objects.filter(
          (object) => !(object.type === 'icon' && object.iconId === iconId)
        ),
      })),
    }))

    if (selectedObject?.type === 'icon' && selectedObject.iconId === iconId) {
      setSelectedObjectId(null)
    }
  }

  const handleInsertIcon = (icon: UploadedIcon) => {
    if (!activeSlide) return

    const nextZIndex =
      activeSlide.objects.length > 0
        ? Math.max(...activeSlide.objects.map((obj) => obj.canvas.zIndex)) + 1
        : 1

    const nextObject = createDefaultObject('icon', {
      metadata: {
        label: icon.name,
        description: '',
        tagIds: [],
      },
      iconId: icon.id,
      src: icon.src,
      assetName: icon.name,
      canvas: {
        x: 120,
        y: 120,
        width: 48,
        height: 48,
        rotation: 0,
        opacity: 1,
        visible: true,
        locked: false,
        zIndex: nextZIndex,
        scaleX: 1,
        scaleY: 1,
      },
    } as Partial<BuilderObject>) as IconBuilderObject

    updateActiveSlide((slide) => ({
      ...slide,
      objects: [...slide.objects, nextObject],
    }))

    setSelectedObjectId(nextObject.id)
    setActiveTool('select')
  }

  /* -----------------------------
     BACKGROUND ACTIONS
  ----------------------------- */
  const handleUploadBackground = async (file: File) => {
    const src = await readFileAsDataUrl(file)

    updateActiveSlide((slide) => ({
      ...slide,
      backgroundImage: src,
    }))
  }

  const handleClearBackground = () => {
    updateActiveSlide((slide) => ({
      ...slide,
      backgroundImage: null,
    }))
  }

  /* -----------------------------
     OBJECT ACTIONS
  ----------------------------- */
  const handleCreateObjectAt = (type: BuilderObjectType, x: number, y: number) => {
    if (!activeSlide) return

    const nextZIndex =
      activeSlide.objects.length > 0
        ? Math.max(...activeSlide.objects.map((obj) => obj.canvas.zIndex)) + 1
        : 1

    const overrides: Partial<BuilderObject> = {
      canvas: {
        x,
        y,
        width: 120,
        height: 80,
        rotation: 0,
        opacity: 1,
        visible: true,
        locked: false,
        zIndex: nextZIndex,
        scaleX: 1,
        scaleY: 1,
      },
      metadata: {
        label: '',
        description: '',
        tagIds: [],
      },
    }

    if (type === 'text') {
      overrides.metadata = {
        label: 'Text',
        description: '',
        tagIds: [],
      }
    }

    const object = createDefaultObject(type, overrides)

    updateActiveSlide((slide) => ({
      ...slide,
      objects: [...slide.objects, object],
    }))

    setSelectedObjectId(object.id)
    setActiveTool('select')
  }

  const handleDeleteObject = (objectId: string) => {
    updateActiveSlide((slide) => ({
      ...slide,
      objects: slide.objects.filter((object) => object.id !== objectId),
    }))

    if (selectedObjectId === objectId) {
      setSelectedObjectId(null)
    }
  }

  const handleDuplicateObject = (objectId: string) => {
    if (!activeSlide) return

    const source = activeSlide.objects.find((object) => object.id === objectId)
    if (!source) return

    const copy = duplicateObject(source)

    updateActiveSlide((slide) => ({
      ...slide,
      objects: [...slide.objects, copy],
    }))

    setSelectedObjectId(copy.id)
  }

  const handleUpdateMetadata = (
    objectId: string,
    updates: Partial<BuilderObject['metadata']>
  ) => {
    updateObjectInActiveSlide(objectId, (object) => ({
      ...object,
      metadata: {
        ...object.metadata,
        ...updates,
      },
    }))
  }

  const handleUpdateObject = (objectId: string, updates: Partial<BuilderObject>) => {
    updateObjectInActiveSlide(objectId, (object) => ({
      ...object,
      ...updates,
    }) as BuilderObject)
  }

  const handleToggleObjectTag = (objectId: string, tagId: string) => {
    updateObjectInActiveSlide(objectId, (object) => {
      const exists = object.metadata.tagIds.includes(tagId)

      return {
        ...object,
        metadata: {
          ...object.metadata,
          tagIds: exists
            ? object.metadata.tagIds.filter((id) => id !== tagId)
            : [...object.metadata.tagIds, tagId],
        },
      }
    })
  }

  const handleSelectObject = (objectId: string) => {
    setSelectedObjectId(objectId)
    setActiveTool('select')
  }

  const handleDragObject = (objectId: string, x: number, y: number) => {
    updateObjectInActiveSlide(objectId, (object) => ({
      ...object,
      canvas: {
        ...object.canvas,
        x: clamp(x, 0, STAGE_WIDTH),
        y: clamp(y, 0, STAGE_HEIGHT),
      },
    }))
  }

  const handleTransformObject = (objectId: string, node: Konva.Node) => {
    const object = activeSlide?.objects.find((item) => item.id === objectId)
    if (!object) return

    const scaleX = node.scaleX()
    const scaleY = node.scaleY()

    const nextWidth = Math.max(10, object.canvas.width * scaleX)
    const nextHeight = Math.max(10, object.canvas.height * scaleY)

    node.scaleX(1)
    node.scaleY(1)

    updateObjectInActiveSlide(objectId, (prev) => ({
      ...prev,
      canvas: {
        ...prev.canvas,
        x: node.x(),
        y: node.y(),
        rotation: node.rotation(),
        width: nextWidth,
        height: nextHeight,
        scaleX: 1,
        scaleY: 1,
      },
    }))
  }

  /* -----------------------------
     STAGE INTERACTION
  ----------------------------- */
  const handleStageMouseDown = (e: Konva.KonvaEventObject<MouseEvent>) => {
    const stage = stageRef.current
    const clickedOnEmpty = e.target === e.target.getStage()

    if (clickedOnEmpty) {
      setSelectedObjectId(null)

      if (activeTool !== 'select' && activeTool !== 'icon' && activeTool !== 'image') {
        const pointer = getPointerPosition(stage)
        handleCreateObjectAt(activeTool as BuilderObjectType, pointer.x, pointer.y)
      }
    }
  }

  /* -----------------------------
     RENDER HELPERS
  ----------------------------- */
  const renderObject = (object: BuilderObject) => {
    const isSelected = selectedObjectId === object.id
    const commonProps = {
      ref: (node: Konva.Node | null) => {
        objectNodeMapRef.current[object.id] = node
      },
      x: object.canvas.x,
      y: object.canvas.y,
      rotation: object.canvas.rotation,
      opacity: object.canvas.opacity,
      visible: object.canvas.visible,
      draggable: !object.canvas.locked,
      onClick: () => handleSelectObject(object.id),
      onTap: () => handleSelectObject(object.id),
      onDragEnd: (e: Konva.KonvaEventObject<DragEvent>) => {
        handleDragObject(object.id, e.target.x(), e.target.y())
      },
      shadowEnabled: isSelected,
      shadowColor: isSelected ? '#60a5fa' : undefined,
      shadowBlur: isSelected ? 10 : 0,
      onTransformEnd: (e: Konva.KonvaEventObject<Event>) => {
        handleTransformObject(object.id, e.target)
      },
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
          />
        )

      case 'image':
      case 'icon':
        return (
          <CanvasImageObject
            key={object.id}
            object={object}
            isSelected={isSelected}
            onSelect={() => handleSelectObject(object.id)}
            onDragEnd={(x, y) => handleDragObject(object.id, x, y)}
            onTransformEnd={(node) => handleTransformObject(object.id, node)}
            nodeRef={(node) => {
              objectNodeMapRef.current[object.id] = node
            }}
          />
        )

      default:
        return null
    }
  }

  /* -----------------------------
     RENDER
  ----------------------------- */
  return (
    <div className="flex w-full flex-col gap-4">
      <BuilderToolbar
        activeSlide={activeSlide}
        activeTool={activeTool}
        onSetActiveTool={setActiveTool}
        onUploadBackground={handleUploadBackground}
        onClearBackground={handleClearBackground}
        onAddSlide={handleAddSlide}
      />

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-[320px_1fr_340px]">
        <BuilderSidebar
          slides={project.slides}
          activeSlideId={project.activeSlideId}
          tags={project.tags}
          icons={project.uploadedIcons}
          onSelectSlide={handleSelectSlide}
          onAddSlide={handleAddSlide}
          onRenameSlide={handleRenameSlide}
          onDuplicateSlide={handleDuplicateSlide}
          onDeleteSlide={handleDeleteSlide}
          onCreateTag={handleCreateTag}
          onDeleteTag={handleDeleteTag}
          onUploadIcon={handleUploadIcon}
          onDeleteIcon={handleDeleteIcon}
          onInsertIcon={handleInsertIcon}
        />

        <section className="rounded-2xl border border-[#2a2a2a] bg-[#111111] p-4">
          <div className="mb-3">
            <h2 className="text-base font-semibold text-white">Canvas</h2>
            <p className="text-xs text-gray-400">
              Click empty space with a tool selected to place an object.
            </p>
          </div>

          <div className="overflow-auto rounded-xl border border-[#2d2d2d] bg-[#171717] p-3">
            <Stage
              ref={stageRef}
              width={STAGE_WIDTH}
              height={STAGE_HEIGHT}
              className="rounded-lg bg-[#101010]"
              onMouseDown={handleStageMouseDown}
            >
              <Layer>
                {backgroundImage ? (
                  <KonvaImage
                    image={backgroundImage}
                    x={0}
                    y={0}
                    width={STAGE_WIDTH}
                    height={STAGE_HEIGHT}
                    listening={false}
                  />
                ) : null}

                {sortedObjects.map(renderObject)}

                <Transformer
                  ref={transformerRef}
                  rotateEnabled
                  enabledAnchors={transformerAnchors}
                  anchorSize={12}
                />
              </Layer>
            </Stage>
          </div>

          <div className="mt-4 rounded-xl border border-[#2d2d2d] bg-[#171717] p-3 text-xs text-gray-400">
            Current tool: <span className="font-medium text-white">{activeTool}</span>
            <br />
            Objects on active slide:{' '}
            <span className="font-medium text-white">
              {activeSlide?.objects.length ?? 0}
            </span>
          </div>
        </section>

        <BuilderInspector
          selectedObject={selectedObject}
          tags={project.tags}
          onUpdateMetadata={handleUpdateMetadata}
          onDeleteObject={handleDeleteObject}
          onDuplicateObject={handleDuplicateObject}
          onUpdateObject={handleUpdateObject}
          onToggleObjectTag={handleToggleObjectTag}
        />
      </div>
    </div>
  )
}

export default Builder