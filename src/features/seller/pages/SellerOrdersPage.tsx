import { useState, useRef, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useGlobalModal } from '@/components/ui/GlobalModalProvider'
import type { Order, OrderStatus } from '../types/orderTypes'
import {
  Plus,
  Search,
  Download,
  MoreHorizontal,
  Eye,
  Pencil,
  Trash2,
  X,
} from 'lucide-react'

// TODO: Replace with real data from API.
const MOCK_ORDERS: Order[] = [
  {
    id: 'ORD-7891',
    customer: { name: 'John Doe', email: 'john@example.com', initials: 'JD' },
    product: 'Pro Dashboard License',
    status: 'completed',
    date: 'Feb 14, 2026',
    amount: '$299.00',
  },
  {
    id: 'ORD-7892',
    customer: { name: 'Jane Smith', email: 'jane@example.com', initials: 'JS' },
    product: 'Starter Pack',
    status: 'processing',
    date: 'Feb 13, 2026',
    amount: '$99.00',
  },
  {
    id: 'ORD-7893',
    customer: { name: 'Bob Wilson', email: 'bob@example.com', initials: 'BW' },
    product: 'Enterprise Bundle',
    status: 'pending',
    date: 'Feb 12, 2026',
    amount: '$599.00',
  },
  {
    id: 'ORD-7894',
    customer: { name: 'Alice Brown', email: 'alice@example.com', initials: 'AB' },
    product: 'Pro Dashboard License',
    status: 'cancelled',
    date: 'Feb 11, 2026',
    amount: '$299.00',
  },
  {
    id: 'ORD-7895',
    customer: { name: 'Charlie Davis', email: 'charlie@example.com', initials: 'CD' },
    product: 'Starter Pack',
    status: 'completed',
    date: 'Feb 10, 2026',
    amount: '$99.00',
  },
  {
    id: 'ORD-7896',
    customer: { name: 'Eva Martinez', email: 'eva@example.com', initials: 'EM' },
    product: 'Pro Dashboard License',
    status: 'processing',
    date: 'Feb 9, 2026',
    amount: '$299.00',
  },
  {
    id: 'ORD-7897',
    customer: { name: 'Frank Lee', email: 'frank@example.com', initials: 'FL' },
    product: 'Enterprise Bundle',
    status: 'pending',
    date: 'Feb 8, 2026',
    amount: '$599.00',
  },
  {
    id: 'ORD-7898',
    customer: { name: 'Grace Kim', email: 'grace@example.com', initials: 'GK' },
    product: 'Starter Pack',
    status: 'completed',
    date: 'Feb 7, 2026',
    amount: '$99.00',
  },
  {
    id: 'ORD-7899',
    customer: { name: 'Henry Chen', email: 'henry@example.com', initials: 'HC' },
    product: 'Pro Dashboard License',
    status: 'cancelled',
    date: 'Feb 6, 2026',
    amount: '$299.00',
  },
  {
    id: 'ORD-7900',
    customer: { name: 'Ivy Taylor', email: 'ivy@example.com', initials: 'IT' },
    product: 'Starter Pack',
    status: 'completed',
    date: 'Feb 5, 2026',
    amount: '$99.00',
  },
  {
    id: 'ORD-7901',
    customer: { name: 'Jack Anderson', email: 'jack@example.com', initials: 'JA' },
    product: 'Enterprise Bundle',
    status: 'processing',
    date: 'Feb 4, 2026',
    amount: '$599.00',
  },
  {
    id: 'ORD-7902',
    customer: { name: 'Kate White', email: 'kate@example.com', initials: 'KW' },
    product: 'Pro Dashboard License',
    status: 'pending',
    date: 'Feb 3, 2026',
    amount: '$299.00',
  },
  {
    id: 'ORD-7903',
    customer: { name: 'Leo Garcia', email: 'leo@example.com', initials: 'LG' },
    product: 'Starter Pack',
    status: 'completed',
    date: 'Feb 2, 2026',
    amount: '$99.00',
  },
  {
    id: 'ORD-7904',
    customer: { name: 'Mia Johnson', email: 'mia@example.com', initials: 'MJ' },
    product: 'Enterprise Bundle',
    status: 'processing',
    date: 'Feb 1, 2026',
    amount: '$599.00',
  },
  {
    id: 'ORD-7905',
    customer: { name: 'Noah Brown', email: 'noah@example.com', initials: 'NB' },
    product: 'Pro Dashboard License',
    status: 'completed',
    date: 'Jan 31, 2026',
    amount: '$299.00',
  },
]

const STATUS_STYLES: Record<OrderStatus, string> = {
  completed: 'bg-emerald-100 text-emerald-700',
  processing: 'bg-cyan-100 text-cyan-700',
  pending: 'bg-amber-100 text-amber-700',
  cancelled: 'bg-red-100 text-red-700',
}

const FILTER_TABS: { key: 'all' | OrderStatus; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'completed', label: 'Completed' },
  { key: 'processing', label: 'Processing' },
  { key: 'pending', label: 'Pending' },
  { key: 'cancelled', label: 'Cancelled' },
]

const SellerOrdersPage = () => {
  const { openModal } = useGlobalModal()
  const [activeFilter, setActiveFilter] = useState<'all' | OrderStatus>('all')
  const [search, setSearch] = useState('')
  const [orders, setOrders] = useState<Order[]>(MOCK_ORDERS)
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

  const filteredOrders = orders.filter((order) => {
    const matchesFilter =
      activeFilter === 'all' || order.status === activeFilter
    const matchesSearch =
      !search ||
      order.id.toLowerCase().includes(search.toLowerCase()) ||
      order.customer.name.toLowerCase().includes(search.toLowerCase()) ||
      order.product.toLowerCase().includes(search.toLowerCase())
    return matchesFilter && matchesSearch
  })

  const totalPages = Math.ceil(filteredOrders.length / rowsPerPage)
  const paginatedOrders = filteredOrders.slice(
    (page - 1) * rowsPerPage,
    page * rowsPerPage
  )

  const allSelectedOnPage =
    paginatedOrders.length > 0 &&
    paginatedOrders.every((order) => selectedIds.has(order.id))

  const toggleSelectAll = () => {
    const pageIds = paginatedOrders.map((o) => o.id)
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
    setOrders((prev) => prev.filter((order) => !selectedIds.has(order.id)))
    setSelectedIds(new Set())
    setPage(1)
  }

  const confirmBulkDelete = () => {
    const selectedCount = selectedIds.size
    openModal({
      title: 'Delete selected orders?',
      content: (
        <p>
          You are about to delete {selectedCount} selected order{selectedCount > 1 ? 's' : ''}. This action cannot be undone.
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
      {/* Breadcrumbs */}
      <nav className="text-xs text-slate-500">
        <Link to="/seller/overview" className="hover:text-slate-700">
          Dashboard
        </Link>
        <span className="mx-1">/</span>
        <span className="text-slate-900">Orders</span>
      </nav>

      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Orders</h1>
          <p className="mt-0.5 text-sm text-slate-600">
            Manage and track all customer orders.
          </p>
        </div>
        <Link
          to="/seller/orders"
          className="flex shrink-0 items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700"
        >
          <Plus size={18} />
          New Order
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
              placeholder="Search orders..."
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
          <table className="w-full min-w-[800px]">
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
                    Order ID
                  </span>
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-slate-600">
                  Customer
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-slate-600">
                  Product
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-slate-600">
                  Status
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-slate-600">
                  Date
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-slate-600">
                  Amount
                </th>
                <th className="w-12 px-4 py-3" />
              </tr>
            </thead>
            <tbody>
              {paginatedOrders.map((order, index) => {
                const openUpward = index >= paginatedOrders.length - 2
                return (
                <tr
                  key={order.id}
                  className="border-b border-slate-100 last:border-0 hover:bg-slate-50"
                >
                  <td className="px-4 py-3">
                    <input
                      type="checkbox"
                      checked={selectedIds.has(order.id)}
                      onChange={() => toggleSelect(order.id)}
                      className="rounded border-slate-300"
                    />
                  </td>
                  <td className="px-4 py-3 text-xs font-medium text-slate-900">
                    {order.id}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-slate-200 text-xs font-medium text-slate-600">
                        {order.customer.initials}
                      </div>
                      <div>
                        <p className="text-xs font-medium text-slate-900">
                          {order.customer.name}
                        </p>
                        <p className="text-xs text-slate-500">
                          {order.customer.email}
                        </p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-xs text-slate-700">
                    {order.product}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium capitalize ${STATUS_STYLES[order.status]}`}
                    >
                      {order.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-xs text-slate-600">
                    {order.date}
                  </td>
                  <td className="px-4 py-3 text-xs font-medium text-slate-900">
                    {order.amount}
                  </td>
                  <td className="relative px-4 py-3">
                    <div
                      className="relative inline-block"
                      ref={openMenuId === order.id ? menuRef : undefined}
                    >
                    <button
                      type="button"
                      onClick={() => setOpenMenuId((id) => (id === order.id ? null : order.id))}
                      className="rounded p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600 cursor-pointer"
                      aria-label="Actions"
                      aria-expanded={openMenuId === order.id}
                    >
                      <MoreHorizontal size={18} />
                    </button>
                    {openMenuId === order.id && (
                      <div
                        className={`absolute right-0 z-50 min-w-[140px] rounded-lg border border-slate-200 bg-white py-1 shadow-lg ${
                          openUpward ? 'bottom-full mb-1' : 'top-full mt-1'
                        }`}
                      >
                        <button
                          type="button"
                          onClick={() => {
                            setOpenMenuId(null)
                            // TODO: Navigate to order view
                          }}
                          className="flex w-full items-center gap-3 px-4 py-2 text-left text-xs text-slate-700 hover:bg-slate-50 cursor-pointer"
                        >
                          <Eye size={16} className="text-slate-500 shrink-0" />
                          View
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setOpenMenuId(null)
                            // TODO: Navigate to order edit
                          }}
                          className="flex w-full items-center gap-3 px-4 py-2 text-left text-xs text-slate-700 hover:bg-slate-50 cursor-pointer"
                        >
                          <Pencil size={16} className="text-slate-500 shrink-0" />
                          Edit
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setOpenMenuId(null)
                            // TODO: Handle delete
                          }}
                          className="flex w-full items-center gap-3 px-4 py-2 text-left text-xs text-red-600 hover:bg-slate-50 cursor-pointer"
                        >
                          <Trash2 size={16} className="text-slate-500 shrink-0" />
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
            {Math.min(page * rowsPerPage, filteredOrders.length)} of{' '}
            {filteredOrders.length} results
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

export default SellerOrdersPage