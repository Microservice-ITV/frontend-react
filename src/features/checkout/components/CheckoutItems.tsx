import { useEffect, useState } from 'react'
import { useAppSelector } from '@/app/hooks'
import { locationApi } from '@/features/account/api/locationApi'
import type { ShopCalculatedShipping } from '@/features/shipping/types/shippingTypes'
import { formatProductPrice } from '@/features/products/utils/formatProductPrice'
import { chatIcon, voucherIcon } from '@/assets/icons'
import { CheckoutTotals } from '../utils/checkoutCalculator'
import { formatKsPrice } from '@/features/products/utils/formatProductPrice'
import placeholderImage from '@/public/placeholder.svg'
import { Truck } from 'lucide-react'

interface CheckoutItemsProps {
  checkout: CheckoutTotals
}

function formatKm(value: number): string {
  return `${value.toFixed(1)} km`
}

function formatKg(value: number): string {
  return `${value.toFixed(2)} kg`
}

function formatKgAmount(value: number): string {
  return value.toFixed(2)
}

const ShippingOptionCard = ({
  fee,
  calculateStatus,
  calculateError,
  cityNames,
}: {
  fee?: ShopCalculatedShipping
  calculateStatus: string
  calculateError: string | null
  cityNames: Record<string, string>
}) => {
  if (calculateStatus === 'loading' || calculateStatus === 'idle') {
    return (
      <div className="rounded-sm border border-emerald-100 bg-[#f3faf6] px-3 py-3 text-sm text-gray-500">
        {calculateStatus === 'loading' ? 'Calculating delivery price…' : 'Delivery price will appear after your address is confirmed.'}
      </div>
    )
  }

  if (calculateStatus === 'failed' || !fee || fee.amount == null) {
    return (
      <div className="rounded-sm border border-amber-200 bg-amber-50 px-3 py-3 text-sm text-amber-800">
        {calculateError?.trim() || 'Delivery price is unavailable'}
      </div>
    )
  }

  const currency = fee.currency
  const isCityRoute = fee.calculationMethod === 'CITY_ROUTE'
  const fromCity = fee.fromCityId ? cityNames[fee.fromCityId] : undefined
  const toCity = fee.toCityId ? cityNames[fee.toCityId] : undefined
  const routeLabel = [fromCity, toCity].filter(Boolean).join(' → ')
  const weightParts = [
    fee.actualWeightKg != null ? `actual ${formatKgAmount(fee.actualWeightKg)}` : null,
    fee.volumetricWeightKg != null ? `volumetric ${formatKgAmount(fee.volumetricWeightKg)}` : null,
  ].filter(Boolean)

  return (
    <div className="rounded-sm border border-emerald-200 bg-[#f3faf6] px-3 py-3 text-[13px] leading-5 text-gray-700">
      <div className="flex items-start justify-between gap-3 text-sm font-semibold text-gray-900">
        <span>{fee.methodLabel?.trim() || 'Standard shipping'}</span>
        <span>
          {fee.deliveryStatus === 'NOT_DELIVERABLE'
            ? 'Not available'
            : formatProductPrice(fee.amount, currency)}
        </span>
      </div>

      <div className="mt-2 space-y-0.5 text-xs text-gray-600">
        <p className="flex items-center gap-1.5 text-emerald-700">
          <Truck className="h-3.5 w-3.5 shrink-0" aria-hidden />
          <span>{fee.etaHint?.trim() || 'Delivery estimate unavailable'}</span>
        </p>
        {fee.deliveryStatus === 'NOT_DELIVERABLE' ? (
          <p className="text-amber-800">Delivery is not available to this address.</p>
        ) : (
          <>
            {isCityRoute ? (
              <p>Route: {routeLabel || 'City route'}</p>
            ) : (
              fee.distanceKm != null && fee.distanceKm > 0 && <p>Distance: {formatKm(fee.distanceKm)}</p>
            )}
            {fee.chargeableWeightKg != null && (
              <p>
                Chargeable weight: {formatKg(fee.chargeableWeightKg)}
                {weightParts.length > 0 ? ` (${weightParts.join(' · ')})` : ''}
              </p>
            )}
            {fee.baseFee != null && <p>Base fee: {formatProductPrice(fee.baseFee, currency)}</p>}
            {fee.distanceFee != null && (
              <p>
                {isCityRoute ? 'Route fee' : 'Distance fee'}: {formatProductPrice(fee.distanceFee, currency)}
              </p>
            )}
            {fee.weightFee != null && <p>Weight fee: {formatProductPrice(fee.weightFee, currency)}</p>}
          </>
        )}
      </div>
    </div>
  )
}

const CheckoutItems = ({ checkout }: CheckoutItemsProps) => {
  const { groupedByShop } = checkout
  const feesByShopId = useAppSelector(state => state.shipping.feesByShopId)
  const calculateStatus = useAppSelector(state => state.shipping.calculateStatus)
  const calculateError = useAppSelector(state => state.shipping.calculateError)
  const [cityNames, setCityNames] = useState<Record<string, string>>({})
  const needsCityNames = Object.values(feesByShopId).some(
    (fee) => fee.calculationMethod === 'CITY_ROUTE' && (fee.fromCityId || fee.toCityId),
  )

  useEffect(() => {
    if (!needsCityNames) return
    let cancelled = false
    void locationApi.getAllCities()
      .then((res) => {
        if (cancelled) return
        const next: Record<string, string> = {}
        for (const city of res.data?.data?.cities ?? []) {
          next[String(city.id)] = city.name
        }
        setCityNames(next)
      })
      .catch(() => {
        if (!cancelled) setCityNames({})
      })
    return () => {
      cancelled = true
    }
  }, [needsCityNames])

  return (
    <div className="space-y-3">
      {calculateStatus === 'failed' && calculateError ? (
        <div className="rounded border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          Delivery fee could not be calculated: {calculateError}
        </div>
      ) : null}

      <div className="hidden items-center gap-3.5 rounded-sm border border-[var(--dni-cart-border)] bg-white px-3 py-2.5 text-sm text-gray-500 sm:px-4 md:grid md:grid-cols-[minmax(0,1fr)_7.5rem_5rem_8.5rem]">
        <span className="text-gray-900">Products Ordered</span>
        <span className="whitespace-nowrap text-right">Unit Price</span>
        <span className="text-center">Quantity</span>
        <span className="whitespace-nowrap text-right">Item Subtotal</span>
      </div>

      {Object.entries(groupedByShop).map(([shopId, shopItems]) => {
        const shopSubtotal = shopItems.reduce(
          (sum, item) => sum + item.price * item.quantity,
          0
        )
        const shopQuantity = shopItems.reduce(
          (sum, item) => sum + item.quantity,
          0
        )
        const feeRow = feesByShopId[shopId]
        const isNotDeliverable = feeRow?.deliveryStatus === 'NOT_DELIVERABLE'
        const hasFee =
          calculateStatus === 'succeeded' &&
          !isNotDeliverable &&
          feeRow?.amount != null &&
          feeRow.amount >= 0
        const shippingFee = hasFee ? (feeRow?.amount as number) : 0
        const shippingCurrency = feeRow?.currency ?? 'MMK'
        const rawMethod = feeRow?.methodLabel?.trim()
        const methodTitle = isNotDeliverable
          ? 'Delivery unavailable'
          : rawMethod === 'STANDARD'
            ? 'Standard shipping'
            : rawMethod || 'Standard shipping'
        const etaLine =
          feeRow?.estimatedDays != null && feeRow.estimatedDays > 0
            ? `Estimated ${feeRow.estimatedDays} business day${feeRow.estimatedDays === 1 ? '' : 's'}`
            : feeRow?.etaHint?.trim() || null
        const shopTotal = shopSubtotal + shippingFee

        return (
          <section
            key={shopId}
            className="overflow-hidden rounded-sm border border-[var(--dni-cart-border)] bg-white"
          >
            <div className="flex items-center justify-between gap-3 border-b border-[var(--dni-cart-border)] px-3 py-2.5 sm:px-4">
              <div className="flex min-w-0 items-center gap-2.5">
                <span className="shrink-0 rounded bg-emerald-600 px-2 py-px text-xs text-white">Shop</span>
                <span className="min-w-0 truncate text-sm font-medium text-gray-900 sm:text-[15px]">
                  {shopItems[0].shopName}
                </span>
                <button type="button" className="hidden shrink-0 items-center gap-1 text-sm text-emerald-600 sm:flex">
                  <img src={chatIcon} alt="" className="h-4 w-4" />
                  Chat
                </button>
              </div>
            </div>

            <ul>
              {shopItems.map(item => {
                const subtotal = item.price * item.quantity
                const variation = item.variantLabel?.trim() || 'Standard'

                return (
                  <li
                    key={`${item.productId}-${item.variantId ?? ''}-${item.shopId}`}
                    className="flex flex-col gap-2 border-b border-[var(--dni-cart-border)] px-3 py-3 last:border-b-0 sm:px-4 md:grid md:grid-cols-[minmax(0,1fr)_7.5rem_5rem_8.5rem] md:items-center md:gap-3.5"
                  >
                    <div className="flex min-w-0 items-center gap-3">
                      <img
                        src={item.image || placeholderImage}
                        alt={item.name}
                        onError={e => {
                          const img = e.currentTarget
                          img.onerror = null
                          img.src = placeholderImage
                        }}
                        className="h-16 w-16 shrink-0 object-cover md:h-14 md:w-14"
                      />
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm text-gray-900 sm:text-[15px]">{item.name}</p>
                        <p className="mt-0.5 truncate text-xs text-gray-500">Variation : {variation}</p>
                        <p className="mt-1 whitespace-nowrap text-sm font-medium text-emerald-700 md:hidden">
                          {formatKsPrice(item.price)}
                        </p>
                      </div>
                    </div>

                    <p className="hidden whitespace-nowrap text-right text-[15px] tabular-nums text-gray-700 md:block">
                      {formatKsPrice(item.price)}
                    </p>
                    <div className="flex items-center justify-between pl-[4.5rem] md:contents">
                      <p className="text-sm text-gray-500 md:hidden">Qty {item.quantity}</p>
                      <p className="hidden text-center text-sm text-gray-700 md:block">{item.quantity}</p>
                      <p className="whitespace-nowrap text-sm font-semibold tabular-nums text-emerald-700 md:text-right md:text-[15px]">
                        {formatKsPrice(subtotal)}
                      </p>
                    </div>
                  </li>
                )
              })}
            </ul>

            <div className="flex items-center justify-between gap-3 border-t border-[var(--dni-cart-border)] px-3 py-2.5 text-sm sm:px-4">
              <div className="flex min-w-0 items-center gap-2">
                <img src={voucherIcon} alt="" className="h-5 w-5" />
                <span className="text-gray-700">Shop Voucher</span>
              </div>
              <button type="button" className="shrink-0 text-[#0055aa] hover:underline">
                Select Voucher
              </button>
            </div>

            <div className="grid grid-cols-1 bg-[#fafdff] lg:grid-cols-2 lg:items-stretch">
              <div className="px-3 py-3 sm:px-4 sm:py-4 lg:flex lg:border-r lg:border-dashed lg:border-black/10">
                <div className="flex min-h-28 w-full flex-col gap-2 lg:h-full lg:min-h-0">
                  <span className="text-sm font-medium text-gray-900">Message for Seller</span>
                  <textarea
                    rows={4}
                    className="min-h-24 w-full flex-1 resize-none overflow-y-auto rounded-sm border border-[var(--dni-cart-border)] bg-white px-3 py-2 text-sm leading-5 text-gray-700 outline-none focus:border-emerald-500 lg:min-h-0"
                    placeholder="Please leave a message"
                  />
                </div>
              </div>

              <div className="border-t border-dashed border-black/10 px-3 py-3 sm:px-4 sm:py-4 lg:border-t-0">
                <div className="mb-2 flex items-center justify-between">
                  <div className="text-sm font-medium text-gray-900">Shipping Option</div>
                  {/* <button type="button" className="flex cursor-pointer items-center gap-1 text-sm text-[#0055aa]">
                    View All <span>›</span>
                  </button> */}
                </div>

                <button
                  type="button"
                  className="w-full cursor-pointer rounded-md border border-[#b7e3d5] bg-[#f0faf7] p-3 text-left transition hover:border-emerald-600 focus:outline-none"
                >
                  <ShippingOptionCard
                    fee={feesByShopId[shopId]}
                    calculateStatus={calculateStatus}
                    calculateError={calculateError}
                    cityNames={cityNames}
                  />
                </button>
              </div>
            </div>

            <div className="border-t border-dashed border-black/10 bg-[#fafdff] px-3 py-3 text-sm sm:px-4">
              <span className="font-medium text-gray-900">Guaranteed to get by 9 Feb</span>
              <span className="ml-1 text-gray-500">with Collection Points</span>
              <span className="ml-1 text-gray-400">›</span>
            </div>

            <div className="flex items-center justify-between gap-2 border-t border-dashed border-black/10 bg-[#fafdff] px-3 py-3 sm:px-4">
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-700">Allow to leave at doorstep</span>
                <span className="rounded bg-emerald-600 px-2 py-[1px] text-xs text-white">New</span>
              </div>
              <div className="relative h-5 w-10 cursor-pointer rounded-full bg-green-500">
                <div className="absolute top-0.5 right-0.5 h-4 w-4 rounded-full bg-white" />
              </div>
            </div>

            <div className="flex flex-wrap items-center justify-end gap-2 bg-[#fafdff] px-3 py-2.5 sm:px-4">
              <span className="text-sm text-gray-600">
                Order Total ({shopQuantity} {shopQuantity === 1 ? 'Item' : 'Items'}):
              </span>
              <span className="whitespace-nowrap text-lg font-semibold tabular-nums text-emerald-600 sm:text-xl">
                {formatKsPrice(shopTotal)}
              </span>
            </div>
          </section>
        )
      })}
    </div>
  )
}

export default CheckoutItems
