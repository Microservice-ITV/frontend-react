import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Plus, Trash2 } from 'lucide-react'
import SearchableSelect from '@/components/ui/SearchableSelect'
import ProductSearchSelect from '@/features/warehouse/components/ProductSearchSelect'
import { useWarehouses } from '@/features/warehouse/hooks/useWarehouseData'
import { warehouseApi } from '@/features/warehouse/api/warehouseApi'
import type { InventoryStock } from '@/features/warehouse/types/warehouseTypes'
import {
  parseVariantId,
  variantDisplayLabel,
} from '@/features/warehouse/utils/variantLabel'
import { notifyDashboardMenuBadgesChanged } from '@/features/dashboard/dashboardMenuBadges'
import { purchaseApi, purchaseErrorMessage } from '../api/purchaseApi'
import { purchasePaths, type PurchaseAreaBase } from '../config/purchasePaths'

const primaryButtonClass =
  'inline-flex items-center justify-center rounded-lg bg-[var(--dni-primary)] px-4 py-2 text-sm font-medium text-white disabled:opacity-50'
const secondaryButtonClass =
  'inline-flex items-center justify-center rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-600 disabled:opacity-50'
const inputClass =
  'w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none focus:border-[var(--dni-primary)]'

/** Sentinel for inventory rows with an empty variant key. */
const NO_VARIANT_VALUE = '__no_variant__'

type Line = {
  key: string
  productId: string
  productLabel: string
  variantId: string
  colorId: string
  sizeId: string
  colorName: string
  sizeName: string
  quantity: string
}

const nextLine = (): Line => ({
  key: `${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
  productId: '',
  productLabel: '',
  variantId: '',
  colorId: '',
  sizeId: '',
  colorName: '',
  sizeName: '',
  quantity: '1',
})

const stockKey = (productId: string, variantId: string) =>
  `${productId}::${variantId || NO_VARIANT_VALUE}`

const WarehouseOrderPage = ({ base }: { base: PurchaseAreaBase }) => {
  const paths = purchasePaths(base)
  const navigate = useNavigate()
  const { warehouses, loading: warehousesLoading } = useWarehouses({
    catalog: true,
    status: 'ACTIVE',
  })
  const [warehouseId, setWarehouseId] = useState('')
  const [inventory, setInventory] = useState<InventoryStock[]>([])
  const [inventoryLoading, setInventoryLoading] = useState(false)
  const [lines, setLines] = useState<Line[]>([nextLine()])
  const [saving, setSaving] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)

  useEffect(() => {
    if (!warehouseId) {
      setInventory([])
      return
    }
    let cancelled = false
    setInventoryLoading(true)
    void warehouseApi
      .listInventory(warehouseId)
      .then((response) => {
        if (!cancelled) setInventory(response.data?.data ?? [])
      })
      .catch(() => {
        if (!cancelled) setInventory([])
      })
      .finally(() => {
        if (!cancelled) setInventoryLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [warehouseId])

  const availableByKey = useMemo(() => {
    const map = new Map<string, number>()
    for (const row of inventory) {
      const key = stockKey(row.productId, row.variantId)
      map.set(key, (map.get(key) ?? 0) + Number(row.availableQty ?? 0))
    }
    return map
  }, [inventory])

  const applyVariantToLine = (line: Line, variantValue: string): Line => {
    if (!variantValue || variantValue === NO_VARIANT_VALUE) {
      return {
        ...line,
        variantId: '',
        colorId: '',
        sizeId: '',
        colorName: '',
        sizeName: '',
      }
    }
    const row = inventory.find(
      (entry) =>
        entry.productId === line.productId &&
        (entry.variantId || NO_VARIANT_VALUE) === variantValue,
    )
    const parsed = parseVariantId(variantValue)
    return {
      ...line,
      variantId: variantValue,
      colorId: parsed.colorId || '',
      sizeId: parsed.sizeId || '',
      colorName: row?.colorName?.trim() || parsed.colorName || '',
      sizeName: row?.sizeName?.trim() || parsed.sizeName || '',
    }
  }

  const variantOptionsForProduct = (productId: string) => {
    if (!productId) return []
    const byVariant = new Map<
      string,
      { value: string; label: string; available: number; name: string }
    >()
    for (const row of inventory) {
      if (row.productId !== productId) continue
      const available = Number(row.availableQty ?? 0)
      if (available <= 0) continue
      const value = row.variantId?.trim() ? row.variantId : NO_VARIANT_VALUE
      const name =
        variantDisplayLabel(row.variantId, {
          colorName: row.colorName,
          sizeName: row.sizeName,
          variantLabel: row.variantLabel,
        }) || 'Standard'
      const existing = byVariant.get(value)
      if (existing) {
        existing.available += available
        existing.label = `${existing.name} · ${existing.available} available`
        continue
      }
      byVariant.set(value, {
        value,
        name,
        available,
        label: `${name} · ${available} available`,
      })
    }
    return [...byVariant.values()].sort((a, b) => a.label.localeCompare(b.label))
  }

  // After inventory loads, auto-pick the only available variation for each line.
  useEffect(() => {
    if (inventoryLoading || inventory.length === 0) return
    setLines((current) => {
      let changed = false
      const next = current.map((row) => {
        if (!row.productId || row.variantId.trim()) return row
        const options = variantOptionsForProduct(row.productId)
        if (options.length !== 1) return row
        changed = true
        return applyVariantToLine(row, options[0].value)
      })
      return changed ? next : current
    })
  }, [inventory, inventoryLoading])

  const checkWarehouseStock = (
    items: Array<{
      productId: string
      productLabel: string
      variantId: string
      colorName: string
      sizeName: string
      quantity: number
    }>,
  ): string | null => {
    const warehouseName =
      warehouses.find((warehouse) => warehouse.id === warehouseId)?.name ?? 'this warehouse'
    const shortages: string[] = []
    for (const item of items) {
      const available = availableByKey.get(stockKey(item.productId, item.variantId)) ?? 0
      if (available < item.quantity) {
        const variation = [item.colorName, item.sizeName].filter(Boolean).join(' / ')
        const base = item.productLabel.trim() || 'A product'
        const label = variation ? `${base} (${variation})` : base
        shortages.push(
          `${label}: available ${available}, requested ${item.quantity} in ${warehouseName}.`,
        )
      }
    }
    if (shortages.length === 0) return null
    return `Not enough stock in the warehouse. ${shortages.join(' ')}`
  }

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
    for (const line of items) {
      const options = variantOptionsForProduct(line.productId)
      if (options.length === 0) {
        setFormError(
          `${line.productLabel || 'A product'} has no available stock in this warehouse.`,
        )
        return
      }
      const selectedValue = line.variantId.trim() ? line.variantId : NO_VARIANT_VALUE
      if (!options.some((option) => option.value === selectedValue)) {
        setFormError(`Choose a variation for ${line.productLabel || 'each product'}.`)
        return
      }
    }

    const stockItems = items.map((line) => ({
      productId: line.productId,
      productLabel: line.productLabel,
      variantId: line.variantId,
      colorName: line.colorName,
      sizeName: line.sizeName,
      quantity: Number(line.quantity),
    }))

    setSaving(true)
    try {
      const shortage = checkWarehouseStock(stockItems)
      if (shortage) {
        setFormError(shortage)
        return
      }

      await purchaseApi.createPurchaseOrder({
        warehouseId,
        orderKind: 'WAREHOUSE',
        items: items.map((line) => ({
          productId: line.productId,
          productName: line.productLabel || undefined,
          variantId: line.variantId || undefined,
          colorId: line.colorId || null,
          sizeId: line.sizeId || null,
          colorName: line.colorName || null,
          sizeName: line.sizeName || null,
          quantity: Number(line.quantity),
          unitCost: 0,
        })),
      })
      notifyDashboardMenuBadgesChanged()
      navigate(paths.warehouseOrders, {
        state: {
          message: 'Request submitted. Waiting for the warehouse manager to approve.',
        },
      })
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
        <Link to={paths.warehouseOrders} className="hover:text-slate-700">
          Orders from warehouse
        </Link>{' '}
        <span className="mx-1">/</span>
        <span className="text-slate-700">New request</span>
      </nav>

      <div>
        <h1 className="text-xl font-bold text-slate-900">Order from Warehouse</h1>
        <p className="text-sm text-slate-500">
          Request stock that is already in a warehouse. Choose the product variation, then the
          warehouse manager approves it and you receive it into shop stock.
        </p>
      </div>

      <div className="max-w-4xl space-y-4 rounded-xl border border-slate-200 bg-white p-4">
        <label className="block text-xs font-medium text-slate-600">
          Warehouse
          <div className="mt-1">
            <SearchableSelect
              mode="scroll-only"
              value={warehouseId}
              onChange={(next) => {
                setWarehouseId(next)
                setLines((current) =>
                  current.map((row) => ({
                    ...row,
                    variantId: '',
                    colorId: '',
                    sizeId: '',
                    colorName: '',
                    sizeName: '',
                  })),
                )
              }}
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
          {lines.map((line) => {
            const variantOptions = variantOptionsForProduct(line.productId)
            const selectedVariantValue = line.variantId.trim()
              ? line.variantId
              : ''
            return (
              <div
                key={line.key}
                className="grid grid-cols-1 items-start gap-2 sm:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)_110px_36px]"
              >
                <ProductSearchSelect
                  ownedOnly
                  value={line.productId}
                  onChange={(productId, option) =>
                    setLines((current) =>
                      current.map((row) => {
                        if (row.key !== line.key) return row
                        const next: Line = {
                          ...row,
                          productId,
                          productLabel: option?.label ?? row.productLabel,
                          variantId: '',
                          colorId: '',
                          sizeId: '',
                          colorName: '',
                          sizeName: '',
                        }
                        const options = variantOptionsForProduct(productId)
                        if (options.length === 1) {
                          return applyVariantToLine(next, options[0].value)
                        }
                        return next
                      }),
                    )
                  }
                />
                <SearchableSelect
                  mode="scroll-only"
                  value={selectedVariantValue}
                  onChange={(variantValue) =>
                    setLines((current) =>
                      current.map((row) =>
                        row.key === line.key ? applyVariantToLine(row, variantValue) : row,
                      ),
                    )
                  }
                  disabled={!line.productId || !warehouseId || inventoryLoading}
                  emptyLabel={
                    !warehouseId
                      ? 'Select warehouse first…'
                      : !line.productId
                        ? 'Select product first…'
                        : inventoryLoading
                          ? 'Loading variations…'
                          : variantOptions.length === 0
                            ? 'No stock in warehouse'
                            : 'Select variation…'
                  }
                  options={variantOptions.map((option) => ({
                    value: option.value,
                    label: option.label,
                  }))}
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
                  onClick={() =>
                    setLines((current) => current.filter((row) => row.key !== line.key))
                  }
                  aria-label="Remove product"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            )
          })}
        </div>

        {formError && (
          <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
            {formError}
          </div>
        )}

        <div className="flex justify-end gap-2 border-t border-slate-200 pt-4">
          <button
            type="button"
            className={secondaryButtonClass}
            disabled={saving}
            onClick={() => navigate(paths.warehouseOrders)}
          >
            Discard
          </button>
          <button
            type="button"
            className={primaryButtonClass}
            disabled={saving}
            onClick={() => void submit()}
          >
            {saving ? 'Saving…' : 'Submit request'}
          </button>
        </div>
      </div>
    </div>
  )
}

export default WarehouseOrderPage
