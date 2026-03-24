import { useState, useRef, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useGlobalModal } from '@/components/ui/GlobalModalProvider'
import type { Category } from '../types/categoryTypes'
import {
  Plus,
  Search,
  Download,
  ChevronUp,
  ChevronDown,
  MoreHorizontal,
  Eye,
  Pencil,
  Trash2,
  Tags,
  X,
} from 'lucide-react'

// TODO: Replace with real data from API.
const MOCK_CATEGORIES: Category[] = [
  {
    id: '1987d8d0-1234-5678-9abc-def012345678',
    name: 'Pet Supplies',
    description: 'Pet Supplies category',
    slug: 'pet-supplies',
    parentId: null,
    isActive: true,
    createdAt: '2026-03-18 07:37:34',
    updatedAt: '2026-03-18 07:37:34',
    image: '/uploads/categories/pet-supplies',
  },
  {
    id: '2b40462a-1234-5678-9abc-def012345679',
    name: 'Sports',
    description: 'Sports category',
    slug: 'sports',
    parentId: null,
    isActive: true,
    createdAt: '2026-03-18 07:37:34',
    updatedAt: '2026-03-18 07:37:34',
    image: '/uploads/categories/sports',
  },
  {
    id: '3c51573b-1234-5678-9abc-def012345680',
    name: 'Gaming',
    description: 'Gaming category',
    slug: 'gaming',
    parentId: null,
    isActive: true,
    createdAt: '2026-03-18 07:37:34',
    updatedAt: '2026-03-18 07:37:34',
    image: '/uploads/categories/gaming',
  },
  {
    id: '4d62684c-1234-5678-9abc-def012345681',
    name: 'Home Appliance',
    description: 'Home Appliance category',
    slug: 'home-appliance',
    parentId: null,
    isActive: true,
    createdAt: '2026-03-18 07:37:34',
    updatedAt: '2026-03-18 07:37:34',
    image: '/uploads/categories/home-appliance',
  },
  {
    id: '5e73795d-1234-5678-9abc-def012345682',
    name: 'Automotive',
    description: 'Automotive category',
    slug: 'automotive',
    parentId: null,
    isActive: true,
    createdAt: '2026-03-18 07:37:34',
    updatedAt: '2026-03-18 07:37:34',
    image: '/uploads/categories/automotive',
  },
  {
    id: '6f848a6e-1234-5678-9abc-def012345683',
    name: 'Outdoors',
    description: 'Outdoors category',
    slug: 'outdoors',
    parentId: null,
    isActive: true,
    createdAt: '2026-03-18 07:37:34',
    updatedAt: '2026-03-18 07:37:34',
    image: '/uploads/categories/outdoors',
  },
  {
    id: '7a959b7f-1234-5678-9abc-def012345684',
    name: 'Watches',
    description: 'Watches category',
    slug: 'watches',
    parentId: null,
    isActive: false,
    createdAt: '2026-03-18 07:37:34',
    updatedAt: '2026-03-18 07:37:34',
    image: '/uploads/categories/watches',
  },
  {
    id: '8ba6ac80-1234-5678-9abc-def012345685',
    name: 'Travel',
    description: 'Travel category',
    slug: 'travel',
    parentId: null,
    isActive: true,
    createdAt: '2026-03-18 07:37:34',
    updatedAt: '2026-03-18 07:37:34',
    image: '/uploads/categories/travel',
  },
  {
    id: '9cb7bd91-1234-5678-9abc-def012345686',
    name: 'Music',
    description: 'Music category',
    slug: 'music',
    parentId: null,
    isActive: true,
    createdAt: '2026-03-18 07:37:34',
    updatedAt: '2026-03-18 07:37:34',
    image: '/uploads/categories/music',
  },
  {
    id: 'adc8ce02-1234-5678-9abc-def012345687',
    name: 'Jewelry',
    description: 'Jewelry category',
    slug: 'jewelry',
    parentId: null,
    isActive: true,
    createdAt: '2026-03-18 07:37:34',
    updatedAt: '2026-03-18 07:37:34',
    image: '/uploads/categories/jewelry',
  },
  {
    id: 'bed9df13-1234-5678-9abc-def012345688',
    name: 'Furniture',
    description: 'Furniture category',
    slug: 'furniture',
    parentId: null,
    isActive: true,
    createdAt: '2026-03-18 07:37:34',
    updatedAt: '2026-03-18 07:37:34',
    image: '/uploads/categories/furniture',
  },
  {
    id: 'cfe0e024-1234-5678-9abc-def012345689',
    name: 'Toys',
    description: 'Toys category',
    slug: 'toys',
    parentId: null,
    isActive: true,
    createdAt: '2026-03-18 07:37:34',
    updatedAt: '2026-03-18 07:37:34',
    image: '/uploads/categories/toys',
  },
]

const FILTER_TABS: { key: 'all' | 'active' | 'inactive'; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'active', label: 'Active' },
  { key: 'inactive', label: 'Inactive' },
]

const SellerCategoriesPage = () => {
  const { openModal } = useGlobalModal()
  const [activeFilter, setActiveFilter] = useState<'all' | 'active' | 'inactive'>('all')
  const [search, setSearch] = useState('')
  const [categories, setCategories] = useState<Category[]>(MOCK_CATEGORIES)
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [page, setPage] = useState(1)
  const [rowsPerPage, setRowsPerPage] = useState(10)
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

  const totalPages = Math.ceil(filteredCategories.length / rowsPerPage)
  const paginatedCategories = filteredCategories.slice(
    (page - 1) * rowsPerPage,
    page * rowsPerPage
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

  const handleBulkDelete = () => {
    setCategories((prev) => prev.filter((category) => !selectedIds.has(category.id)))
    setSelectedIds(new Set())
    setPage(1)
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
            className="flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs text-slate-700 hover:bg-slate-50"
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
                    <ChevronUp size={14} className="opacity-50" />
                    <ChevronDown size={14} className="-ml-3 opacity-50" />
                  </span>
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-slate-600">
                  <span className="flex items-center gap-1">
                    Slug
                    <ChevronUp size={14} className="opacity-50" />
                    <ChevronDown size={14} className="-ml-3 opacity-50" />
                  </span>
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-slate-600">
                  <span className="flex items-center gap-1">
                    Status
                    <ChevronUp size={14} className="opacity-50" />
                    <ChevronDown size={14} className="-ml-3 opacity-50" />
                  </span>
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-slate-600">
                  <span className="flex items-center gap-1">
                    Parent
                    <ChevronUp size={14} className="opacity-50" />
                    <ChevronDown size={14} className="-ml-3 opacity-50" />
                  </span>
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-slate-600">
                  <span className="flex items-center gap-1">
                    Created
                    <ChevronUp size={14} className="opacity-50" />
                    <ChevronDown size={14} className="-ml-3 opacity-50" />
                  </span>
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-slate-600">
                  <span className="flex items-center gap-1">
                    Updated
                    <ChevronUp size={14} className="opacity-50" />
                    <ChevronDown size={14} className="-ml-3 opacity-50" />
                  </span>
                </th>
                <th className="w-12 px-4 py-3" />
              </tr>
            </thead>
            <tbody>
              {paginatedCategories.map((category, index) => {
                const openUpward = index >= paginatedCategories.length - 2
                return (
                  <tr
                    key={category.id}
                    className="border-b border-slate-100 last:border-0 hover:bg-slate-50"
                  >
                    <td className="px-4 py-3">
                      <input
                        type="checkbox"
                        checked={selectedIds.has(category.id)}
                        onChange={() => toggleSelect(category.id)}
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
                            {category.description}
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
                        MOCK_CATEGORIES.find((c) => c.id === category.parentId)?.name ?? '—'
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
                    <td className="relative px-4 py-3">
                      <div
                        className="relative inline-block"
                        ref={openMenuId === category.id ? menuRef : undefined}
                      >
                        <button
                          type="button"
                          onClick={() =>
                            setOpenMenuId((id) =>
                              id === category.id ? null : category.id
                            )
                          }
                          className="rounded p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
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
                              onClick={() => {
                                setOpenMenuId(null)
                                // TODO: Navigate to category view
                              }}
                              className="flex w-full items-center gap-3 px-4 py-2 text-left text-xs text-slate-700 hover:bg-slate-50"
                            >
                              <Eye size={16} className="shrink-0 text-slate-500" />
                              View
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                setOpenMenuId(null)
                                // TODO: Navigate to category edit
                              }}
                              className="flex w-full items-center gap-3 px-4 py-2 text-left text-xs text-slate-700 hover:bg-slate-50"
                            >
                              <Pencil size={16} className="shrink-0 text-slate-500" />
                              Edit
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                setOpenMenuId(null)
                                // TODO: Handle delete
                              }}
                              className="flex w-full items-center gap-3 px-4 py-2 text-left text-xs text-red-600 hover:bg-slate-50"
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

        {/* Pagination */}
        <div className="flex flex-col gap-4 border-t border-slate-200 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-xs text-slate-600">
            Showing {(page - 1) * rowsPerPage + 1}-
            {Math.min(page * rowsPerPage, filteredCategories.length)} of{' '}
            {filteredCategories.length} results
          </p>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-600">Rows</span>
              <select
                value={rowsPerPage}
                onChange={(e) => {
                  setRowsPerPage(Number(e.target.value))
                  setPage(1)
                }}
                className="rounded border border-slate-200 bg-white px-2 py-1 text-xs"
              >
                <option value={10}>10</option>
                <option value={20}>20</option>
                <option value={50}>50</option>
              </select>
            </div>
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="rounded px-3 py-1.5 text-xs text-slate-600 hover:bg-slate-100 disabled:opacity-50"
              >
                Previous
              </button>
              {Array.from({ length: totalPages }, (_, i) => i + 1).map(
                (p) => (
                  <button
                    key={p}
                    type="button"
                    onClick={() => setPage(p)}
                    className={`rounded px-3 py-1.5 text-xs ${
                      page === p
                        ? 'bg-emerald-600 text-white'
                        : 'text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    {p}
                  </button>
                )
              )}
              <button
                type="button"
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="rounded px-3 py-1.5 text-xs text-slate-600 hover:bg-slate-100 disabled:opacity-50"
              >
                Next
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default SellerCategoriesPage