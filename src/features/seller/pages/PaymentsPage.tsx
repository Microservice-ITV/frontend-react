import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { RefreshCw, Search, Eye } from 'lucide-react'
import { useAppSelector } from '@/app/hooks'
import { adminShopApi } from '@/features/admin/api/adminShopApi'
import DataTablePagination from '@/components/ui/DataTablePagination'
import { sellerOrderApi, type PaymentRecord } from '../api/sellerOrderApi'

type PaymentsPageProps = { admin?: boolean }

const money = (value: number, currency: string) =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency: currency || 'USD' }).format(value || 0)

const PAYMENT_STATUS_STYLES: Record<string, string> = {
  COLLECTED: 'bg-emerald-100 text-emerald-700',
  SUCCESS: 'bg-sky-100 text-sky-700',
  PENDING: 'bg-amber-100 text-amber-700',
  FAILED: 'bg-red-100 text-red-700',
  EXPIRED: 'bg-slate-200 text-slate-600',
}

const DELIVERY_STATUS_STYLES: Record<string, string> = {
  DELIVERED: 'bg-emerald-100 text-emerald-700',
  SHIPPED: 'bg-sky-100 text-sky-700',
  READY_FOR_FULFILLMENT: 'bg-violet-100 text-violet-700',
  PAID: 'bg-amber-100 text-amber-700',
  CONFIRMED: 'bg-slate-100 text-slate-600',
}

const deliveryLabel = (status?: string | null) => {
  if (!status) return '—'
  switch (status.toUpperCase()) {
    case 'DELIVERED':
      return 'Delivered'
    case 'SHIPPED':
      return 'Shipped'
    case 'READY_FOR_FULFILLMENT':
      return 'Ready to fulfil'
    default:
      return status.charAt(0) + status.slice(1).toLowerCase()
  }
}

export default function PaymentsPage({ admin = false }: PaymentsPageProps) {
  const user = useAppSelector((state) => state.auth.user)
  const [payments, setPayments] = useState<PaymentRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [collecting, setCollecting] = useState<string | null>(null)

  const [activeFilter, setActiveFilter] = useState('all')
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [rowsPerPage, setRowsPerPage] = useState(10)

  const load = async () => {
    setLoading(true)
    setError('')
    try {
      let shopIds: string[] = []
      if (admin) {
        const response = await adminShopApi.listShops({ page: 1, limit: 100 })
        const remainingPages = Array.from(
          { length: Math.max(0, response.data.pagination.totalPages - 1) },
          (_, index) => adminShopApi.listShops({ page: index + 2, limit: 100 }),
        )
        const additionalResponses = await Promise.all(remainingPages)
        shopIds = [
          ...response.data.data,
          ...additionalResponses.flatMap((result) => result.data.data),
        ]
          .map((shop) => shop.id)
          .filter((id): id is string => Boolean(id))
      } else if (user?.id) {
        const shops = await sellerOrderApi.listShopsByUser(user.id)
        shopIds = shops
          .map((shop) => shop.id ?? shop.shopId ?? '')
          .filter((id): id is string => Boolean(id))
      }

      if (shopIds.length === 0 && !admin && user?.active_shop_id) {
        shopIds = [user.active_shop_id]
      }

      setPayments(await sellerOrderApi.paymentRecordsForShops(shopIds))
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Unable to load payment records.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { void load() }, [admin, user?.id, user?.active_shop_id])

  const sortedPayments = useMemo(
    () =>
      [...payments].sort(
        (a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime(),
      ),
    [payments],
  )

  const statusTabs = useMemo(() => {
    const statuses = [...new Set(sortedPayments.map((payment) => payment.status))].sort()
    return [{ key: 'all', label: 'All' }, ...statuses.map((status) => ({ key: status, label: status }))]
  }, [sortedPayments])

  const filteredPayments = useMemo(() => {
    const q = search.toLowerCase()
    return sortedPayments.filter((payment) => {
      const matchesFilter = activeFilter === 'all' || payment.status === activeFilter
      const matchesSearch =
        !q ||
        (payment.invoiceNo ?? '').toLowerCase().includes(q) ||
        payment.orderId.toLowerCase().includes(q) ||
        payment.provider.toLowerCase().includes(q) ||
        (payment.paymentMethod ?? '').toLowerCase().includes(q) ||
        (payment.deliveryStatus ?? '').toLowerCase().includes(q)
      return matchesFilter && matchesSearch
    })
  }, [sortedPayments, activeFilter, search])

  const totalPages = Math.max(1, Math.ceil(filteredPayments.length / rowsPerPage))
  const paginatedPayments = filteredPayments.slice((page - 1) * rowsPerPage, page * rowsPerPage)

  const collect = async (payment: PaymentRecord) => {
    setCollecting(payment.id)
    setError('')
    try {
      await sellerOrderApi.collectPayment(payment.orderId)
      await load()
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Unable to collect COD payment.')
    } finally {
      setCollecting(null)
    }
  }

  const isCodCollectable = (payment: PaymentRecord) => {
    const isCod = (payment.paymentMethod ?? payment.provider).toLowerCase() === 'cod'
    return (
      isCod &&
      (payment.deliveryStatus ?? '').toUpperCase() === 'DELIVERED' &&
      payment.status.toUpperCase() !== 'COLLECTED'
    )
  }

  return (
    <section className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <nav className="text-xs text-slate-500">
            <Link to={admin ? '/super-admin/overview' : '/seller/overview'}>Dashboard</Link>
            <span className="mx-1">/</span>Payments
          </nav>
          <h1 className="mt-1 text-xl font-bold text-slate-900">Payments</h1>
          <p className="mt-0.5 text-sm text-slate-600">
            {admin ? 'Payment records across all shops.' : 'Payment records for your shop orders.'}
          </p>
        </div>
        <button
          onClick={() => void load()}
          className="inline-flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-700"
        >
          <RefreshCw size={16} /> Refresh
        </button>
      </div>

      {error && <p className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</p>}

      <div className="rounded-xl border border-slate-200 bg-white p-4">
        <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm font-semibold text-slate-900">All Payments</p>
          <div className="flex flex-wrap items-center gap-2">
            <div className="relative w-full sm:w-52">
              <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="search"
                placeholder="Search payments..."
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value)
                  setPage(1)
                }}
                className="w-full rounded-lg border border-slate-200 bg-white py-1.5 pl-8 pr-3 text-xs outline-none placeholder:text-slate-400 focus:border-emerald-500"
              />
            </div>
            <div className="flex flex-wrap gap-1">
              {statusTabs.map((tab) => (
                <button
                  key={tab.key}
                  type="button"
                  onClick={() => {
                    setActiveFilter(tab.key)
                    setPage(1)
                  }}
                  className={`rounded px-2.5 py-1 text-xs font-medium ${
                    activeFilter === tab.key
                      ? 'bg-slate-200 text-slate-900'
                      : 'bg-white text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[920px]">
            <thead>
              <tr className="border-b border-slate-100">
                <th className="px-2 py-2 text-left text-[11px] font-medium text-slate-500">Invoice</th>
                <th className="px-2 py-2 text-left text-[11px] font-medium text-slate-500">Order</th>
                <th className="px-2 py-2 text-left text-[11px] font-medium text-slate-500">Payment Provider</th>
                <th className="px-2 py-2 text-left text-[11px] font-medium text-slate-500">Amount</th>
                <th className="px-2 py-2 text-left text-[11px] font-medium text-slate-500">Delivery Status</th>
                <th className="px-2 py-2 text-left text-[11px] font-medium text-slate-500">Payment Status</th>
                <th className="px-2 py-2 text-right text-[11px] font-medium text-slate-500">Action</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={7} className="px-2 py-8 text-center text-sm text-slate-500">
                    Loading payments…
                  </td>
                </tr>
              ) : paginatedPayments.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-2 py-8 text-center text-sm text-slate-500">
                    No payments found.
                  </td>
                </tr>
              ) : (
                paginatedPayments.map((payment) => (
                  <tr key={payment.id} className="border-b border-slate-100 last:border-0">
                    <td className="px-2 py-3 text-xs font-semibold text-slate-900">
                      {payment.invoiceNo || '—'}
                    </td>
                    <td className="px-2 py-3 text-xs text-slate-600">
                      <span className="font-mono">{payment.orderId}</span>
                    </td>
                    <td className="px-2 py-3">
                      <p className="text-xs font-medium capitalize text-slate-900">{payment.provider}</p>
                      {payment.paymentMethod && payment.paymentMethod !== payment.provider && (
                        <p className="text-[11px] text-slate-500">{payment.paymentMethod}</p>
                      )}
                    </td>
                    <td className="px-2 py-3 text-xs font-semibold text-slate-900">
                      {money(payment.amount, payment.currency)}
                    </td>
                    <td className="px-2 py-3">
                      <span
                        className={`inline-flex rounded-full px-2 py-0.5 text-[11px] font-medium ${
                          DELIVERY_STATUS_STYLES[(payment.deliveryStatus ?? '').toUpperCase()] ??
                          'bg-slate-100 text-slate-600'
                        }`}
                      >
                        {deliveryLabel(payment.deliveryStatus)}
                      </span>
                    </td>
                    <td className="px-2 py-3">
                      <span
                        className={`inline-flex rounded-full px-2 py-0.5 text-[11px] font-medium ${
                          PAYMENT_STATUS_STYLES[payment.status.toUpperCase()] ??
                          'bg-slate-100 text-slate-600'
                        }`}
                      >
                        {payment.status}
                      </span>
                    </td>
                    <td className="px-2 py-3">
                      <div className="flex items-center justify-end gap-1.5">
                        <Link
                          to={`${admin ? '/super-admin' : '/seller'}/payments/${payment.id}`}
                          className="inline-flex items-center gap-1 rounded-md border border-slate-200 px-2.5 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50"
                        >
                          <Eye size={13} /> Details
                        </Link>
                        {isCodCollectable(payment) && (
                          <button
                            disabled={collecting === payment.id}
                            onClick={() => void collect(payment)}
                            className="rounded-md bg-emerald-600 px-2.5 py-1.5 text-xs font-medium text-white disabled:opacity-60"
                          >
                            {collecting === payment.id ? 'Collecting…' : 'Collect COD'}
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <DataTablePagination
          page={page}
          totalPages={totalPages}
          rowsPerPage={rowsPerPage}
          totalItems={filteredPayments.length}
          itemLabel="payments"
          onPageChange={setPage}
          onRowsPerPageChange={(value) => {
            setRowsPerPage(value)
            setPage(1)
          }}
        />
      </div>
    </section>
  )
}