// Product used in LIST (grid, cards)
export interface Product {
  id: string
  name: string
  text?: string
  price: number
  images: string[]
  categoryId: string
  /** Catalog list includes the owning shop id. Name is loaded from the product when adding to cart. */
  shopId?: string
  tags?: string[]
}

/** One SKU row from ecommerce-read `product_reads.variants`. */
export interface ProductVariant {
  variantId: string
  sku: string
  /** Customer-facing unit price */
  price: number
  listPrice: number
  compareAtPrice: number | null
  effectiveSellingPrice: number
  /** Shop/catalog qty only. */
  shopStock: number
  /** Warehouse available for this color×size. */
  warehouseStock: number
  length: number | null
  width: number | null
  height: number | null
  weight: number | null
  isPrimary: boolean
  colorId: string
  colorName: string
  colorCode: string
  sizeId: string
  sizeName: string
  sizeCode: string
  /** Indices into `ProductDetail.images` for this SKU’s gallery */
  imageIndexes?: number[]
}

/** Live flash-deal row from ecommerce-read, keyed by product (and optional variant). */
export interface ProductFlashDeal {
  flashDealId: string
  flashDealItemId: string
  variantId: string | null
  dealPrice: number
  originalPrice: number
  discount: number
  startAt: string
  endAt: string
}

// Product used in DETAILS page
export interface ProductDetail {
  id: string
  name: string
  text?: string
  slug: string
  description?: string
  /** Optional product demo video (YouTube URL). */
  videoUrl?: string
  sku?: string
  /** Aggregate / default when no variant selection */
  stock?: number
  price: number
  images: string[]
  categoryId: string
  category?: {
    id: string
    name: string
    slug: string
    parentId: string | null
  }

  shop: {
    id: string
    name: string
    slug: string
  }

  currency: string
  minPrice: number
  maxPrice: number
  brandName: string
  primaryVariantId: string | null
  variants: ProductVariant[]
  tags?: string[]
  /** Empty when this product is not in a live flash deal. */
  flashDeals?: ProductFlashDeal[]
}

// Redux state
export interface ProductsState {
  items: Product[]
  selectedProduct: ProductDetail | null
  status: 'idle' | 'loading' | 'succeeded' | 'failed'
  error: string | null
  /** Latest `fetchProductDetail(id)` request id — ignores stale fulfilled/rejected from slower responses */
  detailRequestedId: string | null
  searchResults: Product[]
  searchStatus: 'idle' | 'loading' | 'succeeded' | 'failed'
  searchError: string | null
  recentProducts: Product[]
  recentProductsNextCursor: string | null
  recentProductsHasNextPage: boolean
  recentProductsLoadedCursors: string[]
  recentProductsLoading: boolean
  recentProductsStatus: 'idle' | 'loading' | 'succeeded' | 'failed'
  recentProductsError: string | null
}