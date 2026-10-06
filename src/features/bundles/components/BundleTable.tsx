import { useEffect, useRef, useState, type ReactNode } from 'react'
import { createPortal } from 'react-dom'
import { MoreHorizontal, Pencil, Trash2 } from 'lucide-react'
import { useGlobalModal } from '@/components/ui/GlobalModalProvider'
import { formatKsPrice } from '@/features/products/utils/formatProductPrice'
import { bundleApi, bundleErrorMessage } from '../api/bundleApi'
import BundleStatusBadge from './BundleStatusBadge'
import type { BundleRecord } from '../types/bundleTypes'

const ACTIONS_MENU_WIDTH = 140
const ACTIONS_MENU_HEIGHT = 84

interface BundleTableProps {
  bundles: BundleRecord[]
  loading: boolean
  error: string | null
  onEdit: (id: string) => void
  onChanged: () => void
  footer?: ReactNode
}

const BundleTable = ({ bundles, loading, error, onEdit, onChanged, footer }: BundleTableProps) => {
  const { openModal } = useGlobalModal()
  const [busy, setBusy] = useState(false)
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
    setMenuPosition({
      top: openUpward ? rect.top - ACTIONS_MENU_HEIGHT - 4 : rect.bottom + 4,
      left: Math.min(Math.max(8, rect.right - ACTIONS_MENU_WIDTH), window.innerWidth - ACTIONS_MENU_WIDTH - 8),
    })
    setOpenMenuId(id)
  }

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node
      const activeButton = openMenuId ? buttonRefs.current[openMenuId] : null
      if (menuRef.current?.contains(target) || activeButton?.contains(target)) return
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

  const quickActionFor = (bundle: BundleRecord): { label: string; action?: 'publish' | 'pause' | 'resume' } => {
    switch (bundle.status) {
      case 'DRAFT':
        return { label: 'Publish', action: 'publish' }
      case 'ACTIVE':
        return { label: 'Pause', action: 'pause' }
      case 'PAUSED':
        return { label: 'Resume', action: 'resume' }
      default:
        return { label: '' }
    }
  }

  const runAction = async (bundle: BundleRecord, action: 'publish' | 'pause' | 'resume' | 'end' | 'remove') => {
    setBusy(true)
    try {
      if (action === 'remove') await bundleApi.remove(bundle.id)
      else await bundleApi[action](bundle.id)
      onChanged()
    } catch (err) {
      openModal({
        title: 'Bundle update failed',
        content: <p>{bundleErrorMessage(err)}</p>,
        primaryLabel: 'Close',
        onPrimary: () => undefined,
      })
    } finally {
      setBusy(false)
    }
  }

  const confirmAction = (bundle: BundleRecord, label: string, action: 'publish' | 'pause' | 'resume' | 'end' | 'remove', danger = false) => {
    openModal({
      title: `${label} bundle?`,
      content: (
        <p>
          Are you sure you want to <strong>{label.toLowerCase()}</strong> the bundle <strong>{bundle.title}</strong>?
        </p>
      ),
      primaryLabel: label,
      primaryVariant: danger ? 'danger' : undefined,
      onPrimary: () => runAction(bundle, action),
    })
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <p className="text-sm text-slate-500">Loading bundles...</p>
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
    <div className="overflow-hidden rounded-xl border border-[var(--dni-border)] bg-white">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[860px]">
          <thead>
            <tr className="border-b border-[var(--dni-border)] bg-white">
              <th className="px-4 py-3 text-left text-xs font-medium text-slate-600">Name</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-slate-600">Status</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-slate-600">Products</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-slate-600">Bundle price</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-slate-600">Actions</th>
              <th className="w-14 px-2 py-3" />
            </tr>
          </thead>
          <tbody>
            {bundles.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-12 text-center text-sm text-slate-500">
                  No bundles found.
                </td>
              </tr>
            ) : (
              bundles.map((bundle) => {
                const quickAction = quickActionFor(bundle)
                const canCancel = bundle.status !== 'ENDED' && bundle.status !== 'DRAFT'
                return (
                  <tr key={bundle.id} className="border-b border-slate-100 last:border-0 hover:bg-slate-50">
                    <td className="max-w-[260px] px-4 py-3">
                      <span className="block truncate text-sm font-medium text-slate-900">{bundle.title}</span>
                      {bundle.description?.trim() && bundle.description.trim() !== bundle.title.trim() && (
                        <span className="mt-0.5 block truncate text-xs text-slate-500">{bundle.description.trim()}</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <BundleStatusBadge status={bundle.status} />
                    </td>
                    <td className="px-4 py-3 text-sm text-slate-700">{bundle.items.length}</td>
                    <td className="px-4 py-3 text-sm font-semibold tabular-nums text-slate-900">
                      {bundle.bundlePrice == null ? '—' : formatKsPrice(bundle.bundlePrice)}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap items-center gap-1.5">
                        {quickAction.action && (
                          <button
                            type="button"
                            disabled={busy}
                            onClick={() => confirmAction(bundle, quickAction.label, quickAction.action!)}
                            className="cursor-pointer rounded-lg bg-[var(--dni-primary)] px-3 py-1.5 text-xs font-medium text-white hover:bg-[var(--dni-primary-hover)] disabled:cursor-not-allowed disabled:opacity-50"
                          >
                            {quickAction.label}
                          </button>
                        )}
                        {canCancel && (
                          <button
                            type="button"
                            disabled={busy}
                            onClick={() => confirmAction(bundle, 'Cancel', 'end', true)}
                            className="cursor-pointer rounded-lg border border-red-200 bg-white px-3 py-1.5 text-xs font-medium text-red-600 hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50"
                          >
                            Cancel
                          </button>
                        )}
                      </div>
                    </td>
                    <td className="w-14 px-2 py-3">
                      <button
                        ref={(node) => {
                          buttonRefs.current[bundle.id] = node
                        }}
                        type="button"
                        onClick={(event) => {
                          event.stopPropagation()
                          openMenu(bundle.id, event.currentTarget)
                        }}
                        className="cursor-pointer rounded p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
                        aria-label="Actions"
                      >
                        <MoreHorizontal size={18} />
                      </button>
                    </td>
                  </tr>
                )
              })
            )}
          </tbody>
        </table>
      </div>
      {footer}
      {openMenuId && menuPosition && createPortal(
        <div
          ref={menuRef}
          style={{ top: menuPosition.top, left: menuPosition.left, width: ACTIONS_MENU_WIDTH }}
          className="fixed z-[100] rounded-lg border border-[var(--dni-border)] bg-white py-1 shadow-lg"
        >
          <button
            type="button"
            onClick={() => {
              const id = openMenuId
              closeMenu()
              onEdit(id)
            }}
            className="flex w-full cursor-pointer items-center gap-3 px-4 py-2 text-left text-xs text-slate-700 hover:bg-slate-50"
          >
            <Pencil size={16} className="shrink-0 text-slate-500" />
            Edit
          </button>
          <button
            type="button"
            disabled={busy || !['DRAFT', 'ENDED'].includes(bundles.find((row) => row.id === openMenuId)?.status ?? '')}
            onClick={() => {
              const bundle = bundles.find((row) => row.id === openMenuId)
              closeMenu()
              if (bundle) confirmAction(bundle, 'Delete', 'remove', true)
            }}
            className="flex w-full cursor-pointer items-center gap-3 px-4 py-2 text-left text-xs text-red-600 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <Trash2 size={16} className="shrink-0 text-slate-500" />
            Delete
          </button>
        </div>,
        document.body,
      )}
    </div>
  )
}

export default BundleTable
