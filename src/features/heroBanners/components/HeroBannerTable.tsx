import { useEffect, useRef, useState, type ReactNode } from 'react'
import { createPortal } from 'react-dom'
import { useDispatch, useSelector } from 'react-redux'
import { MoreHorizontal, Pencil, Trash2 } from 'lucide-react'

import type { AppDispatch } from '@/app/store'
import { useGlobalModal } from '@/components/ui/GlobalModalProvider'
import { deleteHeroBanner } from '../store/heroBannerThunks'
import { selectHeroBannersDeleting } from '../store/heroBannerSelectors'
import type { HeroBanner } from '../types/heroBannerTypes'

const ACTIONS_MENU_WIDTH = 140
const ACTIONS_MENU_HEIGHT = 84

interface HeroBannerTableProps {
  banners: HeroBanner[]
  loading: boolean
  error: string | null
  onEdit: (id: string) => void
  footer?: ReactNode
}

const HeroBannerTable = ({ banners, loading, error, onEdit, footer }: HeroBannerTableProps) => {
  const dispatch = useDispatch<AppDispatch>()
  const { openModal } = useGlobalModal()

  const deleting = useSelector(selectHeroBannersDeleting)

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
      if (menuRef.current?.contains(target) || activeButton?.contains(target)) {
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

  const confirmDelete = (id: string) => {
    openModal({
      title: 'Delete hero banner?',
      content: (
        <p>
          Are you sure you want to delete this hero banner? This action cannot be
          undone.
        </p>
      ),
      primaryLabel: 'Delete',
      primaryVariant: 'danger',
      secondaryLabel: 'Cancel',
      onPrimary: async () => {
        await dispatch(deleteHeroBanner(id)).unwrap()
      },
    })
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <p className="text-sm text-slate-500">Loading hero banners...</p>
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
              <th className="px-4 py-3 text-left text-xs font-medium text-slate-600">
                Order
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-slate-600">
                Image
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-slate-600">
                Status
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-slate-600">
                Created
              </th>
              <th className="w-16 px-2 py-3 text-left text-xs font-medium text-slate-600">
                Actions
              </th>
            </tr>
          </thead>
          <tbody>
            {banners.length === 0 ? (
              <tr>
                <td
                  colSpan={5}
                  className="px-4 py-12 text-center text-sm text-slate-500"
                >
                  No hero banners found.
                </td>
              </tr>
            ) : (
              banners.map((banner) => (
                <tr
                  key={banner.id}
                  className="border-b border-slate-100 last:border-0 hover:bg-slate-50"
                >
                  <td className="px-4 py-3 text-xs text-slate-600">
                    {banner.sortOrder}
                  </td>

                  <td className="px-4 py-3">
                    <div className="flex h-14 w-24 items-center justify-center overflow-hidden rounded bg-slate-100">
                      {banner.imageUrl ? (
                        <img
                          src={banner.imageUrl}
                          alt="Hero banner"
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <span className="text-xs text-slate-400">—</span>
                      )}
                    </div>
                  </td>

                  <td className="px-4 py-3">
                    <span
                      className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${
                        banner.isActive
                          ? 'bg-emerald-100 text-emerald-700'
                          : 'bg-slate-100 text-slate-600'
                      }`}
                    >
                      {banner.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </td>

                  <td className="px-4 py-3 text-xs text-slate-600">
                    {new Date(banner.createdAt).toLocaleDateString()}
                  </td>

                  <td className="w-16 px-2 py-3">
                    <button
                      ref={(node) => {
                        buttonRefs.current[banner.id] = node
                      }}
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation()
                        openMenu(banner.id, e.currentTarget)
                      }}
                      className="rounded p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600 cursor-pointer"
                      aria-label="Actions"
                      aria-expanded={openMenuId === banner.id}
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
                onEdit(id)
              }}
              className="flex w-full items-center gap-3 px-4 py-2 text-left text-xs text-slate-700 hover:bg-slate-50 cursor-pointer"
            >
              <Pencil size={16} className="shrink-0 text-slate-500" />
              Edit
            </button>
            <button
              type="button"
              disabled={deleting}
              onClick={() => {
                const id = openMenuId
                closeMenu()
                confirmDelete(id)
              }}
              className="flex w-full items-center gap-3 px-4 py-2 text-left text-xs text-red-600 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50 cursor-pointer"
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

export default HeroBannerTable
