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

export interface IconPaletteGroup {
  id: string
  name: string
  createdAt: string
}

export interface UploadedIcon {
  id: string
  name: string
  src: string
  fileName: string
  uploadedAt: string
  paletteId: string | null
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
  pointerLength: number
  pointerWidth: number
}

export interface LineBuilderObject extends BaseBuilderObject {
  type: 'line'
}

export interface RectangleBuilderObject extends BaseBuilderObject {
  type: 'rectangle'
  cornerRadius: number
}

export interface EllipseBuilderObject extends BaseBuilderObject {
  type: 'ellipse'
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
  iconPalettes: IconPaletteGroup[]
  createdAt: string
  updatedAt: string
}

// props

export interface BuilderTopBarProps {
  projectTitle: string
}

export interface BuilderSlideStripProps {
  slides: BuilderSlide[]
  activeSlideId: string | null
  activeSlide: BuilderSlide | null
  onSelectSlide: (slideId: string) => void
  onAddSlide: () => void
  onRenameSlide: (slideId: string, newName: string) => void
  onDuplicateSlide: (slideId: string) => void
  onDeleteSlide: (slideId: string) => void
  onUploadBackground: (file: File) => void
  onClearBackground: () => void
}

export interface BuilderToolsBarProps {
  activeTool: ToolType
  onSetActiveTool: (tool: ToolType) => void
}

export interface BuilderRightPanelProps {
  // Assets tab
  icons: UploadedIcon[]
  iconPalettes: IconPaletteGroup[]
  onUploadIcon: (files: FileList, paletteId: string | null) => void
  onDeleteIcon: (iconId: string) => void
  onInsertIcon: (icon: UploadedIcon) => void
  onCreatePalette: (name: string) => void
  onDeletePalette: (paletteId: string) => void
  onAssignIconToPalette: (iconId: string, paletteId: string | null) => void
  // Inspector tab
  selectedObject: BuilderObject | null
  tags: StratTag[]
  onUpdateMetadata: (objectId: string, updates: Partial<ObjectMetadata>) => void
  onDeleteObject: (objectId: string) => void
  onDuplicateObject: (objectId: string) => void
  onUpdateObject: (objectId: string, updates: Partial<BuilderObject>) => void
  onToggleObjectTag: (objectId: string, tagId: string) => void
  // Tags tab
  onCreateTag: (name: string, color: string) => void
  onDeleteTag: (tagId: string) => void
  // tab control
  activeTab: 'assets' | 'inspector' | 'tags'
  onSetActiveTab: (tab: 'assets' | 'inspector' | 'tags') => void
}

export interface BuilderInspectorProps {
  selectedObject: BuilderObject | null
  tags: StratTag[]
  onUpdateMetadata: (objectId: string, updates: Partial<ObjectMetadata>) => void
  onDeleteObject: (objectId: string) => void
  onDuplicateObject: (objectId: string) => void
  onUpdateObject: (objectId: string, updates: Partial<BuilderObject>) => void
  onToggleObjectTag: (objectId: string, tagId: string) => void
}

export interface TagManagerProps {
  tags: StratTag[]
  onCreateTag: (name: string, color: string) => void
  onDeleteTag: (tagId: string) => void
}

export interface IconPaletteProps {
  icons: UploadedIcon[]
  iconPalettes: IconPaletteGroup[]
  onUploadIcon: (files: FileList, paletteId: string | null) => void
  onDeleteIcon: (iconId: string) => void
  onInsertIcon: (icon: UploadedIcon) => void
  onCreatePalette: (name: string) => void
  onDeletePalette: (paletteId: string) => void
  onAssignIconToPalette: (iconId: string, paletteId: string | null) => void
}

export interface BuilderLayersPanelProps {
  objects: BuilderObject[]
  tags: StratTag[]
  selectedObjectId: string | null
  filterTagIds: string[]
  onSelectObject: (objectId: string) => void
  onToggleVisibility: (objectId: string) => void
  onToggleLocked: (objectId: string) => void
  onMoveObjectUp: (objectId: string) => void
  onMoveObjectDown: (objectId: string) => void
  onSetFilterTagIds: (tagIds: string[]) => void
}