export type ToolType =
  | 'select'
  | 'text'
  | 'arrow'
  | 'rectangle'
  | 'ellipse'
  | 'line'
  | 'image'
  | 'icon'
  

export type BuilderObjectType =
  | 'text'
  | 'arrow'
  | 'rectangle'
  | 'ellipse'
  | 'line'
  | 'image'
  | 'icon'
  

export interface StratTag {
  id: string
  name: string
  color: string
}

export interface UploadedIcon {
  id: string
  name: string
  src: string
  fileName: string
  uploadedAt: string
}

export interface ObjectMetadata {
  label: string
  description: string
  tagIds: string[]
}

export interface BaseCanvasProps {
  x: number
  y: number
  width: number
  height: number
  rotation: number
  opacity: number
  visible: boolean
  locked: boolean
  zIndex: number
  scaleX: number
  scaleY: number
}

export interface BaseStyleProps {
  fill: string
  stroke: string
  strokeWidth: number
}

export interface BaseBuilderObject {
  id: string
  type: BuilderObjectType
  metadata: ObjectMetadata
  canvas: BaseCanvasProps
  style: BaseStyleProps
  createdAt: string
  updatedAt: string
}

export interface TextBuilderObject extends BaseBuilderObject {
  type: 'text'
  text: string
  fontSize: number
  fontFamily: string
  align: 'left' | 'center' | 'right'
}

export interface ArrowBuilderObject extends BaseBuilderObject {
  type: 'arrow'
  points: number[]
  pointerLength: number
  pointerWidth: number
}

export interface RectangleBuilderObject extends BaseBuilderObject {
  type: 'rectangle'
  cornerRadius: number
}

export interface EllipseBuilderObject extends BaseBuilderObject {
  type: 'ellipse'
}

export interface LineBuilderObject extends BaseBuilderObject {
  type: 'line'
  points: number[]
}

export interface ImageBuilderObject extends BaseBuilderObject {
  type: 'image'
  src: string
  assetName?: string
}

export interface IconBuilderObject extends BaseBuilderObject {
  type: 'icon'
  iconId: string
  src: string
  assetName?: string
}


export type BuilderObject =
  | TextBuilderObject
  | ArrowBuilderObject
  | RectangleBuilderObject
  | EllipseBuilderObject
  | LineBuilderObject
  | ImageBuilderObject
  | IconBuilderObject

export interface BuilderSlide {
  id: string
  name: string
  backgroundImage: string | null
  notes: string
  objects: BuilderObject[]
  createdAt: string
  updatedAt: string
}

export interface BuilderProject {
  id: string
  title: string
  description: string
  gameId?: string | null
  mapId?: string | null
  activeSlideId: string | null
  slides: BuilderSlide[]
  tags: StratTag[]
  uploadedIcons: UploadedIcon[]
  createdAt: string
  updatedAt: string
}

export interface BuilderSelectionState {
  selectedObjectId: string | null
}

export interface BuilderInspectorProps {
  selectedObject: BuilderObject | null
  tags: StratTag[]
  onUpdateMetadata: (
    objectId: string,
    updates: Partial<ObjectMetadata>
  ) => void
}

export interface SlideManagerProps {
  slides: BuilderSlide[]
  activeSlideId: string | null
  onSelectSlide: (slideId: string) => void
  onAddSlide: () => void
  onRenameSlide: (slideId: string, newName: string) => void
  onDuplicateSlide: (slideId: string) => void
  onDeleteSlide: (slideId: string) => void
}

export interface TagManagerProps {
  tags: StratTag[]
  onCreateTag: (name: string, color: string) => void
  onDeleteTag: (tagId: string) => void
}

export interface IconPaletteProps {
  icons: UploadedIcon[]
  onUploadIcon: (file: File) => void
  onDeleteIcon: (iconId: string) => void
  onInsertIcon?: (icon: UploadedIcon) => void
}

export interface BuilderToolbarProps {
  activeSlide: BuilderSlide | null
  activeTool: ToolType
  onSetActiveTool: (tool: ToolType) => void
  onUploadBackground: (file: File) => void
  onClearBackground: () => void
  onAddSlide: () => void
}

export interface BuilderSidebarProps {
  slides: BuilderSlide[]
  activeSlideId: string | null
  tags: StratTag[]
  icons: UploadedIcon[]
  onSelectSlide: (slideId: string) => void
  onAddSlide: () => void
  onRenameSlide: (slideId: string, newName: string) => void
  onDuplicateSlide: (slideId: string) => void
  onDeleteSlide: (slideId: string) => void
  onCreateTag: (name: string, color: string) => void
  onDeleteTag: (tagId: string) => void
  onUploadIcon: (file: File) => void
  onDeleteIcon: (iconId: string) => void
  onInsertIcon?: (icon: UploadedIcon) => void
}