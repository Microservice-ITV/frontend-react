import { useEffect, useMemo, useState } from 'react'
import ProductSearchSelect from '../ProductSearchSelect'
import { warehouseApi, warehouseErrorMessage } from '../../api/warehouseApi'
import type { Warehouse } from '../../types/warehouseTypes'
import {
  FormField,
  invalidTextInputClass,
  primaryButtonClass,
  secondaryButtonClass,
  textInputClass,
} from './FormField'

export type TransferStockFormProps = {
  warehouses: Warehouse[]
  defaultWarehouseId?: string
  defaultProductId?: string
  onSuccess: () => void
}

const buildReferenceId = () =>
  `TRF-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}-${Math.random()
    .toString(36)
    .slice(2, 6)
    .toUpperCase()}`

const TransferStockForm = ({
  warehouses,
  defaultWarehouseId,
  defaultProductId,
  onSuccess,
}: TransferStockFormProps) => {
  const selectableWarehouses = useMemo(
    () =>
      warehouses.filter((warehouse) => warehouse.status === 'ACTIVE').length
        ? warehouses.filter((warehouse) => warehouse.status === 'ACTIVE')
        : warehouses,
    [warehouses],
  )

  const [fromWarehouseId, setFromWarehouseId] = useState('')
  const [toWarehouseId, setToWarehouseId] = useState('')
  const [productId, setProductId] = useState('')
  const [quantity, setQuantity] = useState('')
  const [referenceId, setReferenceId] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})

  useEffect(() => {
    const first = defaultWarehouseId ?? selectableWarehouses[0]?.id ?? ''
    setFromWarehouseId(first)
    setToWarehouseId(selectableWarehouses.find((item) => item.id !== first)?.id ?? '')
    setProductId(defaultProductId ?? '')
    setReferenceId(buildReferenceId())
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [defaultWarehouseId, defaultProductId])

  const submit = async () => {
    const errors: Record<string, string> = {}
    if (!fromWarehouseId) errors.fromWarehouseId = 'Select a source warehouse.'
    if (!toWarehouseId) errors.toWarehouseId = 'Select a destination warehouse.'
    if (fromWarehouseId && fromWarehouseId === toWarehouseId) {
      errors.toWarehouseId = 'Source and destination must be different.'
    }
    if (!productId) errors.productId = 'Search and select a product.'
    if (!Number.isInteger(Number(quantity)) || Number(quantity) <= 0) {
      errors.quantity = 'Quantity must be a whole number above 0.'
    }
    if (referenceId.trim().length < 2) errors.referenceId = 'Reference ID is required.'

    setFieldErrors(errors)
    if (Object.keys(errors).length > 0) return

    setSubmitting(true)
    setError(null)
    try {
      await warehouseApi.transferStock({
        fromWarehouseId,
        toWarehouseId,
        productId,
        quantity: Number(quantity),
        referenceId: referenceId.trim(),
        referenceType: 'TRANSFER',
      })
      setQuantity('')
      setReferenceId(buildReferenceId())
      onSuccess()
    } catch (err) {
      setError(warehouseErrorMessage(err))
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="space-y-4">
      {error && (
        <div className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">
          {error}
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2">
        <FormField label="From warehouse" required error={fieldErrors.fromWarehouseId}>
          <select
            value={fromWarehouseId}
            onChange={(event) => setFromWarehouseId(event.target.value)}
            className={`${textInputClass} cursor-pointer ${
              fieldErrors.fromWarehouseId ? invalidTextInputClass : ''
            }`}
          >
            <option value="">Select source…</option>
            {selectableWarehouses.map((warehouse) => (
              <option key={warehouse.id} value={warehouse.id}>
                {warehouse.name}
              </option>
            ))}
          </select>
        </FormField>

        <FormField label="To warehouse" required error={fieldErrors.toWarehouseId}>
          <select
            value={toWarehouseId}
            onChange={(event) => setToWarehouseId(event.target.value)}
            className={`${textInputClass} cursor-pointer ${
              fieldErrors.toWarehouseId ? invalidTextInputClass : ''
            }`}
          >
            <option value="">Select destination…</option>
            {selectableWarehouses
              .filter((warehouse) => warehouse.id !== fromWarehouseId)
              .map((warehouse) => (
                <option key={warehouse.id} value={warehouse.id}>
                  {warehouse.name}
                </option>
              ))}
          </select>
        </FormField>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <FormField label="Product" required error={fieldErrors.productId}>
          <ProductSearchSelect
            value={productId}
            onChange={setProductId}
            aria-invalid={Boolean(fieldErrors.productId)}
          />
        </FormField>

        <FormField label="Quantity" required error={fieldErrors.quantity}>
          <input
            type="number"
            min={1}
            step={1}
            value={quantity}
            onChange={(event) => setQuantity(event.target.value)}
            placeholder="0"
            className={`${textInputClass} ${
              fieldErrors.quantity ? invalidTextInputClass : ''
            }`}
          />
        </FormField>
      </div>

      <FormField label="Reference ID" required error={fieldErrors.referenceId}>
        <input
          type="text"
          value={referenceId}
          onChange={(event) => setReferenceId(event.target.value)}
          placeholder="e.g. DEPOT-NOTE-07"
          className={`${textInputClass} ${
            fieldErrors.referenceId ? invalidTextInputClass : ''
          }`}
        />
      </FormField>

      <div className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-700">
        Transfers start as <span className="font-semibold">pending</span> and only move
        stock after a warehouse approves them.
      </div>

      <div className="flex justify-end gap-3 border-t border-[var(--dni-border)] pt-4">
        <button
          type="button"
          onClick={() => {
            setFieldErrors({})
            setError(null)
            setQuantity('')
          }}
          className={secondaryButtonClass}
          disabled={submitting}
        >
          Clear
        </button>
        <button
          type="button"
          onClick={() => void submit()}
          className={primaryButtonClass}
          disabled={submitting}
        >
          {submitting ? 'Submitting…' : 'Submit transfer request'}
        </button>
      </div>
    </div>
  )
}

export default TransferStockForm
