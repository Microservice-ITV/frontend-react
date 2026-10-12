import { useState, type ReactNode } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { Eye, FileText, Plus, RefreshCw } from 'lucide-react'
import DataTable, { type DataTableColumn } from '@/components/ui/DataTable'
import FilterBar from '@/components/ui/FilterBar'
import ModalDrawer from '@/components/ui/ModalDrawer'
import StatusBadge from '@/components/ui/StatusBadge'
import {
  PurchaseOrderStatusBadge,
  PURCHASE_ORDER_STATUS_TONES,
} from '../components/PurchaseBadges'
import { purchasePaths, type PurchaseAreaBase } from '../config/purchasePaths'
import { purchaseApi, purchaseErrorMessage } from '../api/purchaseApi'
import { notifyOrderedReceiptCountChanged } from '../orderedReceiptCount'
import { usePurchaseOrders } from '../hooks/usePurchaseData'
import {
  ADDITIONAL_COST_CATEGORY_LABELS,
  COST_ALLOCATION_METHOD_LABELS,
  COST_STATUS_LABELS,
  formatMoney,
  PURCHASE_ORDER_STATUS_LABELS,
  type PurchaseOrder,
  type PurchaseOrderAttachment,
  type PurchaseOrderStatus,
} from '../types/purchaseTypes'

const primaryButtonClass =
  'inline-flex items-center justify-center gap-1.5 rounded-lg bg-[var(--dni-primary)] px-4 py-2 text-sm font-medium text-white disabled:opacity-50'
const secondaryButtonClass =
  'inline-flex cursor-pointer items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50'
const actionButtonClass =
  'inline-flex shrink-0 cursor-pointer items-center gap-1 whitespace-nowrap rounded-md px-2.5 py-1 text-xs font-medium disabled:opacity-40'
const detailsButtonClass = `${actionButtonClass} border border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100`
const submitButtonClass = `${actionButtonClass} bg-indigo-600 text-white hover:bg-indigo-700`
const approveButtonClass = `${actionButtonClass} bg-emerald-600 text-white hover:bg-emerald-700`
const orderedButtonClass = `${actionButtonClass} bg-sky-600 text-white hover:bg-sky-700`
const closeButtonClass = `${actionButtonClass} bg-amber-500 text-white hover:bg-amber-600`
const cancelButtonClass = `${actionButtonClass} bg-red-600 text-white hover:bg-red-700`

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

  const term = search.trim().toLowerCase()
  const rows = term
    ? orders.filter((order) =>
        `${order.orderNumber} ${order.supplier?.name ?? ''}`
          .toLowerCase()
          .includes(term),
      )
    : orders

  const changeStatus = async (id: string, next: PurchaseOrderStatus) => {
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

  const downloadAttachment = async (orderId: string, attachment: PurchaseOrderAttachment) => {
    const response = await purchaseApi.downloadPurchaseOrderAttachment(orderId, attachment.id)
    const blob = new Blob([response.data], { type: attachment.mimeType || 'application/octet-stream' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = attachment.fileName
    link.click()
    URL.revokeObjectURL(url)
  }

  const columns: Array<DataTableColumn<PurchaseOrder>> = [
    {
      key: 'orderNumber',
      header: 'Order',
      sortValue: (row) => row.orderNumber,
      render: (row) => (
        <div>
          <p className="whitespace-nowrap font-medium text-slate-900">{row.orderNumber}</p>
          <p className="truncate text-xs text-slate-400">{row.supplier?.name ?? '—'}</p>
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
      width: platform ? '320px' : '110px',
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
          {platform && (row.status === 'PENDING_APPROVAL' || row.status === 'PENDING') && (
            <button
              type="button"
              className={approveButtonClass}
              onClick={() => void changeStatus(row.id, 'APPROVED')}
            >
              Approve
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
          {platform &&
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
            Order stock from your suppliers across every warehouse.
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
              { value: 'PARTIALLY_RECEIVED', label: 'Partially received' },
              { value: 'RECEIVED', label: 'Received' },
              { value: 'CLOSED', label: 'Closed' },
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
          {detailsLoading && <p className="text-sm text-slate-500">Loading…</p>}
          {detailsError && <p className="text-sm text-red-600">{detailsError}</p>}
          <div className="space-y-5">
            <section className="space-y-2">
              <h3 className="text-sm font-semibold text-slate-800">Order & supplier details</h3>
              <div className="grid grid-cols-2 gap-3">
                <DetailCell label="Status" value={<PurchaseOrderStatusBadge status={details.status} size="md" />} />
                <DetailCell
                  label="Order date"
                  value={
                    details.orderDate
                      ? new Date(details.orderDate).toLocaleDateString()
                      : new Date(details.createdAt).toLocaleDateString()
                  }
                />
                <DetailCell label="Supplier" value={details.supplier?.name ?? '—'} />
                <DetailCell label="Supplier contact" value={details.supplierContact || '—'} />
                <DetailCell label="Currency" value={details.currency} />
                <DetailCell label="Exchange rate" value={details.exchangeRate} />
                <DetailCell
                  label="Expected arrival"
                  value={
                    details.expectedAt
                      ? new Date(details.expectedAt).toLocaleDateString()
                      : '—'
                  }
                />
                <DetailCell label="Payment terms" value={details.paymentTerms || '—'} />
                <DetailCell label="Destination warehouse" value={details.warehouse?.name ?? '—'} />
                <DetailCell label="Delivery terms" value={details.deliveryTerms || '—'} />
              </div>
            </section>

            <section className="space-y-2">
              <h3 className="text-sm font-semibold text-slate-800">Notes</h3>
              <p className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700">
                {details.notes?.trim() ? details.notes : 'No notes'}
              </p>
            </section>

            <section className="space-y-2">
              <h3 className="text-sm font-semibold text-slate-800">Attachments</h3>
              {(details.attachments?.length ?? 0) > 0 ? (
                <ul className="space-y-1">
                  {details.attachments?.map((file) => (
                    <li key={file.id}>
                      <button
                        type="button"
                        className="inline-flex items-center gap-2 text-sm font-medium text-sky-700 hover:text-sky-800"
                        onClick={() => void downloadAttachment(details.id, file)}
                      >
                        <FileText size={14} />
                        {file.fileName}
                        <span className="text-xs font-normal text-slate-400">
                          {Math.max(1, Math.round(file.sizeBytes / 1024))} KB
                        </span>
                      </button>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm text-slate-500">No attachments</p>
              )}
            </section>

            <section className="space-y-2">
              <h3 className="text-sm font-semibold text-slate-800">Products line items</h3>
              <div className="overflow-x-auto rounded-lg border border-slate-200">
                <table className="w-full text-xs">
                  <thead className="bg-slate-50 text-left text-[11px] uppercase tracking-wide text-slate-500">
                    <tr>
                      <th className="px-3 py-2">Product</th>
                      <th className="px-3 py-2 text-right">Qty</th>
                      <th className="px-3 py-2 text-right">Unit price</th>
                      <th className="px-3 py-2 text-right">Discount</th>
                      <th className="px-3 py-2 text-right">Net amount</th>
                      <th className="px-3 py-2 text-right">Weight/unit</th>
                      <th className="px-3 py-2 text-right">Volume/unit</th>
                    </tr>
                  </thead>
                  <tbody>
                    {details.items?.map((item) => (
                      <tr key={item.id} className="border-t border-slate-100">
                        <td className="px-3 py-2">
                          <span className="font-medium text-slate-800">
                            {item.productName ?? item.productId}
                          </span>
                          {item.sku && (
                            <span className="ml-1 text-slate-400">({item.sku})</span>
                          )}
                        </td>
                        <td className="px-3 py-2 text-right text-slate-700">{item.quantity}</td>
                        <td className="px-3 py-2 text-right text-slate-700">
                          {formatMoney(item.unitCost)}
                        </td>
                        <td className="px-3 py-2 text-right text-slate-500">
                          {formatMoney(item.discountAmount)}
                        </td>
                        <td className="px-3 py-2 text-right font-medium text-slate-800">
                          {formatMoney(item.lineTotal)}
                        </td>
                        <td className="px-3 py-2 text-right text-slate-500">{item.weightPerUnit}</td>
                        <td className="px-3 py-2 text-right text-slate-500">{item.volumePerUnit}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>

            <section className="space-y-2">
              <h3 className="text-sm font-semibold text-slate-800">Delivery stages & charges</h3>
              {(details.deliveryStages?.length ?? 0) > 0 ? (
                <div className="overflow-x-auto rounded-lg border border-slate-200">
                  <table className="w-full text-xs">
                    <thead className="bg-slate-50 text-left text-[11px] uppercase tracking-wide text-slate-500">
                      <tr>
                        <th className="px-3 py-2">Route</th>
                        <th className="px-3 py-2">Carrier</th>
                        <th className="px-3 py-2 text-right">Charge fee</th>
                        <th className="px-3 py-2">Allocation</th>
                        <th className="px-3 py-2">Applicable products</th>
                      </tr>
                    </thead>
                    <tbody>
                      {details.deliveryStages?.map((stage) => (
                        <tr key={stage.id} className="border-t border-slate-100">
                          <td className="px-3 py-2 font-medium text-slate-800">{stage.name}</td>
                          <td className="px-3 py-2 text-slate-500">{stage.carrier ?? '—'}</td>
                          <td className="px-3 py-2 text-right text-slate-700">
                            {formatMoney(stage.feeAmount)}
                          </td>
                          <td className="px-3 py-2 text-slate-500">
                            {COST_ALLOCATION_METHOD_LABELS[stage.allocationMethod] ?? stage.allocationMethod}
                          </td>
                          <td className="px-3 py-2 text-slate-500">
                            {stage.applicableProductIds.length === 0
                              ? 'All products'
                              : stage.applicableProductIds
                                  .map(
                                    (productId) =>
                                      details.items?.find((item) => item.productId === productId)
                                        ?.productName ?? productId,
                                  )
                                  .join(', ')}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p className="text-sm text-slate-500">No delivery stages</p>
              )}
            </section>

            <section className="space-y-2">
              <h3 className="text-sm font-semibold text-slate-800">Additional costs</h3>
              {(details.additionalCosts?.length ?? 0) > 0 ? (
                <div className="overflow-x-auto rounded-lg border border-slate-200">
                  <table className="w-full text-xs">
                    <thead className="bg-slate-50 text-left text-[11px] uppercase tracking-wide text-slate-500">
                      <tr>
                        <th className="px-3 py-2">Cost item</th>
                        <th className="px-3 py-2">Category</th>
                        <th className="px-3 py-2 text-right">Amount</th>
                        <th className="px-3 py-2">Mode</th>
                        <th className="px-3 py-2">Allocation</th>
                      </tr>
                    </thead>
                    <tbody>
                      {details.additionalCosts?.map((cost) => (
                        <tr key={cost.id} className="border-t border-slate-100">
                          <td className="px-3 py-2 font-medium text-slate-800">{cost.name}</td>
                          <td className="px-3 py-2 text-slate-500">
                            {ADDITIONAL_COST_CATEGORY_LABELS[cost.category] ?? cost.category}
                          </td>
                          <td className="px-3 py-2 text-right text-slate-700">
                            {formatMoney(cost.amount)}
                          </td>
                          <td className="px-3 py-2 text-slate-500">
                            {COST_STATUS_LABELS[cost.status] ?? cost.status}
                          </td>
                          <td className="px-3 py-2 text-slate-500">
                            {COST_ALLOCATION_METHOD_LABELS[cost.allocationMethod] ?? cost.allocationMethod}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p className="text-sm text-slate-500">No additional costs</p>
              )}
            </section>

            <section className="space-y-2">
              <h3 className="text-sm font-semibold text-slate-800">Summary</h3>
              <div className="grid grid-cols-2 gap-3">
                <DetailCell label="Subtotal" value={formatMoney(details.subtotal)} />
                <DetailCell label="Delivery" value={formatMoney(details.shippingAmount)} />
                <DetailCell
                  label="Other costs"
                  value={formatMoney(
                    (details.additionalCosts ?? []).reduce(
                      (sum, cost) => sum + Number(cost.amount),
                      0,
                    ),
                  )}
                />
                <DetailCell label="Total" value={formatMoney(details.totalAmount)} />
              </div>
            </section>

            <section className="space-y-2">
              <h3 className="text-sm font-semibold text-slate-800">Status history</h3>
              {details.statusHistory && details.statusHistory.length > 0 ? (
                <ol className="space-y-2">
                  {details.statusHistory.map((entry) => (
                    <li key={entry.id} className="flex items-start gap-3">
                      <span className="mt-1 h-2 w-2 shrink-0 rounded-full bg-[var(--dni-primary)]" />
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <StatusBadge
                            label={PURCHASE_ORDER_STATUS_LABELS[entry.status] ?? entry.status}
                            tone={PURCHASE_ORDER_STATUS_TONES[entry.status] ?? 'neutral'}
                            size="sm"
                          />
                          <span className="text-xs text-slate-400">
                            {new Date(entry.createdAt).toLocaleString()}
                          </span>
                        </div>
                        {entry.note && (
                          <p className="text-xs text-slate-500">{entry.note}</p>
                        )}
                        {entry.changedBy && (
                          <p className="text-xs text-slate-400">by {entry.changedBy}</p>
                        )}
                      </div>
                    </li>
                  ))}
                </ol>
              ) : (
                <p className="text-sm text-slate-500">No status changes recorded yet.</p>
              )}
            </section>
          </div>
        </ModalDrawer>
      )}
    </div>
  )
}

const DetailCell = ({
  label,
  value,
}: {
  label: string
  value: ReactNode
}) => (
  <div className="rounded-lg border border-slate-200 bg-white px-3 py-2">
    <p className="text-[11px] uppercase tracking-wide text-slate-400">{label}</p>
    <p className="text-sm text-slate-700">{value}</p>
  </div>
)

export default PurchaseOrdersPage