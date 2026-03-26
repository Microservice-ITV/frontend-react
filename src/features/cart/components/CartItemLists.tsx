import { useAppDispatch, useAppSelector } from '@/app/hooks'
import type { CartItem } from '../types/cartTypes'
import CartItemRow from './CartItemRow'
import { selectShopSelectionMap } from '../store/cartSelectors'
import { toggleShopSelection } from '../store/cartSlice'

interface CartItemListProps {
  items: CartItem[]
}

const CartItemLists = ({ items }: CartItemListProps) => {
  const dispatch = useAppDispatch()
  const shopSelectionMap = useAppSelector(selectShopSelectionMap)

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
        <section key={shop.shopId}>
          {/* SHOP HEADER */}
          <div
            className="bg-white flex items-center px-4 py-3 border-t border-l border-r border-[var(--dni-cart-border)] rounded-t-sm"
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

          {/* ITEMS */}
          <div className="space-y-3">
            {shop.items.map(item => (
              <CartItemRow key={item.productId} item={item} />
            ))}
          </div>
        </section>
      ))}
    </div>
  )
}

export default CartItemLists