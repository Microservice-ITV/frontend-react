import { useState, type ReactNode } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { Eye, Plus } from 'lucide-react'
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
import { usePurchaseOrders } from '../hooks/usePurchaseData'
import {
  formatMoney,
  PURCHASE_ORDER_STATUS_LABELS,
  type PurchaseOrder,
  type PurchaseOrderStatus,
} from '../types/purchaseTypes'

const primaryButtonClass =
  'inline-flex items-center justify-center rounded-lg bg-[var(--dni-primary)] px-4 py-2 text-sm font-medium text-white disabled:opacity-50'
const subtleButtonClass =
  'text-xs font-medium text-slate-500 hover:text-slate-700 disabled:opacity-40'

const numberParam = (value: string | null): number => {
  const parsed = Number(value ?? '')
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 0
}

export type PurchaseOrdersPageProps = {
  base: PurchaseAreaBase
  platform?: boolean
}

const PurchaseOrdersPage = ({ base }: PurchaseOrdersPageProps) => {
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
        <div className="min-w-0">
          <p className="font-medium text-slate-900">{row.orderNumber}</p>
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
      width: '320px',
      render: (row) => (
        <div className="flex items-center justify-end gap-3">
          <button
            type="button"
            className={subtleButtonClass}
            onClick={() => void openDetails(row.id)}
          >
            <span className="inline-flex items-center gap-1">
              <Eye size={13} />
              Details
            </span>
          </button>
          {row.status === 'DRAFT' && (
            <button
              type="button"
              className={subtleButtonClass}
              onClick={() => void changeStatus(row.id, 'PENDING_APPROVAL')}
            >
              Submit for approval
            </button>
          )}
          {row.status === 'PENDING_APPROVAL' && (
            <button
              type="button"
              className={subtleButtonClass}
              onClick={() => void changeStatus(row.id, 'APPROVED')}
            >
              Approve
            </button>
          )}
          {row.status === 'PENDING' && (
            <button
              type="button"
              className={subtleButtonClass}
              onClick={() => void changeStatus(row.id, 'APPROVED')}
            >
              Approve
            </button>
          )}
          {row.status === 'APPROVED' && (
            <button
              type="button"
              className={subtleButtonClass}
              onClick={() => void changeStatus(row.id, 'ORDERED')}
            >
              Mark ordered
            </button>
          )}
          {(row.status === 'ORDERED' ||
            row.status === 'RECEIVED' ||
            row.status === 'PARTIALLY_RECEIVED') && (
            <button
              type="button"
              className={subtleButtonClass}
              onClick={() => void changeStatus(row.id, 'CLOSED')}
            >
              Close
            </button>
          )}
          {row.status !== 'CANCELLED' && row.status !== 'CLOSED' && (
            <button
              type="button"
              className={subtleButtonClass}
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
        <Link to={newOrderHref} className={primaryButtonClass}>
          <Plus size={16} />
          New purchase order
        </Link>
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
        minWidth="900px"
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
          size="lg"
        >
          {detailsLoading && <p className="text-sm text-slate-500">Loading…</p>}
          {detailsError && <p className="text-sm text-red-600">{detailsError}</p>}
          <div className="space-y-5">
            <div className="grid grid-cols-2 gap-3">
              <DetailCell label="Status" value={<PurchaseOrderStatusBadge status={details.status} size="md" />} />
              <DetailCell label="Total" value={formatMoney(details.totalAmount)} />
              <DetailCell
                label="Subtotal"
                value={`${formatMoney(details.subtotal)}${
                  details.shippingAmount && Number(details.shippingAmount) > 0
                    ? ` + ${formatMoney(details.shippingAmount)} shipping`
                    : ''
                }`}
              />
              <DetailCell label="Currency" value={details.currency} />
              <DetailCell
                label="Expected"
                value={
                  details.expectedAt
                    ? new Date(details.expectedAt).toLocaleDateString()
                    : '—'
                }
              />
              <DetailCell label="Created" value={new Date(details.createdAt).toLocaleString()} />
            </div>

            <section className="space-y-2">
              <h3 className="text-sm font-semibold text-slate-800">Line items</h3>
              <div className="overflow-hidden rounded-lg border border-slate-200">
                <table className="w-full text-xs">
                  <thead className="bg-slate-50 text-left text-[11px] uppercase tracking-wide text-slate-500">
                    <tr>
                      <th className="px-3 py-2">Product</th>
                      <th className="px-3 py-2 text-right">Qty</th>
                      <th className="px-3 py-2 text-right">Received</th>
                      <th className="px-3 py-2 text-right">Unit cost</th>
                      <th className="px-3 py-2 text-right">Line total</th>
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
                        <td className="px-3 py-2 text-right text-slate-500">{item.receivedQty}</td>
                        <td className="px-3 py-2 text-right text-slate-700">
                          {formatMoney(item.unitCost)}
                        </td>
                        <td className="px-3 py-2 text-right font-medium text-slate-800">
                          {formatMoney(item.lineTotal)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>

            {(details.deliveryStages?.length ?? 0) > 0 && (
              <section className="space-y-2">
                <h3 className="text-sm font-semibold text-slate-800">Delivery stages</h3>
                <div className="overflow-hidden rounded-lg border border-slate-200">
                  <table className="w-full text-xs">
                    <thead className="bg-slate-50 text-left text-[11px] uppercase tracking-wide text-slate-500">
                      <tr>
                        <th className="px-3 py-2">Route</th>
                        <th className="px-3 py-2">Carrier</th>
                        <th className="px-3 py-2 text-right">Fee</th>
                        <th className="px-3 py-2">Allocation</th>
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
                          <td className="px-3 py-2 text-slate-500">{stage.allocationMethod}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </section>
            )}

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

            {details.notes && (
              <div className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-600">
                <span className="font-medium text-slate-700">Notes: </span>
                {details.notes}
              </div>
            )}
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