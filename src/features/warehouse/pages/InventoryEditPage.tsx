import { useEffect, useState, type FormEvent } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { ArrowLeftRight } from 'lucide-react'
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

const formatForeign = (currency: string, amount: number) =>
  `${currency === 'USD' ? '$' : `${currency} `}${amount.toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`

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
  const [rateOrderId, setRateOrderId] = useState('')
  const [exchangeRate, setExchangeRate] = useState('')
  const [isRateSaving, setIsRateSaving] = useState(false)
  const [rateError, setRateError] = useState('')

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
        const latest = row.poHistory?.find((po) => po.currency !== 'MMK' && po.poExchangeRate > 1)
        setRateOrderId(latest?.purchaseOrderId ?? '')
        setExchangeRate(latest ? String(latest.exchangeRate) : '')
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

  const ratePos = stock?.poHistory?.filter((po) => po.currency !== 'MMK' && po.poExchangeRate > 1) ?? []
  const ratePo = ratePos.find((po) => po.purchaseOrderId === rateOrderId)
  const nextRate = Number(exchangeRate)
  // Foreign cost is fixed by the PO rate; the MMK unit price follows the received rate.
  const foreignTotal = ratePo ? (ratePo.quantity * ratePo.unitPrice) / ratePo.exchangeRate : 0
  const previewUnitPrice =
    ratePo && nextRate > 0 ? Math.round(((foreignTotal * nextRate) / ratePo.quantity) * 100) / 100 : null
  const rateChanged = ratePo != null && nextRate > 0 && nextRate !== ratePo.exchangeRate

  const handleRateUpdate = async () => {
    if (!stock || !ratePo || previewUnitPrice == null) return
    setRateError('')
    setIsRateSaving(true)
    try {
      await warehouseApi.updateStockExchangeRate(stock.id, ratePo.purchaseOrderId, nextRate)
      setStock({
        ...stock,
        poHistory: stock.poHistory?.map((po) =>
          po.purchaseOrderId === ratePo.purchaseOrderId
            ? { ...po, exchangeRate: nextRate, unitPrice: previewUnitPrice }
            : po,
        ),
      })
    } catch (error) {
      setRateError(warehouseErrorMessage(error))
    } finally {
      setIsRateSaving(false)
    }
  }

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault()
    if (!stock) return

    const nextSelling = Number(sellingPrice)
    if (!Number.isFinite(nextSelling) || nextSelling <= 0) {
      setSubmitError('Enter a selling price greater than 0.')
      return
    }

    const sellingChanged = pricing.sellingPrice == null || nextSelling !== pricing.sellingPrice

    if (sellingChanged && !pricing.variantId) {
      setSubmitError('This stock row is not linked to a product variant yet.')
      return
    }
    setSubmitError('')
    setIsSubmitting(true)
    try {
      // Selling price first so any later inventory.updated → product.updated
      // snapshot already includes the new storefront price (avoids stale overwrite).
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
      navigate(paths.inventory, {
        state: { notice: sellingChanged ? 'Selling price updated.' : 'No changes made.' },
      })
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
                The selling price updates the product selling price everywhere.
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
                Same selling price as on the product. Unit price (from PO) and discount stay unchanged.
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
              <h2 className="text-sm font-semibold text-slate-900">Exchange rate</h2>
              <p className="mt-0.5 text-xs text-slate-500">
                Enter the actual rate when the goods arrived. The unit price is recalculated from
                the foreign price.
              </p>
              {ratePo ? (
                <div className="mt-4 space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <span className={labelClass}>Purchase order</span>
                      <p className={`${inputClass} bg-slate-50 font-medium`}>{ratePo.orderNumber}</p>
                      <p className="mt-1 text-xs text-slate-500">Select a row in the history below.</p>
                    </div>
                    <div>
                      <label
                        htmlFor="inventory-exchange-rate"
                        className="flex items-center gap-1 text-xs font-medium text-slate-600"
                      >
                        Exchange rate (MMK
                        <ArrowLeftRight size={12} className="text-slate-500" aria-label="to" />
                        {ratePo.currency})
                      </label>
                      <input
                        id="inventory-exchange-rate"
                        type="number"
                        min={0.000001}
                        step="any"
                        value={exchangeRate}
                        onChange={(event) => setExchangeRate(event.target.value)}
                        className={inputClass}
                      />
                    </div>
                  </div>
                  <div className="space-y-1 rounded-lg bg-slate-50 px-3 py-2.5 text-xs tabular-nums text-slate-600">
                    <p>Purchase Order Exchange Rate: {ratePo.poExchangeRate.toLocaleString('en-US')}</p>
                    <p>
                      Foreign Price: {formatForeign(ratePo.currency, foreignTotal)} ({ratePo.quantity}{' '}
                      units)
                    </p>
                    <p className="font-medium text-slate-900">
                      Unit Price = {formatForeign(ratePo.currency, foreignTotal)} ×{' '}
                      {nextRate > 0 ? nextRate.toLocaleString('en-US') : '—'} ÷ {ratePo.quantity} ={' '}
                      {formatUnitPrice(previewUnitPrice)}
                    </p> 
                  </div>
                  {rateError && <p className="text-xs text-red-700">{rateError}</p>}
                  <div className="flex justify-end">
                    <button
                      type="button"
                      onClick={() => void handleRateUpdate()}
                      disabled={!rateChanged || isRateSaving}
                      className="cursor-pointer rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {isRateSaving ? 'Updating…' : 'Update exchange rate'}
                    </button>
                  </div>
                </div>
              ) : (
                <p className="mt-4 text-sm text-slate-500">
                  No foreign-currency purchase order with an exchange rate for this stock.
                </p>
              )}
            </section>
            </div>
          </div>

          <section className={sectionClass}>
            <h2 className="text-sm font-semibold text-slate-900">Purchase order history</h2>
            <p className="mt-0.5 text-xs text-slate-500">
              Unit price per PO received for this variant, newest first. Select a row to update
              its exchange rate.
            </p>
            {stock.poHistory?.length ? (
              <div className="-mx-5 mt-4 sm:-mx-6">
              <table className="w-full text-sm [&_tr>*:first-child]:pl-5 sm:[&_tr>*:first-child]:pl-6 [&_tr>*:last-child]:pr-5 sm:[&_tr>*:last-child]:pr-6">
                <thead>
                  <tr className="border-b border-slate-200 text-left text-xs text-slate-500">
                    <th className="w-12 py-2" aria-label="Select" />
                    <th className="py-2 font-medium">Purchase Order number</th>
                    <th className="py-2 font-medium">Received Date</th>
                    <th className="py-2 text-right font-medium">Quantity</th>
                    <th className="py-2 text-right font-medium">Unit price</th>
                    <th className="py-2 text-right font-medium">Exchange rate</th>
                    <th className="py-2 text-right font-medium">Foreign price</th>
                  </tr>
                </thead>
                <tbody>
                  {stock.poHistory.map((row) => {
                    const converts = row.currency !== 'MMK' && row.poExchangeRate > 1
                    const selected = converts && row.purchaseOrderId === rateOrderId
                    const select = () => {
                      if (!converts || selected) return
                      setRateOrderId(row.purchaseOrderId)
                      setExchangeRate(String(row.exchangeRate))
                      setRateError('')
                    }
                    return (
                      <tr
                        key={row.orderNumber}
                        onClick={select}
                        className={`border-b border-slate-100 last:border-b-0 ${
                          selected
                            ? 'bg-emerald-50'
                            : converts
                              ? 'cursor-pointer hover:bg-slate-50'
                              : 'text-slate-400'
                        }`}
                      >
                        <td className="py-2.5">
                          <input
                            type="checkbox"
                            checked={selected}
                            disabled={!converts}
                            onChange={select}
                            aria-label={`Select ${row.orderNumber}`}
                            className="cursor-pointer rounded border-slate-300 disabled:cursor-not-allowed"
                          />
                        </td>
                        <td className="py-2.5 font-medium text-slate-900">{row.orderNumber}</td>
                        <td className="py-2.5 text-slate-600">
                          {row.receivedAt ? new Date(row.receivedAt).toLocaleDateString() : '—'}
                        </td>
                        <td className="py-2.5 text-right tabular-nums text-slate-700">{row.quantity}</td>
                        <td className="py-2.5 text-right tabular-nums font-medium text-slate-900">
                          {formatUnitPrice(row.unitPrice)}
                        </td>
                        <td className="py-2.5 text-right tabular-nums text-slate-700">
                          {converts
                            ? `${row.exchangeRate !== row.poExchangeRate ? `${row.poExchangeRate.toLocaleString('en-US')} → ` : ''}${row.exchangeRate.toLocaleString('en-US')} / ${row.currency}`
                            : '—'}
                        </td>
                        <td className="py-2.5 text-right tabular-nums font-medium text-slate-900">
                          {converts
                            ? formatForeign(row.currency, (row.quantity * row.unitPrice) / row.exchangeRate)
                            : '—'}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
              </div>
            ) : (
              <p className="mt-4 text-sm text-slate-500">No purchase orders received yet.</p>
            )}
          </section>
        </form>
      )}
    </div>
  )
}

export default InventoryEditPage
