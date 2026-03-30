import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAppDispatch, useAppSelector } from '@/app/hooks'
import { useGlobalModal } from '@/components/ui/GlobalModalProvider'
import DataTablePagination from '@/components/ui/DataTablePagination'
import type { AdminShopRow } from '../types/shopTypes'
import { fetchAdminShops } from '../store/adminShopsThunks'
import { removeShopsLocally } from '../store/adminShopsSlice'
import {
  selectAdminShops,
  selectAdminShopsError,
  selectAdminShopsStatus,
} from '../store/adminShopsSelectors'
import {
  Plus,
  Search,
  Download,
  MoreHorizontal,
  Eye,
  Pencil,
  Trash2,
  Building2,
  X,
} from 'lucide-react'

const FILTER_TABS: { key: 'all' | 'active' | 'inactive'; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'active', label: 'Active' },
  { key: 'inactive', label: 'Inactive' },
]

const AdminShopsPage = () => {
  const dispatch = useAppDispatch()
  const { openModal } = useGlobalModal()
  const shops = useAppSelector(selectAdminShops)
  const shopsStatus = useAppSelector(selectAdminShopsStatus)
  const shopsError = useAppSelector(selectAdminShopsError)
  const [activeFilter, setActiveFilter] = useState<'all' | 'active' | 'inactive'>('all')
  const [search, setSearch] = useState('')
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [page, setPage] = useState(1)
  const [rowsPerPage, setRowsPerPage] = useState(10)
  const [openMenuId, setOpenMenuId] = useState<string | null>(null)
  const menuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (shopsStatus === 'idle') {
      dispatch(fetchAdminShops())
    }
  }, [dispatch, shopsStatus])

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

  const filteredShops = shops.filter((shop) => {
    const matchesFilter =
      activeFilter === 'all' ||
      (activeFilter === 'active' && shop.status === 'active') ||
      (activeFilter === 'inactive' && shop.status === 'inactive')

    const query = search.toLowerCase()
    const matchesSearch =
      !query ||
      shop.name.toLowerCase().includes(query) ||
      shop.description.toLowerCase().includes(query) ||
      shop.slug.toLowerCase().includes(query)

    return matchesFilter && matchesSearch
  })

  const totalPages = Math.max(1, Math.ceil(filteredShops.length / rowsPerPage))
  const paginatedShops = filteredShops.slice((page - 1) * rowsPerPage, page * rowsPerPage)

  const allSelectedOnPage =
    paginatedShops.length > 0 &&
    paginatedShops.every((shop) => selectedIds.has(shop.id))

  const toggleSelectAll = () => {
    const pageIds = paginatedShops.map((s) => s.id)
    setSelectedIds((prev) => {
      const next = new Set(prev)
      const allPageSelected = pageIds.every((id) => next.has(id))
      if (allPageSelected) pageIds.forEach((id) => next.delete(id))
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

  const handleBulkDelete = () => {
    dispatch(removeShopsLocally(Array.from(selectedIds)))
    setSelectedIds(new Set())
    setPage(1)
  }

  const confirmBulkDelete = () => {
    const selectedCount = selectedIds.size
    openModal({
      title: 'Delete selected shops?',
      content: (
        <p>
          You are about to delete {selectedCount} selected shop{selectedCount > 1 ? 's' : ''}. This action cannot be undone.
        </p>
      ),
      primaryLabel: 'Delete',
      primaryVariant: 'success',
      secondaryLabel: 'Cancel',
      onPrimary: handleBulkDelete,
    })
  }

  return (
    <div className="space-y-6">
      <nav className="text-xs text-slate-500">
        <Link to="/super-admin/overview" className="hover:text-slate-700">
          Dashboard
        </Link>
        <span className="mx-1">/</span>
        <span className="text-slate-900">Shops</span>
      </nav>

      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Shops</h1>
          <p className="mt-0.5 text-sm text-slate-600">
            Browse and manage all shops from product-service.
          </p>
        </div>
        <Link
          to="/super-admin/shops/new"
          className="flex shrink-0 items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700"
        >
          <Plus size={18} />
          Add Shop
        </Link>
      </div>

      <div className="flex flex-wrap gap-1">
        {FILTER_TABS.map((tab) => (
          <button
            key={tab.key}
            type="button"
            onClick={() => setActiveFilter(tab.key)}
            className={`rounded-lg px-4 py-2 text-xs font-medium transition-colors ${
              activeFilter === tab.key
                ? 'bg-slate-200 text-slate-900'
                : 'bg-white text-slate-600 hover:bg-slate-100'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

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
              placeholder="Search shops..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full rounded-lg border border-slate-200 bg-white py-2 pl-10 pr-4 text-sm outline-none placeholder:text-slate-400 focus:border-emerald-500"
            />
          </div>
        )}
        <div className="flex gap-2">
          <button
            type="button"
            autoFocus
            className="flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs text-slate-700 hover:bg-slate-50 cursor-pointer"
          >
            <Download size={16} />
            Export
          </button>
        </div>
      </div>

      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[900px]">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50">
                <th className="w-12 px-4 py-3 text-left">
                  <input
                    type="checkbox"
                    checked={allSelectedOnPage}
                    onChange={toggleSelectAll}
                    className="rounded border-slate-300"
                  />
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-slate-600">
                  <span className="flex items-center gap-1">
                    Shop
                  </span>
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-slate-600">
                  <span className="flex items-center gap-1">
                    Slug
                  </span>
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-slate-600">
                  <span className="flex items-center gap-1">
                    Status
                  </span>
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-slate-600">
                  <span className="flex items-center gap-1">
                    Created
                  </span>
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-slate-600">
                  <span className="flex items-center gap-1">
                    Updated
                  </span>
                </th>
                <th className="w-16 px-2 py-3 text-left text-xs font-medium text-slate-600">
                  <span className="flex items-center gap-1">
                    Actions
                  </span>
                </th>
              </tr>
            </thead>
            <tbody>
              {shopsStatus === 'loading' && (
                <tr>
                  <td colSpan={8} className="px-4 py-10 text-center text-sm text-slate-500">
                    Loading shops...
                  </td>
                </tr>
              )}
              {shopsStatus === 'failed' && (
                <tr>
                  <td colSpan={8} className="px-4 py-10 text-center text-sm text-red-600">
                    {shopsError ?? 'Unable to load shops.'}
                  </td>
                </tr>
              )}
              {shopsStatus !== 'loading' && shopsStatus !== 'failed' && paginatedShops.length === 0 && (
                <tr>
                  <td colSpan={8} className="px-4 py-10 text-center text-sm text-slate-500">
                    No shops found.
                  </td>
                </tr>
              )}
              {shopsStatus !== 'loading' && shopsStatus !== 'failed' && paginatedShops.map((shop, index) => {
                const openUpward = index >= paginatedShops.length - 2
                return (
                  <tr
                    key={shop.id}
                    className="border-b border-slate-100 last:border-0 hover:bg-slate-50"
                  >
                    <td className="px-4 py-3">
                      <input
                        type="checkbox"
                        checked={selectedIds.has(shop.id)}
                        onChange={() => toggleSelect(shop.id)}
                        className="rounded border-slate-300"
                      />
                    </td>
                    <td className="px-4 py-3">
                      <ShopCell shop={shop} />
                    </td>
                    <td className="px-4 py-3 text-xs text-slate-700">
                      {shop.slug}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${
                          shop.status === 'active'
                            ? 'bg-emerald-100 text-emerald-700'
                            : 'bg-slate-100 text-slate-600'
                        }`}
                      >
                        {shop.status === 'active' ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-xs text-slate-600">{shop.created}</td>
                    <td className="px-4 py-3 text-xs text-slate-600">{shop.updated}</td>
                    <td className="relative w-16 px-2 py-3">
                      <div
                        className="relative inline-block"
                        ref={openMenuId === shop.id ? menuRef : undefined}
                      >
                        <button
                          type="button"
                          onClick={() => setOpenMenuId((id) => (id === shop.id ? null : shop.id))}
                          className="rounded p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600 cursor-pointer"
                          aria-label="Actions"
                          aria-expanded={openMenuId === shop.id}
                        >
                          <MoreHorizontal size={18} />
                        </button>
                        {openMenuId === shop.id && (
                          <div
                            className={`absolute right-0 z-50 min-w-[140px] rounded-lg border border-slate-200 bg-white py-1 shadow-lg ${
                              openUpward ? 'bottom-full mb-1' : 'top-full mt-1'
                            }`}
                          >
                            <button
                              type="button"
                              onClick={() => setOpenMenuId(null)}
                              className="flex w-full items-center gap-3 px-4 py-2 text-left text-xs text-slate-700 hover:bg-slate-50 cursor-pointer"
                            >
                              <Eye size={16} className="shrink-0 text-slate-500" />
                              View
                            </button>
                            <button
                              type="button"
                              onClick={() => setOpenMenuId(null)}
                              className="flex w-full items-center gap-3 px-4 py-2 text-left text-xs text-slate-700 hover:bg-slate-50 cursor-pointer"
                            >
                              <Pencil size={16} className="shrink-0 text-slate-500" />
                              Edit
                            </button>
                            <button
                              type="button"
                              onClick={() => setOpenMenuId(null)}
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

        <DataTablePagination
          page={page}
          totalPages={totalPages}
          rowsPerPage={rowsPerPage}
          totalItems={filteredShops.length}
          onPageChange={setPage}
          onRowsPerPageChange={(value) => {
            setRowsPerPage(value)
            setPage(1)
          }}
        />
      </div>
    </div>
  )
}

const ShopCell = ({ shop }: { shop: AdminShopRow }) => (
  <div className="flex items-center gap-3">
    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded bg-slate-200 text-slate-500">
      <Building2 size={20} />
    </div>
    <div>
      <p className="text-xs font-semibold text-slate-900">{shop.name}</p>
      <p className="text-xs text-slate-500">{shop.description}</p>
    </div>
  </div>
)

export default AdminShopsPage