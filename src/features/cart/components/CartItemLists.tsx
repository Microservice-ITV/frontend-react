import { useAppDispatch, useAppSelector } from '@/app/hooks'
import { voucherIcon } from '@/assets/icons'
import { Trash2 } from 'lucide-react'
import type { CartItem } from '../types/cartTypes'
import { selectShopSelectionMap } from '../store/cartSelectors'
import { removeFromCart, toggleItemSelection, toggleShopSelection } from '../store/cartSlice'
import { formatProductPrice } from '@/features/products/utils/formatProductPrice'
import CartQuantityInput from './CartQuantityInput'
import placeholderImage from '@/public/placeholder.svg'

const formatCartPrice = (amount: number) => formatProductPrice(amount).replace('MMK', 'Ks')

interface CartItemListProps {
  items: CartItem[]
  bundleMinimumQty?: ReadonlyMap<string, number>
}

const CartItemLists = ({ items, bundleMinimumQty }: CartItemListProps) => {
  const dispatch = useAppDispatch()
  const shopSelectionMap = useAppSelector(selectShopSelectionMap)

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
      <div className="hidden items-center gap-3.5 rounded-sm border border-[var(--dni-cart-border)] bg-white px-3 py-2.5 text-sm text-gray-500 sm:px-4 md:grid md:grid-cols-[1rem_3.5rem_minmax(0,1fr)_7.5rem_8.5rem_8.5rem_4.75rem]">
        <span className="col-span-3 text-gray-900">Product</span>
        <span className="whitespace-nowrap">Unit Price</span>
        <span className="text-center">Quantity</span>
        <span className="whitespace-nowrap text-right">Total Price</span>
        <span aria-hidden="true" />
      </div>

      {Object.values(groupedByShop).map(shop => (
        <section
          key={shop.shopId}
          className="overflow-hidden rounded-sm border border-[var(--dni-cart-border)] bg-white"
        >
          <div className="flex items-center gap-2.5 border-b border-[var(--dni-cart-border)] px-3 py-2.5 sm:px-4">
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
              aria-label={`Select all items from ${shop.shopName}`}
            />
            <p className="min-w-0 flex-1 truncate text-sm font-medium text-gray-900 sm:text-[15px]">
              {shop.shopName}
            </p>
          </div>

          <ul>
            {shop.items.map(item => (
              <li
                key={`${item.productId}::${item.variantId ?? ''}`}
                className="flex flex-col gap-2.5 border-b border-[var(--dni-cart-border)] px-3 py-3 last:border-b-0 sm:px-4 md:grid md:grid-cols-[1rem_3.5rem_minmax(0,1fr)_7.5rem_8.5rem_8.5rem_4.75rem] md:items-center md:gap-3.5"
              >
                <div className="flex min-w-0 items-center gap-3 md:contents">
                  <input
                    type="checkbox"
                    checked={item.selected}
                    onChange={() =>
                      dispatch(toggleItemSelection({ productId: item.productId, variantId: item.variantId }))
                    }
                    className="h-4 w-4 shrink-0 accent-emerald-600"
                    aria-label={`Select ${item.name}`}
                  />

                  <img
                    src={item.image || placeholderImage}
                    alt=""
                    onError={(e) => {
                      const img = e.currentTarget
                      img.onerror = null
                      img.src = placeholderImage
                    }}
                    className="h-16 w-16 shrink-0 object-cover md:h-14 md:w-14"
                  />

                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm text-gray-900 sm:text-[15px]">
                      {item.name}
                    </p>
                    <p className="mt-0.5 truncate text-xs text-gray-500">
                      Variation : {item.variantLabel?.trim() || 'Standard'}
                    </p>
                    <p className="mt-1 whitespace-nowrap text-sm font-medium text-emerald-700 md:hidden">
                      {formatCartPrice(item.price)}
                    </p>
                  </div>
                </div>

                <p className="hidden whitespace-nowrap text-[15px] tabular-nums text-gray-700 md:block">
                  {formatCartPrice(item.price)}
                </p>

                <div className="flex items-center justify-between gap-2 pl-7 md:contents">
                  <div className="md:flex md:justify-center">
                    <CartQuantityInput
                      item={item}
                      minimumQuantity={bundleMinimumQty?.get(item.productId)}
                    />
                  </div>
                  <p className="shrink-0 whitespace-nowrap text-sm font-semibold tabular-nums text-emerald-700 md:w-full md:text-right md:text-[15px]">
                    {formatCartPrice(item.price * item.quantity)}
                  </p>
                  <button
                    type="button"
                    aria-label="Remove item from cart"
                    className="inline-flex shrink-0 items-center gap-1 text-sm text-gray-500 hover:text-red-500 md:justify-self-end"
                    onClick={() =>
                      dispatch(removeFromCart({ productId: item.productId, variantId: item.variantId }))
                    }
                  >
                    <Trash2 size={15} />
                    <span className="hidden sm:inline">Delete</span>
                  </button>
                </div>
              </li>
            ))}
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
        </section>
      ))}
    </div>
  )
}

export default CartItemLists
