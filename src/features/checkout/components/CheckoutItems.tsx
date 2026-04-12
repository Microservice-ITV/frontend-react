import { chatIcon, fastDeliveryIcon } from '@/assets/icons'
import { CheckoutTotals } from '../utils/checkoutCalculator'
import { useAppSelector } from '@/app/hooks'

const DEFAULT_SHIPPING_DISPLAY = 1.99

interface CheckoutItemsProps {
  checkout: CheckoutTotals
}

const CheckoutItems = ({ checkout }: CheckoutItemsProps) => {
  const { groupedByShop } = checkout
  const feesByShopId = useAppSelector(state => state.shipping.feesByShopId)
  const calculateStatus = useAppSelector(state => state.shipping.calculateStatus)

  return (
    <div className="mt-3">
      <div className="bg-white rounded-sm">
        {/* Header */}
        <div className="grid grid-cols-[1fr_140px_100px_160px] px-6 py-5 text-sm text-gray-500 hidden md:grid">
          <div className="font-medium text-gray-900">Products Ordered</div>
          <div className="text-right">Unit Price</div>
          <div className="text-center">Amount</div>
          <div className="text-right">Item Subtotal</div>
        </div>
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
        const shippingFee =
          calculateStatus === 'succeeded' && feeRow?.amount != null && feeRow.amount >= 0
            ? feeRow.amount
            : DEFAULT_SHIPPING_DISPLAY
        const methodTitle = feeRow?.methodLabel?.trim() || 'Next Day Doorstep Delivery'
        const shopTotal = shopSubtotal + shippingFee

        return (
          <div key={shopId} className="mb-3 bg-white rounded-sm">
            {/* Shop row */}
            <div className="flex items-center justify-between px-6 py-3">
              <div className="flex items-center gap-3">
                <span className="bg-emerald-600 text-white text-xs px-2 py-[1px] rounded">Shop</span>
                <span className="font-medium text-gray-900">{shopItems[0].shopName}</span>
                  <button className="flex items-center gap-1 text-sm text-emerald-600 cursor-pointer">
                  <img src={chatIcon} className="w-4 h-4" />
                  chat now
                </button>
              </div>
            </div>

            {/* Products Loop */}
            {shopItems.map((item) => {
              const subtotal = item.price * item.quantity

              return (
                <div
                  key={`${item.productId}-${item.variantId ?? ''}-${item.shopId}`}
                  className="grid md:grid-cols-[1fr_140px_100px_160px] gap-3 px-4 md:px-6 py-5 items-start"
                >
                  <div className="flex gap-3">
                    <img src={item.image} alt={item.name} className="w-10 h-10 object-cover" />
                    <div className="text-sm text-gray-900">{item.name}</div>
                    <div className="text-xs text-gray-500 mt-1">
                      {item.variantLabel?.trim()
                        ? `Variation: ${item.variantLabel}`
                        : 'Variation: Standard'}
                    </div>
                  </div>

                  <div className="text-right">
                    <div className="md:text-right text-sm">${item.price.toFixed(2)}</div>
                    <div className="text-xs line-through text-gray-400">$29.52</div>
                  </div>

                  <div className="md:text-center text-sm">{item.quantity}</div>

                  <div className="md:text-right text-sm font-medium">${subtotal.toFixed(2)}</div>
                </div>
              )
            })}

            {/* ================= VOUCHER ================= */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-dashed border-black/10">
              <div className="flex items-center gap-2 text-sm">🎟️ Shop Voucher</div>
              <button className="text-sm text-[#0055aa] cursor-pointer">Select Voucher</button>
            </div>

            {/* ================= MESSAGE + SHIPPING ================= */}
            <div className="grid grid-cols-1 md:grid-cols-[40%_60%] bg-[#fafdff] border-b border-dashed border-black/10">

              {/* LEFT COLUMN */}
              <div className="px-6 py-5 md:py-6 md:border-r border-dashed border-black/10">
                <div className="flex flex-col gap-2">
                  <span className="text-sm font-medium text-gray-900">Message for Seller</span>

                  <input
                    className="w-full border px-3 py-2 text-sm text-gray-700 rounded border-[var(--dni-cart-border)] outline-none"
                    placeholder="Please leave a message"
                  />
                </div>
              </div>

              {/* RIGHT COLUMN */}
              <div className="px-6 py-5 border-t md:border-t-0 border-dashed border-black/10">
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
                      ) : (
                        `$${shippingFee.toFixed(2)}`
                      )}
                    </span>
                  </div>

                  <div className="mt-2 flex items-center gap-1 text-sm text-emerald-600">
                    <img src={fastDeliveryIcon} className="w-4 h-4" />
                    {feeRow?.etaHint?.trim() ? (
                      <span>{feeRow.etaHint.trim()}</span>
                    ) : (
                      <>
                        Guaranteed to get by <span className="font-medium">7 Feb</span>
                      </>
                    )}
                  </div>

                  <div className="mt-1 text-sm text-gray-600">
                    Get a $2.00 voucher if no delivery was attempted by 7 Feb 2026.
                  </div>

                  <div className="mt-1 text-sm text-gray-600">
                    Orders paid after 2pm will be delivered the day after tomorrow, excl. Sun & PH
                  </div>
                </button>
              </div>

              {/* ROW 2 */}
              <div className="px-6 py-4 border-t border-dashed border-black/10 text-sm">
                <span className="text-gray-900 font-medium">Guaranteed to get by 9 Feb</span>
                <span className="text-gray-500 ml-1">with Collection Points</span>
                <span className="ml-1 text-gray-400">›</span>
              </div>

              {/* ROW 3 */}
              <div className="px-6 py-4 border-t border-dashed border-black/10 flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-700">Allow to leave at doorstep</span>
                  <span className="text-xs bg-emerald-600 text-white px-2 py-[1px] rounded">New</span>
                </div>

                <div className="w-10 h-5 bg-green-500 rounded-full relative cursor-pointer">
                  <div className="absolute right-0.5 top-0.5 w-4 h-4 bg-white rounded-full" />
                </div>
              </div>
            </div>

            {/* ================= ORDER TOTAL ================= */}
            <div className="flex justify-end items-center px-6 py-5 bg-[#fafdff]">
              <span className="text-sm text-gray-600 mr-3">Order Total ({shopQuantity} Items):</span>
              <span className="text-xl font-semibold text-emerald-600">${shopTotal.toFixed(2)}</span>
            </div>
          </div>
        )
      })}
    </div>
  )
}

export default CheckoutItems