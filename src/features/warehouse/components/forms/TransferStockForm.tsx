import { useEffect, useMemo, useState } from 'react'
import SearchableSelect from '@/components/ui/SearchableSelect'
import ProductSearchSelect from '../ProductSearchSelect'
import { warehouseApi, warehouseErrorMessage } from '../../api/warehouseApi'
import { warehouseCapacityLabel, type Warehouse } from '../../types/warehouseTypes'
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
  defaultVariantId?: string
  sellerMode?: boolean
  /** Seller warehouse→warehouse: no seller approval step. */
  skipSellerApprovalHint?: boolean
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
  defaultVariantId,
  sellerMode = false,
  skipSellerApprovalHint = false,
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
  const [variantId, setVariantId] = useState('')
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
    setVariantId(defaultVariantId ?? '')
    setReferenceId(buildReferenceId())
  }, [defaultWarehouseId, defaultProductId, defaultVariantId, selectableWarehouses, sellerMode])

  const destinationWarehouses = useMemo(() => {
    const pool = destinations.length > 0 ? destinations : selectableWarehouses
    return pool.filter(
      (warehouse) =>
        warehouse.status !== 'INACTIVE' && (!sellerMode ? warehouse.id !== fromWarehouseId : true),
    )
  }, [destinations, selectableWarehouses, fromWarehouseId, sellerMode])

  const sourceWarehouses = useMemo(() => {
    const pool = selectableWarehouses
    return pool.filter((warehouse) => warehouse.status !== 'INACTIVE')
  }, [selectableWarehouses])

  const submit = async () => {
    const errors: Record<string, string> = {}
    if (!sellerMode && !fromWarehouseId) errors.fromWarehouseId = 'Select a source warehouse.'
    if (!toWarehouseId) errors.toWarehouseId = 'Select a destination warehouse.'
    if (!sellerMode && fromWarehouseId && fromWarehouseId === toWarehouseId) {
      errors.toWarehouseId = 'Source and destination must be different.'
    }
    const destination = destinationWarehouses.find((warehouse) => warehouse.id === toWarehouseId)
    if (destination?.isAtCapacity) {
      errors.toWarehouseId = `${destination.name} is at full capacity. Choose another warehouse.`
    }
    if (!productId) errors.productId = 'Search and select a product.'
    if (!Number.isInteger(Number(quantity)) || Number(quantity) <= 0) {
      errors.quantity = 'Quantity must be a whole number above 0.'
    } else if (
      destination?.capacityUnits != null &&
      destination.remainingUnits != null &&
      Number(quantity) > destination.remainingUnits
    ) {
      errors.quantity = `${destination.name} only has ${destination.remainingUnits} units of capacity remaining.`
    }
    if (referenceId.trim().length < 2) errors.referenceId = 'Reference ID is required.'

    setFieldErrors(errors)
    if (Object.keys(errors).length > 0) return

    setSubmitting(true)
    setError(null)
    try {
      if (sellerMode) {
        await warehouseApi.transferStock({
          fromSeller: true,
          toWarehouseId,
          productId,
          variantId: variantId || undefined,
          quantity: Number(quantity),
          referenceId: referenceId.trim(),
          referenceType: 'SELLER_TRANSFER',
        })
      } else {
        await warehouseApi.transferStock({
          fromWarehouseId,
          toWarehouseId,
          productId,
          variantId: variantId || undefined,
          quantity: Number(quantity),
          referenceId: referenceId.trim(),
          referenceType: 'TRANSFER',
          sellerInitiated: skipSellerApprovalHint || undefined,
        })
      }
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
        {sellerMode ? (
          <FormField label="From">
            <div className={`${textInputClass} bg-slate-50 text-slate-700`}>My inventory</div>
          </FormField>
        ) : (
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
        )}

        <FormField label="To warehouse" required error={fieldErrors.toWarehouseId}>
          <SearchableSelect
            mode="scroll-only"
            value={toWarehouseId}
            onChange={setToWarehouseId}
            emptyLabel="Select destination…"
            aria-invalid={Boolean(fieldErrors.toWarehouseId)}
            options={destinationWarehouses.map((warehouse) => ({
              value: warehouse.id,
              label: `${warehouse.name} (${warehouseCapacityLabel(warehouse)})`,
              disabled: Boolean(warehouse.isAtCapacity),
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
        {sellerMode ? (
          <>
            Stock leaves your inventory after the warehouse manager approves and clicks{' '}
            <span className="font-semibold">Received</span>.
          </>
        ) : skipSellerApprovalHint ? (
          <>
            No seller approval needed — status is set to <span className="font-semibold">Approved</span>.
            The warehouse manager must click <span className="font-semibold">Complete transfer</span>{' '}
            to move stock.
          </>
        ) : (
          <>
            Transfers start as <span className="font-semibold">pending</span>. The seller approves
            the request, then you complete the transfer.
          </>
        )}
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
          {submitting ? 'Submitting…' : sellerMode ? 'Send to warehouse' : 'Submit transfer request'}
        </button>
      </div>
    </div>
  )
}

export default TransferStockForm
