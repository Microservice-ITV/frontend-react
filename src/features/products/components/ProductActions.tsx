import { useEffect, useMemo, useState } from 'react'
import { useAppDispatch } from '@/app/hooks'
import { addToCart } from '@/features/cart/store/cartSlice'
import { addToCartIcon } from '@/assets/icons'
import type { ProductDetail, ProductVariant } from '@/features/products/types/productTypes'
import { useNavigate } from 'react-router-dom'
import { pickDefaultVariant, variantDisplayLabel } from './ProductVariantSelector'
import { fetchShopProfilesForCurrentCart } from '@/features/shipping/store/shippingThunks'

type ProductActionsProps = {
  product: ProductDetail
  selectedVariant: ProductVariant | null
  /** Present when this product is bought from a flash deal slot; carried to checkout for deal stock reservation. */
  flashDealItemId?: string
}

const ProductActions = ({ product, selectedVariant, flashDealItemId }: ProductActionsProps) => {
  const dispatch = useAppDispatch()
  const [quantity, setQuantity] = useState(1)

  const navigate = useNavigate()

  const effective = useMemo(
    () => selectedVariant ?? pickDefaultVariant(product.variants),
    [product.variants, selectedVariant],
  )

  const unitPrice = effective?.price ?? product.price
  const maxStock = effective ? effective.shopStock : product.stock ?? 0
  const maxQty = Math.min(99, Math.max(0, maxStock))
  const outOfStock = maxStock <= 0

  useEffect(() => {
    setQuantity((q) => (maxQty > 0 ? Math.min(q, maxQty) : 1))
  }, [maxQty, product.id])

  const increase = () =>
    setQuantity((q) => (maxQty > 0 ? Math.min(q + 1, maxQty) : q))
  const decrease = () => setQuantity((q) => (q > 1 ? q - 1 : 1))

  const cartPayload = () => ({
    productId: product.id,
    variantId: effective?.variantId ?? '',
    variantLabel: effective ? variantDisplayLabel(effective) : undefined,
    name: product.name,
    price: unitPrice,
    image: product.images?.[0],
    quantity,
    shopId: product.shop.id,
    shopName: product.shop.name,
    selected: true,
    ...(flashDealItemId ? { flashDealItemId } : {}),
  })

  const handleAddToCart = () => {
    if (outOfStock) return
    dispatch(addToCart(cartPayload()))
    void dispatch(fetchShopProfilesForCurrentCart())
  }

  const handleBuyNow = () => {
    if (outOfStock) return
    dispatch(addToCart(cartPayload()))
    void dispatch(fetchShopProfilesForCurrentCart())
    navigate('/cart')
  }

  return (
    <div className="space-y-4 sm:space-y-6 mt-4 sm:mt-6">
      {/* QUANTITY */}
      <div className="flex items-center gap-3 sm:gap-4">
        <span className="text-xs sm:text-sm text-gray-600 w-16 sm:w-20">Quantity</span>

        <div className="flex items-center border border-gray-300">
          {/* DECREASE */}
          <button
            onClick={decrease}
            disabled={quantity === 1 || outOfStock}
            className={`
              w-8 h-8 flex items-center justify-center border-r
              ${quantity === 1 || outOfStock ? 'cursor-not-allowed text-gray-300' : 'hover:bg-gray-100 cursor-pointer'}
            `}
            aria-label="Decrease"
          >
            <svg viewBox="0 0 10 10" className="w-3 h-3 fill-current">
              <polygon points="0 4.5 10 4.5 10 5.5 0 5.5" />
            </svg>
          </button>

          {/* INPUT */}
          <input
            type="text"
            value={quantity}
            readOnly
            className="w-10 sm:w-12 h-8 text-center text-xs sm:text-sm outline-none border-none"
          />

          {/* INCREASE */}
          <button
            onClick={increase}
            disabled={outOfStock || quantity >= maxQty}
            className={`w-8 h-8 flex items-center justify-center border-l ${
              outOfStock || quantity >= maxQty
                ? 'cursor-not-allowed text-gray-300'
                : 'hover:bg-gray-100 cursor-pointer'
            }`}
            aria-label="Increase"
          >
            <svg viewBox="0 0 10 10" className="w-3 h-3 fill-current">
              <polygon points="10 4.5 5.5 4.5 5.5 0 4.5 0 4.5 4.5 0 4.5 0 5.5 4.5 5.5 4.5 10 5.5 10 5.5 5.5 10 5.5" />
            </svg>
          </button>
        </div>
      </div>

      {/* ACTION BUTTONS */}
      <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
        {/* ADD TO CART */}
        <button
          onClick={handleAddToCart}
          disabled={outOfStock}
          className="
            flex items-center justify-center gap-2
            h-10 sm:h-11 px-6 sm:px-10 w-full sm:w-auto sm:min-w-[180px]
            border border-[var(--dni-primary)]
            bg-[rgba(255,87,34,0.08)]
            text-[var(--dni-primary)]
            font-medium text-sm sm:text-base
            hover:bg-[rgba(255,87,34,0.15)]
            transition cursor-pointer
            disabled:opacity-50 disabled:cursor-not-allowed
          "
        >
          <img
            src={addToCartIcon}
            alt="Add to cart"
            className="w-4 h-4 sm:w-5 sm:h-5"
          />
          <span>Add to Cart</span>
        </button>

        {/* BUY NOW */}
        <button
          onClick={handleBuyNow}
          disabled={outOfStock}
          className="
            h-10 sm:h-11 px-6 sm:px-10 w-full sm:w-auto sm:min-w-[180px]
            bg-[var(--dni-primary)]
            text-white
            font-medium text-sm sm:text-base
            hover:opacity-90
            transition
            cursor-pointer
            disabled:opacity-50 disabled:cursor-not-allowed
          "
        >
          Buy Now
        </button>
      </div>

    </div>
  )
}

export default ProductActions