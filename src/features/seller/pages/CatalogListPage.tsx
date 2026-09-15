import { useEffect, useMemo, useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Plus, Search, MoreHorizontal, Pencil, Trash2, X } from 'lucide-react'
import { useGlobalModal } from '@/components/ui/GlobalModalProvider'
import type { CatalogEntityConfig } from '../config/catalogEntityConfig'
import type { CatalogItem } from '../types/catalogTypes'

type CatalogListPageProps = {
  config: CatalogEntityConfig
}

const CatalogListPage = ({ config }: CatalogListPageProps) => {
  const navigate = useNavigate()
  const { openModal } = useGlobalModal()

  const [items, setItems] = useState<CatalogItem[]>([])
  const [status, setStatus] = useState<'idle' | 'loading' | 'succeeded' | 'failed'>('idle')
  const [error, setError] = useState<string | null>(null)
  const [search, setSearch] = useState('')
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [openMenuId, setOpenMenuId] = useState<string | null>(null)
  const menuRef = useRef<HTMLDivElement>(null)

  const loadItems = async () => {
    setStatus('loading')
    setError(null)
    try {
      const response = await config.api.list({ limit: 100 })
      const rows = response.data?.data ?? []
      setItems(rows)
      setStatus('succeeded')
    } catch (err: any) {
      setStatus('failed')
      setError(
        err?.response?.data?.error?.message ??
          err?.response?.data?.message ??
          err?.message ??
          `Unable to load ${config.labelPlural.toLowerCase()}. Please try again.`,
      )
    }
  }

  useEffect(() => {
    void loadItems()
  }, [config])

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

  const filteredItems = useMemo(() => {
    const term = search.trim().toLowerCase()
    if (!term) return items
    return items.filter((item) => {
      const usageCount = item._count?.products ?? item._count?.variants ?? 0
      return (
        item.name.toLowerCase().includes(term) ||
        item.code.toLowerCase().includes(term) ||
        (item.slug ?? '').toLowerCase().includes(term) ||
        String(usageCount).toLowerCase().includes(term)
      )
    })
  }, [items, search])

  const deleteItemsByIds = async (ids: string[]) => {
    if (ids.length === 0) return

    const results = await Promise.allSettled(ids.map((id) => config.api.remove(id)))
    const deletedIds = ids.filter((_, index) => results[index]?.status === 'fulfilled')
    const failedCount = results.length - deletedIds.length

    if (deletedIds.length > 0) {
      setItems((prev) => prev.filter((item) => !deletedIds.includes(item.id)))
      setSelectedIds((prev) => {
        const next = new Set(prev)
        deletedIds.forEach((id) => next.delete(id))
        return next
      })
    }

    if (failedCount > 0) {
      throw new Error(
        `${failedCount} ${config.labelPlural.toLowerCase()} deletion(s) failed. Please try again.`,
      )
    }
  }

  const confirmSingleDelete = (item: CatalogItem) => {
    openModal({
      title: `Delete ${config.labelSingular.toLowerCase()}?`,
      content: (
        <p>
          Are you sure you want to delete <strong>{item.name}</strong>? This action cannot be
          undone.
        </p>
      ),
      primaryLabel: 'Delete',
      primaryVariant: 'success',
      secondaryLabel: 'Cancel',
      onPrimary: async () => {
        await deleteItemsByIds([item.id])
      },
    })
  }

  const confirmBulkDelete = () => {
    const selectedCount = selectedIds.size
    openModal({
      title: `Delete selected ${config.labelPlural.toLowerCase()}?`,
      content: (
        <p>
          You are about to delete {selectedCount} selected{' '}
          {config.labelPlural.toLowerCase()}. This action cannot be undone.
        </p>
      ),
      primaryLabel: 'Delete',
      primaryVariant: 'success',
      secondaryLabel: 'Cancel',
      onPrimary: () => deleteItemsByIds(Array.from(selectedIds)),
    })
  }

  const allSelected = filteredItems.length > 0 && filteredItems.every((item) => selectedIds.has(item.id))

  const toggleSelectAll = () => {
    const pageIds = filteredItems.map((item) => item.id)
    setSelectedIds((prev) => {
      const next = new Set(prev)
      const allSelected = pageIds.every((id) => next.has(id))
      if (allSelected) pageIds.forEach((id) => next.delete(id))
      else pageIds.forEach((id) => next.add(id))
      return next
    })
  }

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const usageCountOf = (item: CatalogItem) => item._count?.products ?? item._count?.variants ?? 0

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr)
    return d.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    })
  }

  const colSpan = 7

  return (
    <div className="space-y-6">
      {/* Breadcrumbs */}
      <nav className="text-xs text-slate-500">
        <Link to="/seller/overview" className="hover:text-slate-700">
          Dashboard
        </Link>
        <span className="mx-1">/</span>
        <span className="text-slate-900">{config.labelPlural}</span>
      </nav>

      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-900">{config.labelPlural}</h1>
          <p className="mt-0.5 text-sm text-slate-600">{config.description}</p>
        </div>
        <Link
          to={config.newPath}
          className="flex shrink-0 items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700"
        >
          <Plus size={18} />
          Add {config.labelSingular}
        </Link>
      </div>

      {/* Search & bulk actions */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        {selectedIds.size > 0 ? (
          <div className="flex flex-wrap items-center gap-3">
            <p className="text-sm text-slate-700">{selectedIds.size} selected</p>
            <button
              type="button"
              onClick={confirmBulkDelete}
              className="flex cursor-pointer items-center gap-2 rounded-lg bg-red-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-red-700"
            >
              <Trash2 size={14} />
              Delete ({selectedIds.size})
            </button>
            <button
              type="button"
              onClick={() => setSelectedIds(new Set())}
              className="flex cursor-pointer items-center gap-1 text-sm text-slate-600 hover:text-slate-800"
            >
              <X size={14} />
              Clear
            </button>
          </div>
        ) : (
          <div className="relative w-full max-w-md">
            <Search
              size={18}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
            />
            <input
              type="search"
              placeholder={`Search ${config.labelPlural.toLowerCase()}...`}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full rounded-lg border border-slate-200 bg-white py-2 pl-10 pr-4 text-sm outline-none placeholder:text-slate-400 focus:border-emerald-500"
            />
          </div>
        )}
      </div>

      {/* Table */}
      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[760px]">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50">
                <th className="w-12 px-4 py-3 text-left">
                  <input
                    type="checkbox"
                    checked={allSelected}
                    onChange={toggleSelectAll}
                    className="rounded border-slate-300"
                  />
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-slate-600">
                  {config.labelSingular}
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-slate-600">
                  Code
                </th>
                {config.hasSlug && (
                  <th className="px-4 py-3 text-left text-xs font-medium text-slate-600">
                    Slug
                  </th>
                )}
                <th className="px-4 py-3 text-left text-xs font-medium text-slate-600">
                  In Use
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
              {status === 'loading' && (
                <tr>
                  <td colSpan={colSpan} className="px-4 py-10 text-center text-sm text-slate-500">
                    Loading {config.labelPlural.toLowerCase()}...
                  </td>
                </tr>
              )}
              {status === 'failed' && (
                <tr>
                  <td colSpan={colSpan} className="px-4 py-10 text-center text-sm text-red-600">
                    {error ?? `Unable to load ${config.labelPlural.toLowerCase()}.`}
                  </td>
                </tr>
              )}
              {status !== 'loading' &&
                status !== 'failed' &&
                filteredItems.length === 0 && (
                  <tr>
                    <td colSpan={colSpan} className="px-4 py-10 text-center text-sm text-slate-500">
                      {search
                        ? `No ${config.labelPlural.toLowerCase()} match your search.`
                        : `No ${config.labelPlural.toLowerCase()} found.`}
                    </td>
                  </tr>
                )}
              {status !== 'loading' &&
                status !== 'failed' &&
                filteredItems.map((item, index) => {
                  const openUpward = index >= filteredItems.length - 2
                  const Icon = config.icon
                  return (
                    <tr
                      key={item.id}
                      className="cursor-pointer border-b border-slate-100 last:border-0 hover:bg-slate-50"
                      onClick={() => navigate(config.editPath(item.id))}
                    >
                      <td className="px-4 py-3">
                        <input
                          type="checkbox"
                          checked={selectedIds.has(item.id)}
                          onChange={() => toggleSelect(item.id)}
                          onClick={(e) => e.stopPropagation()}
                          className="rounded border-slate-300"
                        />
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded bg-slate-200 text-slate-500">
                            <Icon size={20} />
                          </div>
                          <p className="text-xs font-semibold text-slate-900">{item.name}</p>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span className="inline-flex rounded bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-700">
                          {item.code}
                        </span>
                      </td>
                      {config.hasSlug && (
                        <td className="px-4 py-3 text-xs text-slate-700">{item.slug ?? '—'}</td>
                      )}
                      <td className="px-4 py-3 text-xs text-slate-600">
                        {usageCountOf(item)} {config.usageLabel}
                      </td>
                      <td className="px-4 py-3 text-xs text-slate-600">
                        {item.createdAt ? formatDate(item.createdAt) : '—'}
                      </td>
                      <td className="relative w-16 px-2 py-3">
                        <div
                          className="relative inline-block"
                          ref={openMenuId === item.id ? menuRef : undefined}
                        >
                          <button
                            type="button"
                            onMouseDown={(e) => e.stopPropagation()}
                            onClick={(e) => {
                              e.stopPropagation()
                              setOpenMenuId((id) => (id === item.id ? null : item.id))
                            }}
                            className="rounded p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600 cursor-pointer"
                            aria-label="Actions"
                            aria-expanded={openMenuId === item.id}
                          >
                            <MoreHorizontal size={18} />
                          </button>
                          {openMenuId === item.id && (
                            <div
                              className={`absolute right-0 z-50 min-w-[140px] rounded-lg border border-slate-200 bg-white py-1 shadow-lg ${
                                openUpward ? 'bottom-full mb-1' : 'top-full mt-1'
                              }`}
                            >
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation()
                                  setOpenMenuId(null)
                                  navigate(config.editPath(item.id))
                                }}
                                className="flex w-full items-center gap-3 px-4 py-2 text-left text-xs text-slate-700 hover:bg-slate-50 cursor-pointer"
                              >
                                <Pencil size={16} className="shrink-0 text-slate-500" />
                                Edit
                              </button>
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation()
                                  setOpenMenuId(null)
                                  confirmSingleDelete(item)
                                }}
                                className="flex w-full items-center gap-3 px-4 py-2 text-left text-xs text-red-600 hover:bg-slate-50 cursor-pointer"
                              >
                                <Trash2 size={16} className="shrink-0 text-slate-500" />
                                Delete
                              </button>
                            </div>
                          )}
                        </div>
                      </td>
                    </tr>
                  )
                })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

export default CatalogListPage