import type { ReactNode } from 'react'
import { FileText } from 'lucide-react'
import StatusBadge from '@/components/ui/StatusBadge'
import {
  PurchaseOrderStatusBadge,
  PURCHASE_ORDER_STATUS_TONES,
} from './PurchaseBadges'
import {
  ADDITIONAL_COST_CATEGORY_LABELS,
  COST_ALLOCATION_METHOD_LABELS,
  COST_STATUS_LABELS,
  formatMoney,
  PURCHASE_ORDER_STATUS_LABELS,
  type PurchaseOrder,
  type PurchaseOrderAttachment,
} from '../types/purchaseTypes'
import { orderItemVariationLabel } from '../utils/orderProductPreview'

const DetailRow = ({ label, value }: { label: string; value: ReactNode }) => (
  <div className="grid min-w-0 grid-cols-[9.5rem_minmax(0,1fr)] items-start gap-x-3 gap-y-1 border-b border-slate-100 py-2.5 last:border-b-0 sm:grid-cols-[10.5rem_minmax(0,1fr)]">
    <p className="text-xs font-medium text-slate-500">{label}</p>
    <div className="break-words text-sm font-semibold text-slate-900">{value}</div>
  </div>
)

const DetailCell = ({ label, value }: { label: string; value: ReactNode }) => (
  <div className="rounded-lg border border-slate-200 bg-white px-3 py-2">
    <p className="text-[11px] uppercase tracking-wide text-slate-400">{label}</p>
    <p className="text-sm text-slate-700">{value}</p>
  </div>
)

const itemVariation = (item: NonNullable<PurchaseOrder['items']>[number]) =>
  orderItemVariationLabel(item) || '—'

type Props = {
  order: PurchaseOrder | null
  loading?: boolean
  error?: string | null
  onDownloadAttachment: (orderId: string, attachment: PurchaseOrderAttachment) => void
}

const StatusHistorySection = ({ order }: { order: PurchaseOrder }) => (
  <section className="space-y-2">
    <h3 className="text-sm font-semibold text-slate-800">Status history</h3>
    {order.statusHistory && order.statusHistory.length > 0 ? (
      <ol className="space-y-2">
        {order.statusHistory.map((entry) => (
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
              {entry.note && <p className="text-xs text-slate-500">{entry.note}</p>}
            </div>
          </li>
        ))}
      </ol>
    ) : (
      <p className="text-sm text-slate-500">No status changes recorded yet.</p>
    )}
  </section>
)

const WarehouseOrderDetails = ({ order }: { order: PurchaseOrder }) => (
  <div className="space-y-4">
    <section className="rounded-lg border border-slate-200 bg-white px-3 sm:px-4">
      <DetailRow
        label="Status"
        value={<PurchaseOrderStatusBadge status={order.status} size="md" />}
      />
      <DetailRow
        label="Requested"
        value={new Date(order.createdAt).toLocaleString()}
      />
      <DetailRow label="Warehouse" value={order.warehouse?.name ?? '—'} />
      {order.notes?.trim() ? <DetailRow label="Notes" value={order.notes} /> : null}
    </section>

    <section className="space-y-2">
      <h3 className="text-sm font-semibold text-slate-800">Products</h3>
      <div className="overflow-x-auto rounded-lg border border-slate-200">
        <table className="w-full text-xs">
          <thead className="bg-slate-50 text-left text-[11px] uppercase tracking-wide text-slate-500">
            <tr>
              <th className="px-3 py-2">Product</th>
              <th className="px-3 py-2">Variation</th>
              <th className="px-3 py-2 text-right">Qty</th>
              <th className="px-3 py-2 text-right">Received</th>
            </tr>
          </thead>
          <tbody>
            {(order.items ?? []).map((item) => (
              <tr key={item.id} className="border-t border-slate-100">
                <td className="px-3 py-2 font-medium text-slate-800">
                  {item.productName ?? item.productId}
                </td>
                <td className="px-3 py-2 text-slate-700">{itemVariation(item)}</td>
                <td className="px-3 py-2 text-right text-slate-700">{item.quantity}</td>
                <td className="px-3 py-2 text-right text-slate-700">{item.receivedQty}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>

    <StatusHistorySection order={order} />
  </div>
)

const PurchaseOrderDetailsPanel = ({
  order,
  loading = false,
  error = null,
  onDownloadAttachment,
}: Props) => {
  if (loading) return <p className="text-sm text-slate-500">Loading…</p>
  if (error) return <p className="text-sm text-red-600">{error}</p>
  if (!order) return <p className="text-sm text-slate-500">No order selected.</p>

  if (order.orderKind === 'WAREHOUSE') {
    return <WarehouseOrderDetails order={order} />
  }

  return (
    <div className="space-y-5">
      <section className="space-y-2">
        <h3 className="text-sm font-semibold text-slate-800">Order & supplier details</h3>
        <div className="rounded-lg border border-slate-200 bg-white px-3 sm:px-4">
          <DetailRow
            label="Status"
            value={<PurchaseOrderStatusBadge status={order.status} size="md" />}
          />
          <DetailRow
            label="Order date"
            value={
              order.orderDate
                ? new Date(order.orderDate).toLocaleDateString()
                : new Date(order.createdAt).toLocaleDateString()
            }
          />
          <DetailRow label="Supplier" value={order.supplier?.name ?? '—'} />
          <DetailRow label="Supplier contact" value={order.supplierContact || '—'} />
          <DetailRow label="Currency" value={order.currency} />
          <DetailRow label="Exchange rate" value={order.exchangeRate} />
          <DetailRow
            label="Expected arrival"
            value={
              order.expectedAt ? new Date(order.expectedAt).toLocaleDateString() : '—'
            }
          />
          <DetailRow label="Payment terms" value={order.paymentTerms || '—'} />
          <DetailRow label="Destination warehouse" value={order.warehouse?.name ?? '—'} />
          <DetailRow label="Delivery terms" value={order.deliveryTerms || '—'} />
        </div>
      </section>

      <section className="space-y-2">
        <h3 className="text-sm font-semibold text-slate-800">Notes</h3>
        <p className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700">
          {order.notes?.trim() ? order.notes : 'No notes'}
        </p>
      </section>

      <section className="space-y-2">
        <h3 className="text-sm font-semibold text-slate-800">Attachments</h3>
        {(order.attachments?.length ?? 0) > 0 ? (
          <ul className="space-y-1">
            {order.attachments?.map((file) => (
              <li key={file.id}>
                <button
                  type="button"
                  className="inline-flex items-center gap-2 text-sm font-medium text-sky-700 hover:text-sky-800"
                  onClick={() => onDownloadAttachment(order.id, file)}
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
        <h3 className="text-sm font-semibold text-slate-800">Products & variations</h3>
        <div className="overflow-x-auto rounded-lg border border-slate-200">
          <table className="w-full text-xs">
            <thead className="bg-slate-50 text-left text-[11px] uppercase tracking-wide text-slate-500">
              <tr>
                <th className="px-3 py-2">Product</th>
                <th className="px-3 py-2">Variation</th>
                <th className="px-3 py-2 text-right">Qty</th>
                <th className="px-3 py-2 text-right">Unit price</th>
                <th className="px-3 py-2 text-right">Discount</th>
                <th className="px-3 py-2 text-right">Net amount</th>
                <th className="px-3 py-2 text-right">Weight/unit</th>
                <th className="px-3 py-2 text-right">Volume/unit</th>
              </tr>
            </thead>
            <tbody>
              {order.items?.map((item) => (
                <tr key={item.id} className="border-t border-slate-100">
                  <td className="px-3 py-2">
                    <span className="font-medium text-slate-800">
                      {item.productName ?? item.productId}
                    </span>
                    {item.sku && (
                      <span className="ml-1 text-slate-400">({item.sku})</span>
                    )}
                  </td>
                  <td className="px-3 py-2 text-slate-700">{itemVariation(item)}</td>
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

      {(order.routeStops?.length ?? 0) > 0 && (
        <section className="space-y-2">
          <h3 className="text-sm font-semibold text-slate-800">Transit route</h3>
          <ol className="space-y-1.5">
            {[...(order.routeStops ?? [])]
              .sort((a, b) => a.sequence - b.sequence)
              .map((stop, index, stops) => {
                const legIndex = order.routeLegIndex ?? 0
                const isCurrentDestination =
                  order.status === 'IN_TRANSIT' && index === legIndex + 1
                return (
                  <li
                    key={stop.id}
                    className="flex flex-wrap items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm"
                  >
                    <span className="font-medium text-slate-800">{stop.location}</span>
                    {stop.arrivedAt ? (
                      <span className="text-xs text-emerald-700">
                        Arrived {new Date(stop.arrivedAt).toLocaleString()}
                      </span>
                    ) : isCurrentDestination ? (
                      <span className="text-xs text-sky-700">In transit to here</span>
                    ) : (
                      <span className="text-xs text-slate-400">Pending</span>
                    )}
                    {index < stops.length - 1 && (
                      <span className="w-full text-[11px] text-slate-400">
                        → next: {stops[index + 1]?.location}
                      </span>
                    )}
                  </li>
                )
              })}
          </ol>
        </section>
      )}

      <section className="space-y-2">
        <h3 className="text-sm font-semibold text-slate-800">Delivery stages & charges</h3>
        {(order.deliveryStages?.length ?? 0) > 0 ? (
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
                {order.deliveryStages?.map((stage) => (
                  <tr key={stage.id} className="border-t border-slate-100">
                    <td className="px-3 py-2 font-medium text-slate-800">{stage.name}</td>
                    <td className="px-3 py-2 text-slate-500">{stage.carrier ?? '—'}</td>
                    <td className="px-3 py-2 text-right text-slate-700">
                      {formatMoney(stage.feeAmount)}
                    </td>
                    <td className="px-3 py-2 text-slate-500">
                      {COST_ALLOCATION_METHOD_LABELS[stage.allocationMethod] ??
                        stage.allocationMethod}
                    </td>
                    <td className="px-3 py-2 text-slate-500">
                      {stage.applicableProductIds.length === 0
                        ? 'All products'
                        : stage.applicableProductIds
                            .map(
                              (productId) =>
                                order.items?.find((item) => item.productId === productId)
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
        {(order.additionalCosts?.length ?? 0) > 0 ? (
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
                {order.additionalCosts?.map((cost) => (
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
                      {COST_ALLOCATION_METHOD_LABELS[cost.allocationMethod] ??
                        cost.allocationMethod}
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
          <DetailCell label="Subtotal" value={formatMoney(order.subtotal)} />
          <DetailCell label="Delivery" value={formatMoney(order.shippingAmount)} />
          <DetailCell
            label="Other costs"
            value={formatMoney(
              (order.additionalCosts ?? []).reduce((sum, cost) => sum + Number(cost.amount), 0),
            )}
          />
          <DetailCell label="Total" value={formatMoney(order.totalAmount)} />
        </div>
      </section>

      <StatusHistorySection order={order} />
    </div>
  )
}

export default PurchaseOrderDetailsPanel
