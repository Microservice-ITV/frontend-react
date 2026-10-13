import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Plus, Trash2 } from 'lucide-react'
import SearchableSelect from '@/components/ui/SearchableSelect'
import ProductSearchSelect from '@/features/warehouse/components/ProductSearchSelect'
import { useWarehouses } from '@/features/warehouse/hooks/useWarehouseData'
import { purchaseApi, purchaseErrorMessage } from '../api/purchaseApi'
import { purchasePaths, type PurchaseAreaBase } from '../config/purchasePaths'

const primaryButtonClass =
  'inline-flex items-center justify-center rounded-lg bg-[var(--dni-primary)] px-4 py-2 text-sm font-medium text-white disabled:opacity-50'
const secondaryButtonClass =
  'inline-flex items-center justify-center rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-600 disabled:opacity-50'
const inputClass =
  'w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none focus:border-[var(--dni-primary)]'

type Line = { key: string; productId: string; quantity: string }

const nextLine = (): Line => ({
  key: `${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
  productId: '',
  quantity: '1',
})

const WarehouseOrderPage = ({ base }: { base: PurchaseAreaBase }) => {
  const paths = purchasePaths(base)
  const navigate = useNavigate()
  const { warehouses, loading: warehousesLoading } = useWarehouses({
    catalog: true,
    status: 'ACTIVE',
  })
  const [warehouseId, setWarehouseId] = useState('')
  const [lines, setLines] = useState<Line[]>([nextLine()])
  const [saving, setSaving] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)

  const submit = async () => {
    setFormError(null)
    if (!warehouseId) {
      setFormError('Select a warehouse.')
      return
    }
    const items = lines.filter((line) => line.productId)
    if (items.length === 0) {
      setFormError('Add at least one product.')
      return
    }
    if (items.some((line) => !Number.isInteger(Number(line.quantity)) || Number(line.quantity) <= 0)) {
      setFormError('Every line needs a whole quantity above 0.')
      return
    }
    setSaving(true)
    try {
      await purchaseApi.createPurchaseOrder({
        warehouseId,
        orderKind: 'WAREHOUSE',
        items: items.map((line) => ({
          productId: line.productId,
          quantity: Number(line.quantity),
          unitCost: 0,
        })),
      })
      navigate(paths.orders)
    } catch (err) {
      setFormError(purchaseErrorMessage(err))
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-4">
      <nav className="text-xs text-slate-500">
        <Link to={paths.root} className="hover:text-slate-700">
          Warehouse
        </Link>{' '}
        <span className="mx-1">/</span>
        <Link to={paths.orders} className="hover:text-slate-700">
          Purchase Orders
        </Link>{' '}
        <span className="mx-1">/</span>
        <span className="text-slate-700">Order from warehouse</span>
      </nav>

      <div>
        <h1 className="text-xl font-bold text-slate-900">Order from Warehouse</h1>
        <p className="text-sm text-slate-500">
          Request stock that is already in a warehouse. The warehouse manager approves it, and the
          products move into your inventory.
        </p>
      </div>

      <div className="max-w-3xl space-y-4 rounded-xl border border-slate-200 bg-white p-4">
        <label className="block text-xs font-medium text-slate-600">
          Warehouse
          <div className="mt-1">
            <SearchableSelect
              mode="scroll-only"
              value={warehouseId}
              onChange={setWarehouseId}
              emptyLabel={warehousesLoading ? 'Loading warehouses…' : 'Select warehouse…'}
              options={warehouses.map((warehouse) => ({
                value: warehouse.id,
                label: warehouse.name,
              }))}
            />
          </div>
        </label>

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-600">Products</span>
            <button
              type="button"
              className="inline-flex items-center gap-1 text-xs font-medium text-slate-500 hover:text-slate-700"
              onClick={() => setLines((current) => [...current, nextLine()])}
            >
              <Plus size={13} />
              Add product
            </button>
          </div>
          {lines.map((line) => (
            <div key={line.key} className="grid grid-cols-[minmax(0,1fr)_120px_36px] items-start gap-2">
              <ProductSearchSelect
                ownedOnly
                value={line.productId}
                onChange={(productId) =>
                  setLines((current) =>
                    current.map((row) => (row.key === line.key ? { ...row, productId } : row)),
                  )
                }
              />
              <input
                type="number"
                min={1}
                step={1}
                value={line.quantity}
                onChange={(event) =>
                  setLines((current) =>
                    current.map((row) =>
                      row.key === line.key ? { ...row, quantity: event.target.value } : row,
                    ),
                  )
                }
                className={inputClass}
                aria-label="Quantity"
              />
              <button
                type="button"
                className="mt-1 text-slate-400 hover:text-red-600 disabled:opacity-40"
                disabled={lines.length === 1}
                onClick={() => setLines((current) => current.filter((row) => row.key !== line.key))}
                aria-label="Remove product"
              >
                <Trash2 size={16} />
              </button>
            </div>
          ))}
        </div>

        {formError && <p className="text-sm text-red-600">{formError}</p>}

        <div className="flex justify-end gap-2 border-t border-slate-200 pt-4">
          <button
            type="button"
            className={secondaryButtonClass}
            disabled={saving}
            onClick={() => navigate(paths.orders)}
          >
            Discard
          </button>
          <button
            type="button"
            className={primaryButtonClass}
            disabled={saving}
            onClick={() => void submit()}
          >
            {saving ? 'Saving…' : 'Submit order'}
          </button>
        </div>
      </div>
    </div>
  )
}

export default WarehouseOrderPage
