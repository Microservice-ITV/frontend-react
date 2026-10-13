import { useEffect, useMemo, useState } from 'react'
import SearchableSelect from '@/components/ui/SearchableSelect'
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
  sellerMode?: boolean
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
  sellerMode = false,
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
  const [destinations, setDestinations] = useState<Warehouse[]>([])
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})

  useEffect(() => {
    let cancelled = false
    void warehouseApi
      .listWarehouses({ catalog: true, status: 'ACTIVE' })
      .then((response) => {
        if (!cancelled) setDestinations(response.data?.data ?? [])
      })
      .catch(() => {
        if (!cancelled) setDestinations([])
      })
    return () => {
      cancelled = true
    }
  }, [])

  useEffect(() => {
    const first = sellerMode ? '' : defaultWarehouseId || selectableWarehouses[0]?.id || ''
    setFromWarehouseId(first)
    setToWarehouseId('')
    setProductId(defaultProductId ?? '')
    setReferenceId(buildReferenceId())
  }, [defaultWarehouseId, defaultProductId, selectableWarehouses, sellerMode])

  const sourceWarehouses = useMemo(() => {
    const pool = sellerMode && destinations.length > 0 ? destinations : selectableWarehouses
    return pool.filter((warehouse) => warehouse.status !== 'INACTIVE')
  }, [destinations, selectableWarehouses, sellerMode])

  const destinationWarehouses = useMemo(() => {
    const pool = destinations.length > 0 ? destinations : selectableWarehouses
    return pool.filter(
      (warehouse) => warehouse.status !== 'INACTIVE' && warehouse.id !== fromWarehouseId,
    )
  }, [destinations, selectableWarehouses, fromWarehouseId])

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
          <SearchableSelect
            mode="scroll-only"
            value={fromWarehouseId}
            onChange={(next) => {
              setFromWarehouseId(next)
              if (next === toWarehouseId) setToWarehouseId('')
            }}
            emptyLabel="Select source…"
            aria-invalid={Boolean(fieldErrors.fromWarehouseId)}
            options={sourceWarehouses.map((warehouse) => ({
              value: warehouse.id,
              label: warehouse.name,
            }))}
          />
        </FormField>

        <FormField label="To warehouse" required error={fieldErrors.toWarehouseId}>
          <SearchableSelect
            mode="scroll-only"
            value={toWarehouseId}
            onChange={setToWarehouseId}
            emptyLabel="Select destination…"
            aria-invalid={Boolean(fieldErrors.toWarehouseId)}
            options={destinationWarehouses.map((warehouse) => ({
              value: warehouse.id,
              label: warehouse.name,
            }))}
          />
        </FormField>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <FormField label="Product" required error={fieldErrors.productId}>
          <ProductSearchSelect
            ownedOnly={sellerMode}
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
        Transfers start as <span className="font-semibold">pending</span>.{' '}
        {sellerMode
          ? 'The source warehouse manager completes the transfer, then the destination warehouse manager clicks Received.'
          : 'The seller approves the request, then you complete the transfer.'}
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
