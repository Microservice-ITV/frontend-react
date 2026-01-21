import { Product } from '../types/productTypes'
import { Link } from 'react-router-dom'

const ProductCard = ({ product }: { product: Product }) => {
  return (
    <div
      className="
        group
        relative
        box-content
        border border-[var(--shopee-border)]
        rounded-[6px]
        bg-white
        transition-all duration-100
        hover:border-[var(--shopee-primary)]
        hover:shadow-md
        hover:-translate-y-[1px]
        hover:z-[10]"
    >
      {/* MAIN CARD */}
      <Link to={`/products/${product.id}`} className="contents">
        <div className="flex flex-col h-full overflow-hidden rounded-[6px]">
          {/* IMAGE */}
          <div className="relative w-full pt-[100%] bg-gray-100">
            <img
              src={product.images}
              alt={product.name}
              className="absolute inset-0 w-full h-full object-contain pointer-events-none"
              loading="lazy"
            />
          </div>

          {/* CONTENT */}
          <div className="p-2 flex flex-col justify-between flex-1">
            <div className="mb-2">
              <div className="line-clamp-2 min-h-[2.5rem] text-sm">
                {product.name}
              </div>
            </div>

            <div className="space-y-1">
              <div className="flex items-center">
                <span className="text-xs mr-0.5">$</span>
                <span className="text-base font-medium text-[var(--shopee-primary)]">
                  {product.price.toFixed(2)}
                </span>
                <span className="ml-auto text-xs text-gray-500">
                  100 sold
                </span>
              </div>
            </div>
          </div>
        </div>
      </Link>

      {/* FIND SIMILAR – OUTSIDE CARD */}
      <Link
        to={`/find-similar/${product.id}`}
        className="
          absolute
          left-[-1px]
          top-[calc(100%-6px)]
          w-[calc(100%+2px)]
          h-[30px]
          bg-[var(--shopee-primary)]
          text-white
          text-center
          text-sm
          leading-[30px]
          border border-[var(--shopee-primary)]
          rounded-b-sm
          opacity-0
          group-hover:opacity-100
          transition-opacity duration-100
          z-[-1]
        "
      >
        Find Similar
      </Link>
    </div>
  )
}

export default ProductCard