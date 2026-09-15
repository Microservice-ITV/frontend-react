import { useEffect, useRef, useState, type ReactNode } from 'react'
import { createPortal } from 'react-dom'
import { useDispatch, useSelector } from 'react-redux'
import { MoreHorizontal, Pencil, Trash2, Eye } from 'lucide-react'

import type { AppDispatch } from '@/app/store'
import { useGlobalModal } from '@/components/ui/GlobalModalProvider'
import { deleteAnnouncementType } from '../store/announcementTypeThunks'
import { selectAnnouncementTypesDeleting } from '../store/announcementTypeSelectors'
import type { AnnouncementType } from '../types/announcementTypes'

const ACTIONS_MENU_WIDTH = 140
const ACTIONS_MENU_HEIGHT = 124

interface AnnouncementTypesTableProps {
  types: AnnouncementType[]
  loading: boolean
  error: string | null
  onView: (id: string) => void
  onEdit: (id: string) => void
  footer?: ReactNode
}

const AnnouncementTypesTable = ({
  types,
  loading,
  error,
  onView,
  onEdit,
  footer,
}: AnnouncementTypesTableProps) => {
  const dispatch = useDispatch<AppDispatch>()
  const { openModal } = useGlobalModal()

  const deleting = useSelector(selectAnnouncementTypesDeleting)

  const [openMenuId, setOpenMenuId] = useState<string | null>(null)
  const [menuPosition, setMenuPosition] = useState<{ top: number; left: number } | null>(null)
  const menuRef = useRef<HTMLDivElement>(null)
  const buttonRefs = useRef<Record<string, HTMLButtonElement | null>>({})

  const closeMenu = () => {
    setOpenMenuId(null)
    setMenuPosition(null)
  }

  const openMenu = (id: string, button: HTMLButtonElement) => {
    if (openMenuId === id) {
      closeMenu()
      return
    }

    const rect = button.getBoundingClientRect()
    const openUpward = window.innerHeight - rect.bottom < ACTIONS_MENU_HEIGHT + 8
    const top = openUpward ? rect.top - ACTIONS_MENU_HEIGHT - 4 : rect.bottom + 4
    const left = Math.min(
      Math.max(8, rect.right - ACTIONS_MENU_WIDTH),
      window.innerWidth - ACTIONS_MENU_WIDTH - 8
    )

    setMenuPosition({ top, left })
    setOpenMenuId(id)
  }

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as Node
      const activeButton = openMenuId ? buttonRefs.current[openMenuId] : null
      if (
        menuRef.current?.contains(target) ||
        activeButton?.contains(target)
      ) {
        return
      }
      closeMenu()
    }
    const handleRepositionClose = () => closeMenu()

    if (openMenuId) {
      document.addEventListener('mousedown', handleClickOutside)
      window.addEventListener('resize', handleRepositionClose)
      window.addEventListener('scroll', handleRepositionClose, true)
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
      window.removeEventListener('resize', handleRepositionClose)
      window.removeEventListener('scroll', handleRepositionClose, true)
    }
  }, [openMenuId])

  const confirmDelete = (type: AnnouncementType) => {
    openModal({
      title: 'Delete announcement type?',
      content: (
        <p>
          Are you sure you want to delete <strong>{type.name}</strong>? Announcement types with
          associated announcements cannot be deleted.
        </p>
      ),
      primaryLabel: 'Delete',
      primaryVariant: 'danger',
      secondaryLabel: 'Cancel',
      onPrimary: async () => {
        await dispatch(deleteAnnouncementType(type.id)).unwrap()
      },
    })
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <p className="text-sm text-slate-500">Loading announcement types...</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="rounded-lg border border-red-200 bg-red-50 p-4">
        <p className="text-sm text-red-600">{error}</p>
      </div>
    )
  }

  return (
    <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[700px]">
          <thead>
            <tr className="border-b border-slate-200 bg-slate-50">
              <th className="px-4 py-3 text-left text-xs font-medium text-slate-600">Name</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-slate-600">Code</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-slate-600">Elements</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-slate-600">Status</th>
              <th className="w-16 px-2 py-3 text-left text-xs font-medium text-slate-600">
                Actions
              </th>
            </tr>
          </thead>
          <tbody>
            {types.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-4 py-12 text-center text-sm text-slate-500">
                  No announcement types found.
                </td>
              </tr>
            ) : (
              types.map((type) => (
                <tr
                  key={type.id}
                  className="border-b border-slate-100 last:border-0 hover:bg-slate-50 cursor-pointer"
                  onClick={() => onView(type.id)}
                >
                  <td className="px-4 py-3">
                    <p className="text-xs font-semibold text-slate-900">{type.name}</p>
                    {type.description && (
                      <p className="mt-0.5 line-clamp-1 max-w-xs text-xs text-slate-500">
                        {type.description}
                      </p>
                    )}
                  </td>

                  <td className="px-4 py-3">
                    <span className="rounded bg-slate-100 px-2 py-0.5 font-mono text-xs text-slate-700">
                      {type.code}
                    </span>
                  </td>

                  <td className="px-4 py-3 text-xs text-slate-600">{type.elements.length}</td>

                  <td className="px-4 py-3">
                    <span
                      className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${
                        type.isActive
                          ? 'bg-emerald-100 text-emerald-700'
                          : 'bg-slate-100 text-slate-600'
                      }`}
                    >
                      {type.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </td>

                  <td className="w-16 px-2 py-3">
                    <button
                      ref={(node) => {
                        buttonRefs.current[type.id] = node
                      }}
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation()
                        openMenu(type.id, e.currentTarget)
                      }}
                      className="cursor-pointer rounded p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
                      aria-label="Actions"
                      aria-expanded={openMenuId === type.id}
                    >
                      <MoreHorizontal size={18} />
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {footer}

      {openMenuId &&
        menuPosition &&
        createPortal(
          <div
            ref={menuRef}
            style={{ top: menuPosition.top, left: menuPosition.left, width: ACTIONS_MENU_WIDTH }}
            className="fixed z-[100] rounded-lg border border-slate-200 bg-white py-1 shadow-lg"
          >
            <button
              type="button"
              onClick={() => {
                const id = openMenuId
                closeMenu()
                onView(id)
              }}
              className="flex w-full items-center gap-3 px-4 py-2 text-left text-xs text-slate-700 hover:bg-slate-50"
            >
              <Eye size={16} className="shrink-0 text-slate-500" />
              View
            </button>
            <button
              type="button"
              onClick={() => {
                const id = openMenuId
                closeMenu()
                onEdit(id)
              }}
              className="flex w-full items-center gap-3 px-4 py-2 text-left text-xs text-slate-700 hover:bg-slate-50"
            >
              <Pencil size={16} className="shrink-0 text-slate-500" />
              Edit
            </button>
            <button
              type="button"
              disabled={deleting}
              onClick={() => {
                const type = types.find((item) => item.id === openMenuId)
                closeMenu()
                if (type) confirmDelete(type)
              }}
              className="flex w-full items-center gap-3 px-4 py-2 text-left text-xs text-red-600 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <Trash2 size={16} className="shrink-0 text-slate-500" />
              Delete
            </button>
          </div>,
          document.body
        )}
    </div>
  )
}

export default AnnouncementTypesTable