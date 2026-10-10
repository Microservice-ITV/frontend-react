import { useState } from 'react'
import { Link } from 'react-router-dom'
import DataTable, { type DataTableColumn } from '@/components/ui/DataTable'
import FilterBar from '@/components/ui/FilterBar'
import ModalDrawer from '@/components/ui/ModalDrawer'
import { PurchaseReceiptStatusBadge } from '../components/PurchaseBadges'
import { purchaseApi, purchaseErrorMessage } from '../api/purchaseApi'
import { purchasePaths, type PurchaseAreaBase } from '../config/purchasePaths'
import { usePurchaseOrders, usePurchaseReceipts } from '../hooks/usePurchaseData'
import type { PurchaseOrderItem, PurchaseReceipt, PurchaseReceiptStatus } from '../types/purchaseTypes'

const primaryButtonClass =
  'inline-flex items-center justify-center rounded-lg bg-[var(--dni-primary)] px-4 py-2 text-sm font-medium text-white disabled:opacity-50'
const secondaryButtonClass =
  'inline-flex items-center justify-center rounded-lg border border-slate-200 px-3 py-2 text-sm font-medium text-slate-600 disabled:opacity-50'
const subtleButtonClass =
  'text-xs font-medium text-slate-500 hover:text-slate-700 disabled:opacity-40'
const inputClass =
  'w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-900 outline-none focus:border-[var(--dni-primary)]'
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

const PurchaseReceiptsPage = ({ base }: PurchaseReceiptsPageProps) => {
  const paths = purchasePaths(base)
  const [status, setStatus] = useState<PurchaseReceiptStatus | ''>('')
  const [search, setSearch] = useState('')
  const { receipts, loading, error, reload } = usePurchaseReceipts({ status })
  const { orders } = usePurchaseOrders()

  const [modalOpen, setModalOpen] = useState(false)
  const [orderId, setOrderId] = useState('')
  const [lines, setLines] = useState<DraftLine[]>([])
  const [notes, setNotes] = useState('')
  const [loadingItems, setLoadingItems] = useState(false)
  const [saving, setSaving] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)
  const [feedback, setFeedback] = useState<string | null>(null)

  const recevableOrders = orders.filter(
    (order) => order.status !== 'CANCELLED' && order.status !== 'RECEIVED',
  )

  const term = search.trim().toLowerCase()
  const rows = term
    ? receipts.filter((receipt) =>
        `${receipt.receiptNumber} ${receipt.purchaseOrderId}`.toLowerCase().includes(term),
      )
    : receipts

  const openCreate = () => {
    setOrderId('')
    setLines([])
    setNotes('')
    setFormError(null)
    setModalOpen(true)
  }

  const selectOrder = async (id: string) => {
    setOrderId(id)
    setLines([])
    if (!id) return
    setLoadingItems(true)
    try {
      const response = await purchaseApi.getPurchaseOrder(id)
      const items = response.data?.data?.items ?? []
      setLines(
        items
          .filter((item) => Number(item.receivedQty) < Number(item.quantity))
          .map((item) => ({
            item,
            quantity: String(Number(item.quantity) - Number(item.receivedQty)),
            acceptedQty: String(Number(item.quantity) - Number(item.receivedQty)),
            rejectedQty: '0',
            batchNumber: '',
            expiryAt: '',
          })),
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
        expiryAt: line.expiryAt || null,
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
        notes: notes || null,
        items,
      })
      const created = response.data?.data
      if (created?.id) {
        await purchaseApi.confirmPurchaseReceipt(created.id)
      }
      setModalOpen(false)
      await reload()
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
    } catch (err) {
      setFeedback(purchaseErrorMessage(err))
    }
  }

  const columns: Array<DataTableColumn<PurchaseReceipt>> = [
    {
      key: 'receiptNumber',
      header: 'Receipt',
      sortValue: (row) => row.receiptNumber,
      render: (row) => (
        <div className="min-w-0">
          <p className="font-medium text-slate-900">{row.receiptNumber}</p>
          <p className="truncate text-xs text-slate-400">{row.purchaseOrderId}</p>
        </div>
      ),
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
        <div>
          <h1 className="text-xl font-bold text-slate-900">Goods Receipts (GRN)</h1>
          <p className="text-sm text-slate-500">
            Receive ordered goods — confirming a GRN updates inventory.
          </p>
        </div>
        <button type="button" className={primaryButtonClass} onClick={openCreate}>
          Receive goods
        </button>
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

      <ModalDrawer open={modalOpen} onClose={() => setModalOpen(false)} title="Receive goods">
        <div className="space-y-4">
          <div>
            <label className={labelClass}>Purchase order</label>
            <select
              className={inputClass}
              value={orderId}
              onChange={(event) => void selectOrder(event.target.value)}
            >
              <option value="">Select purchase order…</option>
              {recevableOrders.map((order) => (
                <option key={order.id} value={order.id}>
                  {order.orderNumber} — {order.supplier?.name ?? ''}
                </option>
              ))}
            </select>
          </div>

          {loadingItems && <p className="text-sm text-slate-500">Loading items…</p>}

            {lines.length > 0 && (
              <div className="space-y-2">
                <span className="text-xs font-medium text-slate-600">Receive quantities</span>
                {lines.map((line, index) => (
                  <div key={line.item.id} className="grid grid-cols-12 items-center gap-2">
                    <span className="col-span-3 truncate text-sm text-slate-600">
                      {line.item.productName ?? line.item.productId}
                    </span>
                    <input
                      className={`${inputClass} col-span-2`}
                      value={line.quantity}
                      onChange={(event) =>
                        setLines((current) =>
                          current.map((item, i) =>
                            i === index ? { ...item, quantity: event.target.value } : item,
                          ),
                        )
                      }
                      placeholder="Qty"
                    />
                    <input
                      className={`${inputClass} col-span-2`}
                      placeholder="Accepted"
                      value={line.acceptedQty}
                      onChange={(event) =>
                        setLines((current) =>
                          current.map((item, i) =>
                            i === index ? { ...item, acceptedQty: event.target.value } : item,
                          ),
                        )
                      }
                    />
                    <input
                      className={`${inputClass} col-span-2`}
                      placeholder="Rejected"
                      value={line.rejectedQty}
                      onChange={(event) =>
                        setLines((current) =>
                          current.map((item, i) =>
                            i === index ? { ...item, rejectedQty: event.target.value } : item,
                          ),
                        )
                      }
                    />
                    <input
                      className={`${inputClass} col-span-1`}
                      placeholder="Batch"
                      value={line.batchNumber}
                      onChange={(event) =>
                        setLines((current) =>
                          current.map((item, i) =>
                            i === index ? { ...item, batchNumber: event.target.value } : item,
                          ),
                        )
                      }
                    />
                    <input
                      type="date"
                      className={`${inputClass} col-span-2`}
                      placeholder="Expiry"
                      value={line.expiryAt}
                      onChange={(event) =>
                        setLines((current) =>
                          current.map((item, i) =>
                            i === index ? { ...item, expiryAt: event.target.value } : item,
                          ),
                        )
                      }
                    />
                  </div>
                ))}
              </div>
            )}

          {orderId && !loadingItems && lines.length === 0 && (
            <p className="text-sm text-slate-500">
              This purchase order has nothing left to receive.
            </p>
          )}

          <div>
            <label className={labelClass}>Notes</label>
            <input
              className={inputClass}
              value={notes}
              onChange={(event) => setNotes(event.target.value)}
            />
          </div>

          {formError && <p className="text-sm text-red-600">{formError}</p>}
          <div className="flex justify-end gap-2">
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
          </div>
        </div>
      </ModalDrawer>
    </div>
  )
}

export default PurchaseReceiptsPage
