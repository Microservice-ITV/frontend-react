import { Product } from '../types/productTypes'
import { Link } from 'react-router-dom'
import { formatProductPrice } from '../utils/formatProductPrice'

/**
 * Shopee-style product card: border + shadow on hover, “Find Similar” under the card.
 * Bottom padding reserves CTA space so the bar never covers the next row.
 */
const ProductCard = ({ product }: { product: Product }) => {
  return (
    <div className="group relative pb-8">
      <div
        className="
          relative z-0 overflow-hidden rounded-sm border border-[rgba(0,0,0,0.09)] bg-white
          transition-[border-color,box-shadow,border-radius] duration-100
          group-hover:z-[1] group-hover:rounded-b-none
          group-hover:border-[var(--dni-primary)]
          group-hover:shadow-[0_0.0625rem_0.125rem_0_rgba(0,0,0,0.1)]
        "
      >
        <Link to={`/products/${product.id}`} className="block">
          {/* IMAGE — square like Shopee */}
          <div className="relative w-full bg-[#fafafa] pt-[100%]">
            <img
              src={`${product.images?.[0] ?? '/placeholder.svg'}`}
              alt={product.name}
              className="pointer-events-none absolute inset-0 h-full w-full object-contain"
              loading="lazy"
            />
          </div>

          {/* META */}
          <div className="flex flex-col gap-1.5 p-2 pb-2.5">
            <h3 className="line-clamp-2 min-h-[2.5rem] text-sm font-normal leading-5 text-[rgba(0,0,0,0.87)]">
              {product.name}
            </h3>

            <div className="mt-auto flex items-baseline justify-between gap-2">
              <span className="text-base font-medium leading-none text-[var(--dni-primary)]">
                {formatProductPrice(product.price)}
              </span>
              <span className="truncate text-xs text-[rgba(0,0,0,0.54)]">100 sold</span>
            </div>
          </div>
        </Link>
      </div>

      {/* FIND SIMILAR — sits in reserved pb, flush under card (Shopee pattern, no overlap) */}
      <Link
        to={`/find-similar/${product.id}`}
        className="
          absolute inset-x-0 bottom-0 z-0 flex h-8 items-center justify-center
          rounded-b-sm border border-t-0 border-transparent
          bg-[var(--dni-primary)] text-sm font-normal text-white
          opacity-0 pointer-events-none transition-opacity duration-100
          group-hover:pointer-events-auto group-hover:opacity-100
          group-hover:border-[var(--dni-primary)]
        "
      >
        Find Similar
      </Link>
    </div>
  )
}

export default ProductCard
