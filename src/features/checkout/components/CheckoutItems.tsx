import { useEffect, useState } from 'react'
import { useAppDispatch, useAppSelector } from '@/app/hooks'
import { voucherIcon } from '@/assets/icons'
import { locationApi } from '@/features/account/api/locationApi'
import CartQuantityInput from '@/features/cart/components/CartQuantityInput'
import { selectShopSelectionMap } from '@/features/cart/store/cartSelectors'
import { removeFromCart, toggleItemSelection, toggleShopSelection } from '@/features/cart/store/cartSlice'
import { CartItem } from '@/features/cart/types/cartTypes'
import type { ShopCalculatedShipping } from '@/features/shipping/types/shippingTypes'
import { formatProductPrice } from '@/features/products/utils/formatProductPrice'
import placeholderImage from '@/public/placeholder.svg'
import { Truck } from 'lucide-react'

interface CartItemListProps {
  items: CartItem[]
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

const CartItemLists = ({ items }: CartItemListProps) => {
  const dispatch = useAppDispatch()
  const [sellerMessages, setSellerMessages] = useState<Record<string, string>>({})
  const shopSelectionMap = useAppSelector(selectShopSelectionMap)
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

  // Group items by shop
  const groupedByShop = items.reduce<Record<
    string,
    { shopId: string; shopName: string; items: CartItem[] }
  >>((acc, item) => {
    acc[item.shopId] ??= {
      shopId: item.shopId,
      shopName: item.shopName,
      items: [],
    }
    acc[item.shopId].items.push(item)
    return acc
  }, {})

  return (
    <div className="space-y-4">
      {Object.values(groupedByShop).map(shop => (
        <section key={shop.shopId} className="bg-white border border-[var(--dni-cart-border)] rounded-sm overflow-hidden">
          {/* SHOP HEADER */}
          <div
            className="flex items-center px-4 py-3 border-b border-[var(--dni-cart-border)]"
          >
            <div className="w-[48px] flex justify-center">
              <input
                type="checkbox"
                checked={shopSelectionMap[shop.shopId]?.checked ?? false}
                ref={el => {
                  if (el) {
                    el.indeterminate = shopSelectionMap[shop.shopId]?.indeterminate ?? false
                  }
                }}
                onChange={e =>
                  dispatch(toggleShopSelection({ shopId: shop.shopId, selected: e.target.checked }))
                }
                className="h-4 w-4 accent-emerald-600"
              />
            </div>

            <span className="font-medium text-gray-800">
              {shop.shopName}
            </span>
          </div>

          {/* ITEMS (single shop section, multiple product rows) */}
          <div>
            {shop.items.map(item => (
              <div
                key={`${item.productId}::${item.variantId ?? ''}`}
                className="grid grid-cols-[40px_1fr] md:grid-cols-[48px_1fr_140px_140px_140px_100px] px-3 md:px-4 py-4 border-b border-[var(--dni-cart-border)]"
              >
                <div className="flex justify-center pt-1 md:pt-0 md:items-center">
                  <input
                    type="checkbox"
                    checked={item.selected}
                    onChange={() =>
                      dispatch(toggleItemSelection({ productId: item.productId, variantId: item.variantId }))
                    }
                    className="h-4 w-4 accent-emerald-600 border-gray-300"
                  />
                </div>

                <div className="flex gap-3">
                  <img
                    src={item.image || placeholderImage}
                    alt={item.name}
                    onError={(e) => {
                      const img = e.currentTarget
                      img.onerror = null
                      img.src = placeholderImage
                    }}
                    className="w-16 h-16 md:w-20 md:h-20 object-cover border border-[var(--dni-cart-border)]"
                  />
                  <div className="min-w-0">
                    <div className="line-clamp-2 text-sm text-gray-800">{item.name}</div>
                    <div className="mt-1 text-xs text-gray-500">
                      {item.variantLabel?.trim()
                        ? `Variation: ${item.variantLabel}`
                        : 'Variation: Standard'}
                    </div>
                    <div className="mt-2 md:hidden flex items-center justify-between gap-3">
                      <span className="text-sm font-medium text-emerald-700">
                        ${(item.price * item.quantity).toFixed(2)}
                      </span>
                      <CartQuantityInput item={item} />
                    </div>
                  </div>
                </div>

                <div className="hidden md:flex items-center justify-center text-sm text-gray-700">
                  ${item.price.toFixed(2)}
                </div>

                <div className="hidden md:flex items-center justify-center">
                  <CartQuantityInput item={item} />
                </div>

                <div className="hidden md:flex items-center justify-center text-sm font-medium text-emerald-700">
                  ${(item.price * item.quantity).toFixed(2)}
                </div>

                <div className="hidden md:flex flex-col items-center justify-center text-sm">
                  <button
                    className="text-gray-600 hover:text-red-500 cursor-pointer"
                    onClick={() =>
                      dispatch(removeFromCart({ productId: item.productId, variantId: item.variantId }))
                    }
                  >
                    Delete
                  </button>
                  <button className="text-gray-500 hover:text-emerald-600 mt-1 cursor-pointer">
                    Save for Later
                  </button>
                </div>
              </div>
            ))}
          </div>

          <div className="flex items-center justify-between border-t border-[var(--dni-cart-border)] px-4 py-3 text-sm">
            <span className="flex items-center gap-2 text-gray-800">
              <img src={voucherIcon} alt="" className="h-4 w-4" />
              Shop Voucher
            </span>
            <button type="button" className="cursor-pointer text-[#0055aa] hover:text-emerald-600">
              Select Voucher
            </button>
          </div>

          <div className="grid grid-cols-1 border-t border-[var(--dni-cart-border)] md:grid-cols-2">
            <div className="px-4 py-4 md:border-r md:border-[var(--dni-cart-border)]">
              <label htmlFor={`seller-message-${shop.shopId}`} className="mb-2 block text-sm text-gray-800">
                Message for Seller
              </label>
              <textarea
                id={`seller-message-${shop.shopId}`}
                rows={4}
                value={sellerMessages[shop.shopId] ?? ''}
                onChange={(event) =>
                  setSellerMessages((current) => ({
                    ...current,
                    [shop.shopId]: event.target.value,
                  }))
                }
                placeholder="Please leave a message"
                className="w-full resize-y rounded-sm border border-gray-200 px-3 py-2 text-sm text-gray-700 outline-none placeholder:text-gray-400 focus:border-emerald-500"
              />
            </div>
            <div className="px-4 py-4">
              <p className="mb-3 text-sm text-gray-800">Shipping Option</p>
              <ShippingOptionCard
                fee={feesByShopId[shop.shopId]}
                calculateStatus={calculateStatus}
                calculateError={calculateError}
                cityNames={cityNames}
              />
            </div>
          </div>
        </section>
      ))}
    </div>
  )
}

export default CartItemLists