'use client'

import { BuilderRightPanelProps } from './builder.types'
import BuilderInspector from './BuilderInspector'
import IconPalette from './IconPalette'
import TagManager from './TagManager'

type Tab = 'assets' | 'inspector' | 'tags'

const BuilderRightPanel = ({
  icons,
  iconPalettes,
  onUploadIcon,
  onDeleteIcon,
  onInsertIcon,
  onCreatePalette,
  onDeletePalette,
  onAssignIconToPalette,
  selectedObject,
  tags,
  onUpdateMetadata,
  onDeleteObject,
  onDuplicateObject,
  onUpdateObject,
  onToggleObjectTag,
  onCreateTag,
  onDeleteTag,
  activeTab,
  onSetActiveTab,
}: BuilderRightPanelProps) => {
  const tabs: { id: Tab; label: string }[] = [
    { id: 'assets', label: 'Assets' },
    { id: 'inspector', label: 'Inspector' },
    { id: 'tags', label: 'Tags' },
  ]

  return (
    <div className="flex h-full w-[260px] shrink-0 flex-col border-l border-[#1f1f1f] bg-[#111111]">
      <div className="flex shrink-0 border-b border-[#1f1f1f]">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => onSetActiveTab(tab.id)}
            className={`flex h-9 flex-1 items-center justify-center text-xs transition ${
              activeTab === tab.id
                ? 'border-b-2 border-[#3b82f6] text-[#aaa]'
                : 'border-b-2 border-transparent text-[#444] hover:text-[#777]'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div className="min-h-0 flex-1 overflow-hidden">
        {activeTab === 'assets' && (
          <IconPalette
            icons={icons}
            iconPalettes={iconPalettes}
            onUploadIcon={onUploadIcon}
            onDeleteIcon={onDeleteIcon}
            onInsertIcon={onInsertIcon}
            onCreatePalette={onCreatePalette}
            onDeletePalette={onDeletePalette}
            onAssignIconToPalette={onAssignIconToPalette}
          />
        )}

        {activeTab === 'inspector' && (
          <BuilderInspector
            selectedObject={selectedObject}
            tags={tags}
            onUpdateMetadata={onUpdateMetadata}
            onDeleteObject={onDeleteObject}
            onDuplicateObject={onDuplicateObject}
            onUpdateObject={onUpdateObject}
            onToggleObjectTag={onToggleObjectTag}
          />
        )}

        {activeTab === 'tags' && (
          <TagManager
            tags={tags}
            onCreateTag={onCreateTag}
            onDeleteTag={onDeleteTag}
          />
        )}
      </div>
    </div>
  )
}

export default BuilderRightPanel