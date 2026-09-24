import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAppDispatch, useAppSelector } from '@/app/hooks'
import { useGlobalModal } from '@/components/ui/GlobalModalProvider'
import DataTablePagination from '@/components/ui/DataTablePagination'
import RowActionMenu from '@/components/ui/RowActionMenu'
import type { AdminShopRow } from '../types/shopTypes'
import { adminShopApi } from '../api/adminShopApi'
import { fetchAdminShops, setShopApproval } from '../store/adminShopsThunks'
import { removeShopsLocally } from '../store/adminShopsSlice'
import { fetchMe } from '@/features/auth/store/authThunks'
import {
  selectAdminShops,
  selectAdminShopsError,
  selectAdminShopsModerationError,
  selectAdminShopsStatus,
} from '../store/adminShopsSelectors'
import {
  Plus,
  Search,
  Download,
  Eye,
  Pencil,
  Trash2,
  Building2,
  X,
  Check,
  XCircle,
} from 'lucide-react'

const FILTER_TABS: { key: 'all' | 'pending' | 'active' | 'inactive'; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'pending', label: 'Pending approval' },
  { key: 'active', label: 'Live' },
  { key: 'inactive', label: 'Inactive' },
]

const AdminShopsPage = () => {
  const dispatch = useAppDispatch()
  const navigate = useNavigate()
  const { openModal } = useGlobalModal()
  const shops = useAppSelector(selectAdminShops)
  const shopsStatus = useAppSelector(selectAdminShopsStatus)
  const shopsError = useAppSelector(selectAdminShopsError)
  const moderationError = useAppSelector(selectAdminShopsModerationError)
  const [activeFilter, setActiveFilter] = useState<'all' | 'pending' | 'active' | 'inactive'>('all')
  const [search, setSearch] = useState('')
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [page, setPage] = useState(1)
  const [rowsPerPage, setRowsPerPage] = useState(10)

  useEffect(() => {
    if (shopsStatus === 'idle') {
      dispatch(fetchAdminShops())
    }
  }, [dispatch, shopsStatus])

  const filteredShops = shops.filter((shop) => {
    const matchesFilter =
      activeFilter === 'all' ||
      (activeFilter === 'pending' && shop.status === 'pending') ||
      (activeFilter === 'active' && shop.status === 'active') ||
      (activeFilter === 'inactive' && shop.status === 'inactive')

    const query = search.toLowerCase()
    const matchesSearch =
      !query ||
      shop.name.toLowerCase().includes(query) ||
      shop.description.toLowerCase().includes(query) ||
      shop.slug.toLowerCase().includes(query) ||
      shop.ownerLabel.toLowerCase().includes(query)

    return matchesFilter && matchesSearch
  })

  const totalPages = Math.max(1, Math.ceil(filteredShops.length / rowsPerPage))
  const paginatedShops = filteredShops.slice((page - 1) * rowsPerPage, page * rowsPerPage)

  const selectableOnPage = paginatedShops.filter((s) => s.status !== 'pending')
  const allSelectedOnPage =
    selectableOnPage.length > 0 &&
    selectableOnPage.every((shop) => selectedIds.has(shop.id))

  const toggleSelectAll = () => {
    const pageIds = selectableOnPage.map((s) => s.id)
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
    const ids = Array.from(selectedIds).filter(
      (id) => shops.find((s) => s.id === id)?.status !== 'pending',
    )
    if (ids.length === 0) return
    dispatch(removeShopsLocally(ids))
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

  const confirmSingleDelete = (shop: AdminShopRow) => {
    openModal({
      title: 'Delete shop?',
      content: (
        <p>
          Are you sure you want to delete <strong>{shop.name}</strong>? This cannot be undone. Shops with products
          cannot be deleted until products are removed.
        </p>
      ),
      primaryLabel: 'Delete',
      primaryVariant: 'success',
      secondaryLabel: 'Cancel',
      onPrimary: async () => {
        await adminShopApi.deleteShop(shop.id)
        await dispatch(fetchAdminShops()).unwrap()
        dispatch(fetchMe())
      },
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
            Pending seller applications and live shops from product-service. Approve or reject from the row menu.
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

      {moderationError && (
        <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">
          {moderationError}
        </p>
      )}

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
              {shopsStatus !== 'loading' && shopsStatus !== 'failed' && paginatedShops.map((shop) => (
                <tr
                    key={shop.id}
                    className="border-b border-slate-100 last:border-0 hover:bg-slate-50"
                  >
                    <td className="px-4 py-3">
                      <input
                        type="checkbox"
                        disabled={shop.status === 'pending'}
                        title={shop.status === 'pending' ? 'Use Approve / Reject for pending shops' : undefined}
                        checked={selectedIds.has(shop.id)}
                        onChange={() => toggleSelect(shop.id)}
                        className="rounded border-slate-300 disabled:opacity-40"
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
                          shop.status === 'pending'
                            ? 'bg-amber-100 text-amber-800'
                            : shop.status === 'active'
                              ? 'bg-emerald-100 text-emerald-700'
                              : 'bg-slate-100 text-slate-600'
                        }`}
                      >
                        {shop.status === 'pending'
                          ? 'Pending approval'
                          : shop.status === 'active'
                            ? 'Live'
                            : 'Inactive'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-xs text-slate-600">{shop.created}</td>
                    <td className="px-4 py-3 text-xs text-slate-600">{shop.updated}</td>
                    <td className="w-16 px-2 py-3">
                      <RowActionMenu
                        ariaLabel="Shop actions"
                        items={[
                          ...(shop.status === 'pending'
                            ? [
                                {
                                  key: 'approve',
                                  label: 'Approve',
                                  icon: <Check size={16} className="shrink-0 text-emerald-600" />,
                                  className:
                                    'flex w-full items-center gap-3 px-4 py-2 text-left text-xs font-medium text-emerald-700 hover:bg-slate-50 cursor-pointer',
                                  onClick: () =>
                                    openModal({
                                      title: `Approve “${shop.name}”?`,
                                      content: (
                                        <p className="text-sm text-slate-600">
                                          The shop becomes live in the public catalogue. The owner can manage products
                                          from the seller dashboard.
                                        </p>
                                      ),
                                      primaryLabel: 'Approve shop',
                                      primaryVariant: 'success',
                                      secondaryLabel: 'Cancel',
                                      onPrimary: async () => {
                                        await dispatch(
                                          setShopApproval({ shopId: shop.id, approved: true }),
                                        ).unwrap()
                                      },
                                    }),
                                },
                                {
                                  key: 'reject',
                                  label: 'Reject',
                                  icon: <XCircle size={16} className="shrink-0 text-red-500" />,
                                  className:
                                    'flex w-full items-center gap-3 px-4 py-2 text-left text-xs font-medium text-red-600 hover:bg-slate-50 cursor-pointer',
                                  onClick: () =>
                                    openModal({
                                      title: `Reject “${shop.name}”?`,
                                      content: (
                                        <p className="text-sm text-slate-600">
                                          The application is marked rejected. The owner may submit a new registration
                                          later if you allow it.
                                        </p>
                                      ),
                                      primaryLabel: 'Reject application',
                                      primaryVariant: 'danger',
                                      secondaryLabel: 'Cancel',
                                      onPrimary: async () => {
                                        await dispatch(
                                          setShopApproval({ shopId: shop.id, approved: false }),
                                        ).unwrap()
                                      },
                                    }),
                                },
                              ]
                            : []),
                          {
                            key: 'view',
                            label: 'View',
                            icon: <Eye size={16} className="shrink-0 text-slate-500" />,
                            onClick: () => navigate(`/super-admin/shops/${shop.id}`),
                          },
                          {
                            key: 'edit',
                            label: 'Edit',
                            icon: <Pencil size={16} className="shrink-0 text-slate-500" />,
                            onClick: () => navigate(`/super-admin/shops/${shop.id}/edit`),
                          },
                          {
                            key: 'delete',
                            label: 'Delete',
                            icon: <Trash2 size={16} className="shrink-0 text-slate-500" />,
                            className:
                              'flex w-full items-center gap-3 px-4 py-2 text-left text-xs text-red-600 hover:bg-slate-50 cursor-pointer',
                            onClick: () => confirmSingleDelete(shop),
                          },
                        ]}
                      />
                    </td>
                  </tr>
                ))}
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
      {shop.status === 'pending' && shop.ownerLabel !== '—' && (
        <p className="mt-0.5 text-[11px] text-slate-400">Owner / contact: {shop.ownerLabel}</p>
      )}
    </div>
  </div>
)

export default AdminShopsPage