import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { RefreshCw, Search, Eye, Download } from 'lucide-react'
import * as XLSX from 'xlsx'
import { useAppSelector } from '@/app/hooks'
import { adminShopApi } from '@/features/admin/api/adminShopApi'
import { formatKsPrice } from '@/features/products/utils/formatProductPrice'
import { shippingApi } from '@/features/shipping/api/shippingApi'
import DataTablePagination from '@/components/ui/DataTablePagination'
import CopyToClipboardButton from '../components/CopyToClipboardButton'
import {
  isDeliveredPendingCodPayment,
  sellerOrderApi,
  sellerPaymentAmountDue,
  type PaymentRecord,
} from '../api/sellerOrderApi'

type PaymentsPageProps = { admin?: boolean }

const money = (value: number) => formatKsPrice(Number(value) || 0)

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
  IN_TRANSIT: 'bg-blue-100 text-blue-700',
  OUT_FOR_DELIVERY: 'bg-indigo-100 text-indigo-700',
  PARTIALLY_FULFILLED: 'bg-orange-100 text-orange-700',
  FULFILLED: 'bg-sky-100 text-sky-700',
  READY_FOR_FULFILLMENT: 'bg-violet-100 text-violet-700',
  PAID: 'bg-amber-100 text-amber-700',
  CONFIRMED: 'bg-slate-100 text-slate-600',
}

const orderStatusLabel = (status?: string | null) => status?.trim().toUpperCase() || '—'

/** True when this payment co-mingles other owners' shops (share < full). */
const isSharedPayment = (payment: PaymentRecord) =>
  Boolean(payment.seller) && Math.abs(payment.seller!.orderShare - payment.amount) > 0.005

export default function PaymentsPage({ admin = false }: PaymentsPageProps) {
  const user = useAppSelector((state) => state.auth.user)
  const [payments, setPayments] = useState<PaymentRecord[]>([])
  const [deliveryCompanyNames, setDeliveryCompanyNames] = useState<Record<string, string>>({})
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [selectedOrderIds, setSelectedOrderIds] = useState<string[]>([])
  const [collectingBatch, setCollectingBatch] = useState(false)

  const [activeFilter, setActiveFilter] = useState('all')
  const [codDueOnly, setCodDueOnly] = useState(false)
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

  useEffect(() => {
    let cancelled = false
    void shippingApi.listActiveDeliveryCompanies()
      .then((response) => {
        const payload = response.data as {
          data?: { companies?: Array<{ id?: unknown; name?: unknown }> }
        } | null
        const names: Record<string, string> = {}
        for (const company of payload?.data?.companies ?? []) {
          if (typeof company.id === 'string' && typeof company.name === 'string') {
            names[company.id] = company.name
          }
        }
        if (!cancelled) setDeliveryCompanyNames(names)
      })
      .catch(() => {
        // Payment records remain useful if the Shipping Service is unavailable.
        if (!cancelled) setDeliveryCompanyNames({})
      })
    return () => {
      cancelled = true
    }
  }, [])

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
      const matchesCodDue = !codDueOnly || isDeliveredPendingCodPayment(payment)
      const matchesSearch =
        !q ||
        (payment.invoiceNo ?? '').toLowerCase().includes(q) ||
        payment.orderId.toLowerCase().includes(q) ||
        payment.provider.toLowerCase().includes(q) ||
        (payment.paymentMethod ?? '').toLowerCase().includes(q) ||
        (payment.deliveryStatus ?? '').toLowerCase().includes(q)
      return matchesFilter && matchesCodDue && matchesSearch
    })
  }, [sortedPayments, activeFilter, codDueOnly, search])

  const totalPages = Math.max(1, Math.ceil(filteredPayments.length / rowsPerPage))
  const paginatedPayments = filteredPayments.slice((page - 1) * rowsPerPage, page * rowsPerPage)

  // Seller-scoped summary across settled payments (success/collected).
  const stats = useMemo(() => {
    const settled = payments.filter((payment) =>
      ['SUCCESS', 'COLLECTED'].includes((payment.status || '').toUpperCase()),
    )
    const deliveredPendingCod = payments.filter(isDeliveredPendingCodPayment)
    const sum = (pick: (payment: PaymentRecord) => number) =>
      Number(settled.reduce((carry, payment) => carry + pick(payment), 0).toFixed(2))
    const scoped = payments.some((payment) => payment.seller)
    return {
      scoped,
      collected: sum((payment) => payment.amount),
      share: sum((payment) => payment.seller?.orderShare ?? payment.amount),
      payout: sum((payment) => payment.seller?.payout ?? payment.amount),
      codDueFromDelivery: Number(deliveredPendingCod.reduce(
        (carry, payment) => carry + sellerPaymentAmountDue(payment),
        0,
      ).toFixed(2)),
      codDueOrderCount: deliveredPendingCod.length,
      pending: payments.filter((payment) =>
        ['PENDING', 'CREATED', 'PROCESSING'].includes((payment.status || '').toUpperCase()),
      ).length,
    }
  }, [payments])

  const collectBatch = async () => {
    if (selectedOrderIds.length === 0) return
    const selectedPayment = payments.find((payment) => payment.orderId === selectedOrderIds[0])
    if (!selectedPayment?.deliveryShopId) {
      setError('The selected shop could not be resolved for this Collect COD batch.')
      return
    }
    setCollectingBatch(true)
    setError('')
    try {
      await sellerOrderApi.collectCodBatch(selectedOrderIds, selectedPayment.deliveryShopId)
      setSelectedOrderIds([])
      await load()
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Unable to collect COD payment.')
    } finally {
      setCollectingBatch(false)
    }
  }

  const isCodCollectable = (payment: PaymentRecord) => {
    const isCod = (payment.paymentMethod ?? payment.provider).toLowerCase() === 'cod'
    const deliveryStatus = payment.sellerDeliveryStatus ?? payment.deliveryStatus
    const batchNeedsRetry = Boolean(payment.codCollectionBatchId) && payments.some((row) =>
      row.codCollectionBatchId === payment.codCollectionBatchId
      && row.status.toUpperCase() !== 'COLLECTED',
    )
    return (
      isCod &&
      deliveryStatus?.toUpperCase() === 'DELIVERED' &&
      Boolean(payment.deliveryShopId && payment.deliveryCompanyId) &&
      (payment.status.toUpperCase() !== 'COLLECTED' || batchNeedsRetry)
    )
  }

  const toggleBatchOrder = (payment: PaymentRecord) => {
    setError('')
    const batchMembers = payment.codCollectionBatchId
      ? payments.filter((row) => row.codCollectionBatchId === payment.codCollectionBatchId)
      : [payment]
    const candidateOrderIds = [...new Set(batchMembers.map((row) => row.orderId))]
    if (candidateOrderIds.some((orderId) => selectedOrderIds.includes(orderId))) {
      setSelectedOrderIds(selectedOrderIds.filter((id) => !candidateOrderIds.includes(id)))
      return
    }
    if (selectedOrderIds.length + candidateOrderIds.length > 100) {
      setError('A Collect COD batch can contain at most 100 orders.')
      return
    }
    const selected = selectedOrderIds
      .map((orderId) => payments.find((row) => row.orderId === orderId))
      .filter((row): row is PaymentRecord => Boolean(row))
    if (selected.some((row) => batchMembers.some((candidate) =>
      row.deliveryShopId !== candidate.deliveryShopId
      || row.deliveryCompanyId !== candidate.deliveryCompanyId
      || row.codCollectionBatchId !== candidate.codCollectionBatchId,
    ),
    )) {
      setError('Select orders for the same shop, delivery provider, and Collect COD batch.')
      return
    }
    setSelectedOrderIds([...selectedOrderIds, ...candidateOrderIds])
  }

  const toggleCodDueFilter = () => {
    setCodDueOnly((current) => !current)
    setActiveFilter('all')
    setPage(1)
    setSelectedOrderIds([])
  }

  const exportCodDueToExcel = () => {
    const rows = filteredPayments
      .filter(isDeliveredPendingCodPayment)
      .map((payment) => ({
        'Invoice No': payment.invoiceNo ?? '',
        'Order ID': payment.orderId,
        'Waybill No': payment.wayBillNo ?? '',
        'Payment Provider': payment.provider,
        'Payment Status': payment.status,
        'Order Status': orderStatusLabel(payment.sellerDeliveryStatus ?? payment.deliveryStatus),
        'Delivery Company': payment.deliveryCompanyId
          ? deliveryCompanyNames[payment.deliveryCompanyId] ?? payment.deliveryCompanyId
          : '',
        'Order Share (Ks)': payment.seller?.orderShare ?? payment.amount,
        'Platform Fee (Ks)': payment.seller?.platformFee ?? 0,
        'Shipping Share (Ks)': payment.seller?.shippingShare ?? 0,
        'Amount to Receive (Ks)': sellerPaymentAmountDue(payment),
        Currency: 'Ks',
        'Created At': payment.createdAt,
      }))

    const worksheet = XLSX.utils.json_to_sheet(rows)
    const workbook = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(workbook, worksheet, 'COD Due')
    XLSX.writeFile(workbook, `cod-to-receive-${new Date().toISOString().slice(0, 10)}.xlsx`)
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

      {!admin && payments.length > 0 && (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-5">
          <div className="rounded-xl border border-slate-200 bg-white p-4">
            <p className="text-[11px] font-medium uppercase tracking-wide text-slate-400">
              Collected (your shops)
            </p>
            <p className="mt-1 text-lg font-bold tracking-tight text-slate-900">
              {money(stats.scoped ? stats.share : stats.collected)}
            </p>
          </div>
          <div className="rounded-xl border border-slate-200 bg-white p-4">
            <p className="text-[11px] font-medium uppercase tracking-wide text-slate-400">
              Net Payouts
            </p>
            <p className="mt-1 text-lg font-bold tracking-tight text-emerald-600">
              {money(stats.payout)}
            </p>
            <p className="mt-0.5 text-[10px] text-slate-400">after platform fees</p>
          </div>
          <button
            type="button"
            onClick={toggleCodDueFilter}
            aria-pressed={codDueOnly}
            className={`w-full rounded-xl border p-4 text-left transition-colors ${
              codDueOnly
                ? 'border-amber-400 bg-amber-100 ring-2 ring-amber-200'
                : 'border-amber-200 bg-amber-50 hover:border-amber-300 hover:bg-amber-100/70'
            }`}
          >
            <p className="text-[11px] font-medium uppercase tracking-wide text-amber-700">
              COD to Receive from Delivery
            </p>
            <p className="mt-1 text-lg font-bold tracking-tight text-amber-800">
              {money(stats.codDueFromDelivery)}
            </p>
            <p className="mt-0.5 text-[10px] text-amber-700">
              {stats.codDueOrderCount} delivered, pending COD {stats.codDueOrderCount === 1 ? 'order' : 'orders'}
            </p>
          </button>
          <div className="rounded-xl border border-slate-200 bg-white p-4">
            <p className="text-[11px] font-medium uppercase tracking-wide text-slate-400">
              Payments
            </p>
            <p className="mt-1 text-lg font-bold tracking-tight text-slate-900">{payments.length}</p>
          </div>
          <div className="rounded-xl border border-slate-200 bg-white p-4">
            <p className="text-[11px] font-medium uppercase tracking-wide text-slate-400">
              Awaiting Payment
            </p>
            <p className="mt-1 text-lg font-bold tracking-tight text-amber-600">{stats.pending}</p>
          </div>
        </div>
      )}

      <div className="rounded-xl border border-slate-200 bg-white p-4">
        <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-semibold text-slate-900">
              {codDueOnly ? 'COD Due from Delivery' : 'All Payments'}
            </p>
            {codDueOnly && (
              <p className="mt-0.5 text-xs text-slate-500">
                Delivered orders with pending COD payments.
              </p>
            )}
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {codDueOnly && (
              <button
                type="button"
                onClick={exportCodDueToExcel}
                disabled={!filteredPayments.some(isDeliveredPendingCodPayment)}
                className="inline-flex items-center gap-1.5 rounded-md border border-emerald-200 px-3 py-1.5 text-xs font-medium text-emerald-700 hover:bg-emerald-50 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <Download size={14} /> Export Excel
              </button>
            )}
            {selectedOrderIds.length > 0 && (
              <button
                type="button"
                disabled={collectingBatch}
                onClick={() => void collectBatch()}
                className="rounded-md bg-emerald-600 px-3 py-1.5 text-xs font-medium text-white disabled:opacity-60"
              >
                {collectingBatch ? 'Collecting…' : `Collect ${selectedOrderIds.length} COD orders`}
              </button>
            )}
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
          <table className="w-full min-w-[1200px]">
            <thead>
              <tr className="border-b border-slate-100">
                <th className="px-2 py-2 text-left text-[11px] font-medium text-slate-500">Select</th>
                <th className="px-2 py-2 text-left text-[11px] font-medium text-slate-500">Invoice</th>
                <th className="px-2 py-2 text-left text-[11px] font-medium text-slate-500">Order ID</th>
                <th className="px-2 py-2 text-left text-[11px] font-medium text-slate-500">Waybill No</th>
                <th className="px-2 py-2 text-left text-[11px] font-medium text-slate-500">Payment Provider</th>
                <th className="px-2 py-2 text-left text-[11px] font-medium text-slate-500">Delivery Provider</th>
                <th className="px-2 py-2 text-left text-[11px] font-medium text-slate-500">Amount</th>
                <th className="px-2 py-2 text-left text-[11px] font-medium text-slate-500">Order Status</th>
                <th className="px-2 py-2 text-left text-[11px] font-medium text-slate-500">Payment Status</th>
                <th className="px-2 py-2 text-right text-[11px] font-medium text-slate-500">Action</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={10} className="px-2 py-8 text-center text-sm text-slate-500">
                    Loading payments…
                  </td>
                </tr>
              ) : paginatedPayments.length === 0 ? (
                <tr>
                  <td colSpan={10} className="px-2 py-8 text-center text-sm text-slate-500">
                    No payments found.
                  </td>
                </tr>
              ) : (
                paginatedPayments.map((payment) => (
                  <tr key={payment.id} className="border-b border-slate-100 last:border-0">
                    <td className="px-2 py-3">
                      <input
                        type="checkbox"
                        aria-label={`Select order ${payment.orderId} for COD collection`}
                        checked={selectedOrderIds.includes(payment.orderId)}
                        disabled={!isCodCollectable(payment) || collectingBatch}
                        onChange={() => toggleBatchOrder(payment)}
                        className="size-4 accent-emerald-600 disabled:opacity-40"
                      />
                    </td>
                    <td className="px-2 py-3 text-xs font-semibold text-slate-900">
                      {payment.invoiceNo || '—'}
                    </td>
                    <td className="px-2 py-3 text-xs text-slate-600">
                      <div className="inline-flex max-w-[180px] items-center gap-1">
                        <span className="min-w-0 truncate font-mono" title={payment.orderId}>{payment.orderId}</span>
                        <CopyToClipboardButton value={payment.orderId} label="order ID" />
                      </div>
                    </td>
                    <td className="px-2 py-3 text-xs text-slate-600">
                      <div className="inline-flex max-w-[210px] items-center gap-1">
                        <span className="min-w-0 truncate font-mono" title={payment.wayBillNo || undefined}>
                          {payment.wayBillNo?.trim() || '—'}
                        </span>
                        <CopyToClipboardButton value={payment.wayBillNo?.trim() ?? ''} label="waybill number" />
                      </div>
                    </td>
                    <td className="px-2 py-3">
                      <p className="text-xs font-medium capitalize text-slate-900">{payment.provider}</p>
                      {payment.paymentMethod && payment.paymentMethod !== payment.provider && (
                        <p className="text-[11px] text-slate-500">{payment.paymentMethod}</p>
                      )}
                    </td>
                    <td className="px-2 py-3 text-xs text-slate-600">
                      {payment.deliveryCompanyId
                        ? deliveryCompanyNames[payment.deliveryCompanyId] ?? payment.deliveryCompanyId
                        : '—'}
                    </td>
                    <td className="px-2 py-3 text-xs font-semibold text-slate-900">
                      {(() => {
                        const share = payment.seller?.orderShare ?? payment.amount
                        const shared = isSharedPayment(payment)
                        return (
                          <div
                            title={
                              shared && payment.seller
                                ? `Full order: ${money(payment.amount)} (other owners' shops excluded) · your payout after fees: ${money(payment.seller.payout)}`
                                : payment.seller
                                  ? `Payout after platform fee: ${money(payment.seller.payout)}`
                                  : undefined
                            }
                          >
                            <p>{money(share)}</p>
                            {shared && (
                              <p className="mt-0.5 text-[10px] font-normal text-slate-400">
                                your share · full {money(payment.amount)}
                              </p>
                            )}
                          </div>
                        )
                      })()}
                    </td>
                    <td className="px-2 py-3">
                      {(() => {
                        // Seller's own shops drive this badge; the full order
                        // status can lag behind other owners' shops.
                        const display = payment.sellerDeliveryStatus || payment.deliveryStatus
                        const differs = Boolean(
                          payment.sellerDeliveryStatus &&
                            payment.sellerDeliveryStatus !== payment.deliveryStatus,
                        )
                        return (
                          <span
                            title={
                              differs
                                ? `Your shops: ${orderStatusLabel(display)} · Full order: ${orderStatusLabel(payment.deliveryStatus)}`
                                : undefined
                            }
                            className={`inline-flex rounded-full px-2 py-0.5 text-[11px] font-medium ${
                              DELIVERY_STATUS_STYLES[(display ?? '').toUpperCase()] ??
                              'bg-slate-100 text-slate-600'
                            }`}
                          >
                            {orderStatusLabel(display)}
                          </span>
                        )
                      })()}
                    </td>
                    <td className="px-2 py-3">
                      <span
                        className={`inline-flex rounded-full px-2 py-0.5 text-[11px] font-medium ${
                          PAYMENT_STATUS_STYLES[payment.status.toUpperCase()] ??
                          'bg-slate-100 text-slate-600'
                        }`}
                      >
                        {payment.status.toUpperCase()}
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
