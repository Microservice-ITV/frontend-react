import { useState } from 'react'
import { Link } from 'react-router-dom'
import DataTable, { type DataTableColumn } from '@/components/ui/DataTable'
import FilterBar from '@/components/ui/FilterBar'
import ModalDrawer from '@/components/ui/ModalDrawer'
import ProductSearchSelect from '@/features/warehouse/components/ProductSearchSelect'
import { PurchaseReturnStatusBadge } from '../components/PurchaseBadges'
import { purchaseApi, purchaseErrorMessage } from '../api/purchaseApi'
import { purchasePaths, type PurchaseAreaBase } from '../config/purchasePaths'
import { usePurchaseOrders, usePurchaseReturns, useSuppliers } from '../hooks/usePurchaseData'
import type { PurchaseReturn, PurchaseReturnStatus } from '../types/purchaseTypes'
import { useWarehouses } from '@/features/warehouse/hooks/useWarehouseData'

const primaryButtonClass =
  'inline-flex items-center justify-center rounded-lg bg-[var(--dni-primary)] px-4 py-2 text-sm font-medium text-white disabled:opacity-50'
const secondaryButtonClass =
  'inline-flex items-center justify-center rounded-lg border border-slate-200 px-3 py-2 text-sm font-medium text-slate-600 disabled:opacity-50'
const subtleButtonClass =
  'text-xs font-medium text-slate-500 hover:text-slate-700 disabled:opacity-40'
const inputClass =
  'w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-900 outline-none focus:border-[var(--dni-primary)]'
const labelClass = 'mb-1 block text-xs font-medium text-slate-600'

type LineItem = {
  productId: string
  variantId: string
  quantity: string
  unitCost: string
}

const emptyLine: LineItem = { productId: '', variantId: '', quantity: '1', unitCost: '0' }

export type PurchaseReturnsPageProps = {
  base: PurchaseAreaBase
  platform?: boolean
}

const PurchaseReturnsPage = ({ base }: PurchaseReturnsPageProps) => {
  const paths = purchasePaths(base)
  const [status, setStatus] = useState<PurchaseReturnStatus | ''>('')
  const [search, setSearch] = useState('')
  const { returns, loading, error, reload } = usePurchaseReturns({ status })
  const { suppliers } = useSuppliers()
  const { warehouses } = useWarehouses()
  const { orders } = usePurchaseOrders()

  const [modalOpen, setModalOpen] = useState(false)
  const [supplierId, setSupplierId] = useState('')
  const [warehouseId, setWarehouseId] = useState('')
  const [orderId, setOrderId] = useState('')
  const [reason, setReason] = useState('')
  const [lines, setLines] = useState<LineItem[]>([{ ...emptyLine }])
  const [saving, setSaving] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)
  const [feedback, setFeedback] = useState<string | null>(null)

  const term = search.trim().toLowerCase()
  const rows = term
    ? returns.filter((item) => `${item.returnNumber}`.toLowerCase().includes(term))
    : returns

  const openCreate = () => {
    setSupplierId('')
    setWarehouseId('')
    setOrderId('')
    setReason('')
    setLines([{ ...emptyLine }])
    setFormError(null)
    setModalOpen(true)
  }

  const updateLine = (index: number, patch: Partial<LineItem>) => {
    setLines((current) =>
      current.map((line, i) => (i === index ? { ...line, ...patch } : line)),
    )
  }

  const handleCreate = async () => {
    setFormError(null)
    if (!supplierId || !warehouseId) {
      setFormError('Select a supplier and a warehouse.')
      return
    }
    const items = lines
      .map((line) => ({
        productId: line.productId.trim(),
        variantId: line.variantId.trim() || undefined,
        quantity: Number(line.quantity),
        unitCost: Number(line.unitCost),
      }))
      .filter((item) => item.productId)

    if (items.length === 0 || items.some((item) => !item.quantity || item.quantity <= 0)) {
      setFormError('Add at least one item with a valid product and quantity.')
      return
    }

    setSaving(true)
    try {
      await purchaseApi.createPurchaseReturn({
        supplierId,
        warehouseId,
        purchaseOrderId: orderId || null,
        reason: reason || null,
        items,
      })
      setModalOpen(false)
      await reload()
    } catch (err) {
      setFormError(purchaseErrorMessage(err))
    } finally {
      setSaving(false)
    }
  }

  const postReturn = async (id: string) => {
    setFeedback(null)
    try {
      await purchaseApi.postPurchaseReturn(id)
      await reload()
    } catch (err) {
      setFeedback(purchaseErrorMessage(err))
    }
  }

  const columns: Array<DataTableColumn<PurchaseReturn>> = [
    {
      key: 'returnNumber',
      header: 'Return',
      sortValue: (row) => row.returnNumber,
      render: (row) => (
        <div className="min-w-0">
          <p className="font-medium text-slate-900">{row.returnNumber}</p>
          <p className="truncate text-xs text-slate-400">{row.purchaseOrderId ?? '—'}</p>
        </div>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      width: '140px',
      sortValue: (row) => row.status,
      render: (row) => <PurchaseReturnStatusBadge status={row.status} />,
    },
    {
      key: 'actions',
      header: '',
      align: 'right',
      width: '140px',
      render: (row) =>
        row.status === 'DRAFT' ? (
          <button type="button" className={subtleButtonClass} onClick={() => void postReturn(row.id)}>
            Post return
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
        <span className="text-slate-700">Purchase Returns</span>
      </nav>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Purchase Returns</h1>
          <p className="text-sm text-slate-500">Return goods to your suppliers.</p>
        </div>
        <button type="button" className={primaryButtonClass} onClick={openCreate}>
          New return
        </button>
      </div>

      {feedback && <p className="text-sm text-red-600">{feedback}</p>}

      <FilterBar
        search={{
          value: search,
          onChange: setSearch,
          placeholder: 'Search return number…',
        }}
        selects={[
          {
            key: 'status',
            label: 'Status',
            value: status,
            allLabel: 'All statuses',
            onChange: (value) => setStatus(value as PurchaseReturnStatus | ''),
            options: [
              { value: 'DRAFT', label: 'Draft' },
              { value: 'POSTED', label: 'Posted' },
              { value: 'CANCELLED', label: 'Cancelled' },
            ],
          },
        ]}
      />

      <DataTable<PurchaseReturn>
        columns={columns}
        rows={rows}
        rowKey={(row) => row.id}
        loading={loading}
        error={error}
        emptyMessage="No purchase returns found."
        itemLabel="returns"
        minWidth="860px"
        fixedLayout
      />

      <ModalDrawer open={modalOpen} onClose={() => setModalOpen(false)} title="New purchase return">
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelClass}>Supplier</label>
              <select
                className={inputClass}
                value={supplierId}
                onChange={(event) => setSupplierId(event.target.value)}
              >
                <option value="">Select supplier…</option>
                {suppliers.map((supplier) => (
                  <option key={supplier.id} value={supplier.id}>
                    {supplier.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className={labelClass}>Warehouse</label>
              <select
                className={inputClass}
                value={warehouseId}
                onChange={(event) => setWarehouseId(event.target.value)}
              >
                <option value="">Select warehouse…</option>
                {warehouses.map((warehouse) => (
                  <option key={warehouse.id} value={warehouse.id}>
                    {warehouse.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div>
            <label className={labelClass}>Related purchase order (optional)</label>
            <select
              className={inputClass}
              value={orderId}
              onChange={(event) => setOrderId(event.target.value)}
            >
              <option value="">None</option>
              {orders.map((order) => (
                <option key={order.id} value={order.id}>
                  {order.orderNumber}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className={labelClass}>Reason</label>
            <input
              className={inputClass}
              value={reason}
              onChange={(event) => setReason(event.target.value)}
            />
          </div>
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-slate-600">Line items</span>
              <button
                type="button"
                className={subtleButtonClass}
                onClick={() => setLines((current) => [...current, { ...emptyLine }])}
              >
                + Add item
              </button>
            </div>
            {lines.map((line, index) => (
              <div key={index} className="grid grid-cols-12 items-center gap-2">
                <div className="col-span-6">
                  <ProductSearchSelect
                    ownedOnly={base === '/seller'}
                    value={line.productId}
                    onChange={(productId) => updateLine(index, { productId })}
                  />
                </div>
                <input
                  className={`${inputClass} col-span-2`}
                  placeholder="Qty"
                  value={line.quantity}
                  onChange={(event) => updateLine(index, { quantity: event.target.value })}
                />
                <input
                  className={`${inputClass} col-span-3`}
                  placeholder="Unit cost"
                  value={line.unitCost}
                  onChange={(event) => updateLine(index, { unitCost: event.target.value })}
                />
                <button
                  type="button"
                  className={subtleButtonClass}
                  disabled={lines.length === 1}
                  onClick={() => setLines((current) => current.filter((_, i) => i !== index))}
                >
                  ✕
                </button>
              </div>
            ))}
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
              {saving ? 'Creating…' : 'Create return'}
            </button>
          </div>
        </div>
      </ModalDrawer>
    </div>
  )
}

export default PurchaseReturnsPage
