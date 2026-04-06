'use client'

import { LayoutGrid, BarChart3 } from 'lucide-react'
import type { DashboardSection, DashboardSectionConfig, DashboardShellProps } from './dashboard.types'

const SECTIONS: DashboardSectionConfig[] = [
  { id: 'gallery', label: 'Gallery', icon: 'grid' },
  { id: 'analytics', label: 'Analytics', icon: 'chart', disabled: true },
]

const SECTION_ICONS: Record<string, React.ReactNode> = {
  grid: <LayoutGrid size={16} />,
  chart: <BarChart3 size={16} />,
}

export default function DashboardShell({
  activeSection,
  onSetActiveSection,
  children,
}: DashboardShellProps) {
  return (
    <div className="flex min-h-[calc(100vh-64px)] gap-0">
      {/* Sidebar */}
      <aside className="w-48 shrink-0 border-r border-[#2a2a2a] bg-[#161616] px-3 py-6">
        <p className="mb-4 px-2 text-[10px] font-medium uppercase tracking-widest text-[#555]">
          Dashboard
        </p>
        <nav className="flex flex-col gap-1">
          {SECTIONS.map((section) => {
            const isActive = activeSection === section.id
            return (
              <button
                key={section.id}
                type="button"
                onClick={() => !section.disabled && onSetActiveSection(section.id)}
                disabled={section.disabled}
                className={`flex items-center gap-2.5 rounded-md px-3 py-2 text-sm transition ${
                  isActive
                    ? 'bg-[#252525] text-[#eee]'
                    : section.disabled
                      ? 'cursor-not-allowed text-[#444]'
                      : 'text-[#888] hover:bg-[#1e1e1e] hover:text-[#ccc]'
                }`}
              >
                {section.icon && SECTION_ICONS[section.icon]}
                <span>{section.label}</span>
                {section.disabled && (
                  <span className="ml-auto rounded bg-[#252525] px-1.5 py-0.5 text-[9px] text-[#555]">
                    Soon
                  </span>
                )}
              </button>
            )
          })}
        </nav>
      </aside>

      {/* Content */}
      <main className="flex-1 overflow-y-auto px-8 py-6">
        {children}
      </main>
    </div>
  )
}