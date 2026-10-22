import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { Eye, RefreshCw } from 'lucide-react'
import DataTable, { type DataTableColumn } from '@/components/ui/DataTable'
import ModalDrawer from '@/components/ui/ModalDrawer'
import { productLabel, useProductNames } from '@/features/warehouse/hooks/useProductNames'
import { notifyDashboardMenuBadgesChanged } from '@/features/dashboard/dashboardMenuBadges'
import { purchaseApi, purchaseErrorMessage } from '../api/purchaseApi'
import { PurchaseOrderStatusBadge } from '../components/PurchaseBadges'
import PurchaseOrderDetailsPanel from '../components/PurchaseOrderDetailsPanel'
import PurchaseOrderRouteStatusDisplay from '../components/PurchaseOrderRouteStatusDisplay'
import { usePurchaseOrders } from '../hooks/usePurchaseData'
import type {
  PurchaseOrder,
  PurchaseOrderItem,
} from '../types/purchaseTypes'
import { secondaryButtonClass } from '../config/purchaseUiClasses'
import { downloadPurchaseOrderAttachment } from '../utils/downloadPurchaseOrderAttachment'
import { variantDisplayLabel } from '@/features/warehouse/utils/variantLabel'

type DeliveryParcelsBase = '/seller' | '/delivery-agent'

const primaryButtonClass =
  'inline-flex cursor-pointer items-center justify-center whitespace-nowrap rounded-md bg-emerald-600 px-2.5 py-1 text-xs font-medium text-white hover:bg-emerald-700 disabled:opacity-50'
const rowActionBaseClass =
  'inline-flex h-7 w-fit shrink-0 cursor-pointer items-center justify-center gap-1 whitespace-nowrap rounded-md px-2 text-[11px] font-medium disabled:opacity-50'
const rowPrimaryButtonClass = `${rowActionBaseClass} bg-emerald-600 text-white hover:bg-emerald-700`
const rowSecondaryButtonClass = `${rowActionBaseClass} border border-slate-200 bg-white text-slate-700 hover:bg-slate-50`
const inputClass =
  'w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-900 outline-none focus:border-emerald-500'

type HandoffLine = {
  item: PurchaseOrderItem
  confirmedQty: string
  variationCorrect: boolean
}

const lineVariantLabel = (item: PurchaseOrderItem) => {
  const named = [item.colorName, item.sizeName].filter((part) => part?.trim()).join(' / ')
  if (named) return named
  return (
    variantDisplayLabel(item.variantId, {
      colorName: item.colorName,
      sizeName: item.sizeName,
    }) || '—'
  )
}

const DeliveryParcelsPage = ({ base = '/delivery-agent' }: { base?: DeliveryParcelsBase }) => {
  const sellerMode = base === '/seller'
  const { orders, loading, error, reload } = usePurchaseOrders()
  const productNames = useProductNames()
  const [feedback, setFeedback] = useState<string | null>(null)
  const [damageOrder, setDamageOrder] = useState<PurchaseOrder | null>(null)
  const [damageNotes, setDamageNotes] = useState('')
  const [damageLines, setDamageLines] = useState<
    Array<{ item: PurchaseOrderItem; quantity: string; damageType: string; notes: string }>
  >([])
  const [savingDamage, setSavingDamage] = useState(false)

  const [handoffOrder, setHandoffOrder] = useState<PurchaseOrder | null>(null)
  const [handoffNotes, setHandoffNotes] = useState('')
  const [handoffLines, setHandoffLines] = useState<HandoffLine[]>([])
  const [handoffError, setHandoffError] = useState<string | null>(null)
  const [savingHandoff, setSavingHandoff] = useState(false)

  const [detailsOpen, setDetailsOpen] = useState(false)
  const [details, setDetails] = useState<PurchaseOrder | null>(null)
  const [detailsLoading, setDetailsLoading] = useState(false)
  const [detailsError, setDetailsError] = useState<string | null>(null)

  const rows = useMemo(
    () =>
      orders
        .filter((order) => order.orderKind === 'SUPPLIER')
        .filter((order) =>
          [
            'IN_TRANSIT',
            'ORDERED',
            'ARRIVED',
            'DELIVERY_PICKED_UP',
            'AWAITING_WAREHOUSE_RECEIPT',
            'AWAITING_SELLER_RECEIPT',
            'WAREHOUSE_RECEIVED',
            'SELLER_RECEIVED',
          ].includes(order.status),
        ),
    [orders],
  )

  const sellerProgressLabel = (order: PurchaseOrder) => {
    const stops = [...(order.routeStops ?? [])].sort((a, b) => a.sequence - b.sequence)
    if (stops.length === 0) return '—'
    if (order.status === 'ARRIVED') {
      return `Seller marked arrived at ${stops[stops.length - 1]?.location ?? 'final stop'}`
    }
    if (order.status === 'IN_TRANSIT' || order.status === 'ORDERED') {
      const leg = order.routeLegIndex ?? 0
      const from = stops[leg]?.location
      const to = stops[leg + 1]?.location
      if (from && to) return `Seller: in transit ${from} → ${to}`
      return 'Seller: in transit'
    }
    if (order.status === 'DELIVERY_PICKED_UP') return 'Ready to confirm and pickup'
    if (
      order.status === 'AWAITING_WAREHOUSE_RECEIPT' ||
      order.status === 'AWAITING_SELLER_RECEIPT'
    ) {
      return 'Sent to warehouse manager'
    }
    if (order.status === 'WAREHOUSE_RECEIVED' || order.status === 'SELLER_RECEIVED') {
      return 'Warehouse received'
    }
    return '—'
  }

  const openDetails = async (id: string) => {
    setDetailsOpen(true)
    setDetailsLoading(true)
    setDetailsError(null)
    setDetails(null)
    try {
      const response = await purchaseApi.getPurchaseOrder(id)
      const order = response.data?.data ?? null
      if (!order) {
        setDetailsError('Order details were not found.')
        return
      }
      setDetails(order)
    } catch (err) {
      setDetailsError(purchaseErrorMessage(err))
    } finally {
      setDetailsLoading(false)
    }
  }

  const openHandoff = (order: PurchaseOrder) => {
    setHandoffOrder(order)
    setHandoffNotes('')
    setHandoffError(null)
    setHandoffLines(
      (order.items ?? []).map((item) => ({
        item,
        confirmedQty: String(item.quantity),
        variationCorrect: true,
      })),
    )
  }

  const submitHandoff = async () => {
    if (!handoffOrder) return
    setHandoffError(null)
    if (handoffLines.some((line) => !line.variationCorrect)) {
      setHandoffError('Confirm every product variation is correct before sending to the warehouse.')
      return
    }
    const items = handoffLines.map((line) => ({
      purchaseOrderItemId: line.item.id,
      confirmedQty: Number(line.confirmedQty),
      variationCorrect: line.variationCorrect,
    }))
    if (items.some((line) => !Number.isFinite(line.confirmedQty) || line.confirmedQty < 0)) {
      setHandoffError('Enter a valid confirmed quantity for each product.')
      return
    }
    if (items.every((line) => line.confirmedQty === 0)) {
      setHandoffError('Confirmed quantity must be greater than zero on at least one product.')
      return
    }

    setSavingHandoff(true)
    setFeedback(null)
    try {
      await purchaseApi.deliveryProcess(handoffOrder.id, {
        notes: handoffNotes.trim() || null,
        items,
      })
      setFeedback(
        sellerMode
          ? `${handoffOrder.orderNumber} confirmed and picked up. Continue on Goods Receipts to post the GRN.`
          : `${handoffOrder.orderNumber} confirmed, picked up, and sent to the warehouse.`,
      )
      setHandoffOrder(null)
      await reload()
      notifyDashboardMenuBadgesChanged()
    } catch (err) {
      setHandoffError(purchaseErrorMessage(err))
    } finally {
      setSavingHandoff(false)
    }
  }

  const openDamage = (order: PurchaseOrder) => {
    setDamageOrder(order)
    setDamageNotes('')
    setDamageLines(
      (order.items ?? []).map((item) => ({
        item,
        quantity: '0',
        damageType: 'damaged',
        notes: '',
      })),
    )
  }

  const submitDamage = async () => {
    if (!damageOrder) return
    const items = damageLines
      .filter((line) => Number(line.quantity) > 0)
      .map((line) => ({
        purchaseOrderItemId: line.item.id,
        productId: line.item.productId,
        variantId: line.item.variantId || undefined,
        productName: line.item.productName,
        quantity: Number(line.quantity),
        damageType: line.damageType || null,
        notes: line.notes || null,
      }))
    if (items.length === 0) {
      setFeedback('Enter a damaged quantity on at least one product.')
      return
    }
    setSavingDamage(true)
    setFeedback(null)
    try {
      await purchaseApi.createDamageReport(damageOrder.id, { notes: damageNotes || null, items })
      setFeedback(`Damage report submitted for ${damageOrder.orderNumber}.`)
      setDamageOrder(null)
      notifyDashboardMenuBadgesChanged()
    } catch (err) {
      setFeedback(purchaseErrorMessage(err))
    } finally {
      setSavingDamage(false)
    }
  }

  const columns: Array<DataTableColumn<PurchaseOrder>> = [
    {
      key: 'order',
      header: 'Order',
      render: (row) => <span className="text-sm font-medium text-slate-800">{row.orderNumber}</span>,
    },
    {
      key: 'supplier',
      header: 'Supplier',
      render: (row) => <span className="text-sm text-slate-700">{row.supplier?.name ?? '—'}</span>,
    },
    {
      key: 'products',
      header: 'Products',
      render: (row) => (
        <span className="block max-w-[280px] truncate text-sm text-slate-700">
          {(row.items ?? [])
            .map(
              (item) =>
                `${item.productName?.trim() || productLabel(productNames, item.productId)} × ${item.quantity}`,
            )
            .join(', ') || '—'}
        </span>
      ),
    },
    {
      key: 'progress',
      header: 'Seller progress',
      render: (row) => (
        <span className="block max-w-[260px] text-sm text-slate-700">{sellerProgressLabel(row)}</span>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      render: (row) => <PurchaseOrderStatusBadge status={row.status} />,
    },
    {
      key: 'actions',
      header: '',
      align: 'right',
      width: '300px',
      render: (row) => (
        <div className="flex flex-wrap justify-end gap-1">
          <button
            type="button"
            className={rowSecondaryButtonClass}
            onClick={() => void openDetails(row.id)}
          >
            <Eye size={12} />
            Details
          </button>
          {(row.status === 'ARRIVED' || row.status === 'DELIVERY_PICKED_UP') && (
            <button
              type="button"
              className={rowPrimaryButtonClass}
              onClick={() => openHandoff(row)}
            >
              Confirm and Pickup
            </button>
          )}
          {!sellerMode &&
            [
              'IN_TRANSIT',
              'ORDERED',
              'ARRIVED',
              'DELIVERY_PICKED_UP',
              'AWAITING_WAREHOUSE_RECEIPT',
            ].includes(row.status) && (
              <button type="button" className={rowSecondaryButtonClass} onClick={() => openDamage(row)}>
                Damage report
              </button>
            )}
        </div>
      ),
    },
  ]

  return (
    <div className="space-y-4">
      <nav className="text-xs text-slate-500">
        <Link to={sellerMode ? '/seller/warehouse' : '/delivery-agent'} className="hover:text-slate-700">
          {sellerMode ? 'Warehouse' : 'Delivery'}
        </Link>{' '}
        <span className="mx-1">/</span>
        <span className="text-slate-700">{sellerMode ? 'Confirm and Pickup' : 'Parcels'}</span>
      </nav>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-900">
            {sellerMode ? 'Confirm and Pickup' : 'Supplier parcels'}
          </h1>
          <p className="text-sm text-slate-500">
            {sellerMode
              ? 'After final arrival, confirm variation and quantity, then pick up and send the parcel for goods receipt.'
              : 'Follow seller transit actions as they happen. After final arrival, confirm variation and quantity, then pickup and send to the warehouse manager.'}
          </p>
        </div>
        <button type="button" className={secondaryButtonClass} disabled={loading} onClick={() => void reload()}>
          <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
          Refresh
        </button>
      </div>

      {feedback && <p className="text-sm text-emerald-700">{feedback}</p>}

      <DataTable<PurchaseOrder>
        columns={columns}
        rows={rows}
        rowKey={(row) => row.id}
        loading={loading}
        error={error}
        emptyMessage="No supplier parcels are waiting."
        minWidth="1180px"
      />

      <ModalDrawer
        open={detailsOpen}
        onClose={() => {
          setDetailsOpen(false)
          setDetails(null)
          setDetailsError(null)
        }}
        title={details?.orderNumber || 'Order details'}
        subtitle={
          details?.supplier?.name
            ? `Supplier: ${details.supplier.name}`
            : 'Review products, costs, notes, and attachments before confirm and pickup'
        }
        size="xl"
        footer={
          details &&
          (details.status === 'ARRIVED' || details.status === 'DELIVERY_PICKED_UP') ? (
            <>
              <button
                type="button"
                className={secondaryButtonClass}
                onClick={() => {
                  setDetailsOpen(false)
                  setDetails(null)
                }}
              >
                Close
              </button>
              <button
                type="button"
                className={primaryButtonClass}
                disabled={detailsLoading}
                onClick={() => {
                  const order = details
                  setDetailsOpen(false)
                  setDetails(null)
                  openHandoff(order)
                }}
              >
                Confirm and Pickup
              </button>
            </>
          ) : undefined
        }
      >
        <div className="space-y-5">
          {details && !detailsLoading && !detailsError && (
            <PurchaseOrderRouteStatusDisplay order={details} />
          )}
          <PurchaseOrderDetailsPanel
            order={details}
            loading={detailsLoading}
            error={detailsError}
            onDownloadAttachment={(orderId, file) =>
              void downloadPurchaseOrderAttachment(orderId, file)
            }
          />
        </div>
      </ModalDrawer>

      <ModalDrawer
        open={Boolean(handoffOrder)}
        onClose={() => setHandoffOrder(null)}
        title="Confirm and Pickup"
        subtitle={handoffOrder?.orderNumber}
        size="lg"
        fitContent
        footer={
          <>
            <button type="button" className={secondaryButtonClass} onClick={() => setHandoffOrder(null)}>
              Cancel
            </button>
            <button
              type="button"
              className={primaryButtonClass}
              disabled={savingHandoff}
              onClick={() => void submitHandoff()}
            >
              {savingHandoff ? 'Saving…' : 'Confirm and Pickup'}
            </button>
          </>
        }
      >
        <div className="space-y-3">
          <p className="text-sm text-slate-600">
            Check each product&apos;s color/size and quantity, then confirm and pickup. The parcel is
            sent to the warehouse manager to post the goods receipt.
          </p>
          {handoffError && <p className="text-sm text-rose-600">{handoffError}</p>}
          <label className="block text-xs font-medium text-slate-600">
            Notes for warehouse
            <textarea
              className={`${inputClass} mt-1 min-h-[64px]`}
              value={handoffNotes}
              onChange={(event) => setHandoffNotes(event.target.value)}
              placeholder="Optional notes about this parcel"
            />
          </label>
          <div className="overflow-x-auto">
            <div className="min-w-[32rem] space-y-2">
              <div className="grid grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)_4.5rem_5.5rem] gap-2 px-0.5 text-[11px] font-medium text-slate-500">
                <span>Product</span>
                <span>Variation</span>
                <span>Ordered</span>
                <span>Confirm qty</span>
              </div>
              {handoffLines.map((line, index) => (
                <div
                  key={line.item.id}
                  className="grid grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)_4.5rem_5.5rem] items-start gap-2 rounded-lg border border-slate-100 bg-slate-50/60 p-2"
                >
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-slate-800">
                      {line.item.productName?.trim() ||
                        productLabel(productNames, line.item.productId)}
                    </p>
                    <label className="mt-1 flex items-center gap-1.5 text-xs text-slate-600">
                      <input
                        type="checkbox"
                        checked={line.variationCorrect}
                        onChange={(event) =>
                          setHandoffLines((current) =>
                            current.map((row, i) =>
                              i === index
                                ? { ...row, variationCorrect: event.target.checked }
                                : row,
                            ),
                          )
                        }
                      />
                      Variation correct
                    </label>
                  </div>
                  <p className="pt-1 text-sm text-slate-700">{lineVariantLabel(line.item)}</p>
                  <p className="pt-1 text-sm text-slate-600">{line.item.quantity}</p>
                  <input
                    type="number"
                    min={0}
                    max={line.item.quantity}
                    className={inputClass}
                    value={line.confirmedQty}
                    onChange={(event) =>
                      setHandoffLines((current) =>
                        current.map((row, i) =>
                          i === index ? { ...row, confirmedQty: event.target.value } : row,
                        ),
                      )
                    }
                    aria-label="Confirmed quantity"
                  />
                </div>
              ))}
            </div>
          </div>
        </div>
      </ModalDrawer>

      <ModalDrawer
        open={Boolean(damageOrder)}
        onClose={() => setDamageOrder(null)}
        title="Damage report"
        subtitle={damageOrder?.orderNumber}
        size="lg"
        footer={
          <>
            <button type="button" className={secondaryButtonClass} onClick={() => setDamageOrder(null)}>
              Cancel
            </button>
            <button
              type="button"
              className={primaryButtonClass}
              disabled={savingDamage}
              onClick={() => void submitDamage()}
            >
              {savingDamage ? 'Submitting…' : 'Submit report'}
            </button>
          </>
        }
      >
        <div className="space-y-3">
          <label className="block text-xs font-medium text-slate-600">
            Notes
            <textarea
              className={`${inputClass} mt-1 min-h-[72px]`}
              value={damageNotes}
              onChange={(event) => setDamageNotes(event.target.value)}
            />
          </label>
          <div className="space-y-2">
            {damageLines.map((line, index) => (
              <div
                key={line.item.id}
                className="grid grid-cols-[minmax(0,1.4fr)_4.5rem_7rem_minmax(0,1fr)] gap-2"
              >
                <p className="truncate text-sm text-slate-800">
                  {line.item.productName?.trim() ||
                    productLabel(productNames, line.item.productId)}
                </p>
                <input
                  type="number"
                  min={0}
                  className={inputClass}
                  value={line.quantity}
                  onChange={(event) =>
                    setDamageLines((current) =>
                      current.map((row, i) =>
                        i === index ? { ...row, quantity: event.target.value } : row,
                      ),
                    )
                  }
                  aria-label="Damaged quantity"
                />
                <select
                  className={inputClass}
                  value={line.damageType}
                  onChange={(event) =>
                    setDamageLines((current) =>
                      current.map((row, i) =>
                        i === index ? { ...row, damageType: event.target.value } : row,
                      ),
                    )
                  }
                >
                  <option value="damaged">Damaged</option>
                  <option value="missing">Missing</option>
                  <option value="wrong_item">Wrong item</option>
                </select>
                <input
                  className={inputClass}
                  placeholder="Line note"
                  value={line.notes}
                  onChange={(event) =>
                    setDamageLines((current) =>
                      current.map((row, i) =>
                        i === index ? { ...row, notes: event.target.value } : row,
                      ),
                    )
                  }
                />
              </div>
            ))}
          </div>
        </div>
      </ModalDrawer>
    </div>
  )
}

export default DeliveryParcelsPage
