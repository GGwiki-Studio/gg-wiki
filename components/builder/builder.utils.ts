import {
  BaseCanvasProps,
  BaseStyleProps,
  BuilderObject,
  BuilderObjectType,
  BuilderProject,
  BuilderSlide,
  ObjectMetadata,
  StratTag,
  UploadedIcon,
} from './builder.types'

export function createId() {
  return crypto.randomUUID()
}

export function getNowIso() {
  return new Date().toISOString()
}

export function createDefaultMetadata(
  overrides?: Partial<ObjectMetadata>
): ObjectMetadata {
  return {
    label: '',
    description: '',
    tagIds: [],
    ...overrides,
  }
}

export function createDefaultCanvasProps(
  overrides?: Partial<BaseCanvasProps>
): BaseCanvasProps {
  return {
    x: 120,
    y: 120,
    width: 120,
    height: 80,
    rotation: 0,
    opacity: 1,
    visible: true,
    locked: false,
    zIndex: 0,
    scaleX: 1,
    scaleY: 1,
    ...overrides,
  }
}

export function createDefaultStyleProps(
  overrides?: Partial<BaseStyleProps>
): BaseStyleProps {
  return {
    fill: 'transparent',
    stroke: '#3b82f6',
    strokeWidth: 2,
    ...overrides,
  }
}

export function createDefaultObject(
  type: BuilderObjectType,
  overrides?: Partial<BuilderObject>
): BuilderObject {
  const now = getNowIso()

  const base = {
    id: createId(),
    type,
    metadata: createDefaultMetadata(),
    canvas: createDefaultCanvasProps(),
    style: createDefaultStyleProps(),
    createdAt: now,
    updatedAt: now,
  }

  switch (type) {
    case 'text':
      return {
        ...base,
        type: 'text',
        text: 'Text',
        fontSize: 24,
        fontFamily: 'Arial',
        align: 'left',
        style: createDefaultStyleProps({
          fill: '#ffffff',
          stroke: 'transparent',
          strokeWidth: 0,
        }),
        canvas: createDefaultCanvasProps({
          width: 180,
          height: 40,
        }),
        ...overrides,
      } as BuilderObject

    case 'arrow':
      return {
        ...base,
        type: 'arrow',
        points: [0, 0, 160, 0],
        pointerLength: 12,
        pointerWidth: 12,
        style: createDefaultStyleProps({
          fill: '#ef4444',
          stroke: '#ef4444',
          strokeWidth: 4,
        }),
        canvas: createDefaultCanvasProps({
          width: 160,
          height: 20,
        }),
        ...overrides,
      } as BuilderObject

    case 'rectangle':
      return {
        ...base,
        type: 'rectangle',
        cornerRadius: 0,
        style: createDefaultStyleProps({
          fill: 'transparent',
          stroke: '#3b82f6',
          strokeWidth: 2,
        }),
        canvas: createDefaultCanvasProps({
          width: 140,
          height: 90,
        }),
        ...overrides,
      } as BuilderObject

    case 'ellipse':
      return {
        ...base,
        type: 'ellipse',
        style: createDefaultStyleProps({
          fill: 'transparent',
          stroke: '#22c55e',
          strokeWidth: 2,
        }),
        canvas: createDefaultCanvasProps({
          width: 100,
          height: 100,
        }),
        ...overrides,
      } as BuilderObject

    case 'line':
      return {
        ...base,
        type: 'line',
        points: [0, 0, 160, 0],
        style: createDefaultStyleProps({
          stroke: '#f59e0b',
          strokeWidth: 3,
        }),
        canvas: createDefaultCanvasProps({
          width: 160,
          height: 10,
        }),
        ...overrides,
      } as BuilderObject

    case 'image':
      return {
        ...base,
        type: 'image',
        src: '',
        assetName: '',
        canvas: createDefaultCanvasProps({
          width: 220,
          height: 140,
        }),
        ...overrides,
      } as BuilderObject

    case 'icon':
      return {
        ...base,
        type: 'icon',
        iconId: '',
        src: '',
        assetName: '',
        canvas: createDefaultCanvasProps({
          width: 48,
          height: 48,
        }),
        ...overrides,
      } as BuilderObject

    

    default:
      return {
        ...base,
        type: 'text',
        text: 'Text',
        fontSize: 24,
        fontFamily: 'Arial',
        align: 'left',
        ...overrides,
      } as BuilderObject
  }
}

export function createDefaultSlide(
  overrides?: Partial<BuilderSlide>
): BuilderSlide {
  const now = getNowIso()

  return {
    id: createId(),
    name: 'New Slide',
    backgroundImage: null,
    notes: '',
    objects: [],
    createdAt: now,
    updatedAt: now,
    ...overrides,
  }
}

export function createDefaultProject(
  overrides?: Partial<BuilderProject>
): BuilderProject {
  const now = getNowIso()
  const firstSlide = createDefaultSlide({ name: 'Slide 1' })

  return {
    id: createId(),
    title: '',
    description: '',
    gameId: null,
    mapId: null,
    activeSlideId: firstSlide.id,
    slides: [firstSlide],
    tags: [],
    uploadedIcons: [],
    createdAt: now,
    updatedAt: now,
    ...overrides,
  }
}

export function createDefaultTag(
  name: string,
  color: string
): StratTag {
  return {
    id: createId(),
    name,
    color,
  }
}

export function createUploadedIcon(params: {
  name: string
  src: string
  fileName: string
}): UploadedIcon {
  return {
    id: createId(),
    name: params.name,
    src: params.src,
    fileName: params.fileName,
    uploadedAt: getNowIso(),
  }
}

export function duplicateObject(object: BuilderObject): BuilderObject {
  const now = getNowIso()

  return {
    ...object,
    id: createId(),
    metadata: {
      ...object.metadata,
      label: object.metadata.label
        ? `${object.metadata.label} Copy`
        : '',
    },
    canvas: {
      ...object.canvas,
      x: object.canvas.x + 24,
      y: object.canvas.y + 24,
      zIndex: object.canvas.zIndex + 1,
    },
    style: {
      ...object.style,
    },
    createdAt: now,
    updatedAt: now,
  } as BuilderObject
}

export function duplicateSlide(slide: BuilderSlide): BuilderSlide {
  const now = getNowIso()

  return {
    ...slide,
    id: createId(),
    name: `${slide.name} Copy`,
    objects: slide.objects.map((object) => duplicateObject(object)),
    createdAt: now,
    updatedAt: now,
  }
}

export function reorderSlides(
  slides: BuilderSlide[],
  fromIndex: number,
  toIndex: number
): BuilderSlide[] {
  const nextSlides = [...slides]

  if (
    fromIndex < 0 ||
    toIndex < 0 ||
    fromIndex >= nextSlides.length ||
    toIndex >= nextSlides.length
  ) {
    return nextSlides
  }

  const [movedSlide] = nextSlides.splice(fromIndex, 1)
  nextSlides.splice(toIndex, 0, movedSlide)

  return nextSlides
}

export function findSlideById(
  slides: BuilderSlide[],
  slideId: string | null
): BuilderSlide | null {
  if (!slideId) return null
  return slides.find((slide) => slide.id === slideId) ?? null
}

export function updateSlideTimestamp(slide: BuilderSlide): BuilderSlide {
  return {
    ...slide,
    updatedAt: getNowIso(),
  }
}