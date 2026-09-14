import { useEffect, useRef, useState, type ReactNode } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { MoreHorizontal, Pencil, Trash2 } from 'lucide-react'

import type { AppDispatch } from '@/app/store'
import { productServiceAssetUrl } from '@/lib/api/apiConfig'
import { useGlobalModal } from '@/components/ui/GlobalModalProvider'
import { deletePromoCard } from '../store/promoCardThunks'
import { selectPromoCardsDeleting } from '../store/promoCardSelectors'
import type { PromoCard } from '../types/promoCardTypes'

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
  const menuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setOpenMenuId(null)
      }
    }
    if (openMenuId) {
      document.addEventListener('mousedown', handleClickOutside)
    }
    return () => document.removeEventListener('mousedown', handleClickOutside)
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
              cards.map((card, index) => (
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

                  <td className="relative w-16 px-2 py-3">
                    <div
                      className="relative inline-block"
                      ref={openMenuId === card.id ? menuRef : undefined}
                    >
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation()
                          setOpenMenuId((id) =>
                            id === card.id ? null : card.id,
                          )
                        }}
                        className="rounded p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600 cursor-pointer"
                        aria-label="Actions"
                        aria-expanded={openMenuId === card.id}
                      >
                        <MoreHorizontal size={18} />
                      </button>
                      {openMenuId === card.id && (
                        <div
                          className={`absolute right-0 z-50 min-w-[140px] rounded-lg border border-slate-200 bg-white py-1 shadow-lg ${
                            index >= cards.length - 2
                              ? 'bottom-full mb-1'
                              : 'top-full mt-1'
                          }`}
                        >
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation()
                              setOpenMenuId(null)
                              onEdit(card.id)
                            }}
                            className="flex w-full items-center gap-3 px-4 py-2 text-left text-xs text-slate-700 hover:bg-slate-50 cursor-pointer"
                          >
                            <Pencil size={16} className="shrink-0 text-slate-500" />
                            Edit
                          </button>
                          <button
                            type="button"
                            disabled={deleting}
                            onClick={(e) => {
                              e.stopPropagation()
                              setOpenMenuId(null)
                              confirmDelete(card.id, card.position)
                            }}
                            className="flex w-full items-center gap-3 px-4 py-2 text-left text-xs text-red-600 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50 cursor-pointer"
                          >
                            <Trash2 size={16} className="shrink-0 text-slate-500" />
                            Delete
                          </button>
                        </div>
                      )}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {footer}
    </div>
  )
}

export default PromoCardTable
