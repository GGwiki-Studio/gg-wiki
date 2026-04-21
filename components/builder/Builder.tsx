'use client'

import { toast } from 'sonner'
import { saveProject } from '@/lib/actions/project.actions'
import { convertBase64ToStorageUrls } from './builder.storage-utils'
import { CURRENT_SCHEMA_VERSION } from '@/lib/schema/builder/schema-migration'
import { uploadBase64Asset } from '@/lib/storage/project-storage'

import { extractStrats } from '@/lib/actions/strat.actions'
import ExtractConfirmDialog from './ExtractConfirmDialog'

import { client } from '@/api/client'

import {
  memo,
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
import BuilderLayersPanel from './BuilderLayersPanel'
import BuilderTopBar from './BuilderTopBar'
import BuilderSlideStrip from './BuilderSlideStrip'
import BuilderToolsBar from './BuilderToolsBar'
import BuilderRightPanel from './BuilderRightPanel'
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
  clamp,
  createDefaultObject,
  createDefaultProject,
  createDefaultSlide,
  createDefaultTag,
  createIconPaletteGroup,
  createUploadedIcon,
  duplicateObject,
  duplicateSlide,
  findSlideById,
  getNowIso,
  validateBackgroundFile,
  validateIconFile,
} from './builder.utils'



const STAGE_WIDTH = 1100
const STAGE_HEIGHT = 700

// Zoom constants — purely for the viewport, never baked into saved data
const MIN_ZOOM = 0.25
const MAX_ZOOM = 3
const ZOOM_STEP = 0.15

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

function useContainerSize(ref: React.RefObject<HTMLDivElement | null>): { width: number; height: number } {
  const [size, setSize] = useState({ width: STAGE_WIDTH, height: STAGE_HEIGHT })

  useEffect(() => {
    const el = ref.current
    if (!el) return

    const update = () => {
      const rect = el.getBoundingClientRect()
      setSize({ width: rect.width, height: rect.height })
    }
    update()

    const observer = new ResizeObserver(update)
    observer.observe(el)
    return () => observer.disconnect()
  }, [ref])

  return size
}

function readFileAsDataUrl(file: File) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => {
      if (typeof reader.result === 'string') resolve(reader.result)
      else reject(new Error('Failed to read file'))
    }
    reader.onerror = () => reject(new Error('Failed to read file'))
    reader.readAsDataURL(file)
  })
}

const CanvasImageObject = memo(({
  object,
  isSelected,
  onSelect,
  onDragEnd,
  onTransformEnd,
  objectNodeMapRef,
}: {
  object: ImageBuilderObject | IconBuilderObject
  isSelected: boolean
  onSelect: (objectId: string) => void
  onDragEnd: (objectId: string, x: number, y: number) => void
  onTransformEnd: (objectId: string, node: Konva.Node) => void
  objectNodeMapRef: React.MutableRefObject<Record<string, Konva.Node | null>>
}) => {
  const image = useLoadedImage(object.src)

  const handleSelect = useCallback(() => onSelect(object.id), [onSelect, object.id])
  const handleDragEnd = useCallback((e: Konva.KonvaEventObject<DragEvent>) => {
    onDragEnd(object.id, e.target.x(), e.target.y())
  }, [onDragEnd, object.id])
  const handleTransformEnd = useCallback((e: Konva.KonvaEventObject<Event>) => {
    onTransformEnd(object.id, e.target as Konva.Node)
  }, [onTransformEnd, object.id])
  const handleRef = useCallback((node: Konva.Image | null) => {
    objectNodeMapRef.current[object.id] = node
  }, [objectNodeMapRef, object.id])

  if (!image) return null

  return (
    <KonvaImage
      ref={handleRef}
      image={image}
      x={object.canvas.x}
      y={object.canvas.y}
      width={object.canvas.width}
      height={object.canvas.height}
      rotation={object.canvas.rotation}
      opacity={object.canvas.opacity}
      visible={object.canvas.visible}
      draggable={!object.canvas.locked}
      onClick={handleSelect}
      onTap={handleSelect}
      onDragEnd={handleDragEnd}
      onTransformEnd={handleTransformEnd}
      shadowEnabled={isSelected}
      shadowColor={isSelected ? '#60a5fa' : undefined}
      shadowBlur={isSelected ? 12 : 0}
    />
  )
})

CanvasImageObject.displayName = 'CanvasImageObject'

interface BuilderProps {
  initialProject?: BuilderProject
  projectId?: string
  userId?: string
}

const Builder = ({ initialProject, projectId, userId }: BuilderProps) => {
  const [project, setProject] = useState<BuilderProject>(() => initialProject ?? createDefaultProject())

  const [activeTool, setActiveTool] = useState<ToolType>('select')
  const [selectedObjectId, setSelectedObjectId] = useState<string | null>(null)
  const [rightPanelTab, setRightPanelTab] = useState<'assets' | 'inspector' | 'tags'>('assets')
  const [filterTagIds, setFilterTagIds] = useState<string[]>([])

  const [isSaving, setIsSaving] = useState(false)
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false)

  const [selectedSlideIds, setSelectedSlideIds] = useState<string[]>([])
  const [extractOpen, setExtractOpen] = useState(false)
  const [extractLoading, setExtractLoading] = useState(false)

  // ─── Viewport state ───────────────────────────────────────────────────────
  // These are purely visual; they are NEVER saved or extracted.
  // The Konva Stage always renders at STAGE_WIDTH × STAGE_HEIGHT in logical
  // coordinates. We just move the camera via scale + position props.
  const [viewZoom, setViewZoom] = useState(1)
  const [viewOffset, setViewOffset] = useState({ x: 0, y: 0 })

  // Panning via middle-mouse or alt+left-drag
  const isPanning = useRef(false)
  const panStart = useRef({ x: 0, y: 0 })
  const panOffsetStart = useRef({ x: 0, y: 0 })
  // ──────────────────────────────────────────────────────────────────────────

  const skipDirtyRef = useRef(false)
  const stageRef = useRef<Konva.Stage | null>(null)
  const transformerRef = useRef<Konva.Transformer | null>(null)
  const objectNodeMapRef = useRef<Record<string, Konva.Node | null>>({})
  const canvasContainerRef = useRef<HTMLDivElement | null>(null)

  const containerSize = useContainerSize(canvasContainerRef)

  const activeSlide = useMemo(
    () => findSlideById(project.slides, project.activeSlideId),
    [project.slides, project.activeSlideId]
  )

  const selectedObject = useMemo(
    () => activeSlide?.objects.find((o) => o.id === selectedObjectId) ?? null,
    [activeSlide, selectedObjectId]
  )

  const sortedObjects = useMemo(
    () => [...(activeSlide?.objects ?? [])].sort((a, b) => a.canvas.zIndex - b.canvas.zIndex),
    [activeSlide?.objects]
  )

  const visibleObjects = useMemo(() => {
    if (filterTagIds.length === 0) return sortedObjects
    return sortedObjects.filter((obj) =>
      obj.metadata.tagIds.some((id) => filterTagIds.includes(id))
    )
  }, [sortedObjects, filterTagIds])

  const backgroundImage = useLoadedImage(activeSlide?.backgroundImage ?? null)

  // ─── fit-to-view helper ───────────────────────────────────────────────────
  const fitView = useCallback(() => {
    const cw = containerSize.width
    const ch = containerSize.height
    if (cw <= 0 || ch <= 0) return
    const scale = Math.min(cw / STAGE_WIDTH, ch / STAGE_HEIGHT, 1)
    const x = (cw - STAGE_WIDTH * scale) / 2
    const y = (ch - STAGE_HEIGHT * scale) / 2
    setViewZoom(scale)
    setViewOffset({ x, y })
  }, [containerSize.width, containerSize.height])

  // Auto-fit when the container resizes
  useEffect(() => {
    fitView()
  }, [containerSize.width, containerSize.height])

  // Auto-fit when a new background map is uploaded
  const prevBgRef = useRef<string | null>(null)
  useEffect(() => {
    const bg = activeSlide?.backgroundImage ?? null
    if (bg !== prevBgRef.current) {
      prevBgRef.current = bg
      if (bg) fitView()
    }
  }, [activeSlide?.backgroundImage, fitView])

  // ─── zoom helpers ─────────────────────────────────────────────────────────
  const zoomAroundPoint = useCallback((nextZoom: number, pivotX: number, pivotY: number) => {
    setViewZoom((z) => {
      const clamped = Math.min(Math.max(nextZoom, MIN_ZOOM), MAX_ZOOM)
      setViewOffset((off) => ({
        x: pivotX - (pivotX - off.x) * (clamped / z),
        y: pivotY - (pivotY - off.y) * (clamped / z),
      }))
      return clamped
    })
  }, [])

  const handleZoomIn = useCallback(() => {
    const cx = containerSize.width / 2
    const cy = containerSize.height / 2
    setViewZoom((z) => {
      const next = Math.min(z + ZOOM_STEP, MAX_ZOOM)
      setViewOffset((off) => ({
        x: cx - (cx - off.x) * (next / z),
        y: cy - (cy - off.y) * (next / z),
      }))
      return next
    })
  }, [containerSize.width, containerSize.height])

  const handleZoomOut = useCallback(() => {
    const cx = containerSize.width / 2
    const cy = containerSize.height / 2
    setViewZoom((z) => {
      const next = Math.max(z - ZOOM_STEP, MIN_ZOOM)
      setViewOffset((off) => ({
        x: cx - (cx - off.x) * (next / z),
        y: cy - (cy - off.y) * (next / z),
      }))
      return next
    })
  }, [containerSize.width, containerSize.height])

  // Ctrl/Cmd + scroll to zoom
  const handleWheel = useCallback((e: React.WheelEvent<HTMLDivElement>) => {
    if (!e.ctrlKey && !e.metaKey) return
    e.preventDefault()
    const rect = canvasContainerRef.current?.getBoundingClientRect()
    if (!rect) return
    const mouseX = e.clientX - rect.left
    const mouseY = e.clientY - rect.top
    const delta = e.deltaY > 0 ? -ZOOM_STEP : ZOOM_STEP
    setViewZoom((z) => {
      const next = Math.min(Math.max(z + delta, MIN_ZOOM), MAX_ZOOM)
      setViewOffset((off) => ({
        x: mouseX - (mouseX - off.x) * (next / z),
        y: mouseY - (mouseY - off.y) * (next / z),
      }))
      return next
    })
  }, [])

  // Alt+left-drag or middle-mouse pan
  const handleContainerMouseDown = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (e.button === 1 || (e.button === 0 && e.altKey)) {
      e.preventDefault()
      isPanning.current = true
      panStart.current = { x: e.clientX, y: e.clientY }
      panOffsetStart.current = { ...viewOffset }
    }
  }, [viewOffset])

  const handleContainerMouseMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (!isPanning.current) return
    const dx = e.clientX - panStart.current.x
    const dy = e.clientY - panStart.current.y
    setViewOffset({
      x: panOffsetStart.current.x + dx,
      y: panOffsetStart.current.y + dy,
    })
  }, [])

  const handleContainerMouseUp = useCallback(() => {
    isPanning.current = false
  }, [])
  // ──────────────────────────────────────────────────────────────────────────

  useEffect(() => {
    if (selectedObjectId) setRightPanelTab('inspector')
  }, [selectedObjectId])

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

  const transformerAnchors = useMemo(
    () =>
      selectedObject?.type === 'line' || selectedObject?.type === 'arrow'
        ? ['middle-left', 'middle-right']
        : ['top-left', 'top-center', 'top-right', 'middle-right', 'bottom-right', 'bottom-center', 'bottom-left', 'middle-left'],
    [selectedObject?.type]
  )

  // ─── project / slide updaters ─────────────────────────────────────────────
  const updateProject = useCallback((updater: (prev: BuilderProject) => BuilderProject) => {
    setProject((prev) => ({ ...updater(prev), updatedAt: getNowIso() }))
    if (!skipDirtyRef.current) {
      setHasUnsavedChanges(true)
    }
  }, [])

  const updateActiveSlide = useCallback(
    (updater: (slide: BuilderSlide) => BuilderSlide) => {
      updateProject((prev) => {
        if (!prev.activeSlideId) return prev
        return {
          ...prev,
          slides: prev.slides.map((slide) =>
            slide.id !== prev.activeSlideId
              ? slide
              : { ...updater(slide), updatedAt: getNowIso() }
          ),
        }
      })
    },
    [updateProject]
  )

  const updateObjectInActiveSlide = useCallback(
    (objectId: string, updater: (object: BuilderObject) => BuilderObject) => {
      updateActiveSlide((slide) => ({
        ...slide,
        objects: slide.objects.map((o) =>
          o.id === objectId ? { ...updater(o), updatedAt: getNowIso() } : o
        ),
      }))
    },
    [updateActiveSlide]
  )

  // ─── save — always resets view to 1:1 before capturing thumbnail ──────────
  const handleSave = useCallback(async (): Promise<boolean> => {
    if (!projectId || !userId || isSaving) return false

    setIsSaving(true)
    try {
      // Temporarily snap stage to 1:1 so toDataURL captures the full canvas
      if (stageRef.current) {
        stageRef.current.scale({ x: 1, y: 1 })
        stageRef.current.position({ x: 0, y: 0 })
        stageRef.current.batchDraw()
      }

      const thumbnail = stageRef.current?.toDataURL({ pixelRatio: 0.5 }) || null

      // Restore viewport
      if (stageRef.current) {
        stageRef.current.scale({ x: viewZoom, y: viewZoom })
        stageRef.current.position(viewOffset)
        stageRef.current.batchDraw()
      }

      let thumbnailUrl: string | null = null
      if (thumbnail) {
        const match = thumbnail.match(/^data:([^;]+);base64,(.+)$/)
        if (match) {
          const path = `${userId}/${projectId}/thumbnail_${Date.now()}.png`
          const byteChars = atob(match[2])
          const byteArray = new Uint8Array(byteChars.length)
          for (let i = 0; i < byteChars.length; i++) byteArray[i] = byteChars.charCodeAt(i)
          const blob = new Blob([byteArray], { type: 'image/png' })

          await client.storage.from('project-assets').upload(path, blob, {
            contentType: 'image/png',
            upsert: true,
            cacheControl: '0',
          })
          const { data } = client.storage.from('project-assets').getPublicUrl(path)
          thumbnailUrl = `${data.publicUrl}?t=${Date.now()}`
        }
      }

      const converted = await convertBase64ToStorageUrls(project, userId, projectId)

      const { error } = await saveProject(projectId, userId, converted, CURRENT_SCHEMA_VERSION, thumbnailUrl)
      if (error) {
        toast.error('Failed to save project')
        setIsSaving(false)
        return false
      }
      skipDirtyRef.current = true
      setProject(converted)
      skipDirtyRef.current = false
      setHasUnsavedChanges(false)
      toast.success('Project saved')
      setIsSaving(false)
      return true
    } catch {
      toast.error('Failed to save project')
      setIsSaving(false)
      return false
    }
  }, [project, projectId, userId, isSaving, viewZoom, viewOffset])

  // Autosave every 10 minutes
  useEffect(() => {
    if (!projectId || !userId) return
    const interval = setInterval(() => {
      if (hasUnsavedChanges && !isSaving) handleSave()
    }, 10 * 60 * 1000)
    return () => clearInterval(interval)
  }, [projectId, userId, hasUnsavedChanges, isSaving, handleSave])

  useEffect(() => {
    if (!hasUnsavedChanges) return
    const handleBeforeUnload = (e: BeforeUnloadEvent) => { e.preventDefault() }
    window.addEventListener('beforeunload', handleBeforeUnload)
    return () => window.removeEventListener('beforeunload', handleBeforeUnload)
  }, [hasUnsavedChanges])

  // ─── extraction ───────────────────────────────────────────────────────────
  const handleToggleSlideSelect = (slideId: string) => {
    if (slideId === '__clear__') { setSelectedSlideIds([]); return }
    setSelectedSlideIds((prev) =>
      prev.includes(slideId) ? prev.filter((id) => id !== slideId) : [...prev, slideId]
    )
  }

  const handleExtractSlides = (slideIds: string[]) => {
    setSelectedSlideIds(slideIds)
    setExtractOpen(true)
  }

  const handleExtractConfirm = useCallback(async () => {
    if (!projectId || !userId) return

    const emptySlides = project.slides
      .filter((s) => selectedSlideIds.includes(s.id))
      .filter((s) => !s.backgroundImage)
    if (emptySlides.length > 0) {
      toast.error(`${emptySlides.map((s) => s.name).join(', ')} ${emptySlides.length === 1 ? 'has' : 'have'} no background map`)
      return
    }

    setExtractLoading(true)
    try {
      const saved = await handleSave()
      if (!saved) return

      // Capture thumbnail at 1:1 scale
      const thumbnails: Record<string, string> = {}
      if (stageRef.current && project.activeSlideId && selectedSlideIds.includes(project.activeSlideId)) {
        stageRef.current.scale({ x: 1, y: 1 })
        stageRef.current.position({ x: 0, y: 0 })
        stageRef.current.batchDraw()
        thumbnails[project.activeSlideId] = stageRef.current.toDataURL({ pixelRatio: 1 })
        stageRef.current.scale({ x: viewZoom, y: viewZoom })
        stageRef.current.position(viewOffset)
        stageRef.current.batchDraw()
      }

      const { data, error } = await extractStrats(userId, projectId, selectedSlideIds, thumbnails)
      if (error) {
        toast.error('Failed to extract strats')
      } else if (data) {
        toast.success(`${data.length} strat${data.length > 1 ? 's' : ''} extracted to dashboard`)
        setSelectedSlideIds([])
        setExtractOpen(false)
      }
    } catch {
      toast.error('Failed to extract strats')
    } finally {
      setExtractLoading(false)
    }
  }, [projectId, userId, project.slides, project.activeSlideId, selectedSlideIds, handleSave, viewZoom, viewOffset])

  // ─── slide handlers ───────────────────────────────────────────────────────
  const handleSelectSlide = (slideId: string) => {
    setSelectedObjectId(null)
    const currentSlide = project.slides.find((s) => s.id === project.activeSlideId)
    if (currentSlide) {
      currentSlide.objects.forEach((obj) => { delete objectNodeMapRef.current[obj.id] })
    }
    setProject((prev) => ({ ...prev, activeSlideId: slideId }))
  }

  const handleAddSlide = () => {
    const nextSlide = createDefaultSlide({ name: `Slide ${project.slides.length + 1}` })
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
      slides: prev.slides.map((s) =>
        s.id === slideId ? { ...s, name: newName, updatedAt: getNowIso() } : s
      ),
    }))
  }

  const handleDuplicateSlide = (slideId: string) => {
    updateProject((prev) => {
      const source = prev.slides.find((s) => s.id === slideId)
      if (!source) return prev
      const copy = duplicateSlide(source)
      return { ...prev, slides: [...prev.slides, copy], activeSlideId: copy.id }
    })
    setSelectedObjectId(null)
  }

  const handleDeleteSlide = (slideId: string) => {
    updateProject((prev) => {
      if (prev.slides.length === 1) return prev
      const deletedSlide = prev.slides.find((s) => s.id === slideId)
      if (deletedSlide) {
        deletedSlide.objects.forEach((obj) => { delete objectNodeMapRef.current[obj.id] })
      }
      const nextSlides = prev.slides.filter((s) => s.id !== slideId)
      const nextActiveSlideId =
        prev.activeSlideId === slideId ? (nextSlides[0]?.id ?? null) : prev.activeSlideId
      return { ...prev, slides: nextSlides, activeSlideId: nextActiveSlideId }
    })
    setSelectedSlideIds((prev) => prev.filter((id) => id !== slideId))
    setSelectedObjectId(null)
  }

  // ─── tag actions ──────────────────────────────────────────────────────────
  const handleCreateTag = (name: string, color: string) => {
    updateProject((prev) => ({ ...prev, tags: [...prev.tags, createDefaultTag(name, color)] }))
  }

  const handleDeleteTag = (tagId: string) => {
    updateProject((prev) => ({
      ...prev,
      tags: prev.tags.filter((t) => t.id !== tagId),
      slides: prev.slides.map((slide) => ({
        ...slide,
        objects: slide.objects.map((obj) => ({
          ...obj,
          metadata: {
            ...obj.metadata,
            tagIds: obj.metadata.tagIds.filter((id) => id !== tagId),
          },
        })),
      })),
    }))
  }

  // ─── icon palette actions ─────────────────────────────────────────────────
  const handleCreatePalette = (name: string) => {
    updateProject((prev) => ({
      ...prev,
      iconPalettes: [...prev.iconPalettes, createIconPaletteGroup(name)],
    }))
  }

  const handleDeletePalette = (paletteId: string) => {
    updateProject((prev) => ({
      ...prev,
      iconPalettes: prev.iconPalettes.filter((p) => p.id !== paletteId),
      uploadedIcons: prev.uploadedIcons.map((icon) =>
        icon.paletteId === paletteId ? { ...icon, paletteId: null } : icon
      ),
    }))
  }

  const handleAssignIconToPalette = (iconId: string, paletteId: string | null) => {
    updateProject((prev) => ({
      ...prev,
      uploadedIcons: prev.uploadedIcons.map((icon) =>
        icon.id === iconId ? { ...icon, paletteId } : icon
      ),
    }))
  }

  // ─── icon actions ─────────────────────────────────────────────────────────
  const handleUploadIcon = async (files: FileList, paletteId: string | null = null) => {
    const fileArray = Array.from(files)
    let successCount = 0
    for (const file of fileArray) {
      const error = validateIconFile(file)
      if (error) { toast.error(`${file.name}: ${error}`); continue }
      try {
        const src = await readFileAsDataUrl(file)
        updateProject((prev) => ({
          ...prev,
          uploadedIcons: [
            ...prev.uploadedIcons,
            createUploadedIcon({ name: file.name.replace(/\.[^/.]+$/, ''), src, fileName: file.name, paletteId }),
          ],
        }))
        successCount++
      } catch {
        toast.error(`Failed to read ${file.name}`)
      }
    }
    if (successCount > 0) toast.success(`${successCount} icon(s) uploaded`)
  }

  const handleDeleteIcon = (iconId: string) => {
    updateProject((prev) => ({
      ...prev,
      uploadedIcons: prev.uploadedIcons.filter((icon) => icon.id !== iconId),
      slides: prev.slides.map((slide) => ({
        ...slide,
        objects: slide.objects.filter((obj) => !(obj.type === 'icon' && obj.iconId === iconId)),
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
        ? Math.max(...activeSlide.objects.map((o) => o.canvas.zIndex)) + 1
        : 1
    const nextObject = createDefaultObject('icon', {
      metadata: { label: icon.name, description: '', tagIds: [] },
      iconId: icon.id,
      src: icon.src,
      assetName: icon.name,
      canvas: { x: 120, y: 120, width: 48, height: 48, rotation: 0, opacity: 1, visible: true, locked: false, zIndex: nextZIndex, scaleX: 1, scaleY: 1 },
    } as Partial<BuilderObject>) as IconBuilderObject
    updateActiveSlide((slide) => ({ ...slide, objects: [...slide.objects, nextObject] }))
    setSelectedObjectId(nextObject.id)
    setActiveTool('select')
  }

  // ─── background actions ───────────────────────────────────────────────────
  const handleUploadBackground = async (file: File) => {
    const error = validateBackgroundFile(file)
    if (error) { toast.error(error); return }
    try {
      const src = await readFileAsDataUrl(file)
      updateActiveSlide((slide) => ({ ...slide, backgroundImage: src }))
      toast.success('Map uploaded')
    } catch {
      toast.error('Failed to read file. Please try again.')
    }
  }

  const handleClearBackground = () => {
    updateActiveSlide((slide) => ({ ...slide, backgroundImage: null }))
  }

  // ─── object actions ───────────────────────────────────────────────────────
  const handleCreateObjectAt = (type: BuilderObjectType, x: number, y: number) => {
    if (!activeSlide) return
    const nextZIndex =
      activeSlide.objects.length > 0
        ? Math.max(...activeSlide.objects.map((o) => o.canvas.zIndex)) + 1
        : 1
    const base = createDefaultObject(type)
    const object: BuilderObject = { ...base, canvas: { ...base.canvas, x, y, zIndex: nextZIndex } } as BuilderObject
    updateActiveSlide((slide) => ({ ...slide, objects: [...slide.objects, object] }))
    setSelectedObjectId(object.id)
    setActiveTool('select')
  }

  const handleDeleteObject = (objectId: string) => {
    updateActiveSlide((slide) => ({ ...slide, objects: slide.objects.filter((o) => o.id !== objectId) }))
    if (selectedObjectId === objectId) setSelectedObjectId(null)
    delete objectNodeMapRef.current[objectId]
  }

  const handleDuplicateObject = (objectId: string) => {
    if (!activeSlide) return
    const source = activeSlide.objects.find((o) => o.id === objectId)
    if (!source) return
    const copy = duplicateObject(source)
    updateActiveSlide((slide) => ({ ...slide, objects: [...slide.objects, copy] }))
    setSelectedObjectId(copy.id)
  }

  const handleUpdateMetadata = (objectId: string, updates: Partial<BuilderObject['metadata']>) => {
    updateObjectInActiveSlide(objectId, (o) => ({ ...o, metadata: { ...o.metadata, ...updates } }))
  }

  const handleUpdateObject = (objectId: string, updates: Partial<BuilderObject>) => {
    updateObjectInActiveSlide(objectId, (o) => ({ ...o, ...updates }) as BuilderObject)
  }

  const handleToggleObjectTag = (objectId: string, tagId: string) => {
    updateObjectInActiveSlide(objectId, (o) => {
      const exists = o.metadata.tagIds.includes(tagId)
      return {
        ...o,
        metadata: {
          ...o.metadata,
          tagIds: exists ? o.metadata.tagIds.filter((id) => id !== tagId) : [...o.metadata.tagIds, tagId],
        },
      }
    })
  }

  const handleSelectObject = useCallback((objectId: string) => {
    setSelectedObjectId(objectId)
    setActiveTool('select')
  }, [])

  const handleDragObject = useCallback((objectId: string, x: number, y: number) => {
    updateObjectInActiveSlide(objectId, (o) => ({
      ...o,
      canvas: { ...o.canvas, x: clamp(x, 0, STAGE_WIDTH), y: clamp(y, 0, STAGE_HEIGHT) },
    }))
  }, [updateObjectInActiveSlide])

  const handleTransformObject = useCallback((objectId: string, node: Konva.Node) => {
    const scaleX = node.scaleX()
    const scaleY = node.scaleY()
    node.scaleX(1)
    node.scaleY(1)
    updateObjectInActiveSlide(objectId, (prev) => ({
      ...prev,
      canvas: {
        ...prev.canvas,
        x: node.x(),
        y: node.y(),
        rotation: node.rotation(),
        width: Math.max(10, prev.canvas.width * scaleX),
        height: Math.max(10, prev.canvas.height * scaleY),
        scaleX: 1,
        scaleY: 1,
      },
    }))
  }, [updateObjectInActiveSlide])

  // ─── layers panel ─────────────────────────────────────────────────────────
  const handleToggleVisibility = (objectId: string) => {
    updateObjectInActiveSlide(objectId, (o) => ({ ...o, canvas: { ...o.canvas, visible: !o.canvas.visible } }))
  }

  const handleToggleLocked = (objectId: string) => {
    updateObjectInActiveSlide(objectId, (o) => ({ ...o, canvas: { ...o.canvas, locked: !o.canvas.locked } }))
  }

  const handleMoveObjectUp = useCallback((objectId: string) => {
    updateActiveSlide((slide) => {
      const sorted = [...slide.objects].sort((a, b) => b.canvas.zIndex - a.canvas.zIndex)
      const visible = filterTagIds.length === 0
        ? sorted
        : sorted.filter((o) => o.metadata.tagIds.some((id) => filterTagIds.includes(id)))
      const index = visible.findIndex((o) => o.id === objectId)
      if (index <= 0) return slide
      const current = visible[index]
      const above = visible[index - 1]
      const currentZ = current.canvas.zIndex
      const aboveZ = above.canvas.zIndex
      return {
        ...slide,
        objects: slide.objects.map((o) => {
          if (o.id === current.id) return { ...o, canvas: { ...o.canvas, zIndex: aboveZ } }
          if (o.id === above.id) return { ...o, canvas: { ...o.canvas, zIndex: currentZ } }
          return o
        }),
      }
    })
  }, [updateActiveSlide, filterTagIds])

  const handleMoveObjectDown = useCallback((objectId: string) => {
    updateActiveSlide((slide) => {
      const sorted = [...slide.objects].sort((a, b) => b.canvas.zIndex - a.canvas.zIndex)
      const visible = filterTagIds.length === 0
        ? sorted
        : sorted.filter((o) => o.metadata.tagIds.some((id) => filterTagIds.includes(id)))
      const index = visible.findIndex((o) => o.id === objectId)
      if (index < 0 || index >= visible.length - 1) return slide
      const current = visible[index]
      const below = visible[index + 1]
      const currentZ = current.canvas.zIndex
      const belowZ = below.canvas.zIndex
      return {
        ...slide,
        objects: slide.objects.map((o) => {
          if (o.id === current.id) return { ...o, canvas: { ...o.canvas, zIndex: belowZ } }
          if (o.id === below.id) return { ...o, canvas: { ...o.canvas, zIndex: currentZ } }
          return o
        }),
      }
    })
  }, [updateActiveSlide, filterTagIds])

  // ─── stage interaction ────────────────────────────────────────────────────
  // Konva handles the scale/position transform — getPointerPosition() already
  // returns logical canvas coordinates, so we don't need to invert manually.
  const handleStageMouseDown = (e: Konva.KonvaEventObject<MouseEvent>) => {
    const clickedOnEmpty = e.target === e.target.getStage()
    if (clickedOnEmpty) {
      setSelectedObjectId(null)
      if (activeTool !== 'select' && activeTool !== 'icon' && activeTool !== 'image') {
        const stage = stageRef.current
        if (!stage) return
        const pointer = stage.getPointerPosition()
        if (!pointer) return
        handleCreateObjectAt(activeTool as BuilderObjectType, pointer.x, pointer.y)
      }
    }
  }

  // ─── render objects ───────────────────────────────────────────────────────
  const renderObject = useCallback((object: BuilderObject) => {
    const isSelected = selectedObjectId === object.id

    const commonProps = {
      ref: (node: Konva.Node | null) => { objectNodeMapRef.current[object.id] = node },
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
          <Rect key={object.id} {...commonProps}
            width={object.canvas.width} height={object.canvas.height}
            fill={object.style.fill} stroke={object.style.stroke} strokeWidth={object.style.strokeWidth}
            cornerRadius={object.cornerRadius} perfectDrawEnabled={false} shadowForStrokeEnabled={false}
          />
        )
      case 'ellipse':
        return (
          <Ellipse key={object.id} {...commonProps}
            radiusX={object.canvas.width / 2} radiusY={object.canvas.height / 2}
            fill={object.style.fill} stroke={object.style.stroke} strokeWidth={object.style.strokeWidth}
            offsetX={-object.canvas.width / 2} offsetY={-object.canvas.height / 2}
            perfectDrawEnabled={false} shadowForStrokeEnabled={false}
          />
        )
      case 'text':
        return (
          <KonvaText key={object.id} {...commonProps}
            text={object.text} width={object.canvas.width} height={object.canvas.height}
            fontSize={object.fontSize} fontFamily={object.fontFamily} align={object.align}
            fill={object.style.fill} shadowForStrokeEnabled={false}
          />
        )
      case 'arrow':
        return (
          <KonvaArrow key={object.id} {...commonProps}
            points={[0, object.canvas.height / 2, object.canvas.width, object.canvas.height / 2]}
            pointerLength={object.pointerLength} pointerWidth={object.pointerWidth}
            stroke={object.style.stroke} fill={object.style.fill} strokeWidth={object.style.strokeWidth}
            hitStrokeWidth={24} perfectDrawEnabled={false} shadowForStrokeEnabled={false}
          />
        )
      case 'line':
        return (
          <Line key={object.id} {...commonProps}
            points={[0, object.canvas.height / 2, object.canvas.width, object.canvas.height / 2]}
            stroke={object.style.stroke} strokeWidth={object.style.strokeWidth}
            hitStrokeWidth={24} perfectDrawEnabled={false} shadowForStrokeEnabled={false}
          />
        )
      case 'image':
      case 'icon':
        return (
          <CanvasImageObject key={object.id} object={object} isSelected={isSelected}
            onSelect={handleSelectObject} onDragEnd={handleDragObject}
            onTransformEnd={handleTransformObject} objectNodeMapRef={objectNodeMapRef}
          />
        )
      default:
        return null
    }
  }, [selectedObjectId, handleSelectObject, handleDragObject, handleTransformObject])

  // ─── render ───────────────────────────────────────────────────────────────
  return (
    <div className="flex h-[calc(100vh-64px)] w-full flex-col overflow-hidden bg-[#0e0e0e]">
      <BuilderTopBar
        projectTitle={project.title}
        onSave={handleSave}
        isSaving={isSaving}
        hasUnsavedChanges={hasUnsavedChanges}
        canSave={!!projectId && !!userId}
      />

      <BuilderSlideStrip
        slides={project.slides}
        activeSlideId={project.activeSlideId}
        activeSlide={activeSlide}
        onSelectSlide={handleSelectSlide}
        onAddSlide={handleAddSlide}
        onRenameSlide={handleRenameSlide}
        onDuplicateSlide={handleDuplicateSlide}
        onDeleteSlide={handleDeleteSlide}
        onUploadBackground={handleUploadBackground}
        onClearBackground={handleClearBackground}
        selectedSlideIds={selectedSlideIds}
        onToggleSlideSelect={handleToggleSlideSelect}
        onExtractSlides={handleExtractSlides}
        extractDialogOpen={extractOpen}
      />

      <div className="flex min-h-0 flex-1">
        <BuilderLayersPanel
          objects={activeSlide?.objects ?? []}
          tags={project.tags}
          selectedObjectId={selectedObjectId}
          filterTagIds={filterTagIds}
          onSelectObject={handleSelectObject}
          onToggleVisibility={handleToggleVisibility}
          onToggleLocked={handleToggleLocked}
          onMoveObjectUp={handleMoveObjectUp}
          onMoveObjectDown={handleMoveObjectDown}
          onSetFilterTagIds={setFilterTagIds}
        />

        <div className="flex min-w-0 flex-1 flex-col">
          <BuilderToolsBar activeTool={activeTool} onSetActiveTool={setActiveTool} />

          {/* ── Canvas viewport ── */}
          <div
            ref={canvasContainerRef}
            className="relative flex min-h-0 flex-1 overflow-hidden bg-[#0a0a0a]"
            onWheel={handleWheel}
            onMouseDown={handleContainerMouseDown}
            onMouseMove={handleContainerMouseMove}
            onMouseUp={handleContainerMouseUp}
            onMouseLeave={handleContainerMouseUp}
            style={{ cursor: isPanning.current ? 'grabbing' : undefined }}
          >
            {/* The Konva stage fills the container div; zoom/pan are applied
                via scale + x/y props. The underlying logical canvas remains
                STAGE_WIDTH × STAGE_HEIGHT at all times. */}
            <Stage
              ref={stageRef}
              width={containerSize.width}
              height={containerSize.height}
              scaleX={viewZoom}
              scaleY={viewZoom}
              x={viewOffset.x}
              y={viewOffset.y}
              onMouseDown={handleStageMouseDown}
            >
              <Layer>
                {backgroundImage ? (() => {
                  const imgWidth = backgroundImage.width
                  const imgHeight = backgroundImage.height
                
                  const scale = Math.min(
                    STAGE_WIDTH / imgWidth,
                    STAGE_HEIGHT / imgHeight
                  )
                
                  const width = imgWidth * scale
                  const height = imgHeight * scale
                
                  const x = (STAGE_WIDTH - width) / 2
                  const y = (STAGE_HEIGHT - height) / 2
                
                  return (
                    <KonvaImage
                      image={backgroundImage}
                      x={x}
                      y={y}
                      width={width}
                      height={height}
                      listening={false}
                    />
                  )
                })() : null}

                {visibleObjects.map(renderObject)}

                <Transformer
                  ref={transformerRef}
                  rotateEnabled
                  enabledAnchors={transformerAnchors}
                  anchorSize={12}
                />
              </Layer>
            </Stage>

            {/* ── Zoom controls (bottom-right) ── */}
            <div className="absolute bottom-10 right-3 z-10 flex flex-col items-center gap-1">
              <button
                type="button"
                onClick={handleZoomIn}
                disabled={viewZoom >= MAX_ZOOM}
                title="Zoom in  (Ctrl + scroll)"
                className="flex h-7 w-7 items-center justify-center rounded border border-[#2a2a2a] bg-[#1a1a1a]/90 text-[#888] text-base leading-none transition hover:border-[#444] hover:text-[#ddd] disabled:opacity-30 select-none"
              >
                +
              </button>
              <button
                type="button"
                onClick={fitView}
                title="Fit to view"
                className="flex h-7 w-7 items-center justify-center rounded border border-[#2a2a2a] bg-[#1a1a1a]/90 text-[#555] text-[11px] transition hover:border-[#444] hover:text-[#ddd] select-none font-mono"
              >
                ⊡
              </button>
              <button
                type="button"
                onClick={handleZoomOut}
                disabled={viewZoom <= MIN_ZOOM}
                title="Zoom out  (Ctrl + scroll)"
                className="flex h-7 w-7 items-center justify-center rounded border border-[#2a2a2a] bg-[#1a1a1a]/90 text-[#888] text-base leading-none transition hover:border-[#444] hover:text-[#ddd] disabled:opacity-30 select-none"
              >
                −
              </button>
            </div>
          </div>

          {/* ── Status bar ── */}
          <div className="flex h-[22px] shrink-0 items-center gap-4 border-t border-[#1f1f1f] bg-[#111111] px-3">
            <span className="text-[10px] text-[#444]">
              <span className="text-[#666]">{activeTool}</span> tool
            </span>
            <span className="text-[10px] text-[#444]">
              <span className="text-[#666]">{activeSlide?.objects.length ?? 0}</span> objects
            </span>
            {activeSlide?.name && (
              <span className="text-[10px] text-[#444]">
                <span className="text-[#666]">{activeSlide.name}</span>
              </span>
            )}
            <span className="ml-auto text-[10px] text-[#444]">
              <span className="text-[#555]">{Math.round(viewZoom * 100)}%</span>
              <span className="text-[#2a2a2a] ml-2">alt+drag to pan · ctrl+scroll to zoom</span>
            </span>
          </div>
        </div>

        <BuilderRightPanel
          icons={project.uploadedIcons}
          iconPalettes={project.iconPalettes}
          onUploadIcon={handleUploadIcon}
          onDeleteIcon={handleDeleteIcon}
          onInsertIcon={handleInsertIcon}
          onCreatePalette={handleCreatePalette}
          onDeletePalette={handleDeletePalette}
          onAssignIconToPalette={handleAssignIconToPalette}
          selectedObject={selectedObject}
          tags={project.tags}
          onUpdateMetadata={handleUpdateMetadata}
          onDeleteObject={handleDeleteObject}
          onDuplicateObject={handleDuplicateObject}
          onUpdateObject={handleUpdateObject}
          onToggleObjectTag={handleToggleObjectTag}
          onCreateTag={handleCreateTag}
          onDeleteTag={handleDeleteTag}
          activeTab={rightPanelTab}
          onSetActiveTab={setRightPanelTab}
        />
      </div>

      <ExtractConfirmDialog
        open={extractOpen}
        onOpenChange={setExtractOpen}
        slides={project.slides.filter((s) => selectedSlideIds.includes(s.id))}
        onConfirm={handleExtractConfirm}
        loading={extractLoading}
      />
    </div>
  )
}

export default Builder
