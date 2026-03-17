'use client'

import SlideManager from './SlideManager'
import TagManager from './TagManager'
import IconPalette from './IconPalette'
import { BuilderSidebarProps } from './builder.types'

const BuilderSidebar = ({
  slides,
  activeSlideId,
  tags,
  icons,
  onSelectSlide,
  onAddSlide,
  onRenameSlide,
  onDuplicateSlide,
  onDeleteSlide,
  onCreateTag,
  onDeleteTag,
  onUploadIcon,
  onDeleteIcon,
  onInsertIcon,
}: BuilderSidebarProps) => {
  return (
    <aside className="flex h-full flex-col gap-4">
      <SlideManager
        slides={slides}
        activeSlideId={activeSlideId}
        onSelectSlide={onSelectSlide}
        onAddSlide={onAddSlide}
        onRenameSlide={onRenameSlide}
        onDuplicateSlide={onDuplicateSlide}
        onDeleteSlide={onDeleteSlide}
      />

      <IconPalette
        icons={icons}
        onUploadIcon={onUploadIcon}
        onDeleteIcon={onDeleteIcon}
        onInsertIcon={onInsertIcon}
/>

      <TagManager
        tags={tags}
        onCreateTag={onCreateTag}
        onDeleteTag={onDeleteTag}
/>
    </aside>
  )
}

export default BuilderSidebar