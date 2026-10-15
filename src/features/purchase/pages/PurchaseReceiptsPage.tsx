import { useState } from 'react'
import { Link } from 'react-router-dom'
import DataTable, { type DataTableColumn } from '@/components/ui/DataTable'
import FilterBar from '@/components/ui/FilterBar'
import ModalDrawer from '@/components/ui/ModalDrawer'
import { PurchaseReceiptStatusBadge } from '../components/PurchaseBadges'
import { productLabel, useProductNames } from '@/features/warehouse/hooks/useProductNames'
import { useWarehouses } from '@/features/warehouse/hooks/useWarehouseData'
import { purchaseApi, purchaseErrorMessage } from '../api/purchaseApi'
import { notifyOrderedReceiptCountChanged } from '../orderedReceiptCount'
import { purchasePaths, type PurchaseAreaBase } from '../config/purchasePaths'
import { usePurchaseOrders, usePurchaseReceipts } from '../hooks/usePurchaseData'
import type {
  DeliveryHandoff,
  PurchaseOrder,
  PurchaseOrderItem,
  PurchaseReceipt,
  PurchaseReceiptStatus,
} from '../types/purchaseTypes'
import { variantDisplayLabel } from '@/features/warehouse/utils/variantLabel'

const primaryButtonClass =
  'inline-flex items-center justify-center gap-2 rounded-lg bg-[var(--dni-primary)] px-4 py-2 text-sm font-medium text-white disabled:opacity-50'
const secondaryButtonClass =
  'inline-flex items-center justify-center rounded-lg border border-slate-200 px-3 py-2 text-sm font-medium text-slate-600 disabled:opacity-50'
const subtleButtonClass =
  'text-xs font-medium text-slate-500 hover:text-slate-700 disabled:opacity-40'
const inputClass =
  'w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-900 outline-none focus:border-[var(--dni-primary)]'
const compactInputClass =
  'w-full rounded-md border border-slate-200 px-2 py-1.5 text-xs text-slate-900 outline-none focus:border-[var(--dni-primary)]'
const labelClass = 'mb-1 block text-xs font-medium text-slate-600'

type DraftLine = {
  item: PurchaseOrderItem
  quantity: string
  acceptedQty: string
  rejectedQty: string
  batchNumber: string
  expiryAt: string
}

export type PurchaseReceiptsPageProps = {
  base: PurchaseAreaBase
  platform?: boolean
}

const purchaseOrderLabel = (
  order: PurchaseOrder,
  names: Record<string, string>,
  warehouseName?: string,
) => {
  const products = [
    ...new Set(
      (order.items ?? [])
        .map((item) => item.productName?.trim() || productLabel(names, item.productId))
        .filter(Boolean),
    ),
  ]
  return [order.orderNumber, order.supplier?.name?.trim(), products.join(', '), warehouseName]
    .filter(Boolean)
    .join(' · ')
}

const PurchaseReceiptsPage = ({ base }: PurchaseReceiptsPageProps) => {
  const paths = purchasePaths(base)
  const warehouseManagerMode = base === '/warehouse-manager'
  const [status, setStatus] = useState<PurchaseReceiptStatus | ''>('')
  const [search, setSearch] = useState('')
  const { receipts, loading, error, reload } = usePurchaseReceipts({ status })
  const { orders, reload: reloadOrders } = usePurchaseOrders()
  const { warehouses } = useWarehouses(
    warehouseManagerMode ? { status: 'ACTIVE' } : { catalog: true, status: 'ACTIVE' },
  )
  const productNames = useProductNames()

  const [modalOpen, setModalOpen] = useState(false)
  const [orderId, setOrderId] = useState('')
  const [lines, setLines] = useState<DraftLine[]>([])
  const [deliveryHandoff, setDeliveryHandoff] = useState<DeliveryHandoff | null>(null)
  const [loadingItems, setLoadingItems] = useState(false)
  const [saving, setSaving] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)
  const [feedback, setFeedback] = useState<string | null>(null)

  // Goods receipts are for supplier parcels only; warehouse orders are received by the seller.
  const orderedOrders = orders.filter(
    (order) =>
      order.orderKind === 'SUPPLIER' &&
      (order.status === 'AWAITING_WAREHOUSE_RECEIPT' ||
        order.status === 'AWAITING_SELLER_RECEIPT'),
  )
  const receivableOrders = orders.filter(
    (order) =>
      order.orderKind === 'SUPPLIER' &&
      (order.status === 'AWAITING_WAREHOUSE_RECEIPT' ||
        order.status === 'AWAITING_SELLER_RECEIPT' ||
        order.status === 'PARTIALLY_RECEIVED'),
  )

  const term = search.trim().toLowerCase()
  const rows = term
    ? receipts.filter((receipt) =>
        `${receipt.receiptNumber} ${receipt.purchaseOrderId}`.toLowerCase().includes(term),
      )
    : receipts

  const updateLine = (index: number, patch: Partial<DraftLine>) => {
    setLines((current) => current.map((item, i) => (i === index ? { ...item, ...patch } : item)))
  }

  const openCreate = () => {
    setOrderId('')
    setLines([])
    setDeliveryHandoff(null)
    setFormError(null)
    setModalOpen(true)
  }

  const selectOrder = async (id: string) => {
    setOrderId(id)
    setLines([])
    setDeliveryHandoff(null)
    if (!id) return
    setLoadingItems(true)
    try {
      const response = await purchaseApi.getPurchaseOrder(id)
      const order = response.data?.data
      const items = order?.items ?? []
      const handoff = order?.deliveryHandoffs?.[0] ?? null
      setDeliveryHandoff(handoff)
      const confirmedByItem = new Map(
        (handoff?.items ?? []).map((line) => [line.purchaseOrderItemId ?? '', line]),
      )
      setLines(
        items
          .filter((item) => Number(item.receivedQty) < Number(item.quantity))
          .map((item) => {
            const remaining = Number(item.quantity) - Number(item.receivedQty)
            const confirmed = confirmedByItem.get(item.id)?.confirmedQty
            const qty =
              confirmed != null
                ? String(Math.max(0, Math.min(remaining, Number(confirmed))))
                : String(remaining)
            return {
              item,
              quantity: qty,
              acceptedQty: qty,
              rejectedQty: '0',
              batchNumber: '',
              expiryAt: '',
            }
          }),
      )
    } catch (err) {
      setFormError(purchaseErrorMessage(err))
    } finally {
      setLoadingItems(false)
    }
  }

  const handleCreate = async () => {
    setFormError(null)
    if (!orderId) {
      setFormError('Select a purchase order.')
      return
    }
    const items = lines
      .map((line) => ({
        purchaseOrderItemId: line.item.id,
        productId: line.item.productId,
        variantId: line.item.variantId || undefined,
        quantity: Number(line.quantity),
        acceptedQty:
          line.acceptedQty !== undefined && line.acceptedQty !== ''
            ? Number(line.acceptedQty)
            : Number(line.quantity),
        rejectedQty:
          line.rejectedQty !== undefined && line.rejectedQty !== ''
            ? Number(line.rejectedQty)
            : 0,
        unitCost: Number(line.item.unitCost),
        batchNumber: line.batchNumber || null,
        expiryAt: line.expiryAt
          ? new Date(`${line.expiryAt}T00:00:00.000Z`).toISOString()
          : null,
      }))
      .filter((item) => item.quantity > 0)

    if (items.length === 0) {
      setFormError('Enter at least one quantity to receive.')
      return
    }

    setSaving(true)
    try {
      const response = await purchaseApi.createPurchaseReceipt({
        purchaseOrderId: orderId,
        items,
      })
      const created = response.data?.data
      if (created?.id) {
        await purchaseApi.confirmPurchaseReceipt(created.id)
      }
      setModalOpen(false)
      await reload()
      await reloadOrders()
      notifyOrderedReceiptCountChanged()
    } catch (err) {
      setFormError(purchaseErrorMessage(err))
    } finally {
      setSaving(false)
    }
  }

  const confirmReceipt = async (id: string) => {
    setFeedback(null)
    try {
      await purchaseApi.confirmPurchaseReceipt(id)
      await reload()
      await reloadOrders()
      notifyOrderedReceiptCountChanged()
    } catch (err) {
      setFeedback(purchaseErrorMessage(err))
    }
  }

  const columns: Array<DataTableColumn<PurchaseReceipt>> = [
    {
      key: 'receiptNumber',
      header: 'Receipt',
      sortValue: (row) => row.receiptNumber,
      render: (row) => {
        const order = orders.find((entry) => entry.id === row.purchaseOrderId)
        return (
          <div className="min-w-0">
            <p className="font-medium text-slate-900">{row.receiptNumber}</p>
            <p className="truncate text-xs text-slate-400">
              {order
                ? purchaseOrderLabel(
                    order,
                    productNames,
                    warehouses.find((warehouse) => warehouse.id === order.warehouseId)?.name,
                  )
                : '—'}
            </p>
          </div>
        )
      },
    },
    {
      key: 'status',
      header: 'Status',
      width: '130px',
      sortValue: (row) => row.status,
      render: (row) => <PurchaseReceiptStatusBadge status={row.status} />,
    },
    {
      key: 'actions',
      header: '',
      align: 'right',
      width: '120px',
      render: (row) =>
        row.status === 'DRAFT' ? (
          <button
            type="button"
            className={subtleButtonClass}
            onClick={() => void confirmReceipt(row.id)}
          >
            Confirm (post)
          </button>
        ) : null,
    },
  ]

  return (
    <div className="space-y-4">
      <nav className="text-xs text-slate-500">
        <Link to={paths.root} className="hover:text-slate-700">
          Warehouse
        </Link>{' '}
        <span className="mx-1">/</span>
        <span className="text-slate-700">Goods Receipts</span>
      </nav>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0 max-w-xl">
          <h1 className="text-xl font-bold text-slate-900">Goods Receipts (GRN)</h1>
          <p className="text-sm text-slate-500">
            {warehouseManagerMode
              ? 'Receive parcels the delivery agent sent to your warehouse. Confirming a GRN stores products and notifies the seller on Purchase Order Tracking.'
              : 'Receive ordered goods — confirming a GRN updates inventory.'}
          </p>
        </div>
        <div className="relative inline-flex shrink-0 self-start">
          <button type="button" className={`${primaryButtonClass} whitespace-nowrap`} onClick={openCreate}>
            Receive goods
          </button>
          {orderedOrders.length > 0 && (
            <span className="absolute -right-2 -top-2 flex size-5 items-center justify-center rounded-full border border-emerald-600 bg-white text-[11px] font-semibold leading-none text-emerald-700 shadow-sm">
              {orderedOrders.length}
            </span>
          )}
        </div>
      </div>

      {feedback && <p className="text-sm text-red-600">{feedback}</p>}

      <FilterBar
        search={{ value: search, onChange: setSearch, placeholder: 'Search receipt number…' }}
        selects={[
          {
            key: 'status',
            label: 'Status',
            value: status,
            allLabel: 'All statuses',
            onChange: (value) => setStatus(value as PurchaseReceiptStatus | ''),
            options: [
              { value: 'DRAFT', label: 'Draft' },
              { value: 'POSTED', label: 'Posted' },
              { value: 'CANCELLED', label: 'Cancelled' },
            ],
          },
        ]}
      />

      <DataTable<PurchaseReceipt>
        columns={columns}
        rows={rows}
        rowKey={(row) => row.id}
        loading={loading}
        error={error}
        emptyMessage="No goods receipts found."
        itemLabel="receipts"
        minWidth="860px"
        fixedLayout
      />

      <ModalDrawer
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title="Receive goods"
        size="lg"
        fitContent
        footer={
          <>
            <button type="button" className={secondaryButtonClass} onClick={() => setModalOpen(false)}>
              Cancel
            </button>
            <button
              type="button"
              className={primaryButtonClass}
              disabled={saving}
              onClick={() => void handleCreate()}
            >
              {saving ? 'Receiving…' : 'Receive & confirm'}
            </button>
          </>
        }
      >
        <div className="space-y-3">
          <div>
            <label className={labelClass} htmlFor="receipt-purchase-order">
              Purchase order
            </label>
            <select
              id="receipt-purchase-order"
              className={inputClass}
              value={orderId}
              onChange={(event) => void selectOrder(event.target.value)}
            >
              <option value="">Select purchase order…</option>
              {receivableOrders.map((order) => (
                <option key={order.id} value={order.id}>
                  {purchaseOrderLabel(
                    order,
                    productNames,
                    warehouses.find((warehouse) => warehouse.id === order.warehouseId)?.name,
                  )}
                </option>
              ))}
            </select>
            {receivableOrders.length === 0 && (
              <p className="mt-1 text-xs text-slate-500">
                {warehouseManagerMode
                  ? 'No delivery-agent parcels are waiting for a goods receipt.'
                  : 'No ordered purchase orders are ready to receive.'}
              </p>
            )}
          </div>

          {loadingItems && <p className="text-sm text-slate-500">Loading items…</p>}

          {warehouseManagerMode && deliveryHandoff && (
            <div className="rounded-lg border border-emerald-200 bg-emerald-50/70 px-3 py-2.5">
              <p className="text-xs font-semibold text-emerald-900">
                Delivery agent confirmation
              </p>
              {deliveryHandoff.notes && (
                <p className="mt-1 text-xs text-emerald-800">{deliveryHandoff.notes}</p>
              )}
              <ul className="mt-2 space-y-1.5">
                {(deliveryHandoff.items ?? []).map((line) => (
                  <li
                    key={line.id}
                    className="rounded-md border border-emerald-100 bg-white/80 px-2.5 py-1.5 text-xs text-slate-700"
                  >
                    <span className="font-medium text-slate-900">
                      {line.productName?.trim() ||
                        productLabel(productNames, line.productId)}
                    </span>
                    <span className="text-slate-500">
                      {' '}
                      ·{' '}
                      {[line.colorName, line.sizeName].filter(Boolean).join(' / ') ||
                        variantDisplayLabel(line.variantId, {
                          colorName: line.colorName,
                          sizeName: line.sizeName,
                        }) ||
                        '—'}
                    </span>
                    <span className="ml-1 text-slate-600">
                      · Ordered {line.orderedQty} · Confirmed {line.confirmedQty}
                      {line.variationCorrect ? ' · Variation OK' : ' · Variation mismatch'}
                    </span>
                    {line.notes ? (
                      <span className="mt-0.5 block text-slate-500">{line.notes}</span>
                    ) : null}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {lines.length > 0 && (
            <div className="space-y-1.5">
              <span className="text-xs font-medium text-slate-600">Receive quantities</span>
              <div className="overflow-x-auto">
                <div className="min-w-[42rem] space-y-1.5">
                  <div className="grid grid-cols-[minmax(0,1.5fr)_4.5rem_4.5rem_4.5rem_7.5rem_7.5rem] gap-1.5 px-0.5 text-[11px] font-medium text-slate-500">
                    <span>Product</span>
                    <span>Quantity</span>
                    <span>Accepted</span>
                    <span>Rejected</span>
                    <span>Manufactured</span>
                    <span>Expiry</span>
                  </div>
                  {lines.map((line, index) => {
                    const remaining = Number(line.item.quantity) - Number(line.item.receivedQty)
                    return (
                      <div
                        key={line.item.id}
                        className="grid grid-cols-[minmax(0,1.5fr)_4.5rem_4.5rem_4.5rem_7.5rem_7.5rem] items-center gap-1.5"
                      >
                        <div className="min-w-0">
                          <p className="truncate text-sm text-slate-800">
                            {line.item.productName?.trim() ||
                              productLabel(productNames, line.item.productId)}
                          </p>
                          <p className="text-[11px] text-slate-400">
                            Ordered {line.item.quantity}
                            {line.item.unit ? ` ${line.item.unit}` : ''} · Remaining {remaining}
                          </p>
                        </div>
                        <input
                          aria-label="Quantity"
                          className={compactInputClass}
                          value={line.quantity}
                          onChange={(event) => updateLine(index, { quantity: event.target.value })}
                        />
                        <input
                          aria-label="Accepted"
                          className={compactInputClass}
                          value={line.acceptedQty}
                          onChange={(event) => updateLine(index, { acceptedQty: event.target.value })}
                        />
                        <input
                          aria-label="Rejected"
                          className={compactInputClass}
                          value={line.rejectedQty}
                          onChange={(event) => updateLine(index, { rejectedQty: event.target.value })}
                        />
                        <input
                          aria-label="Manufactured"
                          type="date"
                          className={compactInputClass}
                          value={line.batchNumber}
                          onChange={(event) => updateLine(index, { batchNumber: event.target.value })}
                        />
                        <input
                          aria-label="Expiry"
                          type="date"
                          className={compactInputClass}
                          value={line.expiryAt}
                          onChange={(event) => updateLine(index, { expiryAt: event.target.value })}
                        />
                      </div>
                    )
                  })}
                </div>
              </div>
            </div>
          )}

          {orderId && !loadingItems && lines.length === 0 && (
            <p className="text-sm text-slate-500">
              This purchase order has nothing left to receive.
            </p>
          )}

          {formError && <p className="text-sm text-red-600">{formError}</p>}
        </div>
      </ModalDrawer>
    </div>
  )
}

export default PurchaseReceiptsPage
