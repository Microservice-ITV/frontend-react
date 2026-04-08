import { useState, useRef, useEffect, useMemo } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useAppDispatch, useAppSelector } from '@/app/hooks'
import { useGlobalModal } from '@/components/ui/GlobalModalProvider'
import DataTablePagination from '@/components/ui/DataTablePagination'
import { sellerProductApi } from '../api/sellerProductApi'
import { truncateText } from '@/utils/text'
import type { Product, ProductStatus } from '../types/productTypes'
import {
  fetchSellerProductsByShop,
  removeProductsLocally,
  selectSellerProducts,
  selectSellerProductsError,
  selectSellerProductsStatus,
} from '../store'
import {
  Plus,
  Search,
  Download,
  ChevronDown,
  MoreHorizontal,
  Eye,
  Pencil,
  Trash2,
  Package,
  X,
} from 'lucide-react'

const STATUS_STYLES: Record<ProductStatus, string> = {
  draft: 'bg-amber-100 text-amber-700',
  archived: 'bg-slate-100 text-slate-600',
  active: 'bg-emerald-100 text-emerald-700',
}

const FILTER_TABS: { key: 'all' | ProductStatus; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'active', label: 'Active' },
  { key: 'draft', label: 'Draft' },
  { key: 'archived', label: 'Archived' },
]

const SellerProductsPage = () => {
  const dispatch = useAppDispatch()
  const navigate = useNavigate()
  const location = useLocation()
  const authUser = useAppSelector((state) => state.auth.user)
  const activeShopId = authUser?.active_shop_id ?? null
  const products = useAppSelector(selectSellerProducts)
  const productsStatus = useAppSelector(selectSellerProductsStatus)
  const productsError = useAppSelector(selectSellerProductsError)
  const { openModal } = useGlobalModal()
  const [activeFilter, setActiveFilter] = useState<'all' | ProductStatus>('all')
  const [categoryFilter, setCategoryFilter] = useState<'All' | string>('All')
  const [categoryDropdownOpen, setCategoryDropdownOpen] = useState(false)
  const [search, setSearch] = useState('')
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [page, setPage] = useState(1)
  const [rowsPerPage, setRowsPerPage] = useState(10)
  const [openMenuId, setOpenMenuId] = useState<string | null>(null)
  const menuRef = useRef<HTMLDivElement>(null)
  const categoryRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setOpenMenuId(null)
      }
      if (categoryRef.current && !categoryRef.current.contains(e.target as Node)) {
        setCategoryDropdownOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [openMenuId, categoryDropdownOpen])

  useEffect(() => {
    if (!activeShopId) return
    dispatch(fetchSellerProductsByShop({ shopId: activeShopId }))
  }, [activeShopId, dispatch, location.pathname])

  useEffect(() => {
    setPage(1)
    setSelectedIds(new Set())
  }, [activeShopId, products.length])

  const categoryOptions = useMemo(
    () => ['All', ...Array.from(new Set(products.map((product) => product.categoryName))).filter(Boolean)],
    [products],
  )
  const missingShopContext = !activeShopId
  const isLoadingProducts = productsStatus === 'loading'
  const effectiveProductsError = missingShopContext
    ? 'No active shop context found for this account.'
    : productsError

  const filteredProducts = products.filter((product) => {
    const matchesFilter =
      activeFilter === 'all' || product.status === activeFilter
    const matchesCategory =
      categoryFilter === 'All' || product.categoryName === categoryFilter
    const matchesSearch =
      !search ||
      product.title.toLowerCase().includes(search.toLowerCase()) ||
      product.description.toLowerCase().includes(search.toLowerCase()) ||
      product.categoryName.toLowerCase().includes(search.toLowerCase()) ||
      product.categoryId.toLowerCase().includes(search.toLowerCase())
    return matchesFilter && matchesCategory && matchesSearch
  })

  const totalPages = Math.max(1, Math.ceil(filteredProducts.length / rowsPerPage))
  const paginatedProducts = filteredProducts.slice(
    (page - 1) * rowsPerPage,
    page * rowsPerPage
  )

  const allSelectedOnPage =
    paginatedProducts.length > 0 &&
    paginatedProducts.every((product) => selectedIds.has(product.id))

  const toggleSelectAll = () => {
    const pageIds = paginatedProducts.map((p) => p.id)
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

  const deleteProductsByIds = async (ids: string[]) => {
    if (ids.length === 0) return

    const results = await Promise.allSettled(ids.map((id) => sellerProductApi.deleteProduct(id)))
    const deletedIds = ids.filter((_, index) => results[index]?.status === 'fulfilled')
    const failedCount = results.length - deletedIds.length

    if (deletedIds.length > 0) {
      dispatch(removeProductsLocally(deletedIds))
    }
    setSelectedIds((prev) => {
      const next = new Set(prev)
      deletedIds.forEach((id) => next.delete(id))
      return next
    })
    setPage(1)

    if (failedCount > 0) {
      throw new Error(`${failedCount} product deletion(s) failed. Please try again.`)
    }
  }

  const handleBulkDelete = async () => {
    await deleteProductsByIds(Array.from(selectedIds))
  }

  const confirmBulkDelete = () => {
    const selectedCount = selectedIds.size
    openModal({
      title: 'Delete selected products?',
      content: (
        <p>
          You are about to delete {selectedCount} selected product{selectedCount > 1 ? 's' : ''}. This action cannot be undone.
        </p>
      ),
      primaryLabel: 'Delete',
      primaryVariant: 'success',
      secondaryLabel: 'Cancel',
      onPrimary: handleBulkDelete,
    })
  }

  const confirmSingleDelete = (product: Product) => {
    openModal({
      title: 'Delete product?',
      content: (
        <p>
          Are you sure you want to delete <strong>{product.title}</strong>? This action cannot be undone.
        </p>
      ),
      primaryLabel: 'Delete',
      primaryVariant: 'success',
      secondaryLabel: 'Cancel',
      onPrimary: async () => {
        await deleteProductsByIds([product.id])
      },
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
        <span className="text-slate-900">Products</span>
      </nav>

      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Products</h1>
          <p className="mt-0.5 text-sm text-slate-600">
            Browse and manage your product catalog.
          </p>
        </div>
        <Link
          to="/seller/products/new"
          className="flex shrink-0 items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700"
        >
          <Plus size={18} />
          Add Product
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
          <div className="flex flex-1 flex-wrap items-center gap-4">
            <div className="relative w-full max-w-md">
              <Search
                size={18}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
              />
              <input
                type="search"
                placeholder="Search products..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full rounded-lg border border-slate-200 bg-white py-2 pl-10 pr-4 text-sm outline-none placeholder:text-slate-400 focus:border-emerald-500"
              />
            </div>
            <div>
              <div className="relative" ref={categoryRef}>
                <button
                  type="button"
                  onClick={() => setCategoryDropdownOpen((o) => !o)}
                  className="flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs text-slate-700 hover:bg-slate-50 cursor-pointer"
                >
                  Category
                  <ChevronDown size={14} />
                </button>
                {categoryDropdownOpen && (
                  <div className="absolute left-0 top-full z-50 mt-1 min-w-[140px] rounded-lg border border-slate-200 bg-white py-1 shadow-lg">
                    {categoryOptions.map((cat) => (
                      <button
                        key={cat}
                        type="button"
                        onClick={() => {
                          setCategoryFilter(cat)
                          setCategoryDropdownOpen(false)
                        }}
                        className={`flex w-full items-center px-4 py-2 text-left text-xs hover:bg-slate-50 ${
                          categoryFilter === cat ? 'font-medium text-slate-900' : 'text-slate-700'
                        }`}
                      >
                        {cat}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
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
                    Product
                  </span>
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-slate-600">
                  <span className="flex items-center gap-1">
                    Category
                  </span>
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-slate-600">
                  <span className="flex items-center gap-1">
                    Status
                  </span>
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-slate-600">
                  <span className="flex items-center gap-1">
                    Stock
                  </span>
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-slate-600">
                  Price
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-slate-600">
                  <span className="flex items-center gap-1">
                    Created
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
              {isLoadingProducts ? (
                <tr>
                  <td colSpan={8} className="px-4 py-8 text-center text-sm text-slate-500">
                    Loading products...
                  </td>
                </tr>
              ) : effectiveProductsError ? (
                <tr>
                  <td colSpan={8} className="px-4 py-8 text-center text-sm text-red-600">
                    {effectiveProductsError}
                  </td>
                </tr>
              ) : paginatedProducts.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-4 py-8 text-center text-sm text-slate-500">
                    No products found for this shop.
                  </td>
                </tr>
              ) : paginatedProducts.map((product, index) => {
                const openUpward = index >= paginatedProducts.length - 2
                return (
                  <tr
                    key={product.id}
                    className="cursor-pointer border-b border-slate-100 last:border-0 hover:bg-slate-50"
                    onClick={() => navigate(`/seller/products/${product.id}`)}
                  >
                    <td className="px-4 py-3">
                      <input
                        type="checkbox"
                        checked={selectedIds.has(product.id)}
                        onChange={() => toggleSelect(product.id)}
                        onClick={(e) => e.stopPropagation()}
                        className="rounded border-slate-300"
                      />
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded bg-slate-200 text-slate-500">
                          <Package size={20} />
                        </div>
                        <div>
                          <p className="text-xs font-semibold text-slate-900">
                            {product.title}
                          </p>
                          <p className="text-xs text-slate-500">
                            {truncateText(product.description, 50)}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className="inline-flex rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-medium text-slate-700">
                        {product.categoryName}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium capitalize ${STATUS_STYLES[product.status]}`}
                      >
                        {product.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-xs text-slate-700">
                      {product.stock}
                    </td>
                    <td className="px-4 py-3 text-xs font-medium text-slate-900">
                      {product.price}
                    </td>
                    <td className="px-4 py-3 text-xs text-slate-600">
                      {product.created}
                    </td>
                    <td className="relative w-16 px-2 py-3">
                      <div
                        className="relative inline-block"
                        ref={openMenuId === product.id ? menuRef : undefined}
                      >
                        <button
                          type="button"
                          onMouseDown={(e) => e.stopPropagation()}
                          onClick={(e) => {
                            e.stopPropagation()
                            setOpenMenuId((id) =>
                              id === product.id ? null : product.id
                            )
                          }}
                          className="rounded p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600 cursor-pointer"
                          aria-label="Actions"
                          aria-expanded={openMenuId === product.id}
                        >
                          <MoreHorizontal size={18} />
                        </button>
                        {openMenuId === product.id && (
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
                                navigate(`/seller/products/${product.id}`)
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
                                navigate(`/seller/products/${product.id}/edit`)
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
                                confirmSingleDelete(product)
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
          totalItems={filteredProducts.length}
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

export default SellerProductsPage