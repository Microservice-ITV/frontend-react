import { useEffect, useRef, useState, type ReactNode } from 'react'
import { createPortal } from 'react-dom'
import { useDispatch, useSelector } from 'react-redux'
import {
  MoreHorizontal,
  Pencil,
  Trash2,
  Send,
  Play,
  Pause as PauseIcon,
  XCircle,
  PackagePlus,
} from 'lucide-react'

import type { AppDispatch } from '@/app/store'
import { productServiceAssetUrl } from '@/lib/api/apiConfig'
import { useGlobalModal } from '@/components/ui/GlobalModalProvider'
import {
  deleteFlashDeal,
  publishFlashDeal,
  activateFlashDeal,
  pauseFlashDeal,
  cancelFlashDeal,
  updateFlashDealStock,
} from '../store/flashDealThunks'
import { selectFlashDealsDeleting } from '../store/flashDealSelectors'
import type { FlashDeal, FlashDealItem } from '../types/flashDealTypes'

const statusStyles: Record<FlashDeal['status'], string> = {
  DRAFT: 'bg-slate-100 text-slate-600 ring-slate-500/10',
  SCHEDULED: 'bg-sky-100 text-sky-700 ring-sky-500/10',
  ACTIVE: 'bg-emerald-100 text-emerald-700 ring-emerald-500/10',
  ENDED: 'bg-violet-100 text-violet-700 ring-violet-500/10',
  CANCELLED: 'bg-rose-100 text-rose-700 ring-rose-500/10',
  PAUSED: 'bg-amber-100 text-amber-700 ring-amber-500/10',
}

const ACTIONS_MENU_WIDTH = 150
const QUICK_ACTION_HEIGHT = 33

interface FlashDealTableProps {
  deals: FlashDeal[]
  loading: boolean
  error: string | null
  onEdit: (id: string) => void
  onView?: (id: string) => void
  footer?: ReactNode
}

type QuickActionKey = 'publish' | 'activate' | 'pause' | 'cancel' | 'topup'

const getQuickActions = (deal: FlashDeal): QuickActionKey[] => {
  const actions: QuickActionKey[] = []
  if (deal.status === 'DRAFT' || deal.status === 'PAUSED') actions.push('publish')
  if (deal.status === 'SCHEDULED' || deal.status === 'PAUSED') actions.push('activate')
  if (deal.status === 'ACTIVE') actions.push('pause')
  if (deal.status === 'DRAFT' || deal.status === 'SCHEDULED' || deal.status === 'PAUSED') actions.push('cancel')
  if (deal.status === 'ACTIVE') actions.push('topup')
  return actions
}

const QUICK_ACTION_META: Record<QuickActionKey, { label: string; icon: ReactNode; color: string }> = {
  publish: { label: 'Publish', icon: <Send size={16} />, color: 'text-sky-600' },
  activate: { label: 'Activate Now', icon: <Play size={16} />, color: 'text-emerald-600' },
  pause: { label: 'Pause', icon: <PauseIcon size={16} />, color: 'text-amber-600' },
  cancel: { label: 'Cancel Deal', icon: <XCircle size={16} />, color: 'text-rose-600' },
  topup: { label: 'Top Up Stock', icon: <PackagePlus size={16} />, color: 'text-indigo-600' },
}

const FlashDealTable = ({ deals, loading, error, onEdit, onView, footer }: FlashDealTableProps) => {
  const dispatch = useDispatch<AppDispatch>()
  const { openModal } = useGlobalModal()

  const deleting = useSelector(selectFlashDealsDeleting)

  const [openMenuId, setOpenMenuId] = useState<string | null>(null)
  const [menuPosition, setMenuPosition] = useState<{ top: number; left: number } | null>(null)
  const [busyId, setBusyId] = useState<string | null>(null)
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

    const deal = deals.find((item) => item.id === id)
    const quickCount = deal ? getQuickActions(deal).length : 0
    const menuHeight = 4 + (quickCount + (onView ? 3 : 2)) * QUICK_ACTION_HEIGHT

    const rect = button.getBoundingClientRect()
    const openUpward = window.innerHeight - rect.bottom < menuHeight + 8
    const top = openUpward ? rect.top - menuHeight - 4 : rect.bottom + 4
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

  const runAction = async (id: string, action: () => Promise<void>) => {
    if (busyId) return
    setBusyId(id)
    try {
      await action()
    } finally {
      setBusyId(null)
    }
  }

  const confirmDelete = (id: string, name: string) => {
    openModal({
      title: 'Delete flash deal?',
      content: (
        <p>
          Are you sure you want to delete <strong>{name}</strong>? This action cannot be undone.
        </p>
      ),
      primaryLabel: 'Delete',
      primaryVariant: 'danger',
      secondaryLabel: 'Cancel',
      onPrimary: async () => {
        await dispatch(deleteFlashDeal(id)).unwrap()
      },
    })
  }

  const openTopUp = (deal: FlashDeal) => {
    const currentItems = deal.items.map((item) => ({
      ...item,
      newAllocated: item.allocatedQuantity,
    }))

    openModal({
      title: `Top up stock - ${deal.name}`,
      content: (
        <div className="max-h-[60vh] space-y-3 overflow-y-auto">
          <p className="text-xs text-slate-500">
            Set a new allocated quantity for each item. New value cannot be lower than already sold quantity.
          </p>
          {currentItems.map((item, index) => (
            <div key={item.id} className="flex items-center gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded bg-slate-100">
                {item.product.images?.[0] ? (
                  <img
                    src={productServiceAssetUrl(item.product.images[0])}
                    alt={item.product.name}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <span className="text-[10px] text-slate-400">No img</span>
                )}
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-xs font-medium text-slate-700">{item.product.name}</p>
                <p className="text-[11px] text-slate-500">
                  Sold {item.soldQuantity} / {item.allocatedQuantity}
                </p>
              </div>
              <input
                type="number"
                min={Math.max(0, item.soldQuantity)}
                defaultValue={item.allocatedQuantity}
                onChange={(e) => {
                  currentItems[index].newAllocated = Math.max(
                    0,
                    Math.floor(Number(e.target.value) || 0)
                  )
                }}
                className="w-24 rounded-lg border border-slate-200 px-2 py-1.5 text-xs outline-none focus:border-emerald-500"
              />
            </div>
          ))}
        </div>
      ),
      primaryLabel: 'Save Stock',
      secondaryLabel: 'Cancel',
      onPrimary: async () => {
        await dispatch(
          updateFlashDealStock({
            id: deal.id,
            items: currentItems.map((item) => ({
              itemId: item.id,
              allocatedQuantity: item.newAllocated,
            })),
          })
        ).unwrap()
      },
    })
  }

  const handleQuickAction = (deal: FlashDeal, action: QuickActionKey) => {
    closeMenu()
    switch (action) {
      case 'publish':
        void runAction(deal.id, async () => {
          await dispatch(publishFlashDeal(deal.id)).unwrap()
        })
        break
      case 'activate':
        void runAction(deal.id, async () => {
          await dispatch(activateFlashDeal(deal.id)).unwrap()
        })
        break
      case 'pause':
        void runAction(deal.id, async () => {
          await dispatch(pauseFlashDeal(deal.id)).unwrap()
        })
        break
      case 'cancel':
        openModal({
          title: 'Cancel flash deal?',
          content: (
            <p>
              Are you sure you want to cancel <strong>{deal.name}</strong>? This will stop it from running.
            </p>
          ),
          primaryLabel: 'Cancel Deal',
          primaryVariant: 'danger',
          secondaryLabel: 'Keep',
          onPrimary: async () => {
            await dispatch(cancelFlashDeal(deal.id)).unwrap()
          },
        })
        break
      case 'topup':
        openTopUp(deal)
        break
    }
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })
  }

  const getFirstItemImage = (items: FlashDealItem[]) => {
    if (items.length === 0) return null
    return items[0].product.images?.[0] ?? null
  }

  const getFirstItemProduct = (items: FlashDealItem[]) => {
    if (items.length === 0) return null
    return items[0].product
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <p className="text-sm text-slate-500">Loading flash deals...</p>
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
        <table className="w-full min-w-[800px]">
          <thead>
            <tr className="border-b border-slate-200 bg-slate-50">
              <th className="px-4 py-3 text-left text-xs font-medium text-slate-600">Deal</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-slate-600">Slot</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-slate-600">Period</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-slate-600">Items</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-slate-600">Status</th>
              <th className="w-16 px-2 py-3 text-left text-xs font-medium text-slate-600">Actions</th>
            </tr>
          </thead>
          <tbody>
            {deals.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-12 text-center text-sm text-slate-500">
                  No flash deals found.
                </td>
              </tr>
            ) : (
              deals.map((deal) => (
                <tr key={deal.id} className="border-b border-slate-100 last:border-0 hover:bg-slate-50">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="flex h-12 w-12 items-center justify-center overflow-hidden rounded bg-slate-100">
                        {getFirstItemImage(deal.items) ? (
                          <img
                            src={productServiceAssetUrl(getFirstItemImage(deal.items)!)}
                            alt={deal.name}
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          <span className="text-xs text-slate-400">No image</span>
                        )}
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-slate-900 truncate max-w-[200px]">{deal.name}</p>
                        {deal.description && <p className="text-xs text-slate-500 truncate max-w-[200px]">{deal.description}</p>}
                      </div>
                    </div>
                  </td>

                  <td className="px-4 py-3">
                    {deal.slotTime ? (
                      <span className="inline-flex rounded-full bg-emerald-50 text-emerald-700 px-2 py-0.5 text-xs font-medium">
                        {deal.slotTime}
                      </span>
                    ) : (
                      <span className="text-xs text-slate-400">—</span>
                    )}
                  </td>

                  <td className="px-4 py-3 text-xs text-slate-600">
                    <div>{formatDate(deal.startAt)}</div>
                    <div>to</div>
                    <div>{formatDate(deal.endAt)}</div>
                  </td>

                  <td className="px-4 py-3">
                    <span className="text-sm font-medium text-slate-900">{deal.items.length}</span>
                    <span className="ml-1 text-xs text-slate-500">product{deal.items.length !== 1 ? 's' : ''}</span>
                  </td>

                  <td className="px-4 py-3">
                    <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ${statusStyles[deal.status]}`}>
                      {deal.status}
                    </span>
                  </td>

                  <td className="w-16 px-2 py-3">
                    <button
                      ref={(node) => {
                        buttonRefs.current[deal.id] = node
                      }}
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation()
                        openMenu(deal.id, e.currentTarget)
                      }}
                      className="rounded p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600 cursor-pointer"
                      aria-label="Actions"
                      aria-expanded={openMenuId === deal.id}
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
            {(() => {
              const deal = deals.find((item) => item.id === openMenuId)
              const busy = busyId === openMenuId
              if (!deal) return null
              return (
                <>
                  {getQuickActions(deal).map((action) => (
                    <button
                      key={action}
                      type="button"
                      disabled={busy}
                      onClick={() => handleQuickAction(deal, action)}
                      className="flex w-full items-center gap-3 px-4 py-2 text-left text-xs text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50 cursor-pointer"
                    >
                      <span className={`shrink-0 ${QUICK_ACTION_META[action].color}`}>
                        {QUICK_ACTION_META[action].icon}
                      </span>
                      <span className={QUICK_ACTION_META[action].color}>
                        {busy ? 'Working...' : QUICK_ACTION_META[action].label}
                      </span>
                    </button>
                  ))}
                  {getQuickActions(deal).length > 0 && (
                    <div className="my-1 border-t border-slate-100" />
                  )}
                  {onView && (
                    <button
                      type="button"
                      onClick={() => {
                        const id = openMenuId
                        closeMenu()
                        onView!(id)
                      }}
                      className="flex w-full items-center gap-3 px-4 py-2 text-left text-xs text-slate-700 hover:bg-slate-50 cursor-pointer"
                    >
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="shrink-0 text-slate-500">
                        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                        <circle cx="12" cy="12" r="3" />
                      </svg>
                      View
                    </button>
                  )}
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
                    disabled={Boolean(deleting[openMenuId])}
                    onClick={() => {
                      closeMenu()
                      confirmDelete(deal.id, deal.name)
                    }}
                    className="flex w-full items-center gap-3 px-4 py-2 text-left text-xs text-red-600 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50 cursor-pointer"
                  >
                    <Trash2 size={16} className="shrink-0 text-slate-500" />
                    Delete
                  </button>
                </>
              )
            })()}
          </div>,
          document.body
        )}
    </div>
  )
}

export default FlashDealTable