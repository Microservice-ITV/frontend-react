import { useMemo, useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { Eye, Plus, RefreshCw } from 'lucide-react'
import DataTable, { type DataTableColumn } from '@/components/ui/DataTable'
import FilterBar from '@/components/ui/FilterBar'
import ModalDrawer from '@/components/ui/ModalDrawer'
import { notifyDashboardMenuBadgesChanged } from '@/features/dashboard/dashboardMenuBadges'
import { PurchaseOrderStatusBadge } from '../components/PurchaseBadges'
import PurchaseOrderDetailsPanel from '../components/PurchaseOrderDetailsPanel'
import { purchasePaths, type PurchaseAreaBase } from '../config/purchasePaths'
import {
  approveButtonClass,
  cancelButtonClass,
  detailsButtonClass,
  primaryButtonClass,
  purchaseTabClass,
  secondaryButtonClass,
} from '../config/purchaseUiClasses'
import { purchaseApi, purchaseErrorMessage } from '../api/purchaseApi'
import { usePurchaseOrders } from '../hooks/usePurchaseData'
import {
  PURCHASE_ORDER_STATUS_LABELS,
  type PurchaseOrder,
  type PurchaseOrderStatus,
} from '../types/purchaseTypes'
import { downloadPurchaseOrderAttachment } from '../utils/downloadPurchaseOrderAttachment'
import { orderProductPreview } from '../utils/orderProductPreview'

const NEEDS_ACTION_STATUSES = new Set<PurchaseOrderStatus>([
  'AWAITING_SELLER_RECEIPT',
  'APPROVED',
  'ORDERED',
  'LOW_STOCK',
  'RESTOCK_REQUESTED',
  'RESTOCK_APPROVED',
])

const HISTORY_STATUSES = new Set<PurchaseOrderStatus>(['RECEIVED', 'CANCELLED', 'CLOSED'])

const supplierPurchaseOrderHref = (newOrderPath: string, row: PurchaseOrder) => {
  const lines = (row.items ?? [])
    .filter((item) => item.productId)
    .map((item) => `${item.productId}:${item.quantity}`)
    .join(',')
  const params = new URLSearchParams({
    kind: 'supplier',
    warehouse_id: row.warehouseId,
    ...(lines ? { lines } : {}),
  })
  return `${newOrderPath}?${params.toString()}`
}

type ViewTab = 'all' | 'action' | 'history'

const SellerWarehouseOrdersPage = ({ base }: { base: PurchaseAreaBase }) => {
  const paths = purchasePaths(base)
  const location = useLocation()
  const locationMessage =
    typeof (location.state as { message?: string } | null)?.message === 'string'
      ? (location.state as { message: string }).message
      : null

  const [tab, setTab] = useState<ViewTab>('all')
  const [status, setStatus] = useState<PurchaseOrderStatus | ''>('')
  const [search, setSearch] = useState('')
  const [banner, setBanner] = useState<string | null>(locationMessage)
  const { orders, loading, error, reload } = usePurchaseOrders({ limit: 500 })

  const [details, setDetails] = useState<PurchaseOrder | null>(null)
  const [detailsLoading, setDetailsLoading] = useState(false)
  const [detailsError, setDetailsError] = useState<string | null>(null)
  const [feedback, setFeedback] = useState<string | null>(null)
  const [receivingId, setReceivingId] = useState<string | null>(null)

  const warehouseOrders = useMemo(
    () => orders.filter((order) => order.orderKind === 'WAREHOUSE'),
    [orders],
  )

  const actionCount = useMemo(
    () => warehouseOrders.filter((order) => NEEDS_ACTION_STATUSES.has(order.status)).length,
    [warehouseOrders],
  )

  const term = search.trim().toLowerCase()
  const rows = warehouseOrders.filter((order) => {
    if (tab === 'action' && !NEEDS_ACTION_STATUSES.has(order.status)) return false
    if (tab === 'history' && !HISTORY_STATUSES.has(order.status)) return false
    if (status && order.status !== status) return false
    if (!term) return true
    const haystack = [
      order.orderNumber,
      order.warehouse?.name,
      PURCHASE_ORDER_STATUS_LABELS[order.status],
      ...(order.items ?? []).map((item) => item.productName ?? item.productId),
    ]
      .filter(Boolean)
      .join(' ')
      .toLowerCase()
    return haystack.includes(term)
  })

  const openDetails = async (id: string) => {
    setDetailsLoading(true)
    setDetailsError(null)
    try {
      const response = await purchaseApi.getPurchaseOrder(id)
      setDetails(response.data?.data ?? null)
    } catch (err) {
      setDetailsError(purchaseErrorMessage(err))
    } finally {
      setDetailsLoading(false)
    }
  }

  const receiveOrder = async (id: string) => {
    setFeedback(null)
    setBanner(null)
    setReceivingId(id)
    try {
      await purchaseApi.sellerReceiveDelivery(id)
      await reload()
      notifyDashboardMenuBadgesChanged()
      if (details?.id === id) await openDetails(id)
    } catch (err) {
      setFeedback(purchaseErrorMessage(err))
    } finally {
      setReceivingId(null)
    }
  }

  const changeStatus = async (id: string, next: PurchaseOrderStatus) => {
    setFeedback(null)
    try {
      await purchaseApi.updatePurchaseOrderStatus(id, next)
      await reload()
      notifyDashboardMenuBadgesChanged()
      if (details?.id === id) await openDetails(id)
    } catch (err) {
      setFeedback(purchaseErrorMessage(err))
    }
  }

  const columns: Array<DataTableColumn<PurchaseOrder>> = [
    {
      key: 'orderNumber',
      header: 'Request',
      sortValue: (row) => row.orderNumber,
      render: (row) => (
        <div>
          <p className="whitespace-nowrap font-medium text-slate-900">{row.orderNumber}</p>
          <p className="truncate text-xs text-slate-400">
            {(row.items ?? []).length} product{(row.items ?? []).length === 1 ? '' : 's'}
          </p>
        </div>
      ),
    },
    {
      key: 'products',
      header: 'Products',
      render: (row) => {
        const preview = orderProductPreview(row.items)
        if (!preview) return <span className="text-xs text-slate-400">—</span>
        return <span className="text-xs text-slate-600">{preview}</span>
      },
    },
    {
      key: 'status',
      header: 'Status',
      width: '160px',
      sortValue: (row) => row.status,
      render: (row) => <PurchaseOrderStatusBadge status={row.status} />,
    },
    {
      key: 'createdAt',
      header: 'Requested',
      width: '110px',
      sortValue: (row) => row.createdAt,
      render: (row) => (
        <span className="text-xs text-slate-500">
          {new Date(row.createdAt).toLocaleDateString()}
        </span>
      ),
    },
    {
      key: 'actions',
      header: '',
      align: 'right',
      width: '320px',
      render: (row) => {
        const busy = receivingId === row.id
        const canReceive =
          row.status === 'AWAITING_SELLER_RECEIPT' ||
          row.status === 'APPROVED' ||
          row.status === 'ORDERED'
        const canCancel =
          row.status === 'LOW_STOCK' ||
          row.status === 'PENDING_APPROVAL' ||
          row.status === 'PENDING' ||
          row.status === 'RESTOCK_REQUESTED' ||
          row.status === 'RESTOCK_APPROVED'
        return (
          <div className="flex flex-nowrap items-center justify-end gap-1.5">
            <button
              type="button"
              className={detailsButtonClass}
              onClick={() => void openDetails(row.id)}
            >
              <Eye size={13} />
              Details
            </button>
            {canReceive && (
              <button
                type="button"
                className={approveButtonClass}
                disabled={busy}
                onClick={() => void receiveOrder(row.id)}
              >
                {busy ? '…' : 'Receive'}
              </button>
            )}
            {row.status === 'RESTOCK_REQUESTED' && (
              <button
                type="button"
                className={approveButtonClass}
                onClick={() => void changeStatus(row.id, 'RESTOCK_APPROVED')}
              >
                Approve restock
              </button>
            )}
            {(row.status === 'LOW_STOCK' || row.status === 'RESTOCK_APPROVED') && (
              <Link
                to={supplierPurchaseOrderHref(paths.newOrder, row)}
                className={approveButtonClass}
              >
                Purchase order
              </Link>
            )}
            {canCancel && (
              <button
                type="button"
                className={cancelButtonClass}
                onClick={() => void changeStatus(row.id, 'CANCELLED')}
              >
                Cancel
              </button>
            )}
          </div>
        )
      },
    },
  ]

  return (
    <div className="space-y-4">
      <nav className="text-xs text-slate-500">
        <Link to={paths.root} className="hover:text-slate-700">
          Warehouse
        </Link>{' '}
        <span className="mx-1">/</span>
        <span className="text-slate-700">Orders from warehouse</span>
      </nav>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Orders from warehouse</h1>
          <p className="text-sm text-slate-500">
            Track warehouse stock requests. Needs action covers receive into shop stock, or create a
            supplier purchase order when the warehouse is out of stock.
          </p>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <button
            type="button"
            className={secondaryButtonClass}
            disabled={loading}
            onClick={() => void reload()}
          >
            <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
            Refresh
          </button>
          <Link to={paths.warehouseOrder} className={primaryButtonClass}>
            <Plus size={16} />
            New request
          </Link>
        </div>
      </div>

      {banner && (
        <div className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800">
          {banner}
        </div>
      )}

      <div className="flex flex-wrap gap-2">
        <button type="button" className={purchaseTabClass(tab === 'all')} onClick={() => setTab('all')}>
          All
        </button>
        <button type="button" className={purchaseTabClass(tab === 'action')} onClick={() => setTab('action')}>
          Needs action
          {actionCount > 0 && (
            <span
              className={`min-w-[1.25rem] rounded-full px-1.5 py-0.5 text-center text-[11px] font-semibold leading-none ${
                tab === 'action' ? 'bg-white/20 text-white' : 'bg-[var(--dni-primary)] text-white'
              }`}
            >
              {actionCount}
            </span>
          )}
        </button>
        <button
          type="button"
          className={purchaseTabClass(tab === 'history')}
          onClick={() => setTab('history')}
        >
          History
        </button>
      </div>

      {feedback && <p className="text-sm text-red-600">{feedback}</p>}

      <FilterBar
        search={{
          value: search,
          onChange: setSearch,
          placeholder: 'Search order number or product…',
        }}
        selects={[
          {
            key: 'status',
            label: 'Status',
            value: status,
            allLabel: 'All statuses',
            onChange: (value) => setStatus(value as PurchaseOrderStatus | ''),
            options: [
              { value: 'PENDING_APPROVAL', label: 'Pending approval' },
              { value: 'AWAITING_SELLER_RECEIPT', label: 'Awaiting seller receipt' },
              { value: 'RECEIVED', label: 'Received' },
              { value: 'LOW_STOCK', label: 'Low stock' },
              { value: 'RESTOCK_REQUESTED', label: 'Restock requested' },
              { value: 'RESTOCK_APPROVED', label: 'Restock approved' },
              { value: 'CANCELLED', label: 'Cancelled' },
            ],
          },
        ]}
      />

      <DataTable<PurchaseOrder>
        columns={columns}
        rows={rows}
        rowKey={(row) => row.id}
        loading={loading}
        error={error}
        emptyMessage="No warehouse orders yet. Create a request to pull stock from a warehouse."
        itemLabel="orders"
        minWidth="980px"
        fixedLayout
      />

      {(details || detailsLoading || detailsError) && (
        <ModalDrawer
          open
          onClose={() => {
            setDetails(null)
            setDetailsError(null)
          }}
          title={details?.orderNumber ?? 'Order details'}
          subtitle="Order from warehouse"
          size="md"
          fitContent
        >
          <PurchaseOrderDetailsPanel
            order={details}
            loading={detailsLoading}
            error={detailsError}
            onDownloadAttachment={(orderId, attachment) =>
              void downloadPurchaseOrderAttachment(orderId, attachment)
            }
          />
        </ModalDrawer>
      )}
    </div>
  )
}

export default SellerWarehouseOrdersPage
