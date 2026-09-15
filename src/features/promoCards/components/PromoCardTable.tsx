import { useEffect, useRef, useState, type ReactNode } from 'react'
import { createPortal } from 'react-dom'
import { useDispatch, useSelector } from 'react-redux'
import { MoreHorizontal, Pencil, Trash2 } from 'lucide-react'

import type { AppDispatch } from '@/app/store'
import { productServiceAssetUrl } from '@/lib/api/apiConfig'
import { useGlobalModal } from '@/components/ui/GlobalModalProvider'
import { deletePromoCard } from '../store/promoCardThunks'
import { selectPromoCardsDeleting } from '../store/promoCardSelectors'
import type { PromoCard } from '../types/promoCardTypes'

const ACTIONS_MENU_WIDTH = 140
const ACTIONS_MENU_HEIGHT = 84

interface PromoCardTableProps {
  cards: PromoCard[]
  loading: boolean
  error: string | null
  onEdit: (id: string) => void
  footer?: ReactNode
}

const PromoCardTable = ({ cards, loading, error, onEdit, footer }: PromoCardTableProps) => {
  const dispatch = useDispatch<AppDispatch>()
  const { openModal } = useGlobalModal()

  const deleting = useSelector(selectPromoCardsDeleting)

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

  const confirmDelete = (id: string, position: string) => {
    openModal({
      title: 'Delete promo banner?',
      content: (
        <p>
          Are you sure you want to delete the <strong>{position}</strong> promo banner? This action cannot be
          undone.
        </p>
      ),
      primaryLabel: 'Delete',
      primaryVariant: 'danger',
      secondaryLabel: 'Cancel',
      onPrimary: async () => {
        await dispatch(deletePromoCard(id)).unwrap()
      },
    })
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <p className="text-sm text-slate-500">Loading promo banners...</p>
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
        <table className="w-full min-w-[600px]">
          <thead>
            <tr className="border-b border-slate-200 bg-slate-50">
              <th className="px-4 py-3 text-left text-xs font-medium text-slate-600">
                Image
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-slate-600">
                Position
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-slate-600">
                Status
              </th>
              <th className="w-16 px-2 py-3 text-left text-xs font-medium text-slate-600">
                Actions
              </th>
            </tr>
          </thead>
          <tbody>
            {cards.length === 0 ? (
              <tr>
                <td
                  colSpan={4}
                  className="px-4 py-12 text-center text-sm text-slate-500"
                >
                  No promo banners found.
                </td>
              </tr>
            ) : (
              cards.map((card) => (
                <tr
                  key={card.id}
                  className="border-b border-slate-100 last:border-0 hover:bg-slate-50"
                >
                  <td className="px-4 py-3">
                    <div className="flex h-12 w-20 items-center justify-center overflow-hidden rounded bg-slate-100">
                      {card.imageUrl ? (
                        <img
                          src={productServiceAssetUrl(card.imageUrl)}
                          alt="Promo banner"
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <span className="text-xs text-slate-400">No image</span>
                      )}
                    </div>
                  </td>

                  <td className="px-4 py-3">
                    <span className="text-xs font-semibold text-slate-900">
                      {card.position}
                    </span>
                  </td>

                  <td className="px-4 py-3">
                    <span
                      className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${
                        card.isActive
                          ? 'bg-emerald-100 text-emerald-700'
                          : 'bg-slate-100 text-slate-600'
                      }`}
                    >
                      {card.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </td>

                  <td className="w-16 px-2 py-3">
                    <button
                      ref={(node) => {
                        buttonRefs.current[card.id] = node
                      }}
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation()
                        openMenu(card.id, e.currentTarget)
                      }}
                      className="rounded p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600 cursor-pointer"
                      aria-label="Actions"
                      aria-expanded={openMenuId === card.id}
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
                const card = cards.find((item) => item.id === openMenuId)
                closeMenu()
                if (card) confirmDelete(card.id, card.position)
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

export default PromoCardTable
