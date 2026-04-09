import { useAppDispatch } from '@/app/hooks'
import { updateQuantity } from '../store/cartSlice'
import type { CartItem } from '../types/cartTypes'

interface CartQuantiryInputProps {
    item: CartItem
}

const CartQuantityInput = ({ item }: CartQuantiryInputProps) => {
    const dispatch = useAppDispatch()

    return (
        <div className="flex items-center">
            <button
                className="h-9 px-3 border border-r-0 border-[var(--dni-cart-border)] rounded-l text-sm hover:bg-gray-50 cursor-pointer"
                onClick={() =>
                    dispatch(
                        updateQuantity({
                            productId: item.productId,
                            variantId: item.variantId,
                            quantity: item.quantity - 1,
                        }),
                    )
                }
            >
                -
            </button>

            <input
                className="h-9 w-12 text-center outline-none border border-[var(--dni-cart-border)] rounded-none text-sm bg-white"
                value={item.quantity}
                readOnly
            />

            <button
                className="h-9 px-3 border border-l-0 border-[var(--dni-cart-border)] rounded-r text-sm hover:bg-gray-50 cursor-pointer"
                onClick={() =>
                    dispatch(
                        updateQuantity({
                            productId: item.productId,
                            variantId: item.variantId,
                            quantity: item.quantity + 1,
                        }),
                    )
                }
            >
                +
            </button>
        </div>
    )
}

export default CartQuantityInput