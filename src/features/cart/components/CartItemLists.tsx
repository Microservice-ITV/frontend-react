import { useAppDispatch, useAppSelector } from '@/app/hooks'
import { formatProfileShippingLine } from '@/features/shipping/utils/normalizeShipping'
import type { CartItem } from '../types/cartTypes'
import { selectShopSelectionMap } from '../store/cartSelectors'
import { removeFromCart, toggleItemSelection, toggleShopSelection } from '../store/cartSlice'
import CartQuantityInput from './CartQuantityInput'
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

          {/* SHOP VOUCHER + SHIPPING (once per shop) */}
          <div className="px-4 py-3 text-sm border-b border-[var(--dni-cart-border)] bg-[#fffaf8]">
            <div className="flex items-center justify-between">
              <span className="text-gray-700">Shop Voucher</span>
              <button className="text-blue-600 hover:text-emerald-600 cursor-pointer">Select Voucher</button>
            </div>
          </div>
          <div className="px-4 py-3 text-sm text-gray-600 bg-[#fafcff]">
            {batchStatus === 'loading' ? (
              <span className="text-gray-400">Loading shipping info…</span>
            ) : (
              formatProfileShippingLine(profilesByShopId[shop.shopId])
            )}
          </div>
        </section>
      ))}
    </div>
  )
}

export default CartItemLists