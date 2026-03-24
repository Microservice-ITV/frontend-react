import { useState } from 'react'
import { NavLink } from 'react-router-dom'
import { X, Zap, ChevronDown, ChevronRight } from 'lucide-react'
import { useDashboardMenu } from '../../hooks/useDashboardMenu'
import type { DashboardArea } from '../../types/dashboardTypes'

type DashboardSidebarProps = {
  area: DashboardArea
  isOpen: boolean
  onClose: () => void
}

const DashboardSidebar = ({ area, isOpen, onClose }: DashboardSidebarProps) => {
  const sections = useDashboardMenu(area)
  const [collapsedSections, setCollapsedSections] = useState<Record<string, boolean>>({})

  const toggleSection = (title: string) => {
    setCollapsedSections((prev) => ({ ...prev, [title]: !prev[title] }))
  }

  const navContent = (
    <>
      <div className="flex items-center justify-between border-b border-slate-800 px-4 py-4 lg:px-5 lg:py-5">
        <div className="flex items-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-500">
            <Zap size={18} className="text-white" />
          </div>
          <div>
            <p className="text-xs font-semibold text-white">DNI</p>
            <p className="text-[9px] uppercase tracking-wider text-slate-400">Dashboard</p>
          </div>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="rounded-md p-2 text-slate-400 hover:bg-slate-800 hover:text-white lg:hidden"
          aria-label="Close menu"
        >
          <X size={20} />
        </button>
      </div>

      <nav className="px-3 py-3">
        {sections.map((section) => {
          const isCollapsed = collapsedSections[section.title] ?? false
          return (
            <div key={section.title} className="mb-4">
              <button
                type="button"
                onClick={() => toggleSection(section.title)}
                className="flex w-full items-center justify-between px-3 py-1.5 text-[10px] font-medium uppercase tracking-wider text-slate-400 hover:text-slate-300"
              >
                {section.title}
                {isCollapsed ? (
                  <ChevronRight size={14} />
                ) : (
                  <ChevronDown size={14} />
                )}
              </button>
              {!isCollapsed && (
                <div className="mt-1 space-y-0.5">
                  {section.items.map((item) => {
                    const Icon = item.icon
                    return (
                      <NavLink
                        key={item.key}
                        to={item.to}
                        onClick={onClose}
                        className={({ isActive }) =>
                          `flex items-center gap-3 rounded-md px-3 py-2 text-xs transition ${
                            isActive
                              ? 'bg-emerald-600 text-white'
                              : 'text-slate-300 hover:bg-slate-900 hover:text-white'
                          }`
                        }
                      >
                        {Icon && (
                          <Icon size={18} className="shrink-0" />
                        )}
                        <span className="min-w-0 flex-1 truncate">{item.label}</span>
                        {item.badge != null && (
                          <span className="shrink-0 rounded-full bg-emerald-600 px-2 py-0.5 text-[10px] font-medium text-white">
                            {item.badge}
                          </span>
                        )}
                      </NavLink>
                    )
                  })}
                </div>
              )}
            </div>
          )
        })}
      </nav>
    </>
  )

  return (
    <>
      <div
        role="presentation"
        onClick={onClose}
        className={`fixed inset-0 z-40 bg-black/50 transition-opacity lg:hidden ${
          isOpen ? 'opacity-100' : 'pointer-events-none opacity-0'
        }`}
        aria-hidden="true"
      />

      <aside
        className={`
          fixed inset-y-0 left-0 z-50 w-64 shrink-0 transform border-r border-slate-200 bg-slate-950 text-slate-200
          transition-transform duration-200 ease-out
          lg:static lg:translate-x-0 lg:transition-none
          ${isOpen ? 'translate-x-0' : '-translate-x-full'}
        `}
      >
        {navContent}
      </aside>
    </>
  )
}

export default DashboardSidebar