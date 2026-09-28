import { chatIcon, fastDeliveryIcon, voucherIcon } from '@/assets/icons'
import { CheckoutTotals } from '../utils/checkoutCalculator'
import { useAppSelector } from '@/app/hooks'
import { formatKsPrice } from '@/features/products/utils/formatProductPrice'
import { useAppDispatch, useAppSelector } from '@/app/hooks'
import CartQuantityInput from '@/features/cart/components/CartQuantityInput'
import { selectShopSelectionMap } from '@/features/cart/store/cartSelectors'
import { removeFromCart, toggleItemSelection, toggleShopSelection } from '@/features/cart/store/cartSlice'
import { CartItem } from '@/features/cart/types/cartTypes'
import { formatProfileShippingLine } from '@/features/shipping/utils/normalizeShipping'
import placeholderImage from '@/public/placeholder.svg'

interface CartItemListProps {
  items: CartItem[]
}

const CartItemLists = ({ items }: CartItemListProps) => {
  const dispatch = useAppDispatch()
  const shopSelectionMap = useAppSelector(selectShopSelectionMap)
  const profilesByShopId = useAppSelector(state => state.shipping.profilesByShopId)
  const batchStatus = useAppSelector(state => state.shipping.batchStatus)

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
    <div className="space-y-3">
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
        const hasFee =
          calculateStatus === 'succeeded' && feeRow?.amount != null && feeRow.amount >= 0
        const shippingFee = hasFee ? (feeRow?.amount as number) : 0
        const shippingCurrency = feeRow?.currency ?? 'MMK'
        const rawMethod = feeRow?.methodLabel?.trim()
        const methodTitle =
          rawMethod === 'STANDARD'
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
            {shopItems.map((item) => {
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
                      onError={(e) => {
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
                    <div className="mt-2 md:hidden flex items-center justify-between gap-3">
                      <span className="text-sm font-medium text-emerald-700">
                        ${(item.price * item.quantity).toFixed(2)}
                      </span>
                      <CartQuantityInput item={item} />
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

            {/* ================= VOUCHER ================= */}
            <div className="flex items-center justify-between gap-3 border-t border-[var(--dni-cart-border)] px-3 py-2.5 text-sm sm:px-4">
              <div className="flex min-w-0 items-center gap-2">
                <img src={voucherIcon} alt="" className="h-5 w-5" />
                <span className="text-gray-700">Shop Voucher</span>
              </div>
              <button type="button" className="shrink-0 text-[#0055aa] hover:underline">
                Select Voucher
              </button>
            </div>

            {/* ================= MESSAGE + SHIPPING ================= */}
            <div className="grid grid-cols-1 bg-[#fafdff] lg:grid-cols-2 lg:items-stretch">

              {/* LEFT COLUMN */}
              <div className="px-3 py-3 sm:px-4 sm:py-4 lg:flex lg:border-r lg:border-dashed lg:border-black/10">
                <div className="flex min-h-28 w-full flex-col gap-2 lg:h-full lg:min-h-0">
                  <span className="text-sm font-medium text-gray-900">Message for Seller</span>
                  <textarea
                    rows={4}
                    className="min-h-24 w-full flex-1 resize-none overflow-y-auto rounded-sm border border-[var(--dni-cart-border)] bg-white px-3 py-2 text-sm leading-5 text-gray-700 outline-none focus:border-emerald-500 lg:min-h-0"
                    placeholder="Please leave a message"
                  />
                </div>

              {/* RIGHT COLUMN */}
              <div className="border-t border-dashed border-black/10 px-3 py-3 sm:px-4 sm:py-4 lg:border-t-0">
                <div className="flex items-center justify-between mb-2">
                  <div className="text-sm font-medium text-gray-900">Shipping Option</div>

                  <button className="text-sm text-[#0055aa] flex items-center gap-1 cursor-pointer">
                    View All <span>›</span>
                  </button>
                </div>

                <button className="
                  w-full text-left bg-[#f0faf7] border border-[#b7e3d5] rounded-md p-3
                  hover:border-emerald-600 transition focus:outline-none cursor-pointer"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="text-sm font-medium text-gray-900">{methodTitle}</div>

                    <span className="text-sm font-medium whitespace-nowrap">
                      {calculateStatus === 'loading' ? (
                        <span className="text-gray-400">…</span>
                      ) : hasFee ? (
                        formatKsPrice(shippingFee, shippingCurrency)
                      ) : calculateStatus === 'failed' ? (
                        <span className="text-red-500">Unavailable</span>
                      ) : (
                        <span className="text-gray-400">—</span>
                      )}
                    </span>
                  </div>

                  <div className="mt-2 flex items-center gap-1 text-sm text-emerald-600">
                    <img src={fastDeliveryIcon} className="w-4 h-4" />
                    {calculateStatus === 'succeeded' && etaLine ? (
                      <span>{etaLine}</span>
                    ) : calculateStatus === 'loading' ? (
                      <span className="text-gray-400">Calculating delivery time…</span>
                    ) : (
                      <span className="text-gray-500">Delivery estimate unavailable</span>
                    )}
                  </div>

                  {hasFee &&
                    (feeRow?.baseFee != null ||
                      feeRow?.distanceFee != null ||
                      feeRow?.weightFee != null) && (
                      <div className="mt-2 space-y-0.5 text-xs text-gray-600">
                        {feeRow?.distanceKm != null && (
                          <div>Distance: {feeRow.distanceKm.toFixed(1)} km</div>
                        )}
                        {feeRow?.chargeableWeightKg != null && (
                          <div>
                            Chargeable weight: {feeRow.chargeableWeightKg.toFixed(2)} kg
                            {feeRow.actualWeightKg != null &&
                              feeRow.volumetricWeightKg != null && (
                                <span className="text-gray-400">
                                  {' '}
                                  (actual {feeRow.actualWeightKg.toFixed(2)} · volumetric{' '}
                                  {feeRow.volumetricWeightKg.toFixed(2)})
                                </span>
                              )}
                          </div>
                        )}
                        {feeRow?.baseFee != null && (
                          <div>
                            Base fee: {formatKsPrice(feeRow.baseFee, shippingCurrency)}
                          </div>
                        )}
                        {feeRow?.distanceFee != null && (
                          <div>
                            Distance fee: {formatKsPrice(feeRow.distanceFee, shippingCurrency)}
                          </div>
                        )}
                        {feeRow?.weightFee != null && (
                          <div>
                            Weight fee: {formatKsPrice(feeRow.weightFee, shippingCurrency)}
                          </div>
                        )}
                      </div>
                    )}

                  <div className="mt-1 text-sm text-gray-600">
                    Get a $2.00 voucher if no delivery was attempted by 7 Feb 2026.
                  </div>

                  <div className="mt-1 text-sm text-gray-600">
                    Orders paid after 2pm will be delivered the day after tomorrow, excl. Sun & PH
                  </div>
                </button>
              </div>

              {/* ROW 2 */}
              <div className="border-t border-dashed border-black/10 px-3 py-3 text-sm sm:px-4">
                <span className="font-medium text-gray-900">Guaranteed to get by 9 Feb</span>
                <span className="ml-1 text-gray-500">with Collection Points</span>
                <span className="ml-1 text-gray-400">›</span>
              </div>

              {/* ROW 3 */}
              <div className="flex items-center justify-between gap-2 border-t border-dashed border-black/10 px-3 py-3 sm:px-4">
                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-700">Allow to leave at doorstep</span>
                  <span className="text-xs bg-emerald-600 text-white px-2 py-[1px] rounded">New</span>
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

            {/* ================= ORDER TOTAL ================= */}
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

export default CartItemLists