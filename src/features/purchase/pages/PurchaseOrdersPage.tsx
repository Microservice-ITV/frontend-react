import { useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { Eye, Plus, RefreshCw } from 'lucide-react'
import DataTable, { type DataTableColumn } from '@/components/ui/DataTable'
import FilterBar from '@/components/ui/FilterBar'
import ModalDrawer from '@/components/ui/ModalDrawer'
import { PurchaseOrderStatusBadge } from '../components/PurchaseBadges'
import PurchaseOrderDetailsPanel from '../components/PurchaseOrderDetailsPanel'
import { purchasePaths, type PurchaseAreaBase } from '../config/purchasePaths'
import {
  approveButtonClass,
  cancelButtonClass,
  closeButtonClass,
  detailsButtonClass,
  orderedButtonClass,
  primaryButtonClass,
  secondaryButtonClass,
  submitButtonClass,
} from '../config/purchaseUiClasses'
import { purchaseApi, purchaseErrorMessage } from '../api/purchaseApi'
import { notifyOrderedReceiptCountChanged } from '../orderedReceiptCount'
import { usePurchaseOrders } from '../hooks/usePurchaseData'
import {
  formatMoney,
  type PurchaseOrder,
  type PurchaseOrderStatus,
} from '../types/purchaseTypes'
import { downloadPurchaseOrderAttachment } from '../utils/downloadPurchaseOrderAttachment'

const numberParam = (value: string | null): number => {
  const parsed = Number(value ?? '')
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 0
}

export type PurchaseOrdersPageProps = {
  base: PurchaseAreaBase
  platform?: boolean
}

const PurchaseOrdersPage = ({ base, platform = false }: PurchaseOrdersPageProps) => {
  const paths = purchasePaths(base)
  const warehouseManagerMode = base === '/warehouse-manager'
  /** Warehouse managers can view/process orders but must not cancel seller POs. */
  const canCancelOrders = platform && !warehouseManagerMode
  const [searchParams] = useSearchParams()
  const [status, setStatus] = useState<PurchaseOrderStatus | ''>('')
  const [search, setSearch] = useState('')

  // Dynamic entry-point routing: parse query params so the new PO page can be
  // initialized from a supplier profile, low-stock reorder, checkout, etc.
  const supplierFromParam = searchParams.get('supplier_id') ?? ''
  const warehouseFromParam = searchParams.get('warehouse_id') ?? ''
  const deliveryFeeFromParam =
    numberParam(searchParams.get('delivery_fee')) ||
    numberParam(searchParams.get('shipping_amount'))
  const sourceRoute =
    searchParams.get('source_route') ?? searchParams.get('origin_route') ?? ''

  const newOrderHref = `${paths.newOrder}${
    supplierFromParam || warehouseFromParam || deliveryFeeFromParam > 0 || sourceRoute
      ? `?${new URLSearchParams({
          ...(supplierFromParam ? { supplier_id: supplierFromParam } : {}),
          ...(warehouseFromParam ? { warehouse_id: warehouseFromParam } : {}),
          ...(deliveryFeeFromParam > 0 ? { delivery_fee: String(deliveryFeeFromParam) } : {}),
          ...(sourceRoute ? { source_route: sourceRoute } : {}),
        }).toString()}`
      : ''
  }`

  const { orders, loading, error, reload } = usePurchaseOrders({ status })

  const [details, setDetails] = useState<PurchaseOrder | null>(null)
  const [detailsLoading, setDetailsLoading] = useState(false)
  const [detailsError, setDetailsError] = useState<string | null>(null)
  const [feedback, setFeedback] = useState<string | null>(null)
  // Warehouse→seller requests live on dedicated pages; PO list is supplier orders only.
  const scopedOrders = orders.filter((order) => order.orderKind !== 'WAREHOUSE')

  const term = search.trim().toLowerCase()
  const rows = term
    ? scopedOrders.filter((order) =>
        `${order.orderNumber} ${order.supplier?.name ?? ''} ${order.orderKind ?? ''}`
          .toLowerCase()
          .includes(term),
      )
    : scopedOrders

  const changeStatus = async (id: string, next: PurchaseOrderStatus) => {
    if (next === 'CANCELLED' && !canCancelOrders) {
      setFeedback('Warehouse managers cannot cancel purchase orders.')
      return
    }
    setFeedback(null)
    try {
      await purchaseApi.updatePurchaseOrderStatus(id, next)
      await reload()
      notifyOrderedReceiptCountChanged()
      if (details?.id === id) await openDetails(id)
    } catch (err) {
      setFeedback(purchaseErrorMessage(err))
    }
  }

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

  const columns: Array<DataTableColumn<PurchaseOrder>> = [
    {
      key: 'orderNumber',
      header: 'Order',
      sortValue: (row) => row.orderNumber,
      render: (row) => (
        <div>
          <p className="whitespace-nowrap font-medium text-slate-900">{row.orderNumber}</p>
          <p className="truncate text-xs text-slate-400">
            {row.supplier?.name ?? 'Supplier order'}
          </p>
        </div>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      width: '150px',
      sortValue: (row) => row.status,
      render: (row) => <PurchaseOrderStatusBadge status={row.status} />,
    },
    {
      key: 'totalAmount',
      header: 'Total',
      align: 'right',
      width: '120px',
      sortValue: (row) => Number(row.totalAmount),
      render: (row) => (
        <span className="font-medium text-slate-700">{formatMoney(row.totalAmount)}</span>
      ),
    },
    {
      key: 'createdAt',
      header: 'Created',
      hideBelow: 'lg',
      width: '150px',
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
      width: platform ? '320px' : '280px',
      render: (row) => (
        <div className="flex flex-nowrap items-center justify-end gap-1.5">
          <button
            type="button"
            className={detailsButtonClass}
            onClick={() => void openDetails(row.id)}
          >
            <Eye size={13} />
            Details
          </button>
          {platform && row.status === 'DRAFT' && (
            <button
              type="button"
              className={submitButtonClass}
              onClick={() => void changeStatus(row.id, 'PENDING_APPROVAL')}
            >
              Submit for approval
            </button>
          )}
          {platform && row.status === 'APPROVED' && (
            <button
              type="button"
              className={orderedButtonClass}
              onClick={() => void changeStatus(row.id, 'ORDERED')}
            >
              Mark ordered
            </button>
          )}
          {platform &&
            (row.status === 'ORDERED' || row.status === 'PARTIALLY_RECEIVED') && (
            <button
              type="button"
              className={closeButtonClass}
              onClick={() => void changeStatus(row.id, 'CLOSED')}
            >
              Close
            </button>
          )}
          {canCancelOrders &&
            row.status !== 'CANCELLED' &&
            row.status !== 'CLOSED' &&
            row.status !== 'RECEIVED' && (
            <button
              type="button"
              className={cancelButtonClass}
              onClick={() => void changeStatus(row.id, 'CANCELLED')}
            >
              Cancel
            </button>
          )}
        </div>
      ),
    },
  ]

  return (
    <div className="space-y-4">
      <nav className="text-xs text-slate-500">
        <Link to={paths.root} className="hover:text-slate-700">
          Warehouse
        </Link>{' '}
        <span className="mx-1">/</span>
        <span className="text-slate-700">Purchase Orders</span>
      </nav>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Purchase Orders</h1>
          <p className="text-sm text-slate-500">
            {platform
              ? 'Track supplier purchase orders. Seller warehouse requests are under Request from seller.'
              : 'Supplier purchase orders with transit routes. Warehouse stock requests are under Orders from warehouse.'}
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
          {!platform && (
            <Link to={newOrderHref} className={primaryButtonClass}>
              <Plus size={16} />
              New purchase order
            </Link>
          )}
        </div>
      </div>

      {sourceRoute && (supplierFromParam || deliveryFeeFromParam > 0) && (
        <div className="rounded-lg border border-sky-200 bg-sky-50 px-3 py-2 text-sm text-sky-700">
          Opened from <span className="font-medium">{sourceRoute}</span> — the next order will be
          pre-filled for supplier <span className="font-medium">{supplierFromParam}</span>
          {deliveryFeeFromParam > 0 && (
            <>
              {' '}with delivery fee{' '}
              <span className="font-medium">{formatMoney(deliveryFeeFromParam)}</span>
            </>
          )}
          . Review the entries before submitting.
        </div>
      )}

      {feedback && <p className="text-sm text-red-600">{feedback}</p>}

      <FilterBar
        search={{
          value: search,
          onChange: setSearch,
          placeholder: 'Search order number or supplier…',
        }}
        selects={[
          {
            key: 'status',
            label: 'Status',
            value: status,
            allLabel: 'All statuses',
            onChange: (value) => setStatus(value as PurchaseOrderStatus | ''),
            options: [
              { value: 'DRAFT', label: 'Draft' },
              { value: 'PENDING_APPROVAL', label: 'Pending approval' },
              { value: 'PENDING', label: 'Pending' },
              { value: 'APPROVED', label: 'Approved' },
              { value: 'ORDERED', label: 'Ordered' },
              { value: 'DELIVERY_PICKED_UP', label: 'Delivery picked up' },
              { value: 'AWAITING_SELLER_RECEIPT', label: 'Awaiting seller receipt' },
              { value: 'SELLER_RECEIVED', label: 'Seller received' },
              { value: 'PARTIALLY_RECEIVED', label: 'Partially received' },
              { value: 'RECEIVED', label: 'Received' },
              { value: 'CLOSED', label: 'Closed' },
              { value: 'CANCELLED', label: 'Cancelled' },
              { value: 'LOW_STOCK', label: 'Low stock' },
              { value: 'RESTOCK_REQUESTED', label: 'Restock requested' },
              { value: 'RESTOCK_APPROVED', label: 'Restock approved' },
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
        emptyMessage="No purchase orders found."
        itemLabel="purchase orders"
        minWidth="980px"
        fixedLayout
      />

      {details && (
        <ModalDrawer
          open
          onClose={() => setDetails(null)}
          title={details.orderNumber}
          subtitle={
            details.supplier?.name
              ? `Supplier: ${details.supplier.name}`
              : undefined
          }
          size="xl"
        >
          <PurchaseOrderDetailsPanel
            order={details}
            loading={detailsLoading}
            error={detailsError}
            onDownloadAttachment={(orderId, file) =>
              void downloadPurchaseOrderAttachment(orderId, file)
            }
          />
        </ModalDrawer>
      )}
    </div>
  )
}

export default PurchaseOrdersPage