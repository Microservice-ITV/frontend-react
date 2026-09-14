import { Product } from '../types/productTypes'
import ProductCard from './ProductCard'

/**
 * Same card footprint everywhere (home, cart recommendations, category, search).
 * Uses auto-fill + min width so a sidebar (category page) drops a column
 * instead of shrinking cards relative to full-width grids.
 */
export const PRODUCT_GRID_CLASS =
  'grid grid-cols-2 gap-2.5 sm:gap-3 items-stretch sm:grid-cols-[repeat(auto-fill,minmax(220px,1fr))]'

interface Props {
  products: Product[]
  showFindSimilar?: boolean
}

const ProductGrid = ({ products, showFindSimilar = true }: Props) => {
  return (
    <div className={PRODUCT_GRID_CLASS}>
      {products.map((product) => (
        <ProductCard key={product.id} product={product} showFindSimilar={showFindSimilar} />
      ))}
    </div>
  )
}

export function ProductGridSkeleton({ count = 10 }: { count?: number }) {
  return (
    <div className={PRODUCT_GRID_CLASS}>
      {Array.from({ length: count }).map((_, index) => (
        <div
          key={index}
          className="animate-pulse overflow-hidden border border-[var(--dni-cart-border)] bg-white"
        >
          <div className="aspect-square bg-gray-200" />
          <div className="space-y-2 p-3">
            <div className="h-4 bg-gray-200" />
            <div className="h-4 w-2/3 bg-gray-200" />
            <div className="h-3 w-1/2 bg-gray-200" />
            <div className="h-10 bg-gray-200" />
          </div>
        </div>
      ))}
    </div>
  )
}

export default ProductGrid
