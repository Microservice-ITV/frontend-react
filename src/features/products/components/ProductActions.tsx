import { useState } from 'react'
import { useAppDispatch } from '@/app/hooks'
import { addToCart } from '@/features/cart/store/cartSlice'
import { addToCartIcon } from '@/assets/icons'
import type { ProductDetail } from '@/features/products/types/productTypes'

type ProductActionsProps = {
  product: ProductDetail
}

const ProductActions = ({ product }: ProductActionsProps) => {
  const dispatch = useAppDispatch()
  const [quantity, setQuantity] = useState(1)

  const increase = () => setQuantity((q) => q + 1)
  const decrease = () => setQuantity((q) => (q > 1 ? q - 1 : 1))

  const handleAddToCart = () => {
    dispatch(
      addToCart({
        productId: product.id,
        name: product.name,
        price: product.price,
        image: product.images?.[0],
        quantity,
      })
    )
  }

  const handleBuyNow = () => {
    console.log('Buy now:', { quantity })
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
            disabled={quantity === 1}
            className={`
              w-8 h-8 flex items-center justify-center border-r
              ${quantity === 1 ? 'cursor-not-allowed text-gray-300' : 'hover:bg-gray-100 cursor-pointer'}
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
            className="w-8 h-8 flex items-center justify-center border-l hover:bg-gray-100 cursor-pointer"
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
          className="
            flex items-center justify-center gap-2
            h-11 sm:h-12 px-6 sm:px-10 w-full sm:w-auto sm:min-w-[180px]
            border border-[var(--dni-primary)]
            bg-[rgba(255,87,34,0.08)]
            text-[var(--dni-primary)]
            font-medium text-sm sm:text-base
            hover:bg-[rgba(255,87,34,0.15)]
            transition cursor-pointer
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
          className="
            h-11 sm:h-12 px-6 sm:px-10 w-full sm:w-auto sm:min-w-[180px]
            bg-[var(--dni-primary)]
            text-white
            font-medium text-sm sm:text-base
            hover:opacity-90
            transition
            cursor-pointer
          "
        >
          Buy Now
        </button>
      </div>

    </div>
  )
}

export default ProductActions