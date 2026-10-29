import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Eye, RefreshCw, Search } from 'lucide-react'
import { useAppSelector } from '@/app/hooks'
import DataTable, { type DataTableColumn } from '@/components/ui/DataTable'
import CopyToClipboardButton from '../components/CopyToClipboardButton'
import CustomerAvatar from '../components/CustomerAvatar'
import {
  fetchCustomerAvatars,
  sellerOrderApi,
  type PendingShopApproval,
} from '../api/sellerOrderApi'

const STATUS_STYLES: Record<string, string> = {
  pending: 'bg-amber-100 text-amber-700',
  approved: 'bg-emerald-100 text-emerald-700',
  rejected: 'bg-red-100 text-red-700',
}

const statusLabel = (status?: string | null): string => {
  if (status === 'approved') return 'APPROVED'
  if (status === 'rejected') return 'REJECTED'
  return 'PENDING APPROVAL'
}

const formatDate = (value?: string | null): string => {
  if (!value) return '—'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return '—'
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

const SellerQuantityApprovalsPage = () => {
  const navigate = useNavigate()
  const authUserId = useAppSelector((state) => state.auth.user?.id ?? null)
  const [approvals, setApprovals] = useState<PendingShopApproval[]>([])
  const [avatars, setAvatars] = useState<Record<string, string | null>>({})
  const [status, setStatus] = useState<'idle' | 'loading' | 'succeeded' | 'failed'>('idle')
  const [error, setError] = useState<string | null>(null)
  const [refreshVersion, setRefreshVersion] = useState(0)
  const [search, setSearch] = useState('')

  useEffect(() => {
    if (!authUserId) {
      setApprovals([])
      setStatus('idle')
      return
    }
    let cancelled = false
    setStatus('loading')
    setError(null)
    void sellerOrderApi.listShopsByUser(authUserId)
      .then((shops) => sellerOrderApi.listPendingShopApprovals(shops.map((shop) => shop.shopId)))
      .then((next) => {
        if (cancelled) return
        setApprovals(next)
        setStatus('succeeded')
      })
      .catch(() => {
        if (cancelled) return
        setApprovals([])
        setError('Unable to load quantity requests.')
        setStatus('failed')
      })
    return () => {
      cancelled = true
    }
  }, [authUserId, refreshVersion])

  useEffect(() => {
    let cancelled = false
    void fetchCustomerAvatars(approvals.map((approval) => approval.user_id))
      .then((next) => {
        if (!cancelled) setAvatars(next)
      })
      .catch(() => {
        if (!cancelled) setAvatars({})
      })
    return () => {
      cancelled = true
    }
  }, [approvals])

  const filteredApprovals = useMemo(() => {
    const term = search.trim().toLowerCase()
    if (!term) return approvals
    return approvals.filter((approval) => [
      approval.checkout_id,
      approval.user_id,
      approval.customer_name,
      approval.status,
      ...approval.items.map((item) => item.title),
    ].some((value) => value?.toLowerCase().includes(term)))
  }, [approvals, search])

  const columns = useMemo<Array<DataTableColumn<PendingShopApproval>>>(() => [
    {
      key: 'checkout',
      header: 'Checkout ID',
      sortValue: (row) => row.checkout_id,
      render: (row) => (
        <div className="inline-flex max-w-[190px] items-center gap-1">
          <span className="min-w-0 truncate font-mono font-medium text-slate-900" title={row.checkout_id}>
            {row.checkout_id}
          </span>
          <CopyToClipboardButton value={row.checkout_id} label="checkout ID" />
        </div>
      ),
    },
    {
      key: 'customer',
      header: 'Customer',
      sortValue: (row) => row.customer_name || row.user_id,
      render: (row) => {
        const name = row.customer_name || row.user_id
        return (
          <div className="flex items-center gap-3">
            <CustomerAvatar imageUrl={avatars[row.user_id]} alt={name} />
            <p className="max-w-[160px] truncate text-xs font-medium text-slate-900" title={name}>
              {name}
            </p>
          </div>
        )
      },
    },
    {
      key: 'items',
      header: 'Items',
      render: (row) => {
        const names = row.items.map((item) => `${item.title} × ${item.qty}`).join(', ')
        return (
          <p className="max-w-[220px] truncate text-xs text-slate-700" title={names || undefined}>
            {row.items.length} item{row.items.length === 1 ? '' : 's'}
          </p>
        )
      },
    },
    {
      key: 'quantity',
      header: 'Quantity',
      sortValue: (row) => row.quantity,
      render: (row) => <span className="font-medium text-slate-900">{row.quantity}</span>,
    },
    {
      key: 'status',
      header: 'Status',
      sortValue: (row) => row.status ?? 'pending',
      render: (row) => (
        <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${STATUS_STYLES[row.status ?? 'pending'] ?? 'bg-slate-100 text-slate-600'}`}>
          {statusLabel(row.status)}
        </span>
      ),
    },
    {
      key: 'date',
      header: 'Date',
      sortValue: (row) => row.created_at ?? '',
      render: (row) => <span className="text-slate-600">{formatDate(row.created_at)}</span>,
    },
    {
      key: 'actions',
      header: 'Actions',
      width: '7rem',
      render: (row) => (
        <button
          type="button"
          onClick={() => navigate(`/seller/quantity-approvals/${row.checkout_id}?shopId=${encodeURIComponent(row.shop_id)}`)}
          className="inline-flex items-center gap-1 rounded px-2 py-1 text-xs font-medium text-slate-700 hover:bg-slate-100"
        >
          <Eye size={14} />
          View
        </button>
      ),
    },
  ], [avatars, navigate])

  return (
    <div className="space-y-6">
      <nav className="text-xs text-slate-500">
        <Link to="/seller/overview" className="hover:text-slate-700">
          Dashboard
        </Link>
        <span className="mx-1">/</span>
        <span className="text-slate-900">Quantity Approvals</span>
      </nav>

      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Quantity Approvals</h1>
          <p className="mt-0.5 text-sm text-slate-600">
            Review checkouts with more than 50 items. Approved and rejected requests stay in this list.
          </p>
        </div>
        <button
          type="button"
          onClick={() => setRefreshVersion((value) => value + 1)}
          disabled={!authUserId || status === 'loading'}
          className="inline-flex items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
        >
          <RefreshCw size={16} className={status === 'loading' ? 'animate-spin' : undefined} />
          Refresh
        </button>
      </div>

      <div className="relative w-full sm:max-w-md">
        <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
        <input
          type="search"
          placeholder="Search quantity requests..."
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          className="w-full rounded-lg border border-slate-200 bg-white py-2 pl-10 pr-4 text-sm outline-none placeholder:text-slate-400 focus:border-emerald-500"
        />
      </div>

      <DataTable
        key={search}
        columns={columns}
        rows={filteredApprovals}
        rowKey={(row) => `${row.checkout_id}:${row.shop_id}`}
        loading={status === 'loading'}
        error={error}
        emptyMessage={search.trim() ? 'No matching quantity requests' : 'No quantity requests yet.'}
        emptyIcon={Search}
        itemLabel="requests"
        minWidth="960px"
      />
    </div>
  )
}

export default SellerQuantityApprovalsPage
