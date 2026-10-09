import { useAppDispatch } from '@/app/hooks'
import { productDetailMaxQty } from '@/features/products/components/ProductQuantityInput'
import { updateQuantity } from '../store/cartSlice'
import type { CartItem } from '../types/cartTypes'

interface CartQuantiryInputProps {
    item: CartItem
    minimumQuantity?: number
}

const CartQuantityInput = ({ item, minimumQuantity }: CartQuantiryInputProps) => {
    const dispatch = useAppDispatch()
    const knownStock = item.availableStock != null && Number.isFinite(item.availableStock)
    const maxQty = knownStock ? productDetailMaxQty(item.availableStock as number) : 99
    const disableDecrease = minimumQuantity != null && item.quantity <= minimumQuantity
    const disableIncrease = item.quantity >= maxQty

    return (
        <div className="flex items-center">
            <button
                type="button"
                disabled={disableDecrease}
                aria-label={disableDecrease ? 'Quantity is needed for the applied bundles' : 'Decrease quantity'}
                className={`h-8 px-2.5 border border-r-0 border-[var(--dni-cart-border)] rounded-l text-sm sm:h-10 sm:px-3.5 ${
                    disableDecrease
                        ? 'cursor-not-allowed bg-gray-50 text-gray-300'
                        : 'cursor-pointer hover:bg-gray-50'
                }`}
                onClick={() => {
                    if (disableDecrease) return
                    dispatch(
                        updateQuantity({
                            productId: item.productId,
                            variantId: item.variantId,
                            quantity: item.quantity - 1,
                        }),
                    )
                }}
            >
                -
            </button>

            <input
                className="h-8 w-10 text-center outline-none border border-[var(--dni-cart-border)] rounded-none text-sm bg-white sm:h-10 sm:w-14"
                value={item.quantity}
                readOnly
            />

            <button
                type="button"
                disabled={disableIncrease}
                aria-label={disableIncrease ? 'Only available stock can be added' : 'Increase quantity'}
                className={`h-8 px-2.5 border border-l-0 border-[var(--dni-cart-border)] rounded-r text-sm sm:h-10 sm:px-3.5 ${
                    disableIncrease
                        ? 'cursor-not-allowed bg-gray-50 text-gray-300'
                        : 'cursor-pointer hover:bg-gray-50'
                }`}
                onClick={() => {
                    if (disableIncrease) return
                    dispatch(
                        updateQuantity({
                            productId: item.productId,
                            variantId: item.variantId,
                            quantity: item.quantity + 1,
                        }),
                    )
                }}
            >
                +
            </button>
        </div>
    )
}

export default CartQuantityInput
