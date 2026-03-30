import { useState, useRef, useEffect, useMemo } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAppDispatch, useAppSelector } from '@/app/hooks'
import { useGlobalModal } from '@/components/ui/GlobalModalProvider'
import DataTablePagination from '@/components/ui/DataTablePagination'
import { sellerCategoryApi } from '../api/sellerCategoryApi'
import { truncateText } from '@/utils/text'
import type { Category } from '../types/categoryTypes'
import {
  fetchSellerCategories,
  removeCategoriesLocally,
  selectSellerCategories,
  selectSellerCategoriesError,
  selectSellerCategoriesStatus,
} from '../store'
import {
  Plus,
  Search,
  Download,
  MoreHorizontal,
  Eye,
  Pencil,
  Trash2,
  Tags,
  X,
} from 'lucide-react'

const FILTER_TABS: { key: 'all' | 'active' | 'inactive'; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'active', label: 'Active' },
  { key: 'inactive', label: 'Inactive' },
]

const SellerCategoriesPage = () => {
  const dispatch = useAppDispatch()
  const navigate = useNavigate()
  const { openModal } = useGlobalModal()
  const categories = useAppSelector(selectSellerCategories)
  const categoriesStatus = useAppSelector(selectSellerCategoriesStatus)
  const categoriesError = useAppSelector(selectSellerCategoriesError)
  const [activeFilter, setActiveFilter] = useState<'all' | 'active' | 'inactive'>('all')
  const [search, setSearch] = useState('')
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [page, setPage] = useState(1)
  const [rowsPerPage, setRowsPerPage] = useState(10)
  const [openMenuId, setOpenMenuId] = useState<string | null>(null)
  const menuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (categoriesStatus === 'idle') {
      dispatch(fetchSellerCategories())
    }
  }, [dispatch, categoriesStatus])

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

  const filteredCategories = categories.filter((category) => {
    const matchesFilter =
      activeFilter === 'all' ||
      (activeFilter === 'active' && category.isActive) ||
      (activeFilter === 'inactive' && !category.isActive)
    const matchesSearch =
      !search ||
      category.name.toLowerCase().includes(search.toLowerCase()) ||
      category.description.toLowerCase().includes(search.toLowerCase()) ||
      category.slug.toLowerCase().includes(search.toLowerCase())
    return matchesFilter && matchesSearch
  })

  const totalPages = Math.max(1, Math.ceil(filteredCategories.length / rowsPerPage))
  const paginatedCategories = filteredCategories.slice(
    (page - 1) * rowsPerPage,
    page * rowsPerPage
  )

  const categoriesById = useMemo(
    () => new Map(categories.map((category) => [category.id, category])),
    [categories],
  )

  const allSelectedOnPage =
    paginatedCategories.length > 0 &&
    paginatedCategories.every((category) => selectedIds.has(category.id))

  const toggleSelectAll = () => {
    const pageIds = paginatedCategories.map((c) => c.id)
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

  const deleteCategoriesByIds = async (ids: string[]) => {
    if (ids.length === 0) return

    const results = await Promise.allSettled(ids.map((id) => sellerCategoryApi.deleteCategory(id)))
    const deletedIds = ids.filter((_, index) => results[index]?.status === 'fulfilled')
    const failedCount = results.length - deletedIds.length

    if (deletedIds.length > 0) {
      dispatch(removeCategoriesLocally(deletedIds))
    }
    setSelectedIds((prev) => {
      const next = new Set(prev)
      deletedIds.forEach((id) => next.delete(id))
      return next
    })
    setPage(1)

    if (failedCount > 0) {
      throw new Error(`${failedCount} category deletion(s) failed. Please try again.`)
    }
  }

  const handleBulkDelete = async () => {
    await deleteCategoriesByIds(Array.from(selectedIds))
  }

  const confirmBulkDelete = () => {
    const selectedCount = selectedIds.size
    openModal({
      title: 'Delete selected categories?',
      content: (
        <p>
          You are about to delete {selectedCount} selected categor{selectedCount > 1 ? 'ies' : 'y'}. This action cannot be undone.
        </p>
      ),
      primaryLabel: 'Delete',
      primaryVariant: 'success',
      secondaryLabel: 'Cancel',
      onPrimary: handleBulkDelete,
    })
  }

  const confirmSingleDelete = (category: Category) => {
    openModal({
      title: 'Delete category?',
      content: (
        <p>
          Are you sure you want to delete <strong>{category.name}</strong>? This action cannot be undone.
        </p>
      ),
      primaryLabel: 'Delete',
      primaryVariant: 'success',
      secondaryLabel: 'Cancel',
      onPrimary: async () => {
        await deleteCategoriesByIds([category.id])
      },
    })
  }

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr)
    return d.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    })
  }

  return (
    <div className="space-y-6">
      {/* Breadcrumbs */}
      <nav className="text-xs text-slate-500">
        <Link to="/seller/overview" className="hover:text-slate-700">
          Dashboard
        </Link>
        <span className="mx-1">/</span>
        <span className="text-slate-900">Categories</span>
      </nav>

      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Categories</h1>
          <p className="mt-0.5 text-sm text-slate-600">
            Browse and manage your product categories.
          </p>
        </div>
        <Link
          to="/seller/categories/new"
          className="flex shrink-0 items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700"
        >
          <Plus size={18} />
          Add Category
        </Link>
      </div>

      {/* Filter tabs */}
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

      {/* Search & tools */}
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
              placeholder="Search categories..."
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

      {/* Table */}
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
                    Category
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
                    Parent
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
              {categoriesStatus === 'loading' && (
                <tr>
                  <td colSpan={8} className="px-4 py-10 text-center text-sm text-slate-500">
                    Loading categories...
                  </td>
                </tr>
              )}
              {categoriesStatus === 'failed' && (
                <tr>
                  <td colSpan={8} className="px-4 py-10 text-center text-sm text-red-600">
                    {categoriesError ?? 'Unable to load categories.'}
                  </td>
                </tr>
              )}
              {categoriesStatus !== 'loading' && categoriesStatus !== 'failed' && paginatedCategories.length === 0 && (
                <tr>
                  <td colSpan={8} className="px-4 py-10 text-center text-sm text-slate-500">
                    No categories found.
                  </td>
                </tr>
              )}
              {categoriesStatus !== 'loading' && categoriesStatus !== 'failed' && paginatedCategories.map((category, index) => {
                const openUpward = index >= paginatedCategories.length - 2
                return (
                  <tr
                    key={category.id}
                    className="cursor-pointer border-b border-slate-100 last:border-0 hover:bg-slate-50"
                    onClick={() => navigate(`/seller/categories/${category.id}`)}
                  >
                    <td className="px-4 py-3">
                      <input
                        type="checkbox"
                        checked={selectedIds.has(category.id)}
                        onChange={() => toggleSelect(category.id)}
                        onClick={(e) => e.stopPropagation()}
                        className="rounded border-slate-300"
                      />
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded bg-slate-200 text-slate-500">
                          <Tags size={20} />
                        </div>
                        <div>
                          <p className="text-xs font-semibold text-slate-900">
                            {category.name}
                          </p>
                          <p className="text-xs text-slate-500">
                            {truncateText(category.description, 50)}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-xs text-slate-700">
                      {category.slug}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${
                          category.isActive
                            ? 'bg-emerald-100 text-emerald-700'
                            : 'bg-slate-100 text-slate-600'
                        }`}
                      >
                        {category.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-xs text-slate-500">
                      {category.parentId ? (
                        categoriesById.get(category.parentId)?.name ?? '—'
                      ) : (
                        '—'
                      )}
                    </td>
                    <td className="px-4 py-3 text-xs text-slate-600">
                      {formatDate(category.createdAt)}
                    </td>
                    <td className="px-4 py-3 text-xs text-slate-600">
                      {formatDate(category.updatedAt)}
                    </td>
                    <td className="relative w-16 px-2 py-3">
                      <div
                        className="relative inline-block"
                        ref={openMenuId === category.id ? menuRef : undefined}
                      >
                        <button
                          type="button"
                          onMouseDown={(e) => e.stopPropagation()}
                          onClick={(e) => {
                            e.stopPropagation()
                            setOpenMenuId((id) =>
                              id === category.id ? null : category.id
                            )
                          }}
                          className="rounded p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600 cursor-pointer"
                          aria-label="Actions"
                          aria-expanded={openMenuId === category.id}
                        >
                          <MoreHorizontal size={18} />
                        </button>
                        {openMenuId === category.id && (
                          <div
                            className={`absolute right-0 z-50 min-w-[140px] rounded-lg border border-slate-200 bg-white py-1 shadow-lg ${
                              openUpward
                                ? 'bottom-full mb-1'
                                : 'top-full mt-1'
                            }`}
                          >
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation()
                                setOpenMenuId(null)
                                navigate(`/seller/categories/${category.id}`)
                              }}
                              className="flex w-full items-center gap-3 px-4 py-2 text-left text-xs text-slate-700 hover:bg-slate-50 cursor-pointer"
                            >
                              <Eye size={16} className="shrink-0 text-slate-500" />
                              View
                            </button>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation()
                                setOpenMenuId(null)
                                navigate(`/seller/categories/${category.id}/edit`)
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
                                confirmSingleDelete(category)
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

        <DataTablePagination
          page={page}
          totalPages={totalPages}
          rowsPerPage={rowsPerPage}
          totalItems={filteredCategories.length}
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

export default SellerCategoriesPage