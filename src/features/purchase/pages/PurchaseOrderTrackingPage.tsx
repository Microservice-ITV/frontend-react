import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { RefreshCw } from 'lucide-react'
import DataTablePagination from '@/components/ui/DataTablePagination'
import FilterBar from '@/components/ui/FilterBar'
import { notifyDashboardMenuBadgesChanged } from '@/features/dashboard/dashboardMenuBadges'
import { purchaseApi, purchaseErrorMessage } from '../api/purchaseApi'
import PurchaseOrderRouteStatusDisplay from '../components/PurchaseOrderRouteStatusDisplay'
import { purchasePaths, type PurchaseAreaBase } from '../config/purchasePaths'
import { secondaryButtonClass } from '../config/purchaseUiClasses'
import { usePurchaseOrders } from '../hooks/usePurchaseData'
import type { PurchaseOrder, PurchaseOrderStatus } from '../types/purchaseTypes'

const TRACKING_STATUSES: PurchaseOrderStatus[] = [
  'IN_TRANSIT',
  'ORDERED',
  'ARRIVED',
  'DELIVERY_PICKED_UP',
  'AWAITING_WAREHOUSE_RECEIPT',
  'WAREHOUSE_RECEIVED',
  'SELLER_RECEIVED',
]

const nextArrivalLocation = (order: PurchaseOrder) => {
  const stops = [...(order.routeStops ?? [])].sort((a, b) => a.sequence - b.sequence)
  const leg = order.routeLegIndex ?? 0
  return stops[leg + 1]?.location ?? null
}

export type PurchaseOrderTrackingPageProps = {
  base: PurchaseAreaBase
}

const PurchaseOrderTrackingPage = ({ base }: PurchaseOrderTrackingPageProps) => {
  const paths = purchasePaths(base)
  const { orders, loading, error, reload } = usePurchaseOrders()
  const [busyId, setBusyId] = useState<string | null>(null)
  const [feedback, setFeedback] = useState<string | null>(null)
  const [spinKey, setSpinKey] = useState(0)
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState<PurchaseOrderStatus | ''>('')
  const [page, setPage] = useState(1)
  const [rowsPerPage, setRowsPerPage] = useState(10)

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase()
    return orders
      .filter((order) => order.orderKind === 'SUPPLIER')
      .filter((order) => TRACKING_STATUSES.includes(order.status))
      .filter((order) => (status ? order.status === status : true))
      .filter((order) => {
        if (!term) return true
        const route = (order.routeStops ?? []).map((stop) => stop.location).join(' ')
        return `${order.orderNumber} ${order.supplier?.name ?? ''} ${route} ${order.warehouse?.name ?? ''}`
          .toLowerCase()
          .includes(term)
      })
  }, [orders, search, status])

  const totalPages = Math.max(1, Math.ceil(filtered.length / rowsPerPage))

  useEffect(() => {
    setPage(1)
  }, [search, status, rowsPerPage])

  useEffect(() => {
    if (page > totalPages) setPage(totalPages)
  }, [page, totalPages])

  const pageRows = useMemo(() => {
    const start = (page - 1) * rowsPerPage
    return filtered.slice(start, start + rowsPerPage)
  }, [filtered, page, rowsPerPage])

  const refreshAll = () => {
    setSpinKey((key) => key + 1)
    void reload()
  }

  const markArrived = async (order: PurchaseOrder) => {
    const destination = nextArrivalLocation(order)
    setBusyId(order.id)
    setFeedback(null)
    try {
      const response = await purchaseApi.markPurchaseOrderRouteArrived(order.id)
      const updated = response.data?.data
      if (updated?.status === 'ARRIVED') {
        setFeedback(
          `${order.orderNumber} arrived at ${destination ?? 'the final stop'}. The delivery agent can now pick up.`,
        )
      } else {
        setFeedback(`${order.orderNumber} arrived at ${destination ?? 'the next stop'}.`)
      }
      await reload()
      notifyDashboardMenuBadgesChanged()
    } catch (err) {
      setFeedback(purchaseErrorMessage(err))
    } finally {
      setBusyId(null)
    }
  }

  return (
    <div className="space-y-4">
      <nav className="text-xs text-slate-500">
        <Link to={paths.root} className="hover:text-slate-700">
          Warehouse
        </Link>{' '}
        <span className="mx-1">/</span>
        <span className="text-slate-700">Purchase Order Tracking</span>
      </nav>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Purchase Order Tracking</h1>
          <p className="text-sm text-slate-500">
            Follow each transit stop with the same progress animation as checkout. Confirm arrival
            to advance the next leg.
          </p>
        </div>
        <button
          type="button"
          className={secondaryButtonClass}
          disabled={loading}
          onClick={refreshAll}
        >
          <RefreshCw
            key={spinKey}
            onAnimationIteration={() => setSpinKey(0)}
            size={16}
            className={loading || spinKey > 0 ? 'animate-spin' : ''}
          />
          Refresh
        </button>
      </div>

      {feedback && (
        <p
          className={`text-sm ${
            feedback.toLowerCase().includes('fail') || feedback.toLowerCase().includes('error')
              ? 'text-rose-700'
              : 'text-emerald-700'
          }`}
        >
          {feedback}
        </p>
      )}

      {error && <p className="text-sm text-rose-600">{error}</p>}

      <FilterBar
        search={{
          value: search,
          onChange: setSearch,
          placeholder: 'Search order number, supplier, warehouse, or route…',
        }}
        selects={[
          {
            key: 'status',
            label: 'Status',
            value: status,
            allLabel: 'All statuses',
            onChange: (value) => setStatus(value as PurchaseOrderStatus | ''),
            options: [
              { value: 'IN_TRANSIT', label: 'In transit' },
              { value: 'ORDERED', label: 'Ordered' },
              { value: 'ARRIVED', label: 'Arrived' },
              { value: 'DELIVERY_PICKED_UP', label: 'Delivery picked up' },
              { value: 'AWAITING_WAREHOUSE_RECEIPT', label: 'Awaiting warehouse receipt' },
              { value: 'WAREHOUSE_RECEIVED', label: 'Warehouse received' },
              { value: 'SELLER_RECEIVED', label: 'Seller received' },
            ],
          },
        ]}
      />

      {loading && filtered.length === 0 && (
        <p className="text-sm text-slate-500">Loading tracking…</p>
      )}

      {!loading && filtered.length === 0 && !error && (
        <div className="rounded-xl border border-dashed border-slate-200 bg-white px-5 py-10 text-center text-sm text-slate-500">
          {search.trim() || status
            ? 'No tracking orders match your search.'
            : 'No supplier orders are in transit yet.'}
        </div>
      )}

      {filtered.length > 0 && (
        <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
          <div className="space-y-6 p-4 sm:p-5">
            {pageRows.map((order) => (
              <PurchaseOrderRouteStatusDisplay
                key={order.id}
                order={order}
                busy={busyId === order.id}
                onRefresh={() => void reload()}
                onMarkArrived={() => void markArrived(order)}
              />
            ))}
          </div>
          <DataTablePagination
            page={page}
            totalPages={totalPages}
            rowsPerPage={rowsPerPage}
            totalItems={filtered.length}
            onPageChange={setPage}
            onRowsPerPageChange={(value) => {
              setRowsPerPage(value)
              setPage(1)
            }}
            itemLabel="orders"
          />
        </div>
      )}
    </div>
  )
}

export default PurchaseOrderTrackingPage
