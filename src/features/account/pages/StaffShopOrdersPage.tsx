import { useCallback, useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { PackageCheck, RefreshCw, Store, Truck } from 'lucide-react'
import { useAppSelector } from '@/app/hooks'
import ModalDrawer from '@/components/ui/ModalDrawer'
import DataTablePagination from '@/components/ui/DataTablePagination'
import { Typing } from '@/components/loading-ui/typing'
import OrderProductImage from '../components/OrderProductImage'
import CheckoutDeliveryCompanySelect from '@/features/checkout/components/CheckoutDeliveryCompanySelect'
import type { CheckoutDeliveryCompany } from '@/features/shipping/hooks/useCheckoutDeliveryCompany'
import { isShopStaffUser } from '@/features/checkout/utils/staffCheckoutCustomer'
import {
  staffShopOrdersApi,
  type StaffShop,
  type StaffShopOrder,
  type StaffShopOrderStatus,
} from '../api/staffShopOrdersApi'

const PAGE_SIZE = 5

const TABS: Array<{ key: StaffShopOrderStatus; label: string }> = [
  { key: 'to-ship', label: 'To Ship' },
  { key: 'shipped', label: 'Shipped' },
]

const STATUS_LABELS: Record<string, string> = {
  READY_FOR_FULFILLMENT: 'To ship',
  SHIPPED: 'Shipped',
  FULFILLED: 'Shipped',
  IN_TRANSIT: 'In transit',
  OUT_FOR_DELIVERY: 'Out for delivery',
  DELIVERED: 'Delivered',
  COMPLETED: 'Completed',
}

const formatMoney = (value?: number | null): string => {
  const amount = Number(value ?? 0)
  return `Ks ${(Number.isFinite(amount) ? amount : 0).toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`
}

const formatDate = (value?: string | null): string => {
  if (!value) return '—'
  const d = new Date(value)
  if (Number.isNaN(d.getTime())) return '—'
  return d.toLocaleString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' })
}

const errorMessage = (error: unknown, fallback: string): string => {
  const err = error as { response?: { data?: { error?: string; message?: string } }; message?: string }
  return err?.response?.data?.error || err?.response?.data?.message || err?.message || fallback
}

const shopRow = (order: StaffShopOrder, shopId: string) =>
  order.shopBreakdown?.find((row) => row.shopId === shopId) ?? null

const shopStatus = (order: StaffShopOrder, shopId: string): string =>
  (shopRow(order, shopId)?.status || order.status || '').toUpperCase()

const paymentLabel = (order: StaffShopOrder): string =>
  (order.payment?.method || '').toLowerCase() === 'cod' ? 'Cash on delivery' : 'Paid'

type ShipModalProps = {
  order: StaffShopOrder
  shopId: string
  onClose: () => void
  onShipped: (orderId: string) => void
}

const ShipOrderModal = ({ order, shopId, onClose, onShipped }: ShipModalProps) => {
  const [packed, setPacked] = useState<Record<number, boolean>>(() =>
    Object.fromEntries(order.items.map((_, index) => [index, true])),
  )
  const [wayBillNo, setWayBillNo] = useState(order.wayBillNo ?? '')
  const [companies, setCompanies] = useState<CheckoutDeliveryCompany[] | null>(null)
  const [deliveryCompanyId, setDeliveryCompanyId] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const allPacked = order.items.length > 0 && order.items.every((_, index) => packed[index])
  const companyReady = companies !== null && (companies.length === 0 || deliveryCompanyId !== '')
  const address = order.deliveryAddress

  useEffect(() => {
    let cancelled = false
    staffShopOrdersApi.deliveryCompanies(shopId)
      .then((rows) => {
        if (cancelled) return
        setCompanies(rows)
        if (rows.length === 1) setDeliveryCompanyId(rows[0].id)
      })
      .catch((err) => {
        if (cancelled) return
        setCompanies([])
        setError(errorMessage(err, 'Delivery companies could not be loaded.'))
      })
    return () => { cancelled = true }
  }, [shopId])

  const toggleSelectAll = (checked: boolean) => {
    setPacked(Object.fromEntries(order.items.map((_, index) => [index, checked])))
  }

  const submit = async () => {
    setSubmitting(true)
    setError('')
    try {
      await staffShopOrdersApi.ship(order.orderId, shopId, wayBillNo.trim(), deliveryCompanyId)
      onShipped(order.orderId)
    } catch (err) {
      setError(errorMessage(err, 'Failed to ship this order. Please try again.'))
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <ModalDrawer
      open
      onClose={onClose}
      title="Ship order"
      subtitle={<span className="font-mono">{order.orderId}</span>}
      size="md"
      fitContent
      panelClassName="rounded-sm!"
      closeOnBackdrop={!submitting}
      footer={
        <div className="flex items-center justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            disabled={submitting}
            className="rounded-sm border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={() => void submit()}
            disabled={!allPacked || !wayBillNo.trim() || !companyReady || submitting}
            className="inline-flex items-center gap-2 rounded-sm bg-[#008f51] px-4 py-2 text-sm font-semibold text-white hover:bg-[#007a45] disabled:cursor-not-allowed disabled:opacity-50"
          >
            {submitting ? <Typing className="h-5 w-6 text-white!" /> : <><Truck size={16} /> Ship order</>}
          </button>
        </div>
      }
    >
        <div className="space-y-4">
          <div className="rounded-sm bg-slate-50 p-3 text-sm">
            <p className="font-medium text-slate-900">{address?.recipientName || 'Customer'} · {address?.recipientPhone || '—'}</p>
            <p className="mt-0.5 text-slate-600">
              {[address?.addressLine1, address?.addressLine2, address?.ward, address?.district, address?.city].filter(Boolean).join(', ') || '—'}
            </p>
            {address?.deliveryNote && <p className="mt-1 text-xs text-slate-500">Note: {address.deliveryNote}</p>}
            <p className="mt-2 text-xs text-slate-600">
              {paymentLabel(order)} · <strong className="text-slate-900">{formatMoney((order.sellerTotals ?? order.totals).total)}</strong>
            </p>
          </div>

          <div>
            <div className="mb-2 flex items-center justify-between gap-2">
              <p className="text-xs font-semibold text-slate-700">Tick each item as you pack it</p>
              <label className="inline-flex cursor-pointer items-center gap-1.5 text-xs font-medium text-slate-600">
                <input
                  type="checkbox"
                  checked={allPacked}
                  onChange={(event) => toggleSelectAll(event.target.checked)}
                  className="h-4 w-4 rounded-sm border-slate-300 text-emerald-600 focus:ring-emerald-500"
                />
                Select all
              </label>
            </div>
            <ul className="divide-y divide-slate-100 rounded-sm border border-slate-200">
              {order.items.map((item, index) => (
                <li key={`${item.productId}:${item.variantId ?? ''}:${index}`}>
                  <label className="flex cursor-pointer items-center gap-3 px-3 py-2.5">
                    <input
                      type="checkbox"
                      checked={Boolean(packed[index])}
                      onChange={(event) => setPacked((current) => ({ ...current, [index]: event.target.checked }))}
                      className="h-4 w-4 rounded-sm border-slate-300 text-emerald-600 focus:ring-emerald-500"
                    />
                    <OrderProductImage imageUrl={item.imageUrl} alt={item.name} className="h-10 w-10" />
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm text-slate-800">{item.name}</span>
                      <span className="text-xs text-slate-500">{item.sku}</span>
                    </span>
                    <span className="text-sm font-semibold text-slate-900">× {item.quantity}</span>
                  </label>
                </li>
              ))}
            </ul>
          </div>

          {(companies === null || companies.length > 0) && (
            <div>
              <p className="mb-2 text-xs font-semibold text-slate-700">Delivery company <span className="text-red-600">*</span></p>
              <CheckoutDeliveryCompanySelect
                companies={companies ?? []}
                selectedId={deliveryCompanyId}
                loading={companies === null}
                error=""
                onSelect={setDeliveryCompanyId}
              />
            </div>
          )}

          <label className="block">
            <span className="mb-1 block text-xs font-semibold text-slate-700">Waybill No <span className="text-red-600">*</span></span>
            <input
              value={wayBillNo}
              onChange={(event) => setWayBillNo(event.target.value)}
              maxLength={128}
              disabled={Boolean(order.wayBillNo)}
              placeholder="e.g. YGN9125345TKI/AAF362660"
              className="w-full rounded-sm border border-slate-300 px-3 py-2 text-sm outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 disabled:bg-slate-50"
            />
            {order.wayBillNo && <span className="mt-1 block text-xs text-slate-500">This order already has a waybill.</span>}
          </label>

          {error && <p className="rounded-sm bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}
        </div>
    </ModalDrawer>
  )
}

const StaffShopOrdersPage = () => {
  const user = useAppSelector((state) => state.auth.user)
  const isStaff = isShopStaffUser(user)
  const [searchParams, setSearchParams] = useSearchParams()
  const focusOrderId = searchParams.get('order')

  const [shops, setShops] = useState<StaffShop[]>([])
  const [shopId, setShopId] = useState('')
  const [tab, setTab] = useState<StaffShopOrderStatus>('to-ship')
  const [orders, setOrders] = useState<StaffShopOrder[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const [shipping, setShipping] = useState<StaffShopOrder | null>(null)
  const [page, setPage] = useState(1)
  const [rowsPerPage, setRowsPerPage] = useState(PAGE_SIZE)
  const [counts, setCounts] = useState<Record<StaffShopOrderStatus, number>>({
    'to-ship': 0,
    shipped: 0,
  })

  useEffect(() => { setPage(1) }, [shopId, tab])

  const totalPages = Math.max(1, Math.ceil(orders.length / rowsPerPage))
  const safePage = Math.min(page, totalPages)
  const pagedOrders = orders.slice((safePage - 1) * rowsPerPage, safePage * rowsPerPage)

  useEffect(() => {
    if (!isStaff) return
    let cancelled = false
    staffShopOrdersApi.staffShops()
      .then((next) => {
        if (cancelled) return
        setShops(next)
        setShopId((current) => current || next[0]?.shopId || '')
      })
      .catch((err) => { if (!cancelled) setError(errorMessage(err, 'Unable to load your shops.')) })
    return () => { cancelled = true }
  }, [isStaff])

  const load = useCallback(async () => {
    if (!shopId) return
    setLoading(true)
    setError('')
    try {
      const [toShip, shipped] = await Promise.all([
        staffShopOrdersApi.list(shopId, 'to-ship'),
        staffShopOrdersApi.list(shopId, 'shipped'),
      ])
      setOrders(tab === 'to-ship' ? toShip : shipped)
      setCounts({ 'to-ship': toShip.length, shipped: shipped.length })
    } catch (err) {
      setOrders([])
      setCounts({ 'to-ship': 0, shipped: 0 })
      setError(errorMessage(err, 'Unable to load shop orders.'))
    } finally {
      setLoading(false)
    }
  }, [shopId, tab])

  useEffect(() => { void load() }, [load])

  // Opened from checkout success: jump straight to that order's ship form.
  useEffect(() => {
    if (!focusOrderId || tab !== 'to-ship' || !shopId) return
    const match = orders.find((order) => order.orderId === focusOrderId)
    if (match) {
      setShipping(match)
      setSearchParams({}, { replace: true })
    }
  }, [focusOrderId, orders, tab, shopId, setSearchParams])

  const shopName = useMemo(() => shops.find((shop) => shop.shopId === shopId)?.shopName ?? '', [shops, shopId])

  if (!isStaff) {
    return (
      <div className="rounded-sm border border-slate-100 bg-white p-8 text-center shadow-sm">
        <Store className="mx-auto h-8 w-8 text-slate-300" />
        <p className="mt-3 text-sm font-semibold text-slate-800">Shop Orders is for shop staff</p>
        <p className="mt-1 text-xs text-slate-500">Ask your shop owner to add you as staff to ship orders.</p>
      </div>
    )
  }

  return (
    <div className="rounded-sm border border-slate-100 bg-white shadow-sm">
      <div className="flex flex-col gap-3 border-b border-slate-100 p-5 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-lg font-semibold text-slate-900">Shop Orders</h1>
          <p className="text-xs text-slate-500">Pack and ship orders for {shopName || 'your shop'}.</p>
        </div>
        <div className="flex items-center gap-2">
          {shops.length > 1 && (
            <select
              value={shopId}
              onChange={(event) => setShopId(event.target.value)}
              className="rounded-sm border border-slate-200 px-3 py-2 text-sm outline-none focus:border-emerald-500"
            >
              {shops.map((shop) => <option key={shop.shopId} value={shop.shopId}>{shop.shopName}</option>)}
            </select>
          )}
          <button
            type="button"
            onClick={() => void load()}
            disabled={loading || !shopId}
            className="inline-flex items-center gap-2 rounded-sm border border-slate-200 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50"
          >
            <RefreshCw size={15} className={loading ? 'animate-spin' : undefined} /> Refresh
          </button>
        </div>
      </div>

      <div className="flex border-b border-slate-100 px-5">
        {TABS.map((entry) => {
          const active = tab === entry.key
          return (
            <button
              key={entry.key}
              type="button"
              onClick={() => setTab(entry.key)}
              className={`-mb-px inline-flex items-center gap-2 border-b-2 px-4 py-3 text-sm font-medium ${
                active ? 'border-[#008f51] text-[#008f51]' : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              {entry.label}
              <span
                className={`inline-flex h-5 min-w-5 items-center justify-center rounded-full px-1.5 text-[11px] font-semibold ${
                  active ? 'bg-[#008f51] text-white' : 'bg-slate-100 text-slate-600'
                }`}
              >
                {counts[entry.key]}
              </span>
            </button>
          )
        })}
      </div>

      {notice && <p className="mx-5 mt-4 rounded-sm bg-emerald-50 px-3 py-2 text-sm text-emerald-700">{notice}</p>}

      <div className="space-y-3 p-5">
        {loading ? (
          <div className="flex min-h-[40vh] items-center justify-center">
            <Typing className="w-8" />
          </div>
        ) : error ? (
          <p className="py-10 text-center text-sm text-red-600">{error}</p>
        ) : orders.length === 0 ? (
          <div className="py-12 text-center">
            <PackageCheck className="mx-auto h-8 w-8 text-slate-300" />
            <p className="mt-3 text-sm font-semibold text-slate-800">
              {tab === 'to-ship' ? 'Nothing to ship right now' : 'No shipped orders yet'}
            </p>
          </div>
        ) : (
          pagedOrders.map((order) => {
            const row = shopRow(order, shopId)
            const status = shopStatus(order, shopId)
            const address = order.deliveryAddress
            return (
              <article key={order.orderId} className="rounded-sm border border-slate-200 p-4">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div>
                    <p className="font-mono text-xs text-slate-500">{order.orderId}</p>
                    <p className="mt-0.5 text-sm font-semibold text-slate-900">
                      {address?.recipientName || 'Customer'}
                      {address?.city && <span className="font-normal text-slate-500"> · {address.city}</span>}
                    </p>
                    <p className="text-xs text-slate-500">{formatDate(order.placedAt || order.createdAt)}</p>
                  </div>
                  <span className={`rounded-full px-2.5 py-1 text-[11px] font-semibold ${
                    status === 'READY_FOR_FULFILLMENT' ? 'bg-amber-100 text-amber-700' : 'bg-emerald-100 text-emerald-700'
                  }`}
                  >
                    {STATUS_LABELS[status] ?? status}
                  </span>
                </div>

                <ul className="mt-3 space-y-1.5">
                  {order.items.map((item, index) => (
                    <li key={`${item.productId}:${index}`} className="flex items-center gap-2 text-sm text-slate-700">
                      <OrderProductImage imageUrl={item.imageUrl} alt={item.name} className="h-10 w-10" />
                      <span className="min-w-0 flex-1 truncate">{item.name}</span>
                      <span className="text-slate-500">× {item.quantity}</span>
                    </li>
                  ))}
                </ul>

                <div className="mt-3 flex flex-wrap items-center justify-between gap-2 border-t border-slate-100 pt-3">
                  <p className="text-sm text-slate-600">
                    {paymentLabel(order)} · <strong className="text-slate-900">{formatMoney((order.sellerTotals ?? order.totals).total)}</strong>
                  </p>
                  {tab === 'to-ship' ? (
                    <button
                      type="button"
                      onClick={() => setShipping(order)}
                      className="inline-flex items-center gap-2 rounded-sm bg-[#008f51] px-4 py-2 text-sm font-semibold text-white hover:bg-[#007a45]"
                    >
                      <Truck size={15} /> Ship
                    </button>
                  ) : (
                    <p className="text-xs text-slate-600">
                      Waybill <strong className="text-slate-900">{order.wayBillNo || '—'}</strong>
                      {row?.trackingNumber && <> · Tracking {row.trackingNumber}</>}
                      {row?.courierName && <> · {row.courierName}</>}
                      {row?.shippedAt && <> · {formatDate(row.shippedAt)}</>}
                    </p>
                  )}
                </div>
              </article>
            )
          })
        )}
      </div>

      {!loading && !error && orders.length > 0 && (
        <DataTablePagination
          page={safePage}
          totalPages={totalPages}
          rowsPerPage={rowsPerPage}
          totalItems={orders.length}
          itemLabel="orders"
          rowsPerPageOptions={[5, 10, 20]}
          onPageChange={setPage}
          onRowsPerPageChange={(value) => {
            setRowsPerPage(value)
            setPage(1)
          }}
        />
      )}

      {shipping && (
        <ShipOrderModal
          order={shipping}
          shopId={shopId}
          onClose={() => setShipping(null)}
          onShipped={(orderId) => {
            setShipping(null)
            setOrders((current) => current.filter((order) => order.orderId !== orderId))
            setCounts((current) => ({
              'to-ship': Math.max(0, current['to-ship'] - 1),
              shipped: current.shipped + 1,
            }))
            setNotice(`Order ${orderId.slice(0, 8)} shipped. It now appears under Shipped.`)
          }}
        />
      )}
    </div>
  )
}

export default StaffShopOrdersPage
