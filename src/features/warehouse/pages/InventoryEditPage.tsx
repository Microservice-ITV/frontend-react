import { useEffect, useState, type FormEvent } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { sellerProductApi, sellerProductErrorMessage } from '@/features/seller/api/sellerProductApi'
import { warehouseApi, warehouseErrorMessage } from '../api/warehouseApi'
import DetailRow from '../components/DetailRow'
import { StockStatusBadge } from '../components/StockStatusBadge'
import type { WarehouseAreaBase } from '../config/warehousePaths'
import { warehousePaths } from '../config/warehousePaths'
import { productLabel, useProductNames } from '../hooks/useProductNames'
import {
  clearVariantPricingCache,
  formatUnitPrice,
  useVariantPricing,
} from '../hooks/useVariantPricing'
import type { InventoryStock } from '../types/warehouseTypes'
import { variantDisplayLabel } from '../utils/variantLabel'

export type InventoryEditPageProps = {
  base: WarehouseAreaBase
}

const inputClass =
  'mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none transition-colors placeholder:text-slate-400 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500'
const labelClass = 'block text-xs font-medium text-slate-600'
const sectionClass = 'rounded-xl border border-slate-200 bg-white p-5 sm:p-6'

const InventoryEditPage = ({ base }: InventoryEditPageProps) => {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const paths = warehousePaths(base)
  const productNames = useProductNames()

  const warehouseId = searchParams.get('warehouseId') ?? ''
  const stockId = searchParams.get('stockId') ?? ''

  const [stock, setStock] = useState<InventoryStock | null>(null)
  const [warehouseName, setWarehouseName] = useState('')
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState('')
  const [submitError, setSubmitError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [sellingPrice, setSellingPrice] = useState('')
  const [unitPrice, setUnitPrice] = useState('')

  useEffect(() => {
    if (!warehouseId) {
      setLoadError('This inventory row is missing its warehouse reference.')
      setLoading(false)
      return
    }
    let cancelled = false
    const load = async () => {
      setLoading(true)
      setLoadError('')
      try {
        const [inventoryResponse, warehouseResponse] = await Promise.all([
          warehouseApi.listInventory(warehouseId),
          warehouseApi.getWarehouse(warehouseId).catch(() => null),
        ])
        const rows = inventoryResponse.data?.data ?? []
        const row = rows.find((item) => item.id === stockId) ?? null
        if (cancelled) return
        if (!row) {
          setLoadError('This inventory row no longer exists.')
          return
        }
        setStock(row)
        setUnitPrice(row.unitPrice != null ? String(row.unitPrice) : '')
        setWarehouseName(warehouseResponse?.data?.data?.name ?? '')
      } catch (error) {
        if (!cancelled) setLoadError(warehouseErrorMessage(error))
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    void load()
    return () => {
      cancelled = true
    }
  }, [warehouseId, stockId])

  const pricing = useVariantPricing(stock?.productId, stock?.variantId, {
    colorName: stock?.colorName,
    sizeName: stock?.sizeName,
  })

  useEffect(() => {
    if (pricing.sellingPrice != null) {
      setSellingPrice(String(pricing.sellingPrice))
    }
  }, [pricing.sellingPrice])

  const variantLabel = stock
    ? variantDisplayLabel(stock.variantId, {
        variantLabel: stock.variantLabel,
        colorName: stock.colorName,
        sizeName: stock.sizeName,
      })
    : ''

  const poUnitPrice = stock?.poUnitPrice ?? null
  const hasUnitPriceOverride = stock?.unitPriceOverride != null

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault()
    if (!stock) return

    const nextSelling = Number(sellingPrice)
    if (!Number.isFinite(nextSelling) || nextSelling <= 0) {
      setSubmitError('Enter a selling price greater than 0.')
      return
    }
    const trimmedUnit = unitPrice.trim()
    const nextUnit = trimmedUnit === '' ? null : Number(trimmedUnit)
    if (nextUnit != null && (!Number.isFinite(nextUnit) || nextUnit <= 0)) {
      setSubmitError('Enter a unit price greater than 0, or leave it empty to use the PO price.')
      return
    }

    const sellingChanged = pricing.sellingPrice == null || nextSelling !== pricing.sellingPrice
    // Clearing the field, or entering the PO price, drops the override.
    const nextOverride = nextUnit == null || nextUnit === poUnitPrice ? null : nextUnit
    const unitChanged = nextOverride !== (stock.unitPriceOverride ?? null)

    if (sellingChanged && !pricing.variantId) {
      setSubmitError('This stock row is not linked to a product variant yet.')
      return
    }
    if (!sellingChanged && !unitChanged) {
      navigate(paths.inventory)
      return
    }

    setSubmitError('')
    setIsSubmitting(true)
    try {
      if (unitChanged) {
        try {
          await warehouseApi.updateStockUnitPrice(stock.id, nextOverride)
        } catch (error) {
          setSubmitError(warehouseErrorMessage(error))
          return
        }
      }
      if (sellingChanged && pricing.variantId) {
        try {
          await sellerProductApi.updateVariantSellingPrice(
            stock.productId,
            pricing.variantId,
            nextSelling,
          )
          clearVariantPricingCache(stock.productId)
        } catch (error) {
          setSubmitError(
            sellerProductErrorMessage(error, 'Could not update the selling price.'),
          )
          return
        }
      }
      const notice =
        sellingChanged && unitChanged
          ? 'Selling price and unit price updated.'
          : sellingChanged
            ? 'Selling price updated.'
            : 'Unit price updated.'
      navigate(paths.inventory, { state: { notice } })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="space-y-6">
      <nav className="text-xs text-slate-500">
        <Link to={paths.overview} className="hover:text-slate-700">
          Warehouse
        </Link>
        <span className="mx-1">/</span>
        <Link to={paths.inventory} className="hover:text-slate-700">
          Inventory data
        </Link>
        <span className="mx-1">/</span>
        <span className="text-slate-900">Edit prices</span>
      </nav>

      {loading && (
        <div className="rounded-xl border border-slate-200 bg-white p-6 text-sm text-slate-600">
          Loading inventory...
        </div>
      )}

      {!loading && loadError && (
        <div className="space-y-3 rounded-xl border border-red-200 bg-red-50 p-6">
          <p className="text-sm text-red-700">{loadError}</p>
          <Link
            to={paths.inventory}
            className="rounded-lg px-3 py-1.5 text-xs font-medium text-slate-600 hover:text-slate-900"
          >
            Back to inventory data
          </Link>
        </div>
      )}

      {!loading && !loadError && stock && (
        <form onSubmit={(event) => void handleSubmit(event)} className="space-y-5">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <h1 className="text-xl font-bold text-slate-900">Edit prices</h1>
              <p className="mt-0.5 text-sm text-slate-600">
                The selling price updates the product selling price everywhere. The unit price
                only applies to this stock row.
              </p>
            </div>
            <div className="flex shrink-0 items-center gap-2">
              <button
                type="button"
                onClick={() => navigate(paths.inventory)}
                className="cursor-pointer rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="cursor-pointer rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isSubmitting ? 'Saving…' : 'Save changes'}
              </button>
            </div>
          </div>

          {submitError && (
            <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">
              {submitError}
            </p>
          )}

          <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
            <section className={sectionClass}>
              <h2 className="text-sm font-semibold text-slate-900">Inventory details</h2>
              <p className="mt-0.5 text-xs text-slate-500">
                Read-only — stock levels and product details are managed by the warehouse.
              </p>
              <div className="mt-4">
                <DetailRow
                  label="Product"
                  value={productLabel(productNames, stock.productId)}
                />
                <DetailRow label="Warehouse" value={warehouseName || '—'} />
                <DetailRow label="Variant" value={variantLabel || '—'} />
                <DetailRow
                  label="Unit price (from PO)"
                  value={formatUnitPrice(poUnitPrice)}
                />
                <DetailRow label="On hand" value={String(stock.onHandQty)} />
                <DetailRow label="Reserved" value={String(stock.reservedQty)} />
                <DetailRow label="Available" value={String(stock.availableQty)} />
                <DetailRow
                  label="Status"
                  value={
                    <StockStatusBadge
                      status={
                        stock.availability ??
                        (stock.availableQty <= 0
                          ? 'OUT_OF_STOCK'
                          : stock.availableQty <= 5
                            ? 'LOW_STOCK'
                            : 'IN_STOCK')
                      }
                    />
                  }
                />
              </div>
            </section>

            <div className="space-y-5">
            <section className={sectionClass}>
              <h2 className="text-sm font-semibold text-slate-900">Selling price</h2>
              <p className="mt-0.5 text-xs text-slate-500">
                Same selling price as on the product. Base price and discount stay unchanged.
              </p>
              <div className="mt-4">
                <label htmlFor="inventory-selling-price" className={labelClass}>
                  Selling price
                </label>
                <input
                  id="inventory-selling-price"
                  type="number"
                  min={1}
                  step="0.01"
                  value={sellingPrice}
                  onChange={(event) => setSellingPrice(event.target.value)}
                  className={inputClass}
                  placeholder="e.g. 15000"
                  required
                />
                <p className="mt-1 text-xs text-slate-500">
                  Updates the selling price of this product variant.
                </p>
              </div>
            </section>

            <section className={sectionClass}>
              <h2 className="text-sm font-semibold text-slate-900">Unit price</h2>
              <p className="mt-0.5 text-xs text-slate-500">
                Calculated from the purchase order: (Subtotal + Delivery + Other costs) / Order
                stock. Change it to correct the cost of this stock in this warehouse.
              </p>
              <div className="mt-4">
                <label htmlFor="inventory-unit-price" className={labelClass}>
                  Unit price
                </label>
                <input
                  id="inventory-unit-price"
                  type="number"
                  min={0.01}
                  step="0.01"
                  value={unitPrice}
                  onChange={(event) => setUnitPrice(event.target.value)}
                  className={inputClass}
                  placeholder={poUnitPrice != null ? String(poUnitPrice) : 'e.g. 12000'}
                />
                <div className="mt-1 flex flex-wrap items-center justify-between gap-2 text-xs text-slate-500">
                  <span>
                    From PO: {formatUnitPrice(poUnitPrice)}
                    {hasUnitPriceOverride && ' · currently using your price'}
                  </span>
                  {poUnitPrice != null && unitPrice !== String(poUnitPrice) && (
                    <button
                      type="button"
                      onClick={() => setUnitPrice(String(poUnitPrice))}
                      className="cursor-pointer font-medium text-emerald-700 hover:text-emerald-800"
                    >
                      Use PO price
                    </button>
                  )}
                </div>
              </div>
            </section>
            </div>
          </div>
        </form>
      )}
    </div>
  )
}

export default InventoryEditPage
