import { useAppDispatch } from '@/app/hooks'
import { removeFromCart, toggleItemSelection } from '../store/cartSlice'
import type { CartItem } from '../types/cartTypes'
import CartQuantityInput from './CartQuantityInput'
import { voucherIcon, deliveryIcon } from '@/assets/icons'

interface CartItemRowProps {
    item: CartItem
}

const CartItemRow = ({ item }: CartItemRowProps) => {
    const dispatch = useAppDispatch()

    return (
        <div className="bg-white border border-[var(--dni-cart-border)] rounded-sm">
            {/* ITEM ROW */}
            <div
                className="
                    grid grid-cols-[48px_1fr]
                    md:grid-cols-[48px_1fr_120px_120px_120px_80px]
                    md:gap-3 p-4 text-sm md:items-center"
            >
                {/* CHECKBOX */}
                <div className="flex justify-center items-start md:items-center">
                    <input
                        type="checkbox"
                        checked={item.selected}
                        onChange={() =>
                            dispatch(
                                toggleItemSelection({ productId: item.productId, variantId: item.variantId }),
                            )
                        }
                        className="h-4 w-4 accent-emerald-600 border-gray-300"
                    />
                </div>

                {/* PRODUCT (IMAGE + NAME) */}
                <div className="flex gap-3">
                    <img
                        src={item.image}
                        alt={item.name}
                        className="w-20 h-20 object-cover border border-[var(--dni-cart-border)]"
                    />

                    <div className="flex flex-col md:justify-center gap-1 min-h-[80px]">
                        <div className="line-clamp-2">
                            {item.name}
                        </div>

                        {/* MOBILE PRICE + QTY */}
                        <div className="flex justify-between items-center md:hidden">
                            <span className="text-emerald-700 font-medium">
                                ${(item.price * item.quantity).toFixed(2)}
                            </span>
                            <CartQuantityInput item={item} />
                        </div>
                    </div>
                </div>

                {/* DESKTOP UNIT PRICE */}
                <div className="hidden md:block text-center">
                    ${item.price.toFixed(2)}
                </div>

                {/* DESKTOP QUANTITY */}
                <div className="hidden md:flex justify-center">
                    <CartQuantityInput item={item} />
                </div>

                {/* DESKTOP TOTAL */}
                <div className="hidden md:block text-center font-medium text-emerald-700">
                    ${(item.price * item.quantity).toFixed(2)}
                </div>

                {/* DESKTOP ACTIONS */}
                <button
                    className="hidden md:block text-gray-500 hover:text-red-500 cursor-pointer"
                    onClick={() =>
                        dispatch(removeFromCart({ productId: item.productId, variantId: item.variantId }))
                    }
                >
                    Delete
                </button>
            </div>

            {/* SHOP VOUCHER */}
            <div className="flex items-center gap-3 px-4 py-3 border-t border-[var(--dni-cart-border)] text-sm">
                <img src={voucherIcon} alt="Voucher" className="w-5 h-5" />
                <button className="text-gray-500 hover:text-emerald-600">
                    Add shop voucher code
                </button>
            </div>

            {/* SHIPPING INFO */}
            <div className="hidden md:flex items-center gap-3 px-4 py-3 border-t border-[var(--dni-cart-border)] text-sm">
                <img src={deliveryIcon} alt="Delivery" className="h-4" />
                <span>
                    Up to $1.99 off shipping on orders from $20.00
                </span>
            </div>
        </div>
    )
}

export default CartItemRow